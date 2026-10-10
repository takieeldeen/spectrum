import React from 'react';
import { Box, Typography } from '@mui/material';
import PlugDetailsView from 'src/sections/plugs/views/details-view';

export default function PlugDetailsPage({ params }: { params: { lang: string; plugId: string } }) {
  return <PlugDetailsView id={params.plugId} />;
}
