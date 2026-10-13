'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import {
  Box,
  Card,
  Stack,
  Tabs,
  Tab,
  Typography,
  Avatar,
  Divider,
  useTheme,
  alpha,
  useColorScheme,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks';
import { useSettingsContext } from 'src/components/settings';

import { ProfileInfoTab } from './profile-info-tab';
import { ProfilePasswordTab } from './profile-password-tab';

// ----------------------------------------------------------------------

export function ProfileView() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const settings = useSettingsContext();
  const { mode } = useColorScheme();
  const { user } = useAuthContext();

  const [currentTab, setCurrentTab] = useState<'general' | 'security'>('general');

  const handleChangeTab = (_: React.SyntheticEvent, newValue: 'general' | 'security') => {
    setCurrentTab(newValue);
  };

  const isRtl = i18n.language === 'ar';

  const isDark =
    mode === 'dark' || settings.colorScheme === 'dark' || theme.palette.mode === 'dark';

  const lightGradient = `linear-gradient(135deg, #C8FAD6 0%, #D0F2FE 45%, #E8F8F5 100%)`;
  const darkGradient = `linear-gradient(135deg, #10171D 0%, #004B50 45%, #007867 80%, #141A21 100%)`;

  return (
    <Stack spacing={4} sx={{ maxWidth: 1200, mx: 'auto', pb: 6 }}>
      {/* -------------------- HERO PROFILE CARD -------------------- */}
      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          boxShadow: theme.customShadows?.card || 3,
        }}
      >
        {/* Decorative Gradient Background Cover */}
        <Box
          sx={{
            height: { xs: 130, sm: 160 },
            background: isDark ? darkGradient : lightGradient,
            ...theme.applyStyles?.('dark', {
              background: darkGradient,
            }),
            ...theme.applyStyles?.('light', {
              background: lightGradient,
            }),
            position: 'relative',
            transition: 'background 0.3s ease',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: isDark
                ? `radial-gradient(circle at 80% 20%, ${alpha(theme.palette.primary.light || '#5BE49B', 0.15)} 0%, transparent 50%)`
                : `radial-gradient(circle at 80% 20%, ${alpha('#FFFFFF', 0.65)} 0%, transparent 60%)`,
              ...theme.applyStyles?.('dark', {
                background: `radial-gradient(circle at 80% 20%, ${alpha(theme.palette.primary.light || '#5BE49B', 0.15)} 0%, transparent 50%)`,
              }),
              ...theme.applyStyles?.('light', {
                background: `radial-gradient(circle at 80% 20%, ${alpha('#FFFFFF', 0.65)} 0%, transparent 60%)`,
              }),
            },
          }}
        />

        {/* User Details & Avatar Row */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 3 }}
          alignItems={{ xs: 'center', sm: 'flex-end' }}
          sx={{
            px: { xs: 2.5, sm: 4 },
            pb: 3,
            pt: 0,
            mt: { xs: -7, sm: -8 },
            position: 'relative',
          }}
        >
          {/* Avatar with Status Badge */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user?.imageUrl || user?.photoURL || undefined}
              alt={user?.name || user?.displayName || 'User'}
              sx={{
                width: { xs: 96, sm: 112 },
                height: { xs: 96, sm: 112 },
                fontSize: 38,
                fontWeight: 'bold',
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                border: `4px solid ${theme.palette.background.paper}`,
                boxShadow: theme.shadows[4],
              }}
            >
              {(user?.name || user?.displayName || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: 'success.main',
                border: `3px solid ${theme.palette.background.paper}`,
                position: 'absolute',
                bottom: 6,
                right: isRtl ? 'auto' : 6,
                left: isRtl ? 6 : 'auto',
                boxShadow: '0 0 10px rgba(76, 175, 80, 0.7)',
              }}
            />
          </Box>

          {/* User Name & Metadata */}
          <Stack
            spacing={1}
            alignItems={{ xs: 'center', sm: 'flex-start' }}
            sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: isRtl ? 'right' : 'left' } }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              flexWrap="wrap"
              justifyContent={{ xs: 'center', sm: 'flex-start' }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {user?.name || user?.displayName || 'User'}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={{ xs: 1.5, sm: 2.5 }}
              flexWrap="wrap"
              justifyContent={{ xs: 'center', sm: 'flex-start' }}
              sx={{ color: 'text.secondary', typography: 'body2' }}
            >
              <Stack direction="row" alignItems="center" spacing={0.6}>
                <Iconify
                  icon="solar:letter-bold-duotone"
                  width={18}
                  sx={{ color: 'primary.main' }}
                />
                <span>{user?.email}</span>
              </Stack>

              {user?.phoneNumber && (
                <Stack direction="row" alignItems="center" spacing={0.6}>
                  <Iconify
                    icon="solar:phone-bold-duotone"
                    width={18}
                    sx={{ color: 'primary.main' }}
                  />
                  <span>{user.phoneNumber}</span>
                </Stack>
              )}

              <Stack direction="row" alignItems="center" spacing={0.6}>
                <Iconify
                  icon="solar:calendar-bold-duotone"
                  width={18}
                  sx={{ color: 'primary.main' }}
                />
                <span>
                  {t('PROFILE_PAGE.MEMBER_SINCE')}:{' '}
                  {user?.createdAt ? dayjs(user.createdAt).format('YYYY/MM/DD') : '2026'}
                </span>
              </Stack>
            </Stack>
          </Stack>
        </Stack>

        <Divider />

        {/* -------------------- NAVIGATION TABS -------------------- */}
        <Box sx={{ px: { xs: 1, sm: 3 }, bgcolor: 'background.neutral' }}>
          <Tabs
            value={currentTab}
            onChange={handleChangeTab}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                minHeight: 52,
                fontSize: 15,
                fontWeight: 600,
                textTransform: 'none',
              },
            }}
          >
            <Tab
              value="general"
              label={t('PROFILE_PAGE.TAB_GENERAL')}
              icon={<Iconify icon="solar:user-id-bold-duotone" width={22} />}
              iconPosition="start"
            />
            <Tab
              value="security"
              label={t('PROFILE_PAGE.TAB_SECURITY')}
              icon={<Iconify icon="solar:lock-password-bold-duotone" width={22} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>
      </Card>

      {/* -------------------- TAB CONTENT -------------------- */}
      {currentTab === 'general' && <ProfileInfoTab />}
      {currentTab === 'security' && <ProfilePasswordTab />}
    </Stack>
  );
}

export default ProfileView;
