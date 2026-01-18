import { Helmet } from 'react-helmet-async';
import { useState } from 'react';

import {
  Alert,
  Box,
  Card,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';
import Iconify from 'src/components/iconify';

export default function ConformiteView() {
  const { contextHolder } = useNotification();

  const [conformiteItems] = useState([
    { id: 1, nom: 'RGPD', description: 'Règlement Général sur la Protection des Données', statut: 'conforme', derniereVerif: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 2, nom: 'HDS', description: 'Hébergeur de Données de Santé', statut: 'conforme', derniereVerif: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 3, nom: 'ISO 27001', description: 'Gestion de la sécurité de l\'information', statut: 'en-cours', derniereVerif: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 4, nom: 'Loi Informatique et Libertés', description: 'Protection des données personnelles', statut: 'conforme', derniereVerif: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  ]);

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'conforme': return 'success';
      case 'en-cours': return 'warning';
      case 'non-conforme': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'conforme': return 'Conforme';
      case 'en-cours': return 'En cours';
      case 'non-conforme': return 'Non conforme';
      default: return statut;
    }
  };

  return (
    <>
      <Helmet><title> Conformité réglementaire | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Conformité réglementaire</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Suivi de la conformité aux réglementations en vigueur</Typography></Box>
        <Alert severity="info">Cette section permet de suivre la conformité aux différentes réglementations applicables au secteur de la santé.</Alert>
        <Grid container spacing={2}>
          {conformiteItems.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{item.nom}</Typography>
                    <Chip label={getStatusLabel(item.statut)} size="small" color={getStatusColor(item.statut)} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                  <Divider />
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Iconify icon="solar:calendar-bold" width={20} sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">Dernière vérification: {fDate(item.derniereVerif)}</Typography>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Documentation et rapports</Typography>
          <Typography variant="body2" color="text.secondary">Les rapports de conformité sont générés automatiquement et disponibles sur demande pour les audits.</Typography>
        </Card>
      </Stack>
    </>
  );
}
