import { View, type ViewProps } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar') ?? false;

  return (
    <View
      style={[
        {
          backgroundColor: theme[type ?? 'background'],
          direction: isArabic ? 'rtl' : 'ltr',
        },
        style,
      ]}
      {...otherProps}
    />
  );
}
