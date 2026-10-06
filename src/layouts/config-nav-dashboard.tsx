import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

export function useNavData() {
  const { t } = useTranslation();

  return useMemo(
    () => [
      /**
       * Overview
       */
      {
        subheader: t('NAVBAR.OVERVIEW'),
        items: [
          { title: t('NAVBAR.DASHBOARD'), path: paths.dashboard.root, icon: ICONS.dashboard },
          { title: t('NAVBAR.TWO'), path: paths.dashboard.two, icon: ICONS.ecommerce },
          { title: t('NAVBAR.THREE'), path: paths.dashboard.three, icon: ICONS.analytics },
        ],
      },
      /**
       * Management
       */
      {
        subheader: t('NAVBAR.MANAGEMENT'),
        items: [
          {
            title: t('NAVBAR.GROUP'),
            path: paths.dashboard.group.root,
            icon: ICONS.user,
            children: [
              { title: t('NAVBAR.FOUR'), path: paths.dashboard.group.root },
              { title: t('NAVBAR.FIVE'), path: paths.dashboard.group.five },
              { title: t('NAVBAR.SIX'), path: paths.dashboard.group.six },
            ],
          },
        ],
      },
    ],
    [t]
  );
}
