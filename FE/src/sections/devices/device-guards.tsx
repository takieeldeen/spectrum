import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Card, Fade, Stack, Typography } from '@mui/material';
import { useGetGuards } from 'src/api/guards';
import { Iconify } from 'src/components/iconify';
import NewEditDrawer, { DrawerTrigger } from 'src/components/new-edit-form/new-edit-drawer';
import DeviceGuardCard from './device-guard-card';
import SafeGuardNewEditForm from './safe-guard-new-edit-form';
import { DeviceGuardCardSkeleton } from './views/loading-view';

type DeviceGuardsProps = {
  deviceId: string;
};

function DeviceGuards({ deviceId }: DeviceGuardsProps) {
  const { data: guards, isLoading } = useGetGuards({ deviceId });
  const { t } = useTranslation();
  const isEmpty = guards?.length === 0 && !isLoading;

  return (
    <Card sx={{ flex: 1, p: 3 }}>
      <Stack spacing={2}>
        <Stack alignItems="center" direction="row" spacing={1}>
          <Iconify icon="ant-design:safety-outlined" color="primary.main" width={30} />
          <Typography sx={{ fontWeight: 700, flex: 1 }}>
            {t('SAFETY_RULES')}
          </Typography>
          <NewEditDrawer>
            <DrawerTrigger
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<Iconify icon="ic:round-plus" />}
            >
              {t('ADD_SAFETY_RULE')}
            </DrawerTrigger>
            <SafeGuardNewEditForm deviceId={deviceId} />
          </NewEditDrawer>
        </Stack>

        {isLoading && (
          <Stack spacing={2}>
            {[...Array(3)].map((_, index) => (
              <DeviceGuardCardSkeleton key={index} />
            ))}
          </Stack>
        )}

        <Fade in={!isEmpty && !isLoading} timeout={{ exit: 0, enter: 300 }} unmountOnExit>
          <Stack spacing={2}>
            {guards?.map((guard) => (
              <DeviceGuardCard guard={guard} key={guard?._id} />
            ))}
          </Stack>
        </Fade>

        <Fade in={isEmpty} timeout={{ exit: 0, enter: 300 }} unmountOnExit>
          <Box>
            <EmptyGuards deviceId={deviceId} />
          </Box>
        </Fade>
      </Stack>
    </Card>
  );
}

function EmptyGuards({ deviceId }: { deviceId?: string }) {
  const { t } = useTranslation();

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{
        py: 4,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Box
        component="img"
        src="/assets/images/states/empty-guard-dark.png"
        alt={t('NO_GUARDS_FOUND')}
        sx={{
          width: 1,
          maxWidth: 220,
          height: 'auto',
          mb: 1,
        }}
      />

      <Stack spacing={1} alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('NO_GUARDS_FOUND')}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360, lineHeight: 1.6 }}
        >
          {t('EMPTY_GUARDS_DESCRIPTION')}
        </Typography>
      </Stack>

      <NewEditDrawer>
        <DrawerTrigger
          variant="outlined"
          color="primary"
          startIcon={<Iconify icon="ic:round-plus" />}
          sx={{ mt: 1 }}
        >
          {t('ADD_SAFETY_RULE')}
        </DrawerTrigger>
        <SafeGuardNewEditForm deviceId={deviceId} />
      </NewEditDrawer>
    </Stack>
  );
}

export default DeviceGuards;
