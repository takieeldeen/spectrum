'use client';

import { useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Fade, Stack, useTheme } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { Iconify } from 'src/components/iconify';
import { useSearchParams } from 'src/routes/hooks';
import { useSnackbar } from 'src/components/snackbar';
import { varAlpha } from 'src/theme/styles';
import i18n from 'src/i18n';
import { useActivateAccount, useResendInvitation } from 'src/api/auth';

// ----------------------------------------------------------------------

type Props = {
  token?: string;
};

export function MainView({ token: tokenProp }: Props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const searchParams = useSearchParams();

  const token = tokenProp || searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const { mutate: activateAccount, isPending, isSuccess, isError, data } = useActivateAccount();
  const { mutate: resendInvitation, isPending: isResending } = useResendInvitation();
  const triggeredToken = useRef<string | null>(null);

  useEffect(() => {
    if (token && triggeredToken.current !== token) {
      triggeredToken.current = token;
      activateAccount(token);
    }
  }, [token, activateAccount]);

  const handleResend = () => {
    const payload = emailParam ? { email: emailParam } : { token };

    resendInvitation(payload, {
      onSuccess: () => {
        enqueueSnackbar(t('ACCOUNT_ACTIVATION.RESEND_SUCCESS'), { variant: 'success' });
      },
      onError: (error: any) => {
        const rawMsg =
          typeof error === 'string' ? error : error?.message || error?.response?.data?.message;

        let errorText = t('ACCOUNT_ACTIVATION.RESEND_ERROR');
        if (rawMsg === 'User not found') {
          errorText = t('ACCOUNT_ACTIVATION.RESEND_USER_NOT_FOUND');
        } else if (rawMsg === 'User is not in INACTIVE status') {
          errorText = t('ACCOUNT_ACTIVATION.RESEND_ALREADY_ACTIVE');
        } else if (rawMsg) {
          errorText = rawMsg;
        }

        enqueueSnackbar(errorText, { variant: 'error' });
      },
    });
  };

  return (
    <Stack alignItems="center" justifyContent="center" flex={1} sx={{ py: 6, minHeight: '100vh' }}>
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <Box component="img" src="/logo/spectrum-long-logo.png" sx={{ height: 75 }} />
      </Box>

      <Fade in={isPending} timeout={{ enter: 300, exit: 0 }} unmountOnExit>
        <Box>
          <LoadingCard />
        </Box>
      </Fade>
      <Fade in={!isSuccess && !isPending} timeout={{ enter: 300, exit: 0 }} unmountOnExit>
        <Box>
          <FailureCard onResend={handleResend} isResending={isResending} />
        </Box>
      </Fade>
      <Fade in={isSuccess && !isPending} timeout={{ enter: 300, exit: 0 }} unmountOnExit>
        <Box>
          <SuccessCard email={data?.data?.email} />
        </Box>
      </Fade>
    </Stack>
  );
}

export function LoadingCard() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack
      spacing={3}
      alignItems="center"
      sx={{
        border: '1px solid',
        borderColor: 'background.neutral',
        p: 3,
        borderRadius: 3,
        width: '100%',
        maxWidth: 440,
      }}
    >
      <Box
        sx={{
          height: 128,
          width: 128,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: varAlpha(theme.palette.primary.mainChannel, 0.15),
          borderRadius: '50%',
        }}
      >
        <CircularProgress size={60} thickness={4} color="primary" />
      </Box>
      <Stack alignItems="center" sx={{ textAlign: 'center' }} spacing={1}>
        <Typography variant="h3" sx={{ lineHeight: 1.2 }}>
          {t('ACCOUNT_ACTIVATION.LOADING_TITLE_PREFIX')}{' '}
          <span style={{ color: theme.palette.primary.main }}>
            {t('ACCOUNT_ACTIVATION.LOADING_TITLE_HIGHLIGHT')}
          </span>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
          {t('ACCOUNT_ACTIVATION.LOADING_SUBTITLE')}
        </Typography>
      </Stack>
    </Stack>
  );
}

type SuccessCardProps = {
  email?: string;
};

