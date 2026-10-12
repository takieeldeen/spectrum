import type { Theme, SxProps } from '@mui/material/styles';
import type { RadioCardProps, RadioCardColor } from 'src/components/radio-card';

import { Controller, useFormContext } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';

import { RadioCard } from 'src/components/radio-card';

// ----------------------------------------------------------------------

export type RHFRadioCardProps = Omit<RadioCardProps, 'checked' | 'onChange'> & {
  name: string;
  value: any;
  helperText?: React.ReactNode;
};

export function RHFRadioCard({ name, value, helperText, ...other }: RHFRadioCardProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const isChecked = field.value === value;

        return (
          <>
            <RadioCard
              {...other}
              value={value}
              checked={isChecked}
              onChange={() => field.onChange(value)}
            />

            {(error || helperText) && (
              <FormHelperText error={!!error} sx={{ mx: 0.5 }}>
                {error ? error?.message : helperText}
              </FormHelperText>
            )}
          </>
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------

export type RadioCardOption = {
  value: any;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string | React.ReactNode;
  checkedIcon?: string | React.ReactNode;
  disabled?: boolean;
};

export type RHFRadioCardGroupProps = {
  name: string;
  options: RadioCardOption[];
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  spacing?: number;
  color?: RadioCardColor;
  sx?: SxProps<Theme>;
};

export function RHFRadioCardGroup({
  name,
  options,
  label,
  helperText,
  spacing = 1,
  color = 'primary',
  sx,
}: RHFRadioCardGroupProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Stack spacing={spacing} sx={sx}>
          {label && (
            <FormLabel
              error={!!error}
              sx={{ typography: 'subtitle2', color: 'text.primary', mb: 0.5 }}
            >
              {label}
            </FormLabel>
          )}

          {options.map((option) => {
            const isChecked = field.value === option.value;

            return (
              <RadioCard
                key={String(option.value)}
                value={option.value}
                checked={isChecked}
                onChange={() => field.onChange(option.value)}
                title={option.title}
                subtitle={option.subtitle}
                icon={option.icon}
                checkedIcon={option.checkedIcon}
                disabled={option.disabled}
                color={color}
              />
            );
          })}

          {(error || helperText) && (
            <FormHelperText error={!!error} sx={{ mx: 0.5 }}>
              {error ? error?.message : helperText}
            </FormHelperText>
          )}
        </Stack>
      )}
    />
  );
}
