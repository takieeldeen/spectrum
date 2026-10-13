import Box from '@mui/material/Box';
import { GuestGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <GuestGuard>
      {/* <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 4, sm: 6 },
          px: { xs: 2, sm: 3 },
          bgcolor: '#080c14',
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 214, 143, 0.08), transparent 70%)',
        }}
      > */}
      {children}
      {/* </Box> */}
    </GuestGuard>
  );
}
