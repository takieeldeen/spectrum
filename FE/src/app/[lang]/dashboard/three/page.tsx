import { CONFIG } from 'src/config-global';

import { BlankView } from 'src/sections/blank/view';
import DevicesListView from 'src/sections/devices/views/list-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Page three | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <DevicesListView />;
}
