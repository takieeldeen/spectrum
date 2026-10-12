'use client';
import { Stack, Typography, Box, Button, Fade, useTheme, CircularProgress } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Iconify } from 'src/components/iconify';
import PlugCard from '../plug-card';
import PlugCardSkeleton from '../plug-card-skeleton';
import PlugNewEditForm from '../plug-new-edit-form';
import { useGetPlugs } from 'src/api/plug';

function PlugsListView() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { data: plugs, isLoading, error, isFetching } = useGetPlugs();
  const [openAdd, setOpenAdd] = useState(false);
  const isEmpty = plugs?.length === 0 && !isLoading && !error;

  return (
    <Stack spacing={3} sx={{ flex: 1 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        sx={{ marginBottom: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h3">{t('NAVBAR.ELECTRIC_PLUGS')}</Typography>
          <Fade in={isFetching && !isLoading} unmountOnExit>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                backgroundColor: 'primary.main',
                color: '#fff',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
              }}
            >
              <CircularProgress size={12} color="inherit" />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {t('VALIDATING')}
              </Typography>
            </Stack>
          </Fade>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Iconify icon="ep:plus" />}
          color="primary"
          onClick={() => setOpenAdd(true)}
        >
          {t('NEW_PLUG')}
        </Button>
        <PlugNewEditForm open={openAdd} onClose={() => setOpenAdd(false)} />
      </Stack>
      <Fade in={isEmpty} timeout={{ enter: 500, exit: 0 }} unmountOnExit>
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ flex: 1, height: '100%', mt: 8 }}
          spacing={3}
        >
          <Box
            component="img"
            src={`/assets/images/states/empty-${theme.palette.mode}.png`}
            alt="empty"
            sx={{ width: 1, maxWidth: '30%' }}
          />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h5">{t('NO_PLUGS_FOUND')}</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', maxWidth: 400 }}
            >
              {t('EMPTY_PLUGS_DESCRIPTION')}
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            size="large"
            color="primary"
            onClick={() => setOpenAdd(true)}
            startIcon={<Iconify icon="ep:plus" />}
          >
            {t('NEW_PLUG')}
          </Button>
        </Stack>
      </Fade>

      <Fade in={isLoading} timeout={{ enter: 500, exit: 0 }} unmountOnExit>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
            alignItems: 'start',
          }}
        >
          {[...Array(8)].map((_, index) => (
            <PlugCardSkeleton key={index} />
          ))}
        </Box>
      </Fade>

      <Fade in={!isLoading && !isEmpty} timeout={{ enter: 500, exit: 0 }} unmountOnExit>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
            alignItems: 'start',
          }}
        >
          {plugs?.map((plug) => <PlugCard key={plug.id} plug={plug} />)}
        </Box>
      </Fade>
    </Stack>
  );
}

export default PlugsListView;
