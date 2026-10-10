'use client';

import React, { forwardRef } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Iconify } from 'src/components/iconify';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

const ErrorView = forwardRef<HTMLDivElement, any>((props, ref) => {
  const { t } = useTranslation();

  return (
    <Stack
      ref={ref}
      {...props}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        flex: 1,
      }}
      spacing={4}
    >
      <Box
        component="img"
        src="/assets/images/states/error-view.png"
        sx={{
          width: '50%',
          maxWidth: '100%',
        }}
      />

      <Stack spacing={1}>
        <Typography variant="h4">{t('ERROR_DEVICES_TITLE', 'تعذر تحميل الأجهزة')}</Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          {t('ERROR_DEVICES_SUBTITLE', 'حدث خطأ أثناء تحميل قائمة الأجهزة.')}
          <br />
          {t('ERROR_DEVICES_DESCRIPTION', 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.')}
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
        <Button
          onClick={() => window.location.reload()}
          size="large"
          variant="contained"
          color="primary"
          endIcon={<Iconify icon="solar:refresh-linear" width={24} />}
        >
          {t('RETRY', 'إعادة المحاولة')}
        </Button>
        <Button
          component={RouterLink}
          href={paths.dashboard.root}
          size="large"
          variant="outlined"
          color="inherit"
          endIcon={<Iconify icon="solar:home-2-linear" width={24} />}
        >
          {t('BACK_TO_HOME', 'العودة إلى الرئيسية')}
        </Button>
      </Stack>
    </Stack>
  );
});

export default ErrorView;
