'use client';

import React, { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useRouter, usePathname } from 'next/navigation';
import dayjs from 'dayjs';

import {
  Card,
  Grid,
  Stack,
  Typography,
  InputAdornment,
  Chip,
  Divider,
  useTheme,
  alpha,
  Paper,
  useColorScheme,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';
import { Form, RHFTextField } from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks';
import { useSettingsContext } from 'src/components/settings';
import { useUpdateProfile } from 'src/api/auth';

// ----------------------------------------------------------------------

type ProfileInfoSchemaType = {
  name: string;
  phoneNumber: string;
};

export function ProfileInfoTab() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const { mode, setMode } = useColorScheme();

  const { user, checkUserSession } = useAuthContext();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const isDark =
    mode === 'dark' || settings.colorScheme === 'dark' || theme.palette.mode === 'dark';

  // Yup Schema
  const formSchema = useMemo(
    () =>
      Yup.object().shape({
        name: Yup.string()
          .trim()
          .required(t('PROFILE_PAGE.FULL_NAME_REQUIRED') || 'Full name is required!'),
        phoneNumber: Yup.string().default(''),
      }),
    [t]
  );

  // Default Values
  const defaultValues: ProfileInfoSchemaType = useMemo(
    () => ({
      name: user?.name || user?.displayName || '',
      phoneNumber: user?.phoneNumber || '',
    }),
    [user]
  );

  const methods = useForm<ProfileInfoSchemaType>({
    resolver: yupResolver(formSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  useEffect(() => {
    if (user) {
      reset({
        name: user?.name || user?.displayName || '',
        phoneNumber: user?.phoneNumber || '',
      });
    }
  }, [user, reset]);

  // Handle Form Submit
  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateProfile({
        name: data.name.trim(),
        phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : undefined,
      });

      enqueueSnackbar(t('PROFILE_PAGE.UPDATE_SUCCESS'), { variant: 'success' });
      reset(data);
      await checkUserSession?.();
    } catch (error: any) {
      enqueueSnackbar(
        error?.message || t('PROFILE_PAGE.UPDATE_ERROR') || 'Failed to update profile',
        { variant: 'error' }
      );
    }
  });

  // Switch Language
  const handleSwitchLanguage = (lang: 'ar' | 'en') => {
    if (i18n.language === lang) return;
    const newPath = pathname.replace(`/${i18n.language}`, `/${lang}`);
    router.push(newPath);
  };

  return (
    <Grid container spacing={3}>
      {/* Left Column: Personal Info Form */}
      <Grid item xs={12} md={7}>
        <Card sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3 }}>
          <Stack spacing={0.5} sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              {t('PROFILE_PAGE.PERSONAL_TITLE')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('PROFILE_PAGE.PERSONAL_DESC')}
            </Typography>
          </Stack>

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              <RHFTextField
                name="name"
                label={t('PROFILE_PAGE.FULL_NAME')}
                placeholder={t('SIGN_UP_PAGE.FULL_NAME_PLACEHOLDER')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:user-bold-duotone" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <RHFTextField
                name="email"
                label={t('PROFILE_PAGE.EMAIL')}
                value={user?.email || ''}
                disabled
                helperText={t('PROFILE_PAGE.EMAIL_LOCKED_HINT') || 'Managed via registered account'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:letter-bold-duotone" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Chip size="small" label="Verified" color="success" variant="soft" />
                    </InputAdornment>
                  ),
                }}
              />

              <RHFTextField
                name="phoneNumber"
                label={t('PROFILE_PAGE.PHONE')}
                placeholder={t('PROFILE_PAGE.PHONE_PLACEHOLDER')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify
                        icon="solar:phone-calling-bold-duotone"
                        sx={{ color: 'text.disabled' }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" justifyContent="flex-end" sx={{ pt: 1 }}>
                <LoadingButton
                  type="submit"
                  color="primary"
                  variant="contained"
                  size="large"
                  loading={isSubmitting}
                  disabled={!isDirty}
                  startIcon={<Iconify icon="solar:check-read-bold" />}
                  sx={{ px: 4, borderRadius: 2 }}
                >
                  {isSubmitting ? t('PROFILE_PAGE.SAVING') : t('PROFILE_PAGE.SAVE_CHANGES')}
                </LoadingButton>
              </Stack>
            </Stack>
          </Form>
        </Card>
      </Grid>

      {/* Right Column: Preferences & Metadata */}
      <Grid item xs={12} md={5}>
        <Stack spacing={3}>
          {/* Language & Theme Card */}
          <Card sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3 }}>
            <Stack spacing={0.5} sx={{ mb: 2.5 }}>
              <Typography variant="h6" fontWeight="bold">
                {t('PROFILE_PAGE.PREFERENCES_TITLE')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('PROFILE_PAGE.PREFERENCES_DESC')}
              </Typography>
            </Stack>

            <Stack spacing={2.5}>
              {/* Language Selector */}
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  {t('PROFILE_PAGE.LANGUAGE')}
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Paper
                      variant="outlined"
                      onClick={() => handleSwitchLanguage('ar')}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        textAlign: 'center',
                        borderRadius: 2,
                        borderColor: i18n.language === 'ar' ? 'primary.main' : 'divider',
                        bgcolor:
                          i18n.language === 'ar'
                            ? alpha(theme.palette.primary.main, 0.08)
                            : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        🇸🇦 {t('PROFILE_PAGE.LANGUAGE_AR')}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6}>
                    <Paper
                      variant="outlined"
                      onClick={() => handleSwitchLanguage('en')}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        textAlign: 'center',
                        borderRadius: 2,
                        borderColor: i18n.language === 'en' ? 'primary.main' : 'divider',
                        bgcolor:
                          i18n.language === 'en'
                            ? alpha(theme.palette.primary.main, 0.08)
                            : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        🇺🇸 {t('PROFILE_PAGE.LANGUAGE_EN')}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>

              <Divider />

              {/* Theme Mode Selector */}
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  {t('PROFILE_PAGE.THEME')}
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Paper
                      variant="outlined"
                      onClick={() => {
                        settings.onUpdateField('colorScheme', 'dark');
                        setMode('dark');
                      }}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        textAlign: 'center',
                        borderRadius: 2,
                        borderColor: isDark ? 'primary.main' : 'divider',
                        bgcolor: isDark
                          ? alpha(theme.palette.primary.main, 0.12)
                          : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Iconify
                        icon="solar:moon-bold-duotone"
                        width={26}
                        sx={{ color: 'primary.main', mb: 0.5 }}
                      />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {t('PROFILE_PAGE.THEME_DARK')}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6}>
                    <Paper
                      variant="outlined"
                      onClick={() => {
                        settings.onUpdateField('colorScheme', 'light');
                        setMode('light');
                      }}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        textAlign: 'center',
                        borderRadius: 2,
                        borderColor: !isDark ? 'primary.main' : 'divider',
                        bgcolor: !isDark
                          ? alpha(theme.palette.primary.main, 0.12)
                          : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Iconify
                        icon="solar:sun-2-bold-duotone"
                        width={26}
                        sx={{ color: 'warning.main', mb: 0.5 }}
                      />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {t('PROFILE_PAGE.THEME_LIGHT')}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </Stack>
          </Card>

          {/* Account Metadata Card */}
          <Card sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.neutral' }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('PROFILE_PAGE.LAST_LOGIN')}
                </Typography>
                <Typography variant="subtitle2">
                  {user?.lastLogin
                    ? dayjs(user.lastLogin).format('YYYY/MM/DD HH:mm')
                    : 'Recently'}
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}

export default ProfileInfoTab;
