'use client';
import {
  Box,
  Button,
  Card,
  Divider,
  Stack,
  Switch,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import React, { useCallback, useState, useEffect } from 'react';
import { useGetPlug } from 'src/api/plug';
import { useTranslation } from 'react-i18next';
import { Iconify } from 'src/components/iconify';
import ElectricPlug, { PlugSocket } from 'src/components/electric-plug/electric-plug';
import { usePlugSocket } from 'src/hooks/use-plug-socket';
import Grid from '@mui/material/Unstable_Grid2';
import { varAlpha } from 'src/theme/styles';
import ConsumptionTrack from 'src/sections/dashboard/electricity-consumption';
import PlugConsumptionCurve from '../plug-tempreture-curve';
import PlugPowerCurve from '../plug-power-curve';

type Props = {
  id: string;
};

function PlugDetailsView({ id }: Props) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { data: plug, isLoading } = useGetPlug(id);
  const { liveData, isConnected, sendOrder, toggleOutlet, toggleMultipleOutlets } =
    usePlugSocket(id);
  console.log(liveData, isConnected);

  // Track the target state for each outlet while waiting for hardware confirmation
  const [targetStates, setTargetStates] = useState<Record<number, boolean>>({});

  const handleToggleOutlet = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, checked: boolean, num: number) => {
      // Optimistically set the target state and show loading
      setTargetStates((prev) => ({ ...prev, [num]: checked }));
      toggleOutlet(checked ? 'on' : 'off', num);
    },
    [toggleOutlet]
  );
  const ANY_SWITCH_ON = Object.values(liveData?.outlets || {}).some((outlet: any) => outlet.on);
  const handleToggleAllOutlets = useCallback(() => {
    const newState = ANY_SWITCH_ON ? 'off' : 'on';
    toggleMultipleOutlets(newState, [1, 2, 3, 4]);
    setTargetStates((prev) => ({
      1: !ANY_SWITCH_ON,
      2: !ANY_SWITCH_ON,
      3: !ANY_SWITCH_ON,
      4: !ANY_SWITCH_ON,
    }));
  }, []);

  // Clear loading state once the hardware reports the expected state
  useEffect(() => {
    if (liveData?.outlets) {
      setTargetStates((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach((numStr) => {
          const num = parseInt(numStr, 10);
          const outletKey = `outlet${num}` as keyof typeof liveData.outlets;
          if (liveData.outlets[outletKey]?.on === next[num]) {
            delete next[num];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [liveData]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between">
        <Typography variant="h4">
          {i18n.language === 'ar'
            ? plug?.arabicName !== ''
              ? plug?.arabicName
              : plug?.name
            : plug?.name}
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="lucide:power" />}
            color="primary"
          >
            {t('ACTIVATE')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Iconify icon="lucide:pencil" />}
            color="info"
          >
            {t('EDIT')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Iconify icon="lucide:trash-2" />}
            color="error"
          >
            {t('DELETE')}
          </Button>
        </Stack>
      </Stack>
      <Box sx={{ width: '50%', alignSelf: 'center' }}>
        {liveData?.outlets && <ElectricPlug outlets={liveData?.outlets} />}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, 1fr)' },
          gap: 3,
        }}
      >
        {[1, 2, 3, 4].map((num, index) => {
          const outletKey = `outlet${num}` as keyof typeof liveData.outlets;
          const outlet = liveData?.outlets?.[outletKey];

          if (!outlet) return null;

          return (
            <Card key={num} sx={{ p: 3 }}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ width: 120, alignSelf: 'stretch' }}>
                  <PlugSocket outlet={outlet} hideSwitch />
                </Box>
                <Stack sx={{ flex: 1 }} spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5">{`مدخل ${num}`}</Typography>
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      {targetStates[num] !== undefined && (
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
                        checked={targetStates[num] !== undefined ? targetStates[num] : outlet.on}
                        disabled={targetStates[num] !== undefined}
                        onChange={(e, checked) => handleToggleOutlet(e, checked, num)}
                        sx={{ opacity: targetStates[num] !== undefined ? 0.5 : 1 }}
                      />
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify
                      icon="lucide:zap"
                      width={16}
                      sx={{ color: outlet.on ? 'primary.main' : 'text.secondary' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {outlet.watts} واط
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify
                      icon="lucide:battery-charging"
                      width={16}
                      sx={{ color: outlet.on ? 'primary.main' : 'text.secondary' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {outlet.power_mw} ميلي واط
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify
                      icon="lucide:clock"
                      width={16}
                      sx={{ color: outlet.on ? 'primary.main' : 'text.secondary' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {outlet.runtime} ثانية
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          );
        })}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between">
            <Stack>
              <Typography variant="h5">المتحكم الرئيسي</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                تشغيل وإيقاف جميع المخارج
              </Typography>
            </Stack>
            <Switch
              disabled={Object.keys(targetStates).length > 0}
              checked={liveData?.outlets && ANY_SWITCH_ON}
              onChange={handleToggleAllOutlets}
            />
          </Stack>
        </Card>
      </Box>
      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Iconify icon="bi:thermometer" width={30} />
                  <Typography variant="h5">درجة الحرارة</Typography>
                </Stack>
                <Stack>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 700 }}>
                    متوسط درجات الحرارة
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 32 }}>32.5° </Typography>
                </Stack>
                <Stack sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      backgroundColor: varAlpha(theme.palette.primary.mainChannel, 0.15),
                      p: 1.5,
                      borderRadius: 1,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Iconify
                        icon="nrk:checkmark-circle-checked-solid-expressive"
                        color="primary.main"
                        width={30}
                      />
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 700 }}>
                          ضمن المعدل الطببيعي
                        </Typography>
                        <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          10° - 60°{' '}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </Stack>
              <Box sx={{ flex: 1 }}>
                <PlugConsumptionCurve />
              </Box>
            </Stack>
          </Card>
        </Grid>
        <Grid xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={1}>
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={3}>
                <Stack spacing={4} sx={{ width: { md: 240, xs: '100%' } }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify
                      icon="solar:chart-square-bold"
                      width={24}
                      sx={{ color: 'text.primary' }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      استهلاك الطاقة
                    </Typography>
                  </Stack>
                  <Stack>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography sx={{ fontSize: 36, fontWeight: 700 }}>88</Typography>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        واط
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={4}>
                    <Stack>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ color: 'text.secondary', mb: 1 }}
                      >
                        <Iconify icon="solar:calendar-date-bold" width={16} />
                        <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
                          أعلي استهلاك
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="baseline" spacing={0.5}>
                        <Typography sx={{ fontSize: 20, fontWeight: 700 }}>220</Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          واط
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ color: 'text.secondary', mb: 1 }}
                      >
                        <Iconify icon="solar:calendar-mark-bold" width={16} />
                        <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
                          إجمالي اليوم
                        </Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 20, fontWeight: 700 }}>142</Typography>
                    </Stack>
                  </Stack>
                </Stack>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <PlugPowerCurve />
                </Box>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default PlugDetailsView;
