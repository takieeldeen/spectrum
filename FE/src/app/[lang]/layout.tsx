import 'src/global.css';

import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-cairo',
});

// ----------------------------------------------------------------------

import type { Viewport } from 'next';

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

import { CONFIG } from 'src/config-global';
import { primary } from 'src/theme/core/palette';
import { schemeConfig } from 'src/theme/scheme-config';
import { ThemeProvider } from 'src/theme/theme-provider';

import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/jwt';
import { I18nProvider } from 'src/i18n/i18n-provider';
import { ReactQueryProvider } from 'src/components/react-query/query-provider';
import { SnackbarProvider } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: primary.main,
};

export const metadata = {
  icons: [
    {
      rel: 'icon',
      url: `${CONFIG.assetsDir}/favicon.ico`,
    },
  ],
};

type Props = {
  children: React.ReactNode;
  params: { lang: string };
};

export default async function RootLayout({ children, params: { lang } }: Props) {
  console.log(lang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={lang} dir={dir} className={cairo.variable} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript
          defaultMode={schemeConfig.defaultMode}
          modeStorageKey={schemeConfig.modeStorageKey}
        />

        <ReactQueryProvider>
          <AuthProvider>
            <SettingsProvider settings={{ ...defaultSettings, direction: dir }}>
              <ThemeProvider>
                <MotionLazy>
                  <I18nProvider lang={lang}>
                    <SnackbarProvider>
                      <ProgressBar />
                      <SettingsDrawer />
                      {children}
                    </SnackbarProvider>
                  </I18nProvider>
                </MotionLazy>
              </ThemeProvider>
            </SettingsProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
