import { CONFIG } from 'src/config-global';

import DeviceDetailsView from 'src/sections/devices/views/details-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Device Details | Dashboard - ${CONFIG.appName}` };

type Props = {
  params: {
    lang: string;
    deviceId: string;
  };
};

export default function Page({ params }: Props) {
  return <DeviceDetailsView deviceId={params.deviceId} />;
}
