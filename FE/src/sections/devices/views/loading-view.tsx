import { Box, Breadcrumbs, Card, Divider, Skeleton, Stack, useTheme } from '@mui/material';
import React from 'react';
import { Iconify } from 'src/components/iconify';
import { useResponsive } from 'src/hooks/use-responsive';

// ----------------------------------------------------------------------

export function DeviceCardSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="rectangular" width={40} height={20} sx={{ borderRadius: 1 }} />
          </Stack>
          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 2 }} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={96} height={96} />
          <Stack direction="column" spacing={0.5} sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={32} />
            <Skeleton variant="text" width="50%" height={20} />
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
          {[...Array(3)].map((_, index) => (
            <Stack key={index} alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Stack alignItems="center" sx={{ width: '100%' }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="80%" height={20} />
              </Stack>
            </Stack>
          ))}
        </Stack>

        <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function DeviceGuardCardSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Stack
      spacing={2}
      sx={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 1,
        borderColor: theme.palette.grey[isDark ? 700 : 300],
        p: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Skeleton variant="circular" width={48} height={48} sx={{ flexShrink: 0 }} />
        <Stack flex={1} spacing={0.5}>
          <Skeleton sx={{ width: { xs: '70%', md: '50%' }, height: 20 }} />
          <Skeleton sx={{ width: { xs: '50%', md: '35%' }, height: 14 }} />
        </Stack>
        <Skeleton
          variant="rounded"
          width={38}
          height={22}
          sx={{ borderRadius: 12, flexShrink: 0 }}
        />
        <Skeleton variant="circular" width={28} height={28} sx={{ flexShrink: 0 }} />
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function DeviceGuardsCardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card sx={{ flex: 1, p: 3 }}>
      <Stack spacing={2}>
        <Stack alignItems="center" direction="row" spacing={1} justifyContent="space-between">
          <Stack alignItems="center" direction="row" spacing={1}>
            <Iconify icon="ant-design:safety-outlined" color="primary.main" width={30} />
            <Skeleton sx={{ width: 100, height: 24 }} />
          </Stack>
          <Skeleton sx={{ width: 140, height: 40, borderRadius: 1 }} />
        </Stack>
        <Stack spacing={2}>
          {[...Array(count)].map((_, index) => (
            <DeviceGuardCardSkeleton key={index} />
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function DetailsViewSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const mdUp = useResponsive('up', 'md');

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Breadcrumbs>
          <Skeleton sx={{ height: 12, width: 64 }} />
          <Skeleton sx={{ height: 12, width: 64 }} />
          <Skeleton sx={{ height: 12, width: 64 }} />
        </Breadcrumbs>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <Skeleton sx={{ height: 48, width: { md: 120, xs: '100%' }, borderRadius: 1 }} />
          <Skeleton sx={{ height: 48, width: { md: 120, xs: '100%' }, borderRadius: 1 }} />
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
                <Stack alignItems={{ xs: 'center', md: 'flex-start' }} spacing={1}>
                  <Skeleton sx={{ height: 24, width: { xs: '100%', md: 172 } }} />
                  <Skeleton sx={{ height: 12, width: { xs: '100%', md: 120 } }} />
                </Stack>
                <Skeleton sx={{ height: 22, width: 68 }} />
              </Stack>
              <Skeleton sx={{ height: 36, width: 90 }} />
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
                <Stack alignItems="center" spacing={1}>
                  <Skeleton sx={{ height: 15, width: 48 }} />
                  <Skeleton sx={{ height: 12, width: 72 }} />
                </Stack>
              </Stack>
              <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <Iconify icon="bi:bar-chart" width={32} color="primary.main" />
                <Stack alignItems="center" spacing={1}>
                  <Skeleton sx={{ height: 15, width: 48 }} />
                  <Skeleton sx={{ height: 12, width: 72 }} />
                </Stack>
              </Stack>
              <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <Iconify icon="mdi:lightning-bolt-outline" width={32} color="primary.main" />
                <Stack alignItems="center" spacing={1}>
                  <Skeleton sx={{ height: 15, width: 48 }} />
                  <Skeleton sx={{ height: 12, width: 72 }} />
                </Stack>
              </Stack>
              <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <Iconify icon="mdi:current-ac" width={32} color="primary.main" />
                <Stack alignItems="center" spacing={1}>
                  <Skeleton sx={{ height: 15, width: 48 }} />
                  <Skeleton sx={{ height: 12, width: 72 }} />
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Card>
      <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
        <Stack flex={{ md: 2, xs: 1 }} spacing={2}>
          <Card sx={{ p: 3 }}>
            <Stack divider={<Divider flexItem />} spacing={1}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Iconify icon="ic:outline-info" color="primary.main" width={30} />
                <Skeleton sx={{ width: 100, height: 24 }} />
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Stack flex={1} direction="row" spacing={1}>
                  <Iconify icon="bi:plug" width={24} color="text.secondary" />
                  <Skeleton sx={{ width: 40, height: 12 }} />{' '}
                </Stack>
                <Skeleton sx={{ width: 40, height: 12 }} />{' '}
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Stack flex={1} direction="row" spacing={1}>
                  <Iconify icon="akar-icons:wifi" width={24} color="text.secondary" />
                  <Skeleton sx={{ width: 40, height: 12 }} />{' '}
                </Stack>
                <Skeleton sx={{ width: 40, height: 12 }} />{' '}
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Stack flex={1} direction="row" spacing={1}>
                  <Iconify icon="lucide:clock" width={24} color="text.secondary" />
                  <Skeleton sx={{ width: 40, height: 12 }} />{' '}
                </Stack>
                <Skeleton sx={{ width: 40, height: 12 }} />{' '}
              </Stack>
            </Stack>
          </Card>
          <Card sx={{ p: 3 }}>
            <Stack divider={<Divider flexItem />} spacing={1}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Iconify icon="basil:location-outline" color="primary.main" width={30} />
                <Skeleton sx={{ width: 100, height: 24 }} />
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Stack flex={1} direction="row" spacing={1}>
                  <Iconify icon="bi:plug" width={24} color="text.secondary" />
                  <Skeleton sx={{ width: 40, height: 12 }} />
                </Stack>
                <Skeleton sx={{ width: 40, height: 12 }} />
              </Stack>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Stack flex={1} direction="row" spacing={1}>
                  <Iconify icon="akar-icons:wifi" width={24} color="text.secondary" />
                  <Skeleton sx={{ width: 40, height: 12 }} />
                </Stack>
                <Skeleton sx={{ width: 40, height: 12 }} />
              </Stack>
            </Stack>
          </Card>
        </Stack>
        <Stack flex={{ md: 5, xs: 1 }} spacing={2}>
          <Card sx={{ p: 3 }}>
            <Stack alignItems="center" direction="row" spacing={1} mb={4}>
              <Iconify icon="bi:bar-chart" width={32} color="primary.main" />
              <Skeleton sx={{ width: 100, height: 24 }} />
            </Stack>
            <Skeleton sx={{ height: 400 }} />
          </Card>
          <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
            <DeviceGuardsCardSkeleton count={5} />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}

export const LoadingView = DetailsViewSkeleton;
export default DetailsViewSkeleton;
