import React from 'react';
import { Card, Stack, Box, Divider, Skeleton, useTheme } from '@mui/material';

export default function PlugCardSkeleton() {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        padding: 1,
        minWidth: 400,
        width: 400,
        backgroundColor: theme.palette.background.neutral,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        sx={{ marginBottom: 'auto', flexDirection: 'column', flex: 1, alignItems: 'center' }}
        spacing={3}
      >
        <Skeleton 
          variant="rectangular" 
          width={70} 
          height={28} 
          sx={{ borderRadius: 2, alignSelf: 'flex-end' }} 
        />
        
        <Box sx={{ width: 300, display: 'flex', justifyContent: 'center' }}>
          <Skeleton variant="rectangular" width={280} height={120} sx={{ borderRadius: 2 }} />
        </Box>
        
        <Stack sx={{ alignSelf: 'stretch' }} spacing={1}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="40%" height={24} />
        </Stack>
        
        <Card
          sx={{
            flex: 1,
            width: '100%',
            p: 1.5,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            bgcolor: 'background.paper',
            boxShadow: 'inset 0px 4px 10px rgba(0,0,0,0.03)',
          }}
        >
          {[...Array(3)].map((_, index) => (
            <React.Fragment key={index}>
              <Stack alignItems="center" spacing={1} direction="row">
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" width={40} height={20} />
              </Stack>
              {index < 2 && <Divider orientation="vertical" flexItem />}
            </React.Fragment>
          ))}
        </Card>
        
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" height={48} sx={{ flex: 1, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 1 }} />
        </Stack>
      </Stack>
    </Card>
  );
}