export function SuccessCard({ email }: SuccessCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const displayEmail = email || 'takie.eldeen1998@gmail.com';

  return (
    <Stack
      spacing={3}
      alignItems="center"
      sx={{
        border: '1px solid',
        borderColor: 'background.neutral',
        p: 3,
        borderRadius: 3,
        width: '100%',
        maxWidth: 440,
      }}
    >
      <Box
        sx={{
          height: 128,
          width: 128,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: varAlpha(theme.palette.success.mainChannel, 0.15),
          borderRadius: '50%',
        }}
      >
        <Iconify
          icon="akar-icons:check"
          width={70}
          color={varAlpha(theme.palette.success.mainChannel, 1)}
        />
      </Box>
      <Stack alignItems="center" sx={{ textAlign: 'center' }} spacing={1}>
        <Typography variant="h3" sx={{ lineHeight: 1.2 }}>
          {t('ACCOUNT_ACTIVATION.TITLE_PREFIX')}{' '}
          <br style={{ display: i18n.language === 'ar' ? 'none' : 'default' }} />
          <span style={{ color: theme.palette.success.main }}>
            {t('ACCOUNT_ACTIVATION.TITLE_HIGHLIGHT')}
          </span>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
          {t('ACCOUNT_ACTIVATION.SUBTITLE')}
        </Typography>
      </Stack>
      <Box
        sx={{
          p: 3,
          borderRadius: 1,
          bgcolor: varAlpha(theme.palette.grey['500Channel'], 0.04),
          border: `1px solid ${varAlpha(theme.palette.grey['500Channel'], 0.2)}`,
          width: '100%',
        }}
      >
        <Stack spacing={1.5} direction="row" alignItems="center">
          <Iconify icon="tabler:user" width={24} height={24} color="text.secondary" />
          <Stack spacing={0.5}>
            <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 700 }}>
              {t('ACCOUNT_ACTIVATION.INVITED_EMAIL')}
            </Typography>
            <Typography variant="body2">{displayEmail}</Typography>
          </Stack>
        </Stack>
      </Box>
      <Button
        component={RouterLink}
        href={paths.auth.jwt.signIn}
        variant="contained"
        fullWidth
        size="large"
        color="primary"
      >
        {t('ACCOUNT_ACTIVATION.GO_TO_SIGN_IN')}
      </Button>
    </Stack>
  );
}

type FailureCardProps = {
  onResend?: () => void;
  isResending?: boolean;
};

export function FailureCard({ onResend, isResending }: FailureCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack
      spacing={3}
      alignItems="center"
      sx={{
        border: '1px solid',
        borderColor: 'background.neutral',
        p: 3,
        borderRadius: 3,
        width: '100%',
        maxWidth: 440,
      }}
    >
      <Box
        sx={{
          height: 128,
          width: 128,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: varAlpha(theme.palette.error.mainChannel, 0.15),
          borderRadius: '50%',
        }}
      >
        <Iconify
          icon="akar-icons:cross"
          width={70}
          color={varAlpha(theme.palette.error.mainChannel, 1)}
        />
      </Box>
      <Stack alignItems="center" sx={{ textAlign: 'center' }} spacing={1}>
        <Typography variant="h3" sx={{ lineHeight: 1.2 }}>
          {t('ACCOUNT_ACTIVATION.FAILURE_TITLE_PREFIX')}{' '}
          <span style={{ color: theme.palette.error.main }}>
            {t('ACCOUNT_ACTIVATION.FAILURE_TITLE_HIGHLIGHT')}
          </span>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
          {t('ACCOUNT_ACTIVATION.FAILURE_SUBTITLE')}
        </Typography>
      </Stack>

      <LoadingButton
        variant="contained"
        fullWidth
        size="large"
        color="primary"
        loading={isResending}
        onClick={onResend}
      >
        {t('ACCOUNT_ACTIVATION.RESEND_ACTIVATION_LINK')}
      </LoadingButton>

      <Button
        component={RouterLink}
        href={paths.auth.jwt.signIn}
        variant="outlined"
        fullWidth
        size="large"
        color="inherit"
      >
        {t('ACCOUNT_ACTIVATION.GO_TO_SIGN_IN')}
      </Button>
    </Stack>
  );
}

export default MainView;
