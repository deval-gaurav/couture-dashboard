import { t } from '@superset-ui/translation';
import { ChartMetadata, ChartPlugin } from '@superset-ui/chart';
import transformProps from '@superset-ui/legacy-plugin-chart-sankey/lib/transformProps';
import thumbnail from '@superset-ui/legacy-plugin-chart-sankey/lib/images/thumbnail.png';

const metadata = new ChartMetadata({
  credits: ['https://github.com/d3/d3-sankey'],
  description: '',
  name: t('Couture Sankey Diagram'),
  thumbnail,
  useLegacyApi: true,
});

export default class CoutureSankeyChartPlugin extends ChartPlugin {
  constructor() {
    super({
      loadChart: () => import('@superset-ui/legacy-plugin-chart-sankey/lib/ReactSankey.js'),
      metadata,
      transformProps,
    });
  }
}