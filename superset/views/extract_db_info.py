from sqlalchemy import create_engine


def sql_table_fetch():

    from superset import conf
    db_uri = conf.get("SQLALCHEMY_DATABASE_URI")

    db_engine = create_engine(db_uri)

    datasource_dict = {}
    database_dict = {}

    with db_engine.connect() as con:
        rows = con.execute('SELECT database_id, perm FROM tables')

        for row in rows:
            db_val = str(list(row)[0])
            param = list(row)[1].split(".")
            db_key = param[0][1:-1]
            ds_key = param[-1].split("](id:")[0][1:]
            ds_value = param[-1].split("](id:")[1][:-1]

            database_dict[db_key] = db_val
            datasource_dict[ds_key] = ds_value

    return datasource_dict, database_dict
