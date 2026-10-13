import { CONFIG } from 'src/config-global';

import { MainView } from 'src/sections/account-activation/views/main-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Account Activation - ${CONFIG.appName}` };

type Props = {
  params: { lang: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function Page({ searchParams }: Props) {
  const token =
    typeof searchParams?.token === 'string'
      ? searchParams.token
      : Array.isArray(searchParams?.token)
        ? searchParams.token[0]
        : '';

  return <MainView token={token} />;
}
