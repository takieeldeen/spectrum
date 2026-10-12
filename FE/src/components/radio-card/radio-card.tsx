import type { StackProps } from '@mui/material/Stack';
import type { Theme, SxProps } from '@mui/material/styles';
import type { TypographyProps } from '@mui/material/Typography';
import type { BoxProps } from '@mui/material/Box';
import type { IconifyProps } from 'src/components/iconify';

import React, { useState, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { varAlpha } from 'src/theme/styles';

// ----------------------------------------------------------------------

export type RadioCardColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export type RadioCardProps = Omit<StackProps, 'onChange' | 'title'> & {
  checked?: boolean;
  selected?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event?: React.SyntheticEvent) => void;
  value?: any;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string | React.ReactNode;
  checkedIcon?: string | React.ReactNode;
  color?: RadioCardColor;
  disabled?: boolean;
  toggleable?: boolean;
  slotProps?: {
    title?: TypographyProps;
    subtitle?: TypographyProps;
    icon?: Partial<IconifyProps>;
    indicator?: BoxProps;
  };
};

// ----------------------------------------------------------------------

export const RadioCard = forwardRef<HTMLDivElement, RadioCardProps>(
  (
    {
      checked,
      selected,
      defaultChecked = false,
      onChange,
      onClick,
      onKeyDown,
      value,
      title,
      subtitle,
      icon,
      checkedIcon,
      color = 'primary',
      disabled = false,
      toggleable = false,
      slotProps,
      sx,
      children,
      ...other
    },
    ref
  ) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [internalChecked, setInternalChecked] = useState(defaultChecked);

    const isControlled = checked !== undefined || selected !== undefined;
    const isChecked = isControlled ? (selected !== undefined ? selected : !!checked) : internalChecked;

    const mainChannel =
      (theme.vars?.palette as any)?.[color]?.mainChannel ??
      (theme.palette as any)[color]?.mainChannel;

    const uncheckedBorderColor = isDark ? 'grey.700' : 'grey.400';

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      const nextChecked = toggleable ? !isChecked : true;

      onClick?.(event);
      onChange?.(nextChecked, event);

      if (!isControlled) {
        setInternalChecked(nextChecked);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        handleClick(event as unknown as React.MouseEvent<HTMLDivElement>);
      }

      onKeyDown?.(event);
    };

    const renderIcon = () => {
      const activeIcon = isChecked && checkedIcon ? checkedIcon : icon;

      if (!activeIcon) return null;

      if (typeof activeIcon === 'string') {
        return (
          <Iconify
            icon={activeIcon}
            width={24}
            sx={{
              color: isChecked ? `${color}.main` : 'text.secondary',
              flexShrink: 0,
              transition: theme.transitions.create(['color'], {
                duration: theme.transitions.duration.shorter,
              }),
              ...slotProps?.icon?.sx,
            }}
            {...slotProps?.icon}
          />
        );
      }

      return activeIcon;
    };

    return (
      <Stack
        ref={ref}
        role="radio"
        aria-checked={isChecked}
        tabIndex={disabled ? -1 : 0}
        direction="row"
        spacing={2}
        alignItems="center"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        sx={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: isChecked ? `${color}.main` : uncheckedBorderColor,
          borderRadius: 1,
          p: 1,
          backgroundColor: isChecked
            ? varAlpha(mainChannel, 0.1)
            : 'transparent',
          cursor: disabled ? 'default' : 'pointer',
          userSelect: 'none',
          transition: theme.transitions.create(
            ['background-color', 'border-color', 'box-shadow', 'opacity'],
            { duration: theme.transitions.duration.shorter }
          ),
          '&:hover': {
            ...(!disabled &&
              !isChecked && {
                borderColor: isDark ? 'grey.600' : 'grey.500',
              }),
          },
          ...(disabled && {
            opacity: 0.48,
            cursor: 'not-allowed',
            pointerEvents: 'none',
          }),
          ...sx,
        }}
        {...other}
      >
        {renderIcon()}

        {(title || subtitle || children) && (
          <Stack spacing={1} flex={1}>
            {title &&
              (typeof title === 'string' ? (
                <Typography
                  sx={{ fontSize: 16, fontWeight: 700, ...slotProps?.title?.sx }}
                  {...slotProps?.title}
                >
                  {title}
                </Typography>
              ) : (
                title
              ))}

            {subtitle &&
              (typeof subtitle === 'string' ? (
                <Typography
                  sx={{ color: 'text.secondary', fontSize: 13, ...slotProps?.subtitle?.sx }}
                  {...slotProps?.subtitle}
                >
                  {subtitle}
                </Typography>
              ) : (
                subtitle
              ))}

            {children}
          </Stack>
        )}

        <Box
          sx={{
            height: 30,
            aspectRatio: 1,
            border: '1px solid',
            borderColor: isChecked ? `${color}.main` : uncheckedBorderColor,
            borderRadius: '50%',
            px: 0,
            py: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isChecked ? `${color}.main` : 'transparent',
            flexShrink: 0,
            transition: theme.transitions.create(['background-color', 'border-color'], {
              duration: theme.transitions.duration.shorter,
            }),
            ...slotProps?.indicator?.sx,
          }}
          {...slotProps?.indicator}
        >
          {isChecked && (
            <Iconify
              icon="bi:check-lg"
              width="70%"
              sx={{ transition: 'all 0.3s' }}
              color="background.default"
            />
          )}
        </Box>
      </Stack>
    );
  }
);
