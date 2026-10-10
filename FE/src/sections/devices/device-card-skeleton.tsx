import { Card, Stack, Box, Divider, Skeleton, useTheme } from '@mui/material';

export default function DeviceCardSkeleton() {
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
