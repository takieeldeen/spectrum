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
  Autocomplete,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Iconify } from 'src/components/iconify';

import * as Yup from 'yup';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import { Form, RHFTextField } from 'src/components/hook-form';
import { useUpdatePlug, useCreatePlug } from 'src/api/plug';
import { useGetUnassignedDevices } from 'src/api/device';
import i18n from 'src/i18n';

type Props = {
  currentPlug?: any;
  open: boolean;
  onClose: () => void;
};

export default function PlugNewEditForm({ currentPlug, open, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const isEdit = !!currentPlug;

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const createPlugMutation = useCreatePlug();
  const updatePlugMutation = useUpdatePlug();

  const { data: availableDevices = [], isLoading: isLoadingDevices } = useGetUnassignedDevices(
    currentPlug ? currentPlug.id || currentPlug._id : undefined
  );

  const defaultDevices = React.useMemo(() => {
    const devicesMap: any = { device1: '', device2: '', device3: '', device4: '' };
    if (!currentPlug || !availableDevices.length) return devicesMap;

    availableDevices.forEach((d) => {
      const plugId = currentPlug.id || currentPlug._id;
      if (d.plugId === plugId && d.plugPort) {
        devicesMap[`device${d.plugPort}`] = d._id;
      }
    });
    return devicesMap;
  }, [currentPlug, availableDevices]);

  const PlugSchema = Yup.object().shape({
    name: Yup.string().required(
      t('COMMON_VALIDATIONS.REQUIRED_FIELD', { field: t('ENGLISH_NAME') })
    ),
    arabicName: Yup.string().nullable(),
    serialNumber: Yup.string().required(
      t('COMMON_VALIDATIONS.REQUIRED_FIELD', { field: t('SERIAL_NUMBER') })
    ),
    ipAddress: Yup.string().required(
      t('COMMON_VALIDATIONS.REQUIRED_FIELD', { field: t('IP_ADDRESS', 'IP Address') })
    ),
    room: Yup.string().nullable(),
    device1: Yup.string().nullable(),
    device2: Yup.string().nullable(),
    device3: Yup.string().nullable(),
    device4: Yup.string().nullable(),
  });

  type FormValues = {
    name: string;
    arabicName: string;
    serialNumber: string;
    ipAddress: string;
    room: string;
    device1: string;
    device2: string;
    device3: string;
    device4: string;
  };

  const defaultValues: FormValues = React.useMemo(
    () => ({
      name: currentPlug?.name || '',
      arabicName: currentPlug?.arabicName || '',
      serialNumber: currentPlug?.serialNumber || '',
      ipAddress: currentPlug?.ipAddress || '',
      room: currentPlug?.roomId || '',
      device1: defaultDevices.device1 || '',
      device2: defaultDevices.device2 || '',
      device3: defaultDevices.device3 || '',
      device4: defaultDevices.device4 || '',
    }),
    [currentPlug, defaultDevices]
  );

  const methods = useForm<FormValues>({
    resolver: yupResolver(PlugSchema) as any,
    defaultValues,
  });

  const { handleSubmit, reset } = methods;

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const handleClose = () => {
    reset();
    if (onClose) onClose();
  };

  const { isSubmitting } = methods.formState;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit) {
        await updatePlugMutation.mutateAsync({ id: currentPlug.id || currentPlug._id, data });
      } else {
        await createPlugMutation.mutateAsync(data);
      }
      setSnackbar({
        open: true,
        message: isEdit
          ? t('PLUG_UPDATED_SUCCESSFULLY', 'Plug was updated successfully')
          : t('PLUG_CREATED_SUCCESSFULLY', 'Plug was created successfully'),
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
              sx={{ p: 2.5, borderBottom: (theme) => `dashed 1px ${theme.palette.divider}` }}
            >
              <Typography variant="h4">اضافة مقبس جديد</Typography>
              <IconButton onClick={handleClose}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Stack>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
              <Stack spacing={3}>
                <Stack spacing={1}>
                  <Typography>{t('ENGLISH_NAME', 'English Name')}</Typography>
                  <RHFTextField name="name" placeholder={t('ENGLISH_NAME', 'English Name')} />
                </Stack>

                <Stack spacing={1}>
                  <Typography>{t('ARABIC_NAME', 'Arabic Name')}</Typography>
                  <RHFTextField name="arabicName" placeholder={t('ARABIC_NAME', 'Arabic Name')} />
                </Stack>

                <Stack spacing={1}>
                  <Typography>{t('SERIAL_NUMBER', 'Serial Number')}</Typography>
                  <RHFTextField
                    name="serialNumber"
                    placeholder={t('SERIAL_NUMBER', 'Serial Number')}
                    helperText={t('SERIAL_NUMBER_HELPER', "It's on the back of the power strip")}
                  />
                </Stack>

                <Stack spacing={1}>
                  <Typography>{t('IP_ADDRESS', 'IP Address')}</Typography>
                  <RHFTextField name="ipAddress" placeholder={t('IP_ADDRESS', 'IP Address')} />
                </Stack>

                <Stack spacing={1}>
                  <Typography>{t('ROOM', 'Room')}</Typography>
                  <Controller
                    name="room"
                    control={methods.control}
                    render={({ field, fieldState: { error } }) => (
                      <Autocomplete
                        {...field}
                        options={[]} // Empty for now; populated later when Room entities exist
                        onChange={(event, newValue) => field.onChange(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={t('SELECT_ROOM', 'Select a room')}
                            error={!!error}
                            helperText={error?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Stack>

                {[1, 2, 3, 4].map((num) => (
                  <Stack spacing={1} key={`device-${num}`}>
                    <Typography>{t(`DEVICE_${num}`, `Device ${num}`)}</Typography>
                    <Controller
                      name={`device${num}` as any}
                      control={methods.control}
                      render={({ field, fieldState: { error } }) => {
                        const valueObj = availableDevices.find((d) => d._id === field.value) || null;
                        return (
                          <Autocomplete
                            value={valueObj}
                            options={availableDevices}
                            loading={isLoadingDevices}
                            getOptionLabel={(option) =>
                              i18n.language === "ar"? option.nameAr || option.nameEn : option.nameEn
                            }
                            isOptionEqualToValue={(option, val) => option._id === val._id}
                            onChange={(event, newValue) => field.onChange(newValue ? newValue._id : '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder={t('SELECT_DEVICE', 'Select a device')}
                                error={!!error}
                                helperText={error?.message}
                              />
                            )}
                          />
                        );
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box sx={{ p: 2.5, borderTop: (theme) => `dashed 1px ${theme.palette.divider}` }}>
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
