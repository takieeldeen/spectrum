'use client';
import React from 'react';
import {
  Stack,
  Button,
  Breadcrumbs,
  Typography,
  Link as MuiLink,
  Card,
  Box,
  Divider,
  Switch,
  IconButton,
  useTheme,
  CircularProgress,
  Drawer,
  Fade,
} from '@mui/material';
import { varAlpha } from 'src/theme/styles';
import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useTranslation } from 'react-i18next';
import DevicePowerCurve from '../device-power-curve';
import { useGetDevice, useToggleDevice } from 'src/api/device';
import { usePlugSocket } from 'src/hooks/use-plug-socket';
import SafeGuardNewEditForm from '../safe-guard-new-edit-form';
import NewEditDrawer, { DrawerTrigger } from 'src/components/new-edit-form/new-edit-drawer';
import DeviceGuardCard from '../device-guard-card';
import { useResponsive } from 'src/hooks/use-responsive';
import LoadingView from './loading-view';
import { IGuard } from 'src/types/guard';
import { useGetGuards } from 'src/api/guards';
import DeviceGuards from '../device-guards';
import DeviceTimerButton from '../device-timer-button';

type Props = {
  deviceId: string;
};

const guards: IGuard[] = [
  {
    _id: '1',
    action: 'OFF',
    target: 'TEMPERATURE',
    comparator: 'MAX',
    value: 34,
    isEnabled: true,
  },
  {
    _id: '2',
    action: 'ON',
    target: 'TEMPERATURE',
    comparator: 'MIN',
    value: 15,
    isEnabled: false,
  },
  {
    _id: '3',
    action: 'OFF',
    target: 'POWER',
    comparator: 'MAX',
    value: 2200,
    isEnabled: true,
  },
  {
    _id: '4',
    action: 'ON',
    target: 'POWER',
    comparator: 'MIN',
    value: 50,
    isEnabled: true,
  },
  {
    _id: '5',
    action: 'OFF',
    target: 'CURRENT',
    comparator: 'MAX',
    value: 10,
    isEnabled: true,
  },
  {
    _id: '6',
    action: 'OFF',
    target: 'CURRENT',
    comparator: 'MIN',
    value: 0.5,
    isEnabled: false,
  },
  {
    _id: '7',
    action: 'OFF',
    target: 'POWER',
    comparator: 'MAX',
    value: 3000,
    isEnabled: true,
  },
];

