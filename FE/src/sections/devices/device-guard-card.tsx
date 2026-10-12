import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteGuard, useToggleGuard } from 'src/api/guard';
import { CustomPopover, usePopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';
import NewEditDrawer from 'src/components/new-edit-form/new-edit-drawer';
import { IGuard } from 'src/types/guard';
import SafeGuardNewEditForm from './safe-guard-new-edit-form';

type Props = {
  guard: IGuard;
};

function DeviceGuardCard({ guard }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const popover = usePopover();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(guard?.isEnabled ?? true);

  const deleteMutation = useDeleteGuard();
  const toggleMutation = useToggleGuard();

  const comparator =
    guard?.comparator === 'MAX' ? t('GUARD_MAX') : t('GUARD_MIN');

  const targetLabel =
    {
      TEMPERATURE: t('TEMPERATURE'),
      POWER: t('POWER_CONSUMPTION'),
      CURRENT: t('CURRENT'),
    }[guard?.target] || guard?.target;

  const unitLabel =
    {
      TEMPERATURE: t('UNIT_CELSIUS'),
      POWER: t('WATT'),
      CURRENT: t('AMPERE'),
    }[guard?.target] || '';

  const title = t('GUARD_TITLE', {
    comparator,
    target: targetLabel,
    value: guard?.value,
    unit: unitLabel,
  });

  const actionText =
    guard?.action === 'ON' ? t('GUARD_ACTION_ON') : t('GUARD_ACTION_OFF');

  const subtitle = t('GUARD_SUBTITLE_ACTION', { action: actionText });

  const iconName =
    {
      TEMPERATURE: guard?.comparator === 'MAX' ? 'bi:thermometer-high' : 'bi:thermometer-low',
      POWER: 'bi:lightning',
      CURRENT: 'solar:bolt-outline',
    }[guard?.target] || 'circum:temp-high';

  const handleToggle = async () => {
    const nextValue = !isEnabled;
    setIsEnabled(nextValue);
    try {
      if (guard?._id) {
        await toggleMutation.mutateAsync({ id: guard._id, isEnabled: nextValue });
      }
    } catch (error) {
      setIsEnabled(!nextValue);
    }
  };

  const handleDeleteClick = () => {
    popover.onClose();
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (guard?._id) {
        await deleteMutation.mutateAsync(guard._id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const handleEditClick = () => {
    popover.onClose();
    setEditOpen(true);
  };

  return (
    <>
      <Stack
        spacing={2}
        sx={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 1,
          borderColor: theme.palette.grey[isDark ? 700 : 300],
          p: 1,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: 'primary.dark',
              height: 48,
              width: 48,
              borderRadius: '50%',
              alignItems: 'center',
            }}
          >
            <Iconify icon={iconName} color="white" width={32} />
          </Box>
          <Stack flex={1}>
            <Typography variant="subtitle1">{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>
          <Switch
            checked={isEnabled}
            onChange={handleToggle}
            disabled={toggleMutation.isPending}
          />
          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" width={24} />
          </IconButton>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('DELETE')}
        </MenuItem>

        <MenuItem onClick={handleEditClick}>
          <Iconify icon="solar:pen-bold" />
          {t('EDIT')}
        </MenuItem>
      </CustomPopover>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>{t('CONFIRM_DELETE_TITLE')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('CONFIRM_DELETE_GUARD')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="inherit">
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

      <NewEditDrawer open={editOpen} onClose={() => setEditOpen(false)}>
        <SafeGuardNewEditForm currentGuard={guard} onClose={() => setEditOpen(false)} />
      </NewEditDrawer>
    </>
  );
}

export default DeviceGuardCard;

