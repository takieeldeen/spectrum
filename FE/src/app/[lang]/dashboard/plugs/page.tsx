import { CONFIG } from 'src/config-global';

import { BlankView } from 'src/sections/blank/view';
import PlugsListView from 'src/sections/plugs/views/list-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Page two | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <PlugsListView />;
}
