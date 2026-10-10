'use client';

import { Box, Card, Stack, Typography, useTheme, Divider, Button } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ElectricPlug from 'src/components/electric-plug/electric-plug';
import { Iconify } from 'src/components/iconify';
import { varAlpha } from 'src/theme/styles';
import { RouterLink } from 'src/routes/components/router-link';
import { IPlug } from 'src/types/plug';

function PlugCard({ plug }: { plug: IPlug }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  return (
    <Card
      sx={{
        padding: 1,
        minWidth: 400,
        width: 400,
        backgroundColor: theme.palette.background.neutral,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        sx={{ marginBottom: 'auto', flexDirection: 'column', flex: 1, alignItems: 'center' }}
        spacing={3}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: 'fit-content',
            flexDirection: 'row',
            gap: 1,
            px: 1.5,
            py: 0.5,
            alignSelf: 'flex-end',
            borderRadius: 2,
            backgroundColor: varAlpha(theme.vars.palette.success.mainChannel, 0.12),
            border: `1px solid ${varAlpha(theme.vars.palette.success.mainChannel, 0.24)}`,
            backdropFilter: 'blur(6px)',
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: theme.vars.palette.success.main,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: `0 0 0 0 ${varAlpha(theme.vars.palette.success.mainChannel, 0.4)}`,
                },
                '70%': {
                  boxShadow: `0 0 0 6px ${varAlpha(theme.vars.palette.success.mainChannel, 0)}`,
                },
                '100%': {
                  boxShadow: `0 0 0 0 ${varAlpha(theme.vars.palette.success.mainChannel, 0)}`,
                },
              },
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: theme.vars.palette.success.main, fontSize: 13 }}
          >
            متصل
          </Typography>
        </Box>
        <Box sx={{ width: 300 }}>
          <ElectricPlug />
        </Box>
        <Stack sx={{ alignSelf: 'stretch' }}>
          <Typography sx={{}} variant="h5">
            {i18n.language === 'ar'
              ? plug.arabicName !== ''
                ? plug.arabicName
                : plug.name
              : plug.name}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
          >
            كهرباء اليوم: <span>3.5 kw</span>
          </Typography>
        </Stack>
        <Card
          sx={{
            flex: 1,
            width: '100%',
            p: 1.5,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            bgcolor: 'background.paper',
            boxShadow: 'inset 0px 4px 10px rgba(0,0,0,0.03)',
          }}
        >
          <Stack alignItems="center" spacing={0.5} direction="row">
            <Iconify icon="circum:temp-high" width={48} color={theme.palette.success.main} />
            <Typography color={theme.palette.text.secondary} sx={{ fontSize: 14, fontWeight: 700 }}>
              32.5°
            </Typography>
          </Stack>
          <Divider orientation="vertical" flexItem />
          <Stack alignItems="center" spacing={0.5} direction="row">
            <Iconify icon="charm:lightning-bolt" width={32} color={theme.palette.success.main} />
            <Typography color={theme.palette.text.secondary} sx={{ fontSize: 14, fontWeight: 700 }}>
              88 واط
            </Typography>
          </Stack>
          <Divider orientation="vertical" flexItem />
          <Stack alignItems="center" spacing={0.5} direction="row">
            <Iconify
              icon="ant-design:clock-circle-outlined"
              width={32}
              color={theme.palette.success.main}
            />
            <Typography color={theme.palette.text.secondary} sx={{ fontSize: 14, fontWeight: 700 }}>
              3 ساعات
            </Typography>
          </Stack>
        </Card>
        <Button
          component={RouterLink}
          href={`/${i18n.language}/dashboard/plugs/${plug.id || plug._id}`}
          size="large"
          color="primary"
          variant="outlined"
          fullWidth
          endIcon={
            <Iconify
              icon={i18n.language === 'ar' ? 'akar-icons:chevron-left' : 'akar-icons:chevron-right'}
            />
          }
        >
          تفاصيل
        </Button>
      </Stack>
    </Card>
  );
}

export default PlugCard;
