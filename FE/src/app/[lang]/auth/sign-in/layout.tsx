import { AuthSplitLayout } from 'src/layouts/auth-split';

import { GuestGuard } from 'src/auth/guard';
import { Card, Stack } from '@mui/material';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <GuestGuard>
      {/* <AuthSplitLayout section={{ title: 'Hi, Welcome back' }}>{children}</AuthSplitLayout> */}
      <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
        <Card sx={{ paddingX: 3, paddingY: 5, minWidth: 400, borderRadius: 3 }}>{children}</Card>
      </Stack>
    </GuestGuard>
  );
}
