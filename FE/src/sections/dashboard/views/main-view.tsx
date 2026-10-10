'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Stack, Typography, useTheme } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import MyDevicesBoard from '../my-devices';
import ConsumptionTrack from '../electricity-consumption';
import Grid from '@mui/material/Unstable_Grid2';
import SummaryWidget from 'src/components/summary-widget/summary-widget';
import { Chart, useChart } from 'src/components/chart';

function DashboardMainView() {
  const { t } = useTranslation();
  const theme = useTheme();

  const deviceChartSeries = [12, 3];
  const deviceChartOptions = useChart({
    labels: [t('DASHBOARD.ONLINE'), t('DASHBOARD.OFFLINE')],
    colors: [theme.palette.success.dark, theme.palette.warning.main],
    stroke: { colors: [theme.palette.background.paper] },
    legend: { show: true, position: 'bottom', horizontalAlign: 'center' },
    dataLabels: { enabled: false, dropShadow: { enabled: false } },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: t('DASHBOARD.TOTAL'),
            },
          },
        },
      },
    },
  });

  return (
    <Stack sx={{ flex: 1 }}>
      <Grid container spacing={2} sx={{ paddingY: 2 }}>
        <Grid xs={12} md={4}>
          <SummaryWidget
            title={t('DASHBOARD.TOTAL_ENERGY')}
            percent={2.6}
            total={18765}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [15, 18, 12, 51, 68, 11, 39, 37],
            }}
          />
        </Grid>
        <Grid xs={12} md={4}>
          <SummaryWidget
            title={t('DASHBOARD.AVG_TEMPERATURE')}
            percent={2.6}
            total={18765}
            chart={{
              colors: [theme.vars.palette.warning.main],
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [15, 18, 12, 51, 68, 11, 39, 37],
            }}
          />
        </Grid>
        <Grid xs={12} md={4}>
          <SummaryWidget
            title={t('DASHBOARD.ESTIMATED_COST')}
            percent={-4.2}
            total={1250}
            chart={{
              colors: [theme.vars.palette.error.main],
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [15, 18, 12, 51, 68, 11, 39, 37],
            }}
          />
        </Grid>
      </Grid>
      <MyDevicesBoard />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <ConsumptionTrack />
        <Stack flex={1} spacing={2}>
          <Typography variant="h4">{t('DASHBOARD.PLUGS_STATUS')}</Typography>
          <Card
            sx={{
              height: 320,
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Chart
              type="donut"
              series={deviceChartSeries}
              options={deviceChartOptions}
              height={280}
            />
          </Card>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default DashboardMainView;
