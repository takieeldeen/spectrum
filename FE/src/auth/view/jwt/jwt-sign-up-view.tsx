'use client';

import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useBoolean } from 'src/hooks/use-boolean';
import { Iconify } from 'src/components/iconify';
import { Form, RHFTextField } from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';
import { varAlpha } from 'src/theme/styles';

import { useAuthContext } from '../../hooks';
import { useSignUpMutation } from 'src/api/auth';

// ----------------------------------------------------------------------

export type SignUpSchemaType = Yup.InferType<ReturnType<typeof useSignUpSchema>>;

export function useSignUpSchema() {
  const { t } = useTranslation();

  return Yup.object().shape({
    name: Yup.string()
      .trim()
      .required(t('SIGN_UP_PAGE.FULL_NAME_REQUIRED')),
    email: Yup.string()
      .trim()
      .required(t('SIGN_UP_PAGE.EMAIL_REQUIRED'))
      .email(t('SIGN_UP_PAGE.EMAIL_INVALID')),
    password: Yup.string()
      .required(t('SIGN_UP_PAGE.PASSWORD_REQUIRED'))
      .min(8, t('SIGN_UP_PAGE.PASSWORD_MIN')),
    confirmPassword: Yup.string()
      .required(t('SIGN_UP_PAGE.CONFIRM_PASSWORD_REQUIRED'))
      .oneOf([Yup.ref('password')], t('SIGN_UP_PAGE.PASSWORDS_DONT_MATCH')),
  });
}

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { checkUserSession } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const { mutateAsync: signupMutate, isPending } = useSignUpMutation();

  const passwordVisibility = useBoolean();
  const confirmPasswordVisibility = useBoolean();

  const schema = useSignUpSchema();

  const defaultValues: SignUpSchemaType = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  const methods = useForm<SignUpSchemaType>({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signupMutate({
        name: data.name,
        email: data.email,
        password: data.password,
        passwordConfirmation: data.confirmPassword,
      });

      enqueueSnackbar(t('SIGN_UP_PAGE.SUCCESS_MESSAGE'), { variant: 'success' });
      await checkUserSession?.();

      setTimeout(() => {
        router.push(paths.auth.jwt.signIn);
      }, 2000);
    } catch (error: any) {
      console.error(error);
      const rawMsg =
        typeof error === 'string'
          ? error
          : error?.message || error?.response?.data?.message;

      let errorText = t('SIGN_UP_PAGE.GENERAL_ERROR');

      if (rawMsg === 'Email is already registered') {
        errorText = t('SIGN_UP_PAGE.EMAIL_ALREADY_EXISTS');
      } else if (rawMsg === 'Password and password confirmation do not match') {
        errorText = t('SIGN_UP_PAGE.PASSWORDS_DONT_MATCH');
      } else if (rawMsg) {
        errorText = rawMsg;
      }

      enqueueSnackbar(errorText, { variant: 'error' });
    }
  });

  return (
    <Stack sx={{ height: '100vh' }} direction="row">
      <Stack flex={{ md: 1, xs: 1 }} sx={{ height: '100%' }}>
        <Stack
          sx={{ height: '100%', p: 3 }}
          justifyContent="center"
          alignItems={{ md: 'center', xs: 'stretch' }}
        >
          <Card
            sx={{
              p: 3,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.32),
              maxWidth: { md: 600, xs: 'unset' },
              width: '100%',
            }}
          >
            <Stack sx={{ mb: 3 }}>
              <Typography variant="h3">{t('SIGN_UP_PAGE.TITLE')}</Typography>
              <Typography variant="body1" color="text.secondary">
                {t('SIGN_UP_PAGE.SUBTITLE')}
              </Typography>
            </Stack>

            <Form methods={methods} onSubmit={onSubmit}>
              <Stack sx={{ py: 2 }} spacing={3}>
                <RHFTextField
                  name="name"
                  label={t('SIGN_UP_PAGE.FULL_NAME_LABEL')}
                  placeholder={t('SIGN_UP_PAGE.FULL_NAME_PLACEHOLDER')}
                  variant="filled"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    style: {
                      border: '1px solid',
                      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.32),
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Iconify icon="basil:user-outline" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <RHFTextField
                  name="email"
                  label={t('SIGN_UP_PAGE.EMAIL_LABEL')}
                  placeholder={t('SIGN_UP_PAGE.EMAIL_PLACEHOLDER')}
                  variant="filled"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    style: {
                      border: '1px solid',
                      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.32),
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Iconify icon="formkit:email" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <RHFTextField
                  name="password"
                  label={t('SIGN_UP_PAGE.PASSWORD_LABEL')}
                  placeholder={t('SIGN_UP_PAGE.PASSWORD_PLACEHOLDER')}
                  variant="filled"
                  type={passwordVisibility.value ? 'text' : 'password'}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    style: {
                      border: '1px solid',
                      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.32),
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={passwordVisibility.onToggle}
                          edge="end"
                          sx={{ color: 'text.disabled', p: 0.5 }}
                        >
                          <Iconify
                            icon={passwordVisibility.value ? 'solar:eye-bold' : 'bi:lock'}
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <RHFTextField
                  name="confirmPassword"
                  label={t('SIGN_UP_PAGE.CONFIRM_PASSWORD_LABEL')}
                  placeholder={t('SIGN_UP_PAGE.CONFIRM_PASSWORD_PLACEHOLDER')}
                  variant="filled"
                  type={confirmPasswordVisibility.value ? 'text' : 'password'}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    style: {
                      border: '1px solid',
                      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.32),
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={confirmPasswordVisibility.onToggle}
                          edge="end"
                          sx={{ color: 'text.disabled', p: 0.5 }}
                        >
                          <Iconify
                            icon={confirmPasswordVisibility.value ? 'solar:eye-bold' : 'bi:lock'}
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <LoadingButton
                  variant="contained"
                  size="large"
                  fullWidth
                  color="primary"
                  type="submit"
                  loading={isSubmitting || isPending}
                  loadingIndicator={t('SIGN_UP_PAGE.SUBMITTING')}
                >
                  {t('SIGN_UP_PAGE.SUBMIT_BUTTON')}
                </LoadingButton>

                <Divider>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('SIGN_UP_PAGE.OR')}
                  </Typography>
                </Divider>

                <Stack alignItems="center" direction="row" justifyContent="center" spacing={0.5}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('SIGN_UP_PAGE.ALREADY_HAVE_ACCOUNT')}
                  </Typography>
                  <Button
                    color="primary"
                    variant="text"
                    onClick={() => router.push(paths.auth.jwt.signIn)}
                    sx={{ fontWeight: 600, p: 0 }}
                  >
                    {t('SIGN_UP_PAGE.SIGN_IN')}
                  </Button>
                </Stack>
              </Stack>
            </Form>
          </Card>
        </Stack>
      </Stack>

      <Stack flex={{ md: 1, xs: 0 }} sx={{ height: '100%' }}>
        <Stack
          sx={{
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            height: '100%',
          }}
        >
          <Box
            component="img"
            src="/assets/images/hero/login_hero.png"
            sx={{
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
