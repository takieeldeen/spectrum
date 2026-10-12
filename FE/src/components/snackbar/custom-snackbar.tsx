'use client';

import React, { forwardRef } from 'react';
import { SnackbarContent, CustomContentProps, useSnackbar } from 'notistack';
import { Box, IconButton, Stack, Typography, keyframes } from '@mui/material';

// ----------------------------------------------------------------------

const shrinkProgress = keyframes`
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
`;

type VariantConfig = {
  bg: string;
  border: string;
  glow: string;
  accent: string;
  dots: string;
  iconBg: string;
  iconColor: string;
};

const VARIANTS: Record<string, VariantConfig> = {
  success: {
    bg: 'rgba(12, 28, 20, 0.94)',
    border: 'rgba(16, 185, 129, 0.28)',
    glow: 'rgba(16, 185, 129, 0.15)',
    accent: '#10b981',
    dots: '#34d399',
    iconBg: '#10b981',
    iconColor: '#0a2318',
  },
  error: {
    bg: 'rgba(32, 16, 20, 0.94)',
    border: 'rgba(239, 68, 68, 0.28)',
    glow: 'rgba(239, 68, 68, 0.15)',
    accent: '#ef4444',
    dots: '#f87171',
    iconBg: '#ef4444',
    iconColor: '#280c10',
  },
  info: {
    bg: 'rgba(13, 24, 40, 0.94)',
    border: 'rgba(14, 165, 233, 0.28)',
    glow: 'rgba(14, 165, 233, 0.15)',
    accent: '#0ea5e9',
    dots: '#38bdf8',
    iconBg: '#0ea5e9',
    iconColor: '#07182b',
  },
  warning: {
    bg: 'rgba(32, 26, 14, 0.94)',
    border: 'rgba(245, 158, 11, 0.28)',
    glow: 'rgba(245, 158, 11, 0.15)',
    accent: '#f59e0b',
    dots: '#fbbf24',
    iconBg: '#f59e0b',
    iconColor: '#261a07',
  },
  default: {
    bg: 'rgba(13, 24, 40, 0.94)',
    border: 'rgba(14, 165, 233, 0.28)',
    glow: 'rgba(14, 165, 233, 0.15)',
    accent: '#0ea5e9',
    dots: '#38bdf8',
    iconBg: '#0ea5e9',
    iconColor: '#07182b',
  },
};

// ----------------------------------------------------------------------

function renderBadgeIcon(variant: string, config: VariantConfig) {
  if (variant === 'warning') {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path
          d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          fill={config.iconBg}
          style={{ filter: `drop-shadow(0 0 10px ${config.accent})` }}
        />
        <line x1="12" y1="9" x2="12" y2="14" stroke={config.iconColor} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.2" fill={config.iconColor} />
      </svg>
    );
  }

  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: config.iconBg,
        boxShadow: `0 0 14px ${config.accent}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: config.iconColor,
      }}
    >
      {variant === 'success' && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}

      {variant === 'error' && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <line
            x1="12"
            y1="5.5"
            x2="12"
            y2="13.5"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="18" r="1.8" fill="currentColor" />
        </svg>
      )}

      {(variant === 'info' || variant === 'default') && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="6" r="1.8" fill="currentColor" />
          <line
            x1="12"
            y1="10.5"
            x2="12"
            y2="18.5"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export interface CustomSnackbarProps extends CustomContentProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  duration?: number;
}

export const CustomSnackbar = forwardRef<HTMLDivElement, CustomSnackbarProps>((props, ref) => {
  const { id, message, variant = 'default', autoHideDuration = 5000 } = props;
  const { closeSnackbar } = useSnackbar();

  const config = VARIANTS[variant] || VARIANTS.default;

  // Extract title and description
  let title: React.ReactNode = '';
  let description: React.ReactNode = '';

  const propsAny = props as any;

  if (
    typeof message === 'object' &&
    message !== null &&
    ('title' in (message as any) || 'description' in (message as any))
  ) {
    title = (message as any).title;
    description = (message as any).description;
  } else if (typeof message === 'string' && message.includes('\n')) {
    const parts = message.split('\n');
    title = parts[0];
    description = parts.slice(1).join('\n');
  } else {
    title = message;
    description = propsAny.description || propsAny.subtitle || '';
  }

  const durationMs =
    typeof propsAny.duration === 'number'
      ? propsAny.duration
      : typeof autoHideDuration === 'number'
        ? autoHideDuration
        : 5000;

  return (
    <SnackbarContent
      ref={ref}
      role="alert"
      style={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        padding: 0,
        minWidth: 0,
      }}
    >
      <Box
        dir="ltr"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          width: { xs: 320, sm: 380, md: 410 },
          maxWidth: '100%',
          backgroundColor: config.bg,
          backdropFilter: 'blur(16px)',
          border: `1px solid ${config.border}`,
          borderRadius: '12px',
          boxShadow: `0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 20px -2px ${config.glow}`,
          p: 2,
          pb: 2.2,
          '&:hover .progress-bar-fill': {
            animationPlayState: 'paused',
          },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Glowing Aura & Floating Particles Icon Badge */}
          <Box
            sx={{
              position: 'relative',
              width: 48,
              height: 48,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Radial background glow */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${config.glow} 0%, rgba(0,0,0,0) 70%)`,
              }}
            />

            {/* Particle floating dots */}
            <Box
              sx={{
                position: 'absolute',
                top: 3,
                left: 8,
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: config.dots,
                opacity: 0.85,
                boxShadow: `0 0 6px ${config.dots}`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 5,
                right: 6,
                width: 3.5,
                height: 3.5,
                borderRadius: '50%',
                backgroundColor: config.dots,
                opacity: 0.75,
                boxShadow: `0 0 5px ${config.dots}`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 7,
                left: 5,
                width: 3,
                height: 3,
                borderRadius: '50%',
                backgroundColor: config.dots,
                opacity: 0.65,
                boxShadow: `0 0 4px ${config.dots}`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 3,
                right: 9,
                width: 4.5,
                height: 4.5,
                borderRadius: '50%',
                backgroundColor: config.dots,
                opacity: 0.9,
                boxShadow: `0 0 6px ${config.dots}`,
              }}
            />

            {/* Central glowing icon badge */}
            {renderBadgeIcon(variant, config)}
          </Box>

          {/* Text Information */}
          <Stack
            spacing={0.5}
            sx={{
              flex: 1,
              minWidth: 0,
              textAlign: (themeProps) => (themeProps.direction === 'rtl' ? 'right' : 'left'),
            }}
          >
            {title && (
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14.5,
                  lineHeight: 1.3,
                }}
              >
                {title}
              </Typography>
            )}

            {description && (
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: 12.5,
                  lineHeight: 1.45,
                }}
              >
                {description}
              </Typography>
            )}
          </Stack>

          {/* Close Action */}
          <IconButton
            size="small"
            onClick={() => closeSnackbar(id)}
            sx={{
              color: 'rgba(255, 255, 255, 0.45)',
              alignSelf: 'flex-start',
              p: 0.5,
              '&:hover': {
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </IconButton>
        </Stack>

        {/* Animated Countdown Progress Bar at Bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3.5px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box
            className="progress-bar-fill"
            sx={{
              height: '100%',
              backgroundColor: config.accent,
              boxShadow: `0 0 8px ${config.accent}`,
              animation: `${shrinkProgress} ${durationMs}ms linear forwards`,
            }}
          />
        </Box>
      </Box>
    </SnackbarContent>
  );
});

CustomSnackbar.displayName = 'CustomSnackbar';

export default CustomSnackbar;
