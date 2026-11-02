'use client';
import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Button,
  useTheme,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Iconify } from 'src/components/iconify';

import * as Yup from 'yup';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { Form, RHFTextField } from 'src/components/hook-form';
import { useCreateDevice } from 'src/api/device';
import i18n from 'src/i18n';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function DeviceNewEditForm({ open, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const DeviceSchema = Yup.object().shape({
    name: Yup.string().required(
      t('COMMON_VALIDATIONS.REQUIRED_FIELD', { field: t('ENGLISH_NAME') })
    ),
    arabicName: Yup.string().nullable(),
  });

  const methods = useForm({
    resolver: yupResolver(DeviceSchema),
    defaultValues: {
      name: '',
      arabicName: '',
    },
  });

  const { handleSubmit, reset } = methods;

  const handleClose = () => {
    reset();
    onClose();
  };

  const { isSubmitting } = methods.formState;
  const createDeviceMutation = useCreateDevice();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createDeviceMutation.mutateAsync(data);
      setSnackbar({
        open: true,
        message: t('DEVICE_CREATED_SUCCESSFULLY', 'Device was created successfully'),
        severity: 'success',
      });
      handleClose();
    } catch (error: any) {
      console.error(error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred',
        severity: 'error',
      });
    }
  });

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={handleClose}
        anchor="left"
        PaperProps={{
          sx: {
            width: { xs: 1, sm: 400 },
          },
        }}
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ p: 2.5, borderBottom: `dashed 1px ${theme.palette.divider}` }}
            >
              <Typography variant="h4">{t('NEW_DEVICE', 'اضافة جهاز جديد')}</Typography>
              <IconButton onClick={handleClose}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Stack>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
              <Stack spacing={3}>
                <Stack
                  spacing={1}
                  sx={{ alignItems: i18n.language === 'en' ? 'flex-start' : 'flex-end' }}
                >
                  <Typography>{t('ENGLISH_NAME', 'English Name')}</Typography>
                  <RHFTextField name="name" placeholder={t('ENGLISH_NAME', 'English Name')} />
                </Stack>

                <Stack
                  spacing={1}
                  sx={{ alignItems: i18n.language === 'en' ? 'flex-start' : 'flex-end' }}
                >
                  <Typography>{t('ARABIC_NAME', 'Arabic Name')}</Typography>
                  <RHFTextField name="arabicName" placeholder={t('ARABIC_NAME', 'Arabic Name')} />
                </Stack>
              </Stack>
            </Box>

            <Box sx={{ p: 2.5, borderTop: `dashed 1px ${theme.palette.divider}` }}>
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  color="error"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  {t('CANCEL', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  color="primary"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {t('SAVE', 'حفظ')}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Form>
      </Drawer>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
