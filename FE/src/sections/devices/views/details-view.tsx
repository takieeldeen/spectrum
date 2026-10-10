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
} from '@mui/material';
import { varAlpha } from 'src/theme/styles';
import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useTranslation } from 'react-i18next';

type Props = {
  deviceId: string;
};

export default function DeviceDetailsView({ deviceId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
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
            variant="contained"
            color="error"
            startIcon={<Iconify icon="lucide:trash-2" />}
          >
            {t('DELETE')}
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }}>
          <Box
            component="img"
            src="/assets/images/states/plug.png"
            sx={{
              width: '15%',
            }}
          />
          <Stack flex={1} spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems="flex-start"
                spacing={2}
                flex={1}
              >
                <Stack>
                  <Typography variant="h4">تلفزيون غرفة النوم</Typography>
                  <Typography color="text.secondary">مشترك اوضة النوم - مخرج ٢</Typography>
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
              <Switch sx={{ transform: 'scale(2.5)' }} />
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
              divider={<Divider flexItem orientation="vertical" />}
            >
              <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <Iconify icon="boxicons:bolt" width={32} color="primary.main" />
                <Stack alignItems="center">
                  <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                    12.6 ك.و. / ساعة
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                    إجمالي الاستهلاك
                  </Typography>
                </Stack>
              </Stack>
              <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <Iconify icon="bi:bar-chart" width={32} color="primary.main" />
                <Stack alignItems="center">
                  <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                    0.45 ك.و. / ساعة
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                    استهلاك اليوم
                  </Typography>
                </Stack>
              </Stack>
              <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <Iconify icon="akar-icons:clock" width={32} color="primary.main" />
                <Stack alignItems="center">
                  <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                    3 ساعات
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                    استهلاك اليوم
                  </Typography>
                </Stack>
              </Stack>
              <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <Iconify icon="bi:bar-chart" width={32} color="primary.main" />
                <Stack alignItems="center">
                  <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                    120 واط{' '}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                    استهلاك اليوم
                  </Typography>
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
                <Typography>معلومات الجهاز</Typography>
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
                  منذ 13 دقيقة
                </Typography>
              </Stack>
            </Stack>
          </Card>
          <Card sx={{ p: 3 }}>
            <Stack divider={<Divider flexItem />} spacing={1}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Iconify icon="basil:location-outline" color="primary.main" width={30} />
                <Typography>موقع الجهاز</Typography>
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Stack flex={1} direction="row" spacing={1}>
                  <Iconify icon="bi:plug" width={24} color="text.secondary" />
                  <Typography color="text.secondary">المشترك</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 12 }}>
                  مشترك البلكونة
                </Typography>
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Stack flex={1} direction="row" spacing={1}>
                  <Iconify icon="akar-icons:wifi" width={24} color="text.secondary" />
                  <Typography color="text.secondary">المدخل</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 12 }}>
                  مدخل ٢
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Stack>
        <Stack flex={{ md: 5, xs: 1 }} spacing={2}>
          <Card>Consumption Curve</Card>
          <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
            <Card sx={{ flex: 1 }}>Statistics</Card>
            <Card sx={{ flex: 1 }}>Settings</Card>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
