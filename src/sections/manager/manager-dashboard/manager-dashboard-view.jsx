import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Card, Grid, Stack, Typography } from '@mui/material';

export default function ManagerDashboardView() {
  const [stats, setStats] = useState({
    patients: 1250,
    consultations: 342,
    revenus: 45230,
    medicaments: 156,
  });

  return (
    <>
      <Helmet><title> Tableau de Bord Global | Clinique </title></Helmet>
      <Stack spacing={3}>
        <Box><Typography variant="h4">Tableau de Bord Global</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Vue d&apos;ensemble de l&apos;activité de la clinique</Typography></Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ p: 3, textAlign: 'center' }}><Typography variant="h3">{stats.patients}</Typography><Typography variant="body2" color="text.secondary">Patients</Typography></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ p: 3, textAlign: 'center' }}><Typography variant="h3">{stats.consultations}</Typography><Typography variant="body2" color="text.secondary">Consultations</Typography></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ p: 3, textAlign: 'center' }}><Typography variant="h3">{stats.revenus.toLocaleString()}€</Typography><Typography variant="body2" color="text.secondary">Revenus (mois)</Typography></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ p: 3, textAlign: 'center' }}><Typography variant="h3">{stats.medicaments}</Typography><Typography variant="body2" color="text.secondary">Médicaments</Typography></Card></Grid>
        </Grid>
      </Stack>
    </>
  );
}
