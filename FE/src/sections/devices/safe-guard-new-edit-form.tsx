'use client';

import React, { useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  ButtonProps,
  CircularProgress,
  FormHelperText,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

import { useCreate, useUpdate } from 'src/api/guards';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form } from 'src/components/hook-form';
import {
  DrawerContent,
  DrawerTrigger,
  useNewEditDrawer,
} from 'src/components/new-edit-form/new-edit-drawer';
import { RadioCard } from 'src/components/radio-card';
import { useParams } from 'src/routes/hooks';
import { IGuard, GuardAction, GuardComparator, GuardTarget } from 'src/types/guard';

// ----------------------------------------------------------------------

type NewEditFormProps = {
  buttonProps?: ButtonProps;
  currentGuard?: IGuard;
  deviceId?: string;
  onClose?: () => void;
};

type FormValues = {
  action: GuardAction;
  comparator: GuardComparator;
  target: GuardTarget;
  value: number | string;
};

function SafeGuardNewEditForm({
  buttonProps,
  currentGuard,
  deviceId: explicitDeviceId,
  onClose,
}: NewEditFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const drawerContext = useNewEditDrawer();
  const params = useParams();

  const isEdit = !!currentGuard?._id;

  const resolvedDeviceId = useMemo(() => {
    if (explicitDeviceId) return explicitDeviceId;
    if (currentGuard?.deviceId) {
      return typeof currentGuard.deviceId === 'object'
        ? (currentGuard.deviceId as any)._id
        : currentGuard.deviceId;
    }
    return typeof params?.deviceId === 'string' ? params.deviceId : '';
  }, [explicitDeviceId, currentGuard, params]);

  const createMutation = useCreate();
  const updateMutation = useUpdate();

  const defaultValues: FormValues = useMemo(
    () => ({
      action: (currentGuard?.action as GuardAction) || 'OFF',
      comparator: (currentGuard?.comparator as GuardComparator) || 'MIN',
      target: (currentGuard?.target as GuardTarget) || 'CURRENT',
      value: currentGuard?.value !== undefined ? currentGuard.value : '',
    }),
    [currentGuard]
  );

  const GuardSchema = useMemo(
    () =>
      Yup.object().shape({
        action: Yup.string().required(
          t('COMMON_VALIDATIONS.REQUIRED_FIELD', { field: t('GUARD_PURPOSE') })
        ),
        comparator: Yup.string().required(
          t('COMMON_VALIDATIONS.REQUIRED_FIELD', { field: t('GUARD_TYPE') })
        ),
        target: Yup.string().required(
          t('COMMON_VALIDATIONS.REQUIRED_FIELD', { field: t('GUARD_TARGET_LABEL') })
        ),
        value: Yup.number()
          .transform((val, orig) =>
            orig === '' || orig === null || orig === undefined ? undefined : Number(orig)
          )
          .when(['comparator', 'target'], ([comparator, target], schema) => {
            const cLabel = comparator === 'MAX' ? t('GUARD_MAX') : t('GUARD_MIN');
            const tLabel =
              {
                CURRENT: t('CURRENT'),
                TEMPERATURE: t('TEMPERATURE'),
                POWER: t('POWER_CONSUMPTION'),
              }[target as GuardTarget] || t('POWER_CONSUMPTION');

            const dynLabel = t('GUARD_THRESHOLD_DYNAMIC', {
              comparator: cLabel,
              target: tLabel,
            });

            return schema
              .typeError(t('COMMON_VALIDATIONS.REQUIRED_FIELD', { field: dynLabel }))
              .required(t('COMMON_VALIDATIONS.REQUIRED_FIELD', { field: dynLabel }))
              .min(0, t('COMMON_VALIDATIONS.INVALID_FIELD', { field: dynLabel }));
          }),
      }),
    [t]
  );

  const methods = useForm<FormValues>({
    resolver: yupResolver(GuardSchema) as any,
    defaultValues,
  });

  const {
    watch,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const selectedComparator = watch('comparator');
  const selectedTarget = watch('target');

  const comparatorLabel = selectedComparator === 'MAX' ? t('GUARD_MAX') : t('GUARD_MIN');
  const targetLabel =
    {
      CURRENT: t('CURRENT'),
      TEMPERATURE: t('TEMPERATURE'),
      POWER: t('POWER_CONSUMPTION'),
    }[selectedTarget as GuardTarget] || t('POWER_CONSUMPTION');

  const dynamicLabel = t('GUARD_THRESHOLD_DYNAMIC', {
    comparator: comparatorLabel,
    target: targetLabel,
  });

  const unitLabel =
    {
      CURRENT: t('AMPERE'),
      TEMPERATURE: t('UNIT_CELSIUS'),
      POWER: t('WATT'),
    }[selectedTarget as GuardTarget] || t('WATT');

  const handleClose = () => {
    reset();
    drawerContext?.onClose();
    onClose?.();
  };

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        const payload = {
          ...data,
          deviceId: resolvedDeviceId,
          value: Number(data.value),
        };

        if (isEdit) {
          await updateMutation.mutateAsync({
            id: currentGuard!._id,
            data: payload,
          });
          toast.info(t('GUARD_UPDATED_SUCCESSFULLY'), t('RULE_UPDATED_SUCCESSFULLY_DESC'));
        } else {
          await createMutation.mutateAsync(payload);
          toast.success(t('GUARD_CREATED_SUCCESSFULLY'), t('CHANGES_APPLIED_SUCCESSFULLY'));
        }

        handleClose();
      } catch (error: any) {
        console.error(error);
        toast.error(
          t('ERROR_SAVING_GUARD'),
          error?.message || t('GUARD_SAVED_FAILED_TRY_AGAIN')
        );
      }
    },
    (validationErrors) => {
      console.warn('Validation errors:', validationErrors);
    }
  );

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <DrawerContent
        anchor="left"
        PaperProps={{
          sx: {
            width: { xs: 1, sm: 400 },
          },
        }}
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Header */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 2.5,
                borderBottom: (themeProps) => `dashed 1px ${themeProps.palette.divider}`,
                flexShrink: 0,
              }}
            >
              <Stack>
                <Typography variant="h4">
                  {isEdit ? t('EDIT_SAFETY_RULE') : t('ADD_SAFETY_RULE')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('SAFETY_RULE_SUBTITLE')}
                </Typography>
              </Stack>
              <DrawerTrigger variant="text" size="small" sx={{ aspectRatio: 1, px: 0 }}>
                <Iconify icon="eva:close-fill" />
              </DrawerTrigger>
            </Stack>

            {/* Scrollable Form Body */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
              <Stack spacing={3}>
                {/* 1. Rule Purpose */}
                <Stack spacing={2}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    {t('GUARD_PURPOSE')}
                  </Typography>
                  <Controller
                    name="action"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Stack spacing={1}>
                        <RadioCard
                          title={t('GUARD_ACTION_OFF_TITLE')}
                          subtitle={t('GUARD_ACTION_OFF_SUBTITLE')}
                          selected={field.value === 'OFF'}
                          onClick={() => field.onChange('OFF')}
                          icon={<Iconify icon="carbon:power" width={24} color="text.secondary" />}
                          value="OFF"
                        />
                        <RadioCard
                          title={t('GUARD_ACTION_ON_TITLE')}
                          subtitle={t('GUARD_ACTION_ON_SUBTITLE')}
                          selected={field.value === 'ON'}
                          onClick={() => field.onChange('ON')}
                          icon={<Iconify icon="carbon:power" width={24} color="text.secondary" />}
                          value="ON"
                        />
                        {error && (
                          <FormHelperText error sx={{ mx: 0.5 }}>
                            {error.message}
                          </FormHelperText>
                        )}
                      </Stack>
                    )}
                  />
                </Stack>

                {/* 2. Rule Type */}
                <Stack spacing={2}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{t('GUARD_TYPE')}</Typography>
                  <Controller
                    name="comparator"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Stack spacing={1}>
                        <RadioCard
                          title={t('GUARD_MIN')}
                          subtitle={t('GUARD_MIN_SUBTITLE')}
                          selected={field.value === 'MIN'}
                          onClick={() => field.onChange('MIN')}
                          icon={
                            <Iconify icon="bi:thermometer-low" width={24} color="text.secondary" />
                          }
                          value="MIN"
                        />
                        <RadioCard
                          title={t('GUARD_MAX')}
                          subtitle={t('GUARD_MAX_SUBTITLE')}
                          selected={field.value === 'MAX'}
                          onClick={() => field.onChange('MAX')}
                          icon={
                            <Iconify icon="bi:thermometer-high" width={24} color="text.secondary" />
                          }
                          value="MAX"
                        />
                        {error && (
                          <FormHelperText error sx={{ mx: 0.5 }}>
                            {error.message}
                          </FormHelperText>
                        )}
                      </Stack>
                    )}
                  />
                </Stack>

                {/* 3. Monitored Metric */}
                <Stack spacing={2}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    {t('GUARD_TARGET_LABEL')}
                  </Typography>
                  <Controller
                    name="target"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Stack spacing={1}>
                        <RadioCard
                          title={t('CURRENT')}
                          subtitle={t('GUARD_CURRENT_SUBTITLE')}
                          selected={field.value === 'CURRENT'}
                          onClick={() => field.onChange('CURRENT')}
                          icon={
                            <Iconify icon="solar:bolt-outline" width={24} color="text.secondary" />
                          }
                          value="CURRENT"
                        />
                        <RadioCard
                          title={t('TEMPERATURE')}
                          subtitle={t('GUARD_TEMPERATURE_SUBTITLE')}
                          selected={field.value === 'TEMPERATURE'}
                          onClick={() => field.onChange('TEMPERATURE')}
                          icon={
                            <Iconify icon="bi:thermometer-high" width={24} color="text.secondary" />
                          }
                          value="TEMPERATURE"
                        />
                        <RadioCard
                          title={t('POWER_CONSUMPTION')}
                          subtitle={t('GUARD_POWER_SUBTITLE')}
                          selected={field.value === 'POWER'}
                          onClick={() => field.onChange('POWER')}
                          icon={<Iconify icon="bi:lightning" width={24} color="text.secondary" />}
                          value="POWER"
                        />
                        {error && (
                          <FormHelperText error sx={{ mx: 0.5 }}>
                            {error.message}
                          </FormHelperText>
                        )}
                      </Stack>
                    )}
                  />
                </Stack>

                {/* 4. Threshold Dynamic Input */}
                <Stack spacing={2}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{dynamicLabel}</Typography>
                  <Controller
                    name="value"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Stack spacing={0.5}>
                        <Stack spacing={1} direction="row" alignItems="center">
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder={dynamicLabel}
                            type="number"
                            error={!!error}
                            sx={{ flex: 1 }}
                          />
                          <Typography>{unitLabel}</Typography>
                        </Stack>
                        {error && (
                          <FormHelperText error sx={{ mx: 0.5 }}>
                            {error.message}
                          </FormHelperText>
                        )}
                      </Stack>
                    )}
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Fixed Action Buttons at Bottom */}
            <Box
              sx={{
                p: 2.5,
                borderTop: (themeProps) => `dashed 1px ${themeProps.palette.divider}`,
                flexShrink: 0,
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  color="primary"
                  disabled={isPending}
                  startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {t('SAVE')}
                </Button>
                <DrawerTrigger
                  variant="soft"
                  size="large"
                  fullWidth
                  onClick={handleClose}
                  disabled={isPending}
                >
                  {t('CANCEL')}
                </DrawerTrigger>
              </Stack>
            </Box>
          </Box>
        </Form>
      </DrawerContent>
    </>
  );
}

export default SafeGuardNewEditForm;
