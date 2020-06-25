import { t } from '@superset-ui/translation';
import { formatSelectOptions } from '@superset-ui/control-utils';

export default {
    requiresTime: true, 
    controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        ['series'],
        ['metrics'],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        ['color_scheme','label_colors'],
        [
          {
            name: 'show_legend',
            config: {
              type: 'CheckboxControl',
              label: t('Legend'),
              default: true,
              renderTrigger: true,
              description: t('Whether to display the Legend'),
            },
          },
          {
            name: 'show_bar_values',
            config: {
              type: 'CheckboxControl',
              label: t('Bar Values'),
              renderTrigger: true,
              default: false,
              description: t('Show Bar Values above the Bar'),
            },
          },
        ],
        [
          {
            name: 'sort_bars',
            config: {
              label: t('Sort Bars'),
              renderTrigger: true,
              clearable: false,
              type: 'SelectControl',
              choices: formatSelectOptions(['auto','ascending','descending']),
              default: 'auto',
              description: t('Whether and how to Sort Bars cooresponding to first metric specified'),
            },
          },
          {
            name: 'bar_value_layout',
            config: {
              label: t('Bar Value Layout'),
              renderTrigger: true,
              clearable: false,
              type: 'SelectControl',
              choices: formatSelectOptions(['0°','45°','90°']),
              default: '0°',
              description: t('Angle by how much bar values should be rotated'),
            },
          },
        ],
      ],
    },
    {
        label: t('X Axis'),
        expanded: true,
        controlSetRows: [
            [
              {
                name: 'x_axis_label',
                config: {
                    type: 'TextControl',
                    label: t('X Axis Label'),
                    renderTrigger: true,
                    default: '',
                },
              },
              {
                name: 'bottom_margin',
                config: {
                    type: 'SelectControl',
                    clearable: false,
                    freeForm: true,
                    label: t('Bottom Margin'),
                    choices: ['auto', 50, 75, 100, 125, 150, 200],
                    default: 'auto',
                    renderTrigger: true,
                    description: t('Bottom margin, in pixels, allowing for more room for axis labels'),
                },
              },
            ],
            [
                {
                  name: 'x_ticks_layout',
                  config: {
                      type: 'SelectControl',
                      label: t('X Tick Layout'),
                      choices: formatSelectOptions(['auto', 'flat', '45°', 'staggered']),
                      default: 'auto',
                      clearable: false,
                      renderTrigger: true,
                      description: t('The way the ticks are laid out on the X-axis'),
                  },
                },
                {
                  name: 'bar_value_precision',
                  config: {
                      type: 'SelectControl',
                      label: t('Bar Value Precision'),
                      choices: formatSelectOptions([ 1, 2, 3, 4, 5, 6, 7]),
                      default: 4,
                      clearable: false,
                      renderTrigger: true,
                      description: t('The the number of precision digits after decimal'),
                  },
                },
            ],
        ],
    },
  ],
};
