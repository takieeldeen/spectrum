'use client';
import { Stack, Typography } from '@mui/material';
import React from 'react';
import PlugCard from '../plug-card';
import PlugNewEditForm from '../plug-new-edit-form';
import { useGetPlugs } from 'src/api/plug';

function PlugsListView() {
  const { data: plugs, isLoading } = useGetPlugs();
  console.log(plugs), 'PLugs list';
  return (
    <Stack>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        sx={{ marginBottom: 3 }}
      >
        <Typography variant="h3">المقابس الكهربائية</Typography>
        <PlugNewEditForm />
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
        {plugs?.map((plug) => <PlugCard key={plug.id} plug={plug} />)}
      </Stack>
    </Stack>
  );
}

export default PlugsListView;
