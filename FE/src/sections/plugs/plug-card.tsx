'use client';

import { Box, Card, Stack, Typography, useTheme, Divider, Button, IconButton, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { useDeletePlug } from 'src/api/plug';
import ElectricPlug from 'src/components/electric-plug/electric-plug';
import { Iconify } from 'src/components/iconify';
import { varAlpha } from 'src/theme/styles';
import { RouterLink } from 'src/routes/components/router-link';
import { IPlug } from 'src/types/plug';
import PlugNewEditForm from './plug-new-edit-form';

function PlugCard({ plug }: { plug: IPlug }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [openEdit, setOpenEdit] = useState(false);
  const popover = usePopover();
  const deleteMutation = useDeletePlug();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const plugName = plug.name;

  const handleDeleteClick = () => {
    popover.onClose();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (plug.id || plug._id) {
        await deleteMutation.mutateAsync((plug.id || plug._id) as string);
        setSnackbar({
          open: true,
          message: t('PLUG_DELETED_SUCCESSFULLY'),
          severity: 'success',
        });
        setConfirmOpen(false);
      }
    } catch (error: any) {
      console.error(error);
      setSnackbar({
        open: true,
        message: error.message || t('ERROR_DELETING_PLUG'),
        severity: 'error',
      });
    }
  };
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          <IconButton onClick={popover.onOpen}>
            <Iconify icon="bi:three-dots-vertical" width={24} height={24} />
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: 'fit-content',
              flexDirection: 'row',
              gap: 1,
              px: 1.5,
              py: 0.5,
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
        </Stack>
        <Box sx={{ width: 300 }}>
          <ElectricPlug />
        </Box>
        <Stack sx={{ alignSelf: 'stretch' }}>
          <Typography sx={{}} variant="h5">
            {plugName}
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
          sx={{ width: '100%' }}
          endIcon={
            <Iconify
              icon={i18n.language === 'ar' ? 'akar-icons:chevron-left' : 'akar-icons:chevron-right'}
            />
          }
        >
          تفاصيل
        </Button>
      </Stack>
      <PlugNewEditForm currentPlug={plug} open={openEdit} onClose={() => setOpenEdit(false)} />
      
      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        anchorEl={popover.anchorEl}
        slotProps={{ arrow: { placement: i18n.language === 'ar' ? 'top-right' : 'top-left' } }}
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            setOpenEdit(true);
          }}
        >
          <Iconify icon="lucide:pencil" />
          {t('EDIT_PLUG')}
        </MenuItem>

        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Iconify icon="lucide:trash-2" />
          {t('DELETE_PLUG')}
        </MenuItem>
      </CustomPopover>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('CONFIRM_DELETE_PLUG_TITLE')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('CONFIRM_DELETE_PLUG_MESSAGE', { name: plugName })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            {t('CANCEL')}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {t('DELETE')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}

export default PlugCard;
