import React from 'react';
import { Chart, useChart } from 'src/components/chart';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

function PlugPowerCurve() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const chart = {
    categories: [
      '2023-09-19T00:00:00.000Z',
      '2023-09-19T01:30:00.000Z',
      '2023-09-19T02:30:00.000Z',
      '2023-09-19T03:30:00.000Z',
      '2023-09-19T04:30:00.000Z',
      '2023-09-19T05:30:00.000Z',
      '2023-09-19T06:30:00.000Z',
      '2023-09-19T07:30:00.000Z',
      '2023-09-19T08:30:00.000Z',
    ],
    series: [
      {
        name: t('DASHBOARD.ELECTRICITY_CONSUMPTION_SERIES'),
        type: 'area',
        data: [32, 40, 28, 42, 64, 72, 56, 80, 65],
      },
    ],
  } as any;
  const chartOptions = useChart({
    colors: [theme.palette.primary.main],
    stroke: {
      width: [3],
      curve: ['smooth'],
      dashArray: [0],
    },
    fill: {
      type: ['gradient'],
    },
    legend: { show: false },
    yaxis: {
      opposite: i18n.language === 'ar',
    },
    xaxis: {
      type: 'datetime',
      categories: chart.categories,
      // @ts-ignore
      reversed: i18n.language === 'ar',
    },
    tooltip: { x: { format: 'dd/MM/yy HH:mm' } },
  });
  return <Chart type="line" series={chart.series} options={chartOptions} height={320} />;
}

export default PlugPowerCurve;
