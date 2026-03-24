import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Skeleton,
  Typography,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STAT_CONFIG = [
  { key: 'total', label: 'Total analyses', color: 'primary', icon: 'solar:test-tube-bold' },
  { key: 'enAttente', label: 'En attente', color: 'warning', icon: 'solar:clock-circle-bold' },
  { key: 'enCours', label: 'En cours', color: 'info', icon: 'solar:refresh-bold' },
  { key: 'terminee', label: 'Terminées', color: 'success', icon: 'solar:check-circle-bold' },
  { key: 'validee', label: 'Validées', color: 'success', icon: 'solar:verified-check-bold' },
  { key: 'annulee', label: 'Annulées', color: 'error', icon: 'solar:close-circle-bold' },
];

export default function LaboratoryStatistiquesView() {
  const { contextHolder, showError } = useNotification();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getLaboratoryAnalysesStatistics();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setStats(null);
        showError('Erreur', result.message || 'Impossible de charger les statistiques');
      }
    } catch (e) {
      setStats(null);
      showError('Erreur', e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <>
      <Helmet>
        <title> Statistiques laboratoire | Clinique </title>
      </Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4">Statistiques du laboratoire</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Synthèse des analyses (API <code>/laboratory/analyses/statistics</code>)
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:refresh-bold" />}
            onClick={loadStats}
            disabled={loading}
          >
            Actualiser
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {STAT_CONFIG.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.key}>
              <Card sx={{ p: 3, height: 1 }}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: (theme) => alpha(theme.palette[item.color].main, 0.12),
                        color: `${item.color}.main`,
                      }}
                    >
                      <Iconify icon={item.icon} width={22} />
                    </Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Stack>
                  {loading ? (
                    <Skeleton variant="text" width={80} height={48} />
                  ) : (
                    <Typography variant="h3">{stats?.[item.key] ?? 0}</Typography>
                  )}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>

        {!loading && !stats && (
          <Card sx={{ p: 3 }}>
            <Typography color="text.secondary">Aucune donnée disponible.</Typography>
            <LoadingButton sx={{ mt: 2 }} variant="contained" onClick={loadStats}>
              Réessayer
            </LoadingButton>
          </Card>
        )}
      </Stack>
    </>
  );
}
