'use client';
import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, Stack, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Chart, useChart } from 'src/components/chart';
import { useTranslation } from 'react-i18next';

function ConsumptionTrack() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [filter, setFilter] = useState('day');
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
      { name: t('DASHBOARD.ELECTRICITY_CONSUMPTION_SERIES'), type: 'area', data: [32, 40, 28, 42, 64, 72, 56, 80, 65] },
      { name: t('DASHBOARD.MAX_LIMIT'), type: 'line', data: [85, 85, 85, 85, 85, 85, 85, 85, 85] },
    ],
  } as any;

  const chartOptions = useChart({
    colors: [theme.palette.primary.main, theme.palette.error.main],
    stroke: {
      width: [3, 2],
      curve: ['smooth', 'straight'],
      dashArray: [0, 4],
    },
    fill: {
      type: ['gradient', 'solid'],
    },
    legend: { show: true },
    xaxis: {
      type: 'datetime',
      categories: chart.categories,
    },
    tooltip: { x: { format: 'dd/MM/yy HH:mm' } },
  });
  return (
    <Stack flex={1} spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4">{t('DASHBOARD.ENERGY_CONSUMPTION')}</Typography>
        <ToggleButtonGroup
          color="primary"
          value={filter}
          exclusive
          size="small"
          onChange={(e, newFilter) => {
            if (newFilter !== null) {
              setFilter(newFilter);
            }
          }}
        >
          <ToggleButton value="day">{t('DASHBOARD.DAY')}</ToggleButton>
          <ToggleButton value="week">{t('DASHBOARD.WEEK')}</ToggleButton>
          <ToggleButton value="month">{t('DASHBOARD.MONTH')}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Card sx={{ height: 320 }}>
        <Chart type="line" series={chart.series} options={chartOptions} height={320} />
      </Card>
    </Stack>
  );
}

export default ConsumptionTrack;
