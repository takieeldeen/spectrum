'use client';
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  Stack,
  Switch,
  Typography,
  useTheme,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Fade,
  CircularProgress,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Iconify } from 'src/components/iconify';
import i18n from 'src/i18n';
import { varAlpha } from 'src/theme/styles';
import { IDevice } from 'src/types/device';
import { CustomPopover, usePopover } from 'src/components/custom-popover';
import { useDeleteDevice, useToggleDevice } from 'src/api/device';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePlugSocket } from 'src/hooks/use-plug-socket';

type DeviceCardProps = {
  device: IDevice;
};

function DeviceCard({ device }: DeviceCardProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const plugIdStr = typeof device?.plugId === 'object' ? device.plugId._id : device?.plugId;
  const { liveData: PlugData } = usePlugSocket(plugIdStr as string);
  const outletProps = PlugData?.outlets?.[`outlet${device?.plugPort}`];
  const isDark = theme.palette.mode === 'dark';
  const popover = usePopover();
  const deleteMutation = useDeleteDevice();
  const toggleMutation = useToggleDevice();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const deviceName =
    i18n.language === 'ar'
      ? device?.nameAr !== ''
        ? device?.nameAr
        : device?.nameEn
      : device?.nameEn;

  const handleDeleteClick = () => {
    popover.onClose();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (device?._id) {
        await deleteMutation.mutateAsync(device._id);
        setSnackbar({
          open: true,
          message: t('DEVICE_DELETED_SUCCESSFULLY'),
          severity: 'success',
        });
        setConfirmOpen(false);
      }
    } catch (error: any) {
      console.error(error);
      setSnackbar({
        open: true,
        message: error.message || t('ERROR_DELETING_DEVICE'),
        severity: 'error',
      });
    }
  };

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked ? 'on' : 'off';
    try {
      if (device?._id) {
        await toggleMutation.mutateAsync({ id: device._id, state: newState });
      }
    } catch (error: any) {
      console.error(error);
      setSnackbar({
        open: true,
        message: error.message || t('ERROR_TOGGLING_DEVICE'),
        severity: 'error',
      });
    }
  };

  return (
    <>
      <Card
        sx={{
          p: 1,
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1}>
              <IconButton onClick={popover.onOpen}>
                <Iconify icon="bi:three-dots-vertical" width={24} height={24} />
              </IconButton>
              <Switch
                checked={!!outletProps?.on}
                onChange={handleToggle}
                disabled={toggleMutation.isPending || !PlugData}
              />
            </Stack>
            <Fade in={outletProps?.on} timeout={{ enter: 200, exit: 0 }}>
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
            </Fade>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                height: 96,
                aspectRatio: 1,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: varAlpha(theme.palette.primary.mainChannel, 0.2),
              }}
            >
              <Iconify icon="carbon:plug" color="primary.main" width={48} />
            </Box>
            <Stack direction="column" spacing={0.25}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5">{deviceName}</Typography>
              </Stack>
              <Typography sx={{ fontSize: 15 }} color="text.secondary">
                {device?.plugId && typeof device.plugId === 'object'
                  ? `${i18n.language === 'ar' ? device.plugId.arabicName || device.plugId.name : device.plugId.name} - ${t('PORT')} ${device.plugPort}`
                  : t('UNASSIGNED')}
              </Typography>
            </Stack>
          </Stack>
          <Stack
            direction="row"
            sx={{
              bgcolor: theme.palette.background[isDark ? 'default' : 'neutral'],
              borderRadius: 1,
              py: 2,
              px: 1,
              minWidth: 0,
            }}
            justifyContent="space-between"
            divider={<Divider flexItem orientation="vertical" />}
            spacing={1}
          >
            <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <Iconify icon="mdi:current-ac" width={32} color="primary.main" />
              <Stack alignItems="center">
                <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                  {outletProps?.on && outletProps?.current_A !== undefined
                    ? outletProps.current_A
                    : '--'}{' '}
                  {t('AMPERE')}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                  {t('CURRENT')}
                </Typography>
              </Stack>
            </Stack>
            <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <Iconify icon="mdi:lightning-bolt-outline" width={32} color="primary.main" />
              <Stack alignItems="center">
                <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                  {outletProps?.on && PlugData?.voltage !== undefined
                    ? PlugData.voltage.toFixed(0)
                    : '--'}{' '}
                  {t('VOLT')}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                  {t('VOLTAGE')}
                </Typography>
              </Stack>
            </Stack>
            <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <Iconify icon="bi:bar-chart" width={32} color="primary.main" />
              <Stack alignItems="center">
                <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                  {outletProps?.on && outletProps?.power_W !== undefined
                    ? Math.round(outletProps.power_W)
                    : '--'}{' '}
                  {t('WATT')}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                  {t('POWER_CONSUMPTION')}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
          <Button
            component={RouterLink}
            href={`${paths.dashboard.three}/${device._id}`}
            fullWidth
            size="large"
            variant="outlined"
            color="primary"
            endIcon={
              <Iconify
                icon={
                  i18n.language === 'en' ? 'mingcute:arrow-right-line' : 'mingcute:arrow-left-line'
                }
                width={18}
              />
            }
          >
            تفاصيل
          </Button>
        </Stack>
      </Card>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        anchorEl={popover.anchorEl}
        slotProps={{ arrow: { placement: i18n.language === 'ar' ? 'top-right' : 'top-left' } }}
      >
        <MenuItem onClick={() => popover.onClose()}>
          <Iconify icon="lucide:pencil" />
          تعديل الاسم
        </MenuItem>

        <MenuItem onClick={() => popover.onClose()}>
          <Iconify icon="tabler:arrows-right-left" />
          تغيير المشترك والمخرج
        </MenuItem>

        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Iconify icon="lucide:trash-2" />
          حذف الجهاز
        </MenuItem>
      </CustomPopover>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('CONFIRM_DELETE_TITLE')}</DialogTitle>
        <DialogContent>
          <Typography>{t('CONFIRM_DELETE_MESSAGE', { name: deviceName })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            {t('CANCEL')}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {t('DELETE')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default DeviceCard;
