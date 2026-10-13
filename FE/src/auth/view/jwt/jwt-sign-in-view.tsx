'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { FormHead } from '../../components/form-head';
import { signInWithPassword } from '../../context/jwt';
import { Stack, TextField, useTheme } from '@mui/material';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export type SignInSchemaType = zod.infer<ReturnType<typeof useSignInSchema>>;

export function useSignInSchema() {
  const { t } = useTranslation();
  return zod.object({
    email: zod
      .string()
      .min(1, { message: t('LOGIN_PAGE.EMAIL_REQUIRED') })
      .email({ message: t('LOGIN_PAGE.EMAIL_INVALID') }),
    password: zod
      .string()
      .min(1, { message: t('LOGIN_PAGE.PASSWORD_REQUIRED') })
      .min(6, { message: t('LOGIN_PAGE.PASSWORD_MIN') }),
  });
}

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const { t } = useTranslation();
  const { checkUserSession } = useAuthContext();
  const schema = useSignInSchema();

  const [errorMsg, setErrorMsg] = useState('');

  const password = useBoolean();

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const returnTo = searchParams.get('returnTo') || paths.dashboard.root;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({ email: data.email, password: data.password });
      await checkUserSession?.();

      router.push(returnTo);
    } catch (error) {
      console.error(error);
      setErrorMsg(typeof error === 'string' ? error : error.message);
    }
  });

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      <Field.Text
        name="email"
        label={t('LOGIN_PAGE.EMAIL_ADDRESS')}
        InputLabelProps={{ shrink: true }}
      />

      <Box gap={1.5} display="flex" flexDirection="column">
        <Link
          component={RouterLink}
          href="#"
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          {t('LOGIN_PAGE.FORGOT_PASSWORD')}
        </Link>

        {/* <TextField
          variant="filled"
          placeholder={t('LOGIN_PAGE.EMAIL_ADDRESS')}
          label={t('LOGIN_PAGE.EMAIL_ADDRESS')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Iconify icon="bitcoin-icons:email-filled" width={24} />
              </InputAdornment>
            ),
          }}
        /> */}
        <Field.Text
          name="password"
          label={t('LOGIN_PAGE.PASSWORD')}
          placeholder="6+ characters"
          type={password.value ? 'text' : 'password'}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('LOGIN_PAGE.SIGNING_IN')}
        sx={{
          bgcolor: '#0f766e',
          color: 'white',
          '&:hover': {
            bgcolor: '#006666',
          },
        }}
      >
        {t('LOGIN_PAGE.SIGN_IN')}
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <Stack style={{ height: 120, position: 'relative' }}>
        <Image
          src="/logo/spectrum-full-logo.png"
          style={{ objectFit: 'contain' }}
          fill
          alt="Logo"
        />
      </Stack>
      <FormHead
        textAlign="center"
        title={t('LOGIN_PAGE.SIGN_IN_TITLE')}
        alignItems="center"
        description={
          <>
            {`${t('LOGIN_PAGE.DONT_HAVE_ACCOUNT')} `}
            <Link
              component={RouterLink}
              href={paths.auth.jwt.signUp}
              variant="subtitle2"
              style={{ color: theme.palette.text.primary }}
            >
              {t('LOGIN_PAGE.GET_STARTED')}
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' }, gap: 0.2 }}
      />

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </>
  );
}
