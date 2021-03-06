# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
import os
import urllib.parse
import requests

from flask import flash, g, redirect, request, url_for
from flask_appbuilder import SimpleFormView, expose, has_access
from flask_appbuilder.models.sqla.interface import SQLAInterface
from flask_babel import lazy_gettext as _
from werkzeug.utils import secure_filename
from wtforms.fields import StringField
from wtforms.validators import ValidationError

import superset.models.core as models
from superset import app, db
from superset.models.core import Database
from superset.config import WORKFLOW_URI, WORKFLOW_REDIRECT_URI
from superset.connectors.sqla.models import SqlaTable
from superset.utils import core as utils
from superset.views.base import (DeleteMixin,
                                 SupersetModelView,
                                 YamlExportMixin,
                                 BaseSupersetView
                                )

from .forms import CsvToDatabaseForm
from .mixins import DatabaseMixin
from .validators import schema_allows_csv_upload, sqlalchemy_uri_validator

config = app.config
stats_logger = config["STATS_LOGGER"]


def sqlalchemy_uri_form_validator(_, field: StringField) -> None:
    """
        Check if user has submitted a valid SQLAlchemy URI
    """
    sqlalchemy_uri_validator(field.data, exception=ValidationError)


class DatabaseView(
    DatabaseMixin, SupersetModelView, DeleteMixin, YamlExportMixin
):  # pylint: disable=too-many-ancestors
    datamodel = SQLAInterface(models.Database)

    add_template = "superset/models/database/add.html"
    edit_template = "superset/models/database/edit.html"
    validators_columns = {"sqlalchemy_uri": [sqlalchemy_uri_form_validator]}

    yaml_dict_key = "databases"

    def _delete(self, pk):
        DeleteMixin._delete(self, pk)


class EDASource(BaseSupersetView):

    req_session = requests.sessions.Session()


    def get_db_conn_uri(self, id_):
        sess = db.session()
        return sess.query(Database).filter(
            Database.id == id_).first().sqlalchemy_uri_decrypted


    @expose("/add/", methods=['POST', 'GET'])
    @has_access
    def eda_source(self):
        """
        Allows to add database table as source for Exploratory Data Analysis.
        """
        try:
            tablename = request.args.get('tablename')
            conn_uri = self.get_db_conn_uri(int(request.args.get('db')))

            # Add these connection URI's to Workflow, then redirect to workflow.
            res = self.req_session.post(
                    urllib.parse.urljoin(WORKFLOW_URI, 'eda/api/'),
                    data={
                        'connection_uri': conn_uri,
                        'source_type': 'db',
                        'tablename': tablename
                    })
            if res.status_code != 201:
                flash('Internal Error while adding as EDA source.')
                return redirect('/superset/sqllab')
        except requests.exceptions.ConnectionError:
            flash('Cannot connect to Workflow while adding a EDA source.')
            return redirect('/superset/sqllab')

        # TODO: Think of how we can keep track of workflow EDA endpoint in superset.
        return redirect(urllib.parse.urljoin(WORKFLOW_REDIRECT_URI, 'eda/sources/'))


class CsvToDatabaseView(SimpleFormView):
    form = CsvToDatabaseForm
    form_template = "superset/form_view/csv_to_database_view/edit.html"
    form_title = _("CSV to Database configuration")
    add_columns = ["database", "schema", "table_name"]

    def form_get(self, form):
        form.sep.data = ","
        form.header.data = 0
        form.mangle_dupe_cols.data = True
        form.skipinitialspace.data = False
        form.skip_blank_lines.data = True
        form.infer_datetime_format.data = True
        form.decimal.data = "."
        form.if_exists.data = "fail"

    def form_post(self, form):
        database = form.con.data
        schema_name = form.schema.data or ""

        if not schema_allows_csv_upload(database, schema_name):
            message = _(
                'Database "%(database_name)s" schema "%(schema_name)s" '
                "is not allowed for csv uploads. Please contact your Superset Admin.",
                database_name=database.database_name,
                schema_name=schema_name,
            )
            flash(message, "danger")
            return redirect("/csvtodatabaseview/form")

        csv_file = form.csv_file.data
        form.csv_file.data.filename = secure_filename(form.csv_file.data.filename)
        csv_filename = form.csv_file.data.filename
        path = os.path.join(config["UPLOAD_FOLDER"], csv_filename)
        try:
            utils.ensure_path_exists(config["UPLOAD_FOLDER"])
            csv_file.save(path)
            table_name = form.name.data

            con = form.data.get("con")
            database = (
                db.session.query(models.Database).filter_by(id=con.data.get("id")).one()
            )
            database.db_engine_spec.create_table_from_csv(form, database)

            table = (
                db.session.query(SqlaTable)
                .filter_by(
                    table_name=table_name,
                    schema=form.schema.data,
                    database_id=database.id,
                )
                .one_or_none()
            )
            if table:
                table.fetch_metadata()
            if not table:
                table = SqlaTable(table_name=table_name)
                table.database = database
                table.database_id = database.id
                table.user_id = g.user.id
                table.schema = form.schema.data
                table.fetch_metadata()
                db.session.add(table)
            db.session.commit()
        except Exception as e:  # pylint: disable=broad-except
            db.session.rollback()
            try:
                os.remove(path)
            except OSError:
                pass
            message = _(
                'Unable to upload CSV file "%(filename)s" to table '
                '"%(table_name)s" in database "%(db_name)s". '
                "Error message: %(error_msg)s",
                filename=csv_filename,
                table_name=form.name.data,
                db_name=database.database_name,
                error_msg=str(e),
            )

            flash(message, "danger")
            stats_logger.incr("failed_csv_upload")
            return redirect("/csvtodatabaseview/form")

        os.remove(path)
        # Go back to welcome page / splash screen
        message = _(
            'CSV file "%(csv_filename)s" uploaded to table "%(table_name)s" in '
            'database "%(db_name)s"',
            csv_filename=csv_filename,
            table_name=form.name.data,
            db_name=table.database.database_name,
        )
        flash(message, "info")
        stats_logger.incr("successful_csv_upload")
        return redirect("/tablemodelview/list/")


class DatabaseTablesAsync(DatabaseView):  # pylint: disable=too-many-ancestors
    list_columns = ["id", "all_table_names_in_database", "all_schema_names"]


class DatabaseAsync(DatabaseView):  # pylint: disable=too-many-ancestors
    list_columns = [
        "id",
        "database_name",
        "expose_in_sqllab",
        "allow_ctas",
        "force_ctas_schema",
        "allow_run_async",
        "allow_dml",
        "allow_multi_schema_metadata_fetch",
        "allow_csv_upload",
        "allows_subquery",
        "backend",
    ]
