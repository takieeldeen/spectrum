import { CONFIG } from 'src/config-global';

import { BlankView } from 'src/sections/blank/view';
import DashboardMainView from 'src/sections/dashboard/views/main-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <DashboardMainView />;
}
