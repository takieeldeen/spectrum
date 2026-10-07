'use client';
import { Box, Card, Stack, Switch, Typography, useTheme } from '@mui/material';
import { Iconify } from 'src/components/iconify';

import React from 'react';
import { useTranslation } from 'react-i18next';
import DeviceCard from 'src/components/device-card/device-card';
import Grid from '@mui/material/Unstable_Grid2';

const DEVICES = [
  { id: 1, name: 'Smart TV', nameAr: 'تلفزيون ذكي', icon: 'bi:tv-fill', isActive: true, energy: 5 },
  { id: 2, name: 'Air Conditioner', nameAr: 'مكيف هواء', icon: 'mdi:air-conditioner', isActive: false, energy: 12 },
  { id: 3, name: 'Smart Light', nameAr: 'إضاءة ذكية', icon: 'mdi:lightbulb-on', isActive: true, energy: 1 },
  { id: 4, name: 'Refrigerator', nameAr: 'ثلاجة', icon: 'mdi:fridge', isActive: true, energy: 8 },
  { id: 5, name: 'Washing Machine', nameAr: 'غسالة', icon: 'mdi:washing-machine', isActive: false, energy: 15 },
  { id: 6, name: 'Wi-Fi Router', nameAr: 'موجه واي فاي', icon: 'mdi:router-wireless', isActive: true, energy: 2 },
  { id: 7, name: 'Smart Speaker', nameAr: 'مكبر صوت ذكي', icon: 'mdi:speaker-wireless', isActive: true, energy: 3 },
  { id: 8, name: 'Security Camera', nameAr: 'كاميرا أمنية', icon: 'mdi:cctv', isActive: true, energy: 6 },
];

function MyDevicesBoard() {
  const { t } = useTranslation();
  return (
    <Stack direction="column" spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }}>
        <Typography variant="h4">{t('DASHBOARD.MY_DEVICES')}</Typography>
      </Stack>
      <Grid container spacing={2}>
        {DEVICES.map((device) => (
          <Grid key={device.id} sm={12} md={4} lg={3}>
            <DeviceCard device={device} />
          </Grid>
        ))}
      </Grid>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: 'repeat(4, 1fr)',
        }}
      ></Box>
    </Stack>
  );
}

export default MyDevicesBoard;
