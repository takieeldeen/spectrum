'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { useCancelDeviceTimer, useSetDeviceTimer } from 'src/api/device';
import { varAlpha } from 'src/theme/styles';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_DURATIONS: { labelKey: string; mins: number; isTest?: boolean }[] = [
  { labelKey: 'SLEEP_TIMER.MIN_1_TEST', mins: 1, isTest: true },
  { labelKey: 'SLEEP_TIMER.MIN_15', mins: 15 },
  { labelKey: 'SLEEP_TIMER.MIN_30', mins: 30 },
  { labelKey: 'SLEEP_TIMER.HOUR_1', mins: 60 },
  { labelKey: 'SLEEP_TIMER.HOUR_2', mins: 120 },
  { labelKey: 'SLEEP_TIMER.HOUR_4', mins: 240 },
  { labelKey: 'SLEEP_TIMER.HOUR_8', mins: 480 },
];

// ─── Countdown Hook ────────────────────────────────────────────────────────────

function useCountdown(closesAt: string | null | undefined) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!closesAt) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const diff = new Date(closesAt).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAt]);

  return remaining;
}

function formatCountdown(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  deviceId: string;
  deviceName?: string;
  timerClosesAt?: string | null;
  /** Called after a timer is successfully set or cancelled (e.g., to trigger a refetch) */
  onChanged?: () => void;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DeviceTimerButton({
  deviceId,
  deviceName,
  timerClosesAt,
  onChanged,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const setTimer = useSetDeviceTimer();
  const cancelTimer = useCancelDeviceTimer();

  const remaining = useCountdown(timerClosesAt);
  const hasActiveTimer = !!timerClosesAt && remaining > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpen = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleSetTimer = useCallback(async () => {
    if (!selected) return;
    try {
      await setTimer.mutateAsync({ id: deviceId, durationMins: selected });
      toast.success(t('SLEEP_TIMER.TIMER_SET_SUCCESS'));
      setOpen(false);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('SLEEP_TIMER.TIMER_ERROR'));
    }
  }, [deviceId, selected, setTimer, t, onChanged]);

  const handleCancelTimer = useCallback(async () => {
    try {
      await cancelTimer.mutateAsync(deviceId);
      toast.success(t('SLEEP_TIMER.TIMER_CANCELLED'));
      setCancelConfirmOpen(false);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('SLEEP_TIMER.TIMER_ERROR'));
    }
  }, [deviceId, cancelTimer, t, onChanged]);

  // ── Styles ────────────────────────────────────────────────────────────────

  const chipBase = {
    flex: '1 1 calc(33.33% - 8px)',
    minWidth: 0,
    height: 48,
    borderRadius: 2,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1.5px solid ${theme.palette.divider}`,
    bgcolor: isDark
      ? varAlpha(theme.palette.grey[800] + 'ff', 0.6)
      : theme.palette.background.neutral,
    '&:hover': {
      borderColor: theme.palette.primary.main,
      bgcolor: varAlpha(theme.palette.primary.mainChannel, 0.08),
    },
  };

  const chipSelected = {
    borderColor: theme.palette.primary.main,
    bgcolor: varAlpha(theme.palette.primary.mainChannel, 0.14),
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Trigger Button ─────────────────────────────────────────────── */}
      <Button
        id="device-timer-btn"
        fullWidth
        variant="outlined"
        color={hasActiveTimer ? 'warning' : 'primary'}
        size="large"
        startIcon={
          <Iconify
            icon={hasActiveTimer ? 'solar:clock-circle-bold-duotone' : 'solar:alarm-bold-duotone'}
          />
        }
        onClick={hasActiveTimer ? () => setCancelConfirmOpen(true) : handleOpen}
        sx={{ justifyContent: 'flex-start', gap: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={1} flex={1} justifyContent="space-between">
          <Typography variant="body2" fontWeight={600}>
            {hasActiveTimer ? t('SLEEP_TIMER.ACTIVE_TIMER') : t('SLEEP_TIMER.TITLE')}
          </Typography>

          <Fade in={hasActiveTimer}>
            <Typography
              variant="body2"
              fontWeight={700}
              fontFamily="monospace"
              sx={{
                color: theme.palette.warning.main,
                letterSpacing: 1,
                fontSize: 13,
              }}
            >
              {formatCountdown(remaining)}
            </Typography>
          </Fade>
        </Stack>
      </Button>

      {/* ── Set Timer Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: isDark ? theme.palette.background.default : theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle>
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:alarm-bold-duotone" width={24} color="primary.main" />
              <Typography variant="h6">{t('SLEEP_TIMER.TITLE')}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {t('SLEEP_TIMER.SUBTITLE')}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: '12px !important' }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {PRESET_DURATIONS.map(({ labelKey, mins }) => {
              const isSelected = selected === mins;
              return (
                <Box
                  key={mins}
                  id={`timer-chip-${mins}`}
                  component="button"
                  onClick={() => setSelected(mins)}
                  sx={{
                    ...chipBase,
                    ...(isSelected ? chipSelected : {}),
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isSelected ? 700 : 500}
                    color={isSelected ? 'primary.main' : 'text.primary'}
                  >
                    {t(labelKey)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            id="timer-cancel-btn"
            variant="outlined"
            color="inherit"
            onClick={() => setOpen(false)}
            sx={{ flex: 1 }}
          >
            {t('CANCEL')}
          </Button>
          <Button
            id="timer-set-btn"
            variant="contained"
            color="primary"
            disabled={!selected || setTimer.isPending}
            onClick={handleSetTimer}
            startIcon={
              setTimer.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="solar:alarm-bold-duotone" width={18} />
              )
            }
            sx={{ flex: 1 }}
          >
            {setTimer.isPending ? t('VALIDATING') : t('SLEEP_TIMER.SET_TIMER')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel Confirm Dialog ──────────────────────────────────────── */}
      <Dialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:clock-circle-bold-duotone" width={22} color="warning.main" />
            <Typography variant="h6">{t('SLEEP_TIMER.ACTIVE_TIMER')}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {t('SLEEP_TIMER.CANCEL_CONFIRM')}
            </Typography>
            {/* Live countdown in confirm dialog */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: varAlpha(theme.palette.warning.mainChannel, 0.1),
                border: `1px solid ${varAlpha(theme.palette.warning.mainChannel, 0.3)}`,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('SLEEP_TIMER.TURNS_OFF_IN')}
              </Typography>
              <Typography
                variant="h4"
                fontFamily="monospace"
                fontWeight={700}
                color="warning.main"
                letterSpacing={2}
              >
                {formatCountdown(remaining)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            id="keep-timer-btn"
            variant="outlined"
            color="inherit"
            onClick={() => setCancelConfirmOpen(false)}
            sx={{ flex: 1 }}
          >
            {t('CANCEL')}
          </Button>
          <Button
            id="confirm-cancel-timer-btn"
            variant="contained"
            color="warning"
            disabled={cancelTimer.isPending}
            onClick={handleCancelTimer}
            startIcon={
              cancelTimer.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="solar:close-circle-bold-duotone" width={18} />
              )
            }
            sx={{ flex: 1 }}
          >
            {cancelTimer.isPending ? t('VALIDATING') : t('SLEEP_TIMER.CANCEL_TIMER')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
