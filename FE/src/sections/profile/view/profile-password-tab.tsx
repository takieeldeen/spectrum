'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import dayjs from 'dayjs';

import {
  Box,
  Card,
  Grid,
  Stack,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';
import { Form, RHFTextField } from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks';
import { signOut } from 'src/auth/context/jwt/action';
import { useChangePassword } from 'src/api/auth';
import { useRouter } from 'src/routes/hooks';

// ----------------------------------------------------------------------

type ProfilePasswordSchemaType = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ProfilePasswordTab() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { user, checkUserSession } = useAuthContext();
  const { mutateAsync: changePassword } = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Yup Schema
  const formSchema = useMemo(
    () =>
      Yup.object().shape({
        currentPassword: Yup.string().required(
          t('PROFILE_PAGE.CURRENT_PASSWORD_REQUIRED') || 'Current password is required!'
        ),
        newPassword: Yup.string()
          .required(t('PROFILE_PAGE.NEW_PASSWORD_REQUIRED') || 'New password is required!')
          .min(8, t('PROFILE_PAGE.PASSWORD_MIN') || 'Password must be at least 8 characters!'),
        confirmPassword: Yup.string()
          .required(t('PROFILE_PAGE.CONFIRM_PASSWORD_REQUIRED') || 'Confirm password is required!')
          .oneOf(
            [Yup.ref('newPassword')],
            t('PROFILE_PAGE.PASSWORD_MISMATCH') || 'Passwords do not match!'
          ),
      }),
    [t]
  );

  // Default Values
  const defaultValues: ProfilePasswordSchemaType = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  const methods = useForm<ProfilePasswordSchemaType>({
    resolver: yupResolver(formSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  // Handle Form Submit
  const onSubmit = handleSubmit(async (data) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      // Show localized notification
      enqueueSnackbar(
        t('PROFILE_PAGE.PASSWORD_SUCCESS_LOGOUT') ||
          'Password changed successfully! You will now be logged out.',
        { variant: 'success' }
      );

      reset();

      // Log the user out and redirect to sign-in
      setTimeout(async () => {
        try {
          await signOut();
          await checkUserSession?.();
          router.push(`/${i18n.language}/auth/sign-in`);
        } catch (logoutError) {
          console.error('Error logging out after password change:', logoutError);
          router.push(`/${i18n.language}/auth/sign-in`);
        }
      }, 1200);
    } catch (error: any) {
      enqueueSnackbar(
        error?.message || t('PROFILE_PAGE.PASSWORD_ERROR') || 'Failed to change password',
        { variant: 'error' }
      );
    }
  });

  return (
    <Grid container spacing={3}>
      {/* Left Column: Change Password Form */}
      <Grid item xs={12} md={7}>
        <Card sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3 }}>
          <Stack spacing={0.5} sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              {t('PROFILE_PAGE.SECURITY_TITLE')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('PROFILE_PAGE.SECURITY_DESC')}
            </Typography>
          </Stack>

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              <RHFTextField
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                label={t('PROFILE_PAGE.CURRENT_PASSWORD')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:lock-bold-duotone" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        <Iconify
                          icon={showCurrentPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <RHFTextField
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                label={t('PROFILE_PAGE.NEW_PASSWORD')}
                helperText={t('PROFILE_PAGE.PASSWORD_MIN')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:key-bold-duotone" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                        <Iconify
                          icon={showNewPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <RHFTextField
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                label={t('PROFILE_PAGE.CONFIRM_NEW_PASSWORD')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify
                        icon="solar:check-circle-bold-duotone"
                        sx={{ color: 'text.disabled' }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        <Iconify
                          icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" justifyContent="flex-end" sx={{ pt: 1 }}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="large"
                  color="primary"
                  loading={isSubmitting}
                  disabled={!isDirty}
                  startIcon={<Iconify icon="solar:shield-check-bold" />}
                  sx={{ px: 4, borderRadius: 2 }}
                >
                  {isSubmitting
                    ? t('PROFILE_PAGE.UPDATING')
                    : t('PROFILE_PAGE.CHANGE_PASSWORD_BTN')}
                </LoadingButton>
              </Stack>
            </Stack>
          </Form>
        </Card>
      </Grid>

      {/* Right Column: Security Summary & Tips */}
      <Grid item xs={12} md={5}>
        <Stack spacing={3}>
          <Card
            sx={{
              p: 3.5,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(
                theme.palette.background.paper,
                0.9
              )} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
            }}
          >
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'success.main',
                  boxShadow: '0 0 20px rgba(76, 175, 80, 0.25)',
                }}
              >
                <Iconify icon="solar:shield-check-bold-duotone" width={36} />
              </Box>

              <Typography variant="h6" fontWeight="bold">
                {t('PROFILE_PAGE.PROTECTED')}
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {i18n.language === 'ar'
                  ? 'حسابك محمي بتقنيات التشفير الحديثة (BCrypt & JWT Token Security) لضمان أعلى مستويات الأمان لتحكمك في الأجهزة الذكية.'
                  : 'Your account is secured with state-of-the-art encryption (BCrypt & JWT Token Security) ensuring maximum protection for your smart devices.'}
              </Typography>

              <Divider sx={{ width: '100%', my: 1 }} />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ width: '100%' }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('PROFILE_PAGE.LAST_CHANGED')}
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {user?.lastPasswordChange
                    ? dayjs(user.lastPasswordChange).format('YYYY/MM/DD')
                    : t('PROFILE_PAGE.NEVER')}
                </Typography>
              </Stack>
            </Stack>
          </Card>

          {/* Password Tips */}
          <Card sx={{ p: 3, borderRadius: 3, bgcolor: 'background.neutral' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
              🛡️ {i18n.language === 'ar' ? 'نصائح لكلمة مرور آمنة:' : 'Password Security Tips:'}
            </Typography>
            <Stack spacing={1} sx={{ typography: 'caption', color: 'text.secondary' }}>
              <li>
                {i18n.language === 'ar'
                  ? 'استخدم 8 أحرف على الأقل تشمل أرقاماً ورموزاً.'
                  : 'Use at least 8 characters including numbers and symbols.'}
              </li>
              <li>
                {i18n.language === 'ar'
                  ? 'تجنب استخدام بيانات سهلة التخمين مثل تاريخ الميلاد.'
                  : 'Avoid using easy-to-guess info like birth dates.'}
              </li>
              <li>
                {i18n.language === 'ar'
                  ? 'قم بتغيير كلمة المرور بشكل دوري لحماية شبكة منزلك.'
                  : 'Update your password regularly to secure your home network.'}
              </li>
            </Stack>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}

export default ProfilePasswordTab;
