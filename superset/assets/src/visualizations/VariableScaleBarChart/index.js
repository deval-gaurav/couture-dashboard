import { t } from '@superset-ui/translation';
import { ChartMetadata, ChartPlugin } from '@superset-ui/chart';
import transformProps from './transformProps';
import thumbnail from './images/thumbnail.png';
import controlPanel from './controlPanel';

const metadata = new ChartMetadata({
  credits: ['https://syntagmatic.github.io/parallel-coordinates'],
  description: '',
  name: t('Variable Scale BarChart'),
  thumbnail,
  useLegacyApi: true,
});

export default class MyChartPlugin extends ChartPlugin {
  constructor() {
    super({
      loadChart: () => import('./ReactVariableScaleBarChart.js'),
      metadata,
      transformProps,
      controlPanel,
    });
  }
}