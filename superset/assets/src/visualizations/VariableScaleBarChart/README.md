## Variable Scale Bar Chart

[![Version](https://img.shields.io/npm/v/@superset-ui/legacy-plugin-chart-parallel-coordinates.svg?style=flat-square)](https://img.shields.io/npm/v/@superset-ui/legacy-plugin-chart-parallel-coordinates.svg?style=flat-square)
[![David (path)](https://img.shields.io/david/apache-superset/superset-ui-plugins.svg?path=packages%2Fsuperset-ui-legacy-plugin-chart-parallel-coordinates&style=flat-square)](https://david-dm.org/apache-superset/superset-ui-plugins?path=packages/superset-ui-legacy-plugin-chart-parallel-coordinates)

This plugin provides Variable Scale Bar Chart for Superset.

### Usage

Configure `key`, which can be any `string`, and register the plugin. This `key` will be used to lookup this chart throughout the app.

```js
import MyChartChartPlugin from '../VariableScaleBarChart/index.js';

new MyChartChartPlugin()
  .configure({ key: 'my-chart' })
  .register();
```

Then use it via `SuperChart`. See [storybook](https://apache-superset.github.io/superset-ui-plugins) for more details.

```js
<SuperChart
  chartType="my-chart"
  width={1250}
  height={600}
  queryData={{ data }}
  formData={{
    series:[],
    metrics:[],
    colorScheme: 'd3Categor',
    showLegend: true/false,
    showBarValues: true/false,
    sortBars: 'descending/ascending',
    xAxisLabel: "Label Text",
    bottomMargin: "auto/10/20/30/...",
    xTicksLayout: "45°/90°/0°",
    barValuePrecision: "1/2/3/4/..."
  }}
/>
```
