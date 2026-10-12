'use client';

import React from 'react';
import {
  SnackbarProvider as NotistackProvider,
  SnackbarProviderProps,
  enqueueSnackbar,
  closeSnackbar,
} from 'notistack';
import { GlobalStyles } from '@mui/material';
import { CustomSnackbar } from './custom-snackbar';

// ----------------------------------------------------------------------

export function SnackbarProvider({ children, ...props }: SnackbarProviderProps) {
  return (
    <>
      <GlobalStyles
        styles={{
          '#notistack-snackbar': {
            padding: 0,
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
          '.notistack-SnackbarContainer': {
            zIndex: 9999,
          },
        }}
      />

      <NotistackProvider
        maxSnack={4}
        autoHideDuration={4500}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        Components={{
          default: CustomSnackbar,
          success: CustomSnackbar,
          error: CustomSnackbar,
          info: CustomSnackbar,
          warning: CustomSnackbar,
        }}
        {...props}
      >
        {children}
      </NotistackProvider>
    </>
  );
}

// ----------------------------------------------------------------------

export type ToastOptions = {
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  duration?: number;
  persist?: boolean;
};

export const toast = {
  success: (title: React.ReactNode, descriptionOrOptions?: React.ReactNode | ToastOptions) => {
    const isOptions =
      typeof descriptionOrOptions === 'object' &&
      descriptionOrOptions !== null &&
      !React.isValidElement(descriptionOrOptions) &&
      ('description' in descriptionOrOptions || 'duration' in descriptionOrOptions);

    const description = isOptions
      ? (descriptionOrOptions as ToastOptions).description
      : (descriptionOrOptions as React.ReactNode);

    const extraProps = isOptions ? (descriptionOrOptions as ToastOptions) : {};

    return enqueueSnackbar(title as any, {
      variant: 'success',
      ...extraProps,
      description,
    } as any);
  },

  error: (title: React.ReactNode, descriptionOrOptions?: React.ReactNode | ToastOptions) => {
    const isOptions =
      typeof descriptionOrOptions === 'object' &&
      descriptionOrOptions !== null &&
      !React.isValidElement(descriptionOrOptions) &&
      ('description' in descriptionOrOptions || 'duration' in descriptionOrOptions);

    const description = isOptions
      ? (descriptionOrOptions as ToastOptions).description
      : (descriptionOrOptions as React.ReactNode);

    const extraProps = isOptions ? (descriptionOrOptions as ToastOptions) : {};

    return enqueueSnackbar(title as any, {
      variant: 'error',
      ...extraProps,
      description,
    } as any);
  },

  info: (title: React.ReactNode, descriptionOrOptions?: React.ReactNode | ToastOptions) => {
    const isOptions =
      typeof descriptionOrOptions === 'object' &&
      descriptionOrOptions !== null &&
      !React.isValidElement(descriptionOrOptions) &&
      ('description' in descriptionOrOptions || 'duration' in descriptionOrOptions);

    const description = isOptions
      ? (descriptionOrOptions as ToastOptions).description
      : (descriptionOrOptions as React.ReactNode);

    const extraProps = isOptions ? (descriptionOrOptions as ToastOptions) : {};

    return enqueueSnackbar(title as any, {
      variant: 'info',
      ...extraProps,
      description,
    } as any);
  },

  warning: (title: React.ReactNode, descriptionOrOptions?: React.ReactNode | ToastOptions) => {
    const isOptions =
      typeof descriptionOrOptions === 'object' &&
      descriptionOrOptions !== null &&
      !React.isValidElement(descriptionOrOptions) &&
      ('description' in descriptionOrOptions || 'duration' in descriptionOrOptions);

    const description = isOptions
      ? (descriptionOrOptions as ToastOptions).description
      : (descriptionOrOptions as React.ReactNode);

    const extraProps = isOptions ? (descriptionOrOptions as ToastOptions) : {};

    return enqueueSnackbar(title as any, {
      variant: 'warning',
      ...extraProps,
      description,
    } as any);
  },

  dismiss: (key?: any) => closeSnackbar(key),
};

export default SnackbarProvider;