export default function DeviceDetailsView({ deviceId }: Props) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const mdUp = useResponsive('up', 'md');
  const isDark = theme.palette.mode === 'dark';

  const { data: device, isLoading } = useGetDevice(deviceId);
  const { data: guards } = useGetGuards({ deviceId });
  console.log(guards);
  const { liveData, isConnected } = usePlugSocket(device?.plugId?._id);
  const { mutateAsync: toggleDeviceState, isPending: isToggling } = useToggleDevice();
  const togglingOutlet = isToggling;
  const outletProps =
    liveData?.outlets?.[`outlet${device?.plugPort}` as keyof typeof liveData.outlets];

  const voltage = liveData?.voltage || 0;

  const [targetState, setTargetState] = React.useState<boolean | undefined>(undefined);

  const handleToggle = React.useCallback(
    async (checked: boolean) => {
      if (!device?._id) return;
      setTargetState(checked);
      try {
        await toggleDeviceState({ id: device._id, state: checked ? 'on' : 'off' });
      } catch (err) {
        setTargetState(undefined);
      }
    },
    [device, toggleDeviceState]
  );

  React.useEffect(() => {
    if (outletProps !== undefined && targetState !== undefined) {
      if (outletProps.on === targetState) {
        setTargetState(undefined);
      }
    }
  }, [outletProps, targetState]);

  if (isLoading) return <LoadingView />;
  return (
    <>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink component={RouterLink} href={paths.dashboard.root} color="inherit">
              {t('HOME')}
            </MuiLink>
            <MuiLink component={RouterLink} href={paths.dashboard.three} color="inherit">
              {t('NAVBAR.DEVICES')}
            </MuiLink>
            <Typography color="text.primary">{t('DASHBOARD.DEVICE_DETAILS')}</Typography>
          </Breadcrumbs>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <Button
              sx={{ minWidth: 120 }}
              size="large"
              variant="outlined"
              startIcon={<Iconify icon="lucide:pencil" />}
            >
              {t('EDIT')}
            </Button>
            <Button
              sx={{ minWidth: 120 }}
              size="large"
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="lucide:trash-2" />}
            >
              {t('DELETE')}
            </Button>
          </Stack>
        </Stack>

        <Card sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ md: 'flex-start', xs: 'center' }}
            spacing={{ xs: 3, md: 0 }}
          >
            <Box
              component="img"
              src="/assets/images/states/plug.png"
              sx={{
                width: { md: '15%', xs: '30%' },
              }}
            />
            <Stack flex={1} spacing={2} alignSelf={{ xs: 'stretch', md: 'inherit' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'center', md: 'flex-start' }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  alignItems={{ xs: 'center', md: 'flex-start' }}
                  spacing={2}
                  flex={1}
                >
                  <Stack alignItems={{ xs: 'center', md: 'flex-start' }}>
                    <Typography variant="h4">
                      {device?.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {device?.plugId
                        ? `${device.plugId.name} - ${t('PORT', 'مدخل')} ${device.plugPort}`
                        : t('UNASSIGNED', 'غير معين')}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      backgroundColor: varAlpha(theme.palette.success.mainChannel, 0.3),
                      px: 2,
                      borderRadius: 2,
                      py: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        height: 8,
                        width: 8,
                        borderRadius: '50%',
                        backgroundColor: isDark ? 'success.light' : 'success.dark',
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: isDark ? 'success.light' : 'success.dark',
                        fontSize: 12,
                      }}
                    >
                      متصل
                    </Typography>
                  </Stack>
                </Stack>
                <Box
                  sx={{ position: 'relative', display: 'flex', alignItems: 'center', height: 72 }}
                >
                  {(togglingOutlet || targetState !== undefined) && (
                    <CircularProgress
                      size={24}
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        marginLeft: '-12px',
                        color: 'primary.main',
                        zIndex: 1,
                      }}
                    />
                  )}
                  <Switch
                    sx={{
                      transform: 'scale(2.5)',
                      opacity: togglingOutlet || targetState !== undefined ? 0.5 : 1,
                      mr: 2,
                    }}
                    checked={targetState !== undefined ? targetState : outletProps?.on || false}
                    disabled={togglingOutlet || targetState !== undefined || !device?.plugPort}
                    onChange={(e, checked) => handleToggle(checked)}
                  />
                </Box>
              </Stack>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                sx={{
                  borderRadius: 1,
                  p: 3,
                  height: '100%',
                  backgroundColor: isDark
                    ? theme.palette.background.default
                    : theme.palette.background.neutral,
                  alignItems: 'center',
                }}
                spacing={{ md: 0, xs: 2 }}
                divider={<Divider flexItem orientation={mdUp ? 'vertical' : 'horizontal'} />}
              >
                <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Iconify icon="circum:temp-high" width={32} color="primary.main" />
                  <Stack alignItems="center">
                    <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                      {outletProps?.temperature_c}°
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                      درجة الحرارة
                    </Typography>
                  </Stack>
                </Stack>
                <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Iconify icon="bi:bar-chart" width={32} color="primary.main" />
                  <Stack alignItems="center">
                    <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                      {outletProps?.power_W} واط
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                      استهلاك الكهرباء
                    </Typography>
                  </Stack>
                </Stack>
                <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Iconify icon="mdi:lightning-bolt-outline" width={32} color="primary.main" />
                  <Stack alignItems="center">
                    <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                      {voltage > 0 ? voltage.toFixed(0) : 0} فولت
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>الجهد</Typography>
                  </Stack>
                </Stack>
                <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Iconify icon="mdi:current-ac" width={32} color="primary.main" />
                  <Stack alignItems="center">
                    <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                      {outletProps?.current_A || 0} أمبير
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>التيار</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Card>
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
          {/* Left Cards */}
          <Stack flex={{ md: 2, xs: 1 }} spacing={2}>
            <Card sx={{ p: 3 }}>
              <Stack divider={<Divider flexItem />} spacing={1}>
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Iconify icon="ic:outline-info" color="primary.main" width={30} />
                  <Typography sx={{ fontWeight: 700 }}>معلومات الجهاز</Typography>
                </Stack>
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Stack flex={1} direction="row" spacing={1}>
                    <Iconify icon="bi:plug" width={24} color="text.secondary" />
                    <Typography color="text.secondary">نوع الجهاز</Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 12 }}>
                    مقبس ذكي
                  </Typography>
                </Stack>
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Stack flex={1} direction="row" spacing={1}>
                    <Iconify icon="akar-icons:wifi" width={24} color="text.secondary" />
                    <Typography color="text.secondary">اخر اتصال</Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 12 }}>
                    {outletProps?.on
                      ? 'الآن'
                      : new Date(device?.lastTurnedOn ?? '').toLocaleDateString(
                          i18n.language === 'ar' ? 'ar-EG' : 'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            day: '2-digit',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                  </Typography>
                </Stack>
                {device?.lastTurnedOn && (
                  <Stack alignItems="center" direction="row" spacing={1}>
                    <Stack flex={1} direction="row" spacing={1}>
                      <Iconify icon="lucide:clock" width={24} color="text.secondary" />
                      <Typography color="text.secondary">اخر تشغيل</Typography>
                    </Stack>
                    <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 12 }}>
                      {new Date(device.lastTurnedOn).toLocaleString('ar-SA')}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Card>
            <Card sx={{ p: 3 }}>
              <Stack divider={<Divider flexItem />} spacing={1}>
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Iconify icon="basil:location-outline" color="primary.main" width={30} />
                  <Typography sx={{ fontWeight: 700 }}>موقع الجهاز</Typography>
                </Stack>
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Stack flex={1} direction="row" spacing={1}>
                    <Iconify icon="bi:plug" width={24} color="text.secondary" />
                    <Typography color="text.secondary">المشترك</Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 12 }}>
                    {device?.plugId ? device.plugId.name : '-'}
                  </Typography>
                </Stack>
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Stack flex={1} direction="row" spacing={1}>
                    <Iconify icon="akar-icons:wifi" width={24} color="text.secondary" />
                    <Typography color="text.secondary">المدخل</Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 12 }}>
                    {device?.plugPort ? `${t('PORT', 'مدخل')} ${device.plugPort}` : '-'}
                  </Typography>
                </Stack>
              </Stack>
            </Card>
            <Fade in={Boolean(outletProps?.on)} timeout={{ enter: 200, exit: 0 }} unmountOnExit>
              <Card sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:alarm-bold-duotone" color="primary.main" width={28} />
                    <Stack>
                      <Typography sx={{ fontWeight: 700 }}>{t('SLEEP_TIMER.TITLE')}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('SLEEP_TIMER.SUBTITLE')}
                      </Typography>
                    </Stack>
                  </Stack>
                  <DeviceTimerButton
                    deviceId={device._id}
                    deviceName={device.name}
                    timerClosesAt={device.timerClosesAt}
                  />
                </Stack>
              </Card>
            </Fade>
          </Stack>
          <Stack flex={{ md: 5, xs: 1 }} spacing={2}>
            <Card sx={{ p: 3 }}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Iconify icon="bi:bar-chart" width={32} color="primary.main" />
                <Typography sx={{ fontWeight: 700 }}>منحنى الاستهلاك</Typography>
              </Stack>
              <DevicePowerCurve />
            </Card>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
              <DeviceGuards deviceId={device?._id} />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
}
