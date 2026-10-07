'use client';
import React, { useState } from 'react';
import { Card, Stack, Switch, Typography, useTheme } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { useTranslation } from 'react-i18next';
function DeviceCard({ device }: { device: any }) {
  const [isActive, setIsActive] = useState<boolean>(device?.isActive || false);
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  
  const currentLang = i18n.language || 'en';
  const displayName = currentLang === 'ar' && device?.nameAr && device.nameAr.length > 0 ? device.nameAr : device?.name;

  return (
    <Card sx={{ height: 200, p: 3, width: '100%' }}>
      <Stack direction="column" sx={{ height: '100%', justifyContent: 'space-between' }}>
        <Stack direction="row" justifyContent="space-between">
          {/* <Iconify icon="bi:tv-fill" width={48} color={theme.palette.primary.main} /> */}
          <Iconify
            icon={device?.icon}
            width={48}
            color={isActive ? theme.palette.primary.main : theme.palette.grey[500]}
            sx={{
              transition: 'all 0.3s',
            }}
          />
          <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Stack>
            <Typography variant="h5">{displayName}</Typography>
            <Typography variant="subtitle2" color={theme.palette.text.secondary}>
              {t('DASHBOARD.ACTIVE_FOR_THREE_HOURS')}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center">
            <Iconify icon="at-icons:lightning-bolt" width={24} color="warning.main" />
            <Typography variant="body1" color="text.secondary">
              5 {t('DASHBOARD.KWH')}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

export default DeviceCard;
