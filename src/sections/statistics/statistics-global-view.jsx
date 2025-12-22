import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useNotification } from 'src/hooks/useNotification';

import { fNumber } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Chart, { useChart } from 'src/components/chart';

import AppWidgetSummary from 'src/sections/overview/app-widget-summary';

// ----------------------------------------------------------------------

// Composant wrapper pour les graphiques afin d'éviter les hooks conditionnels
function BarChart({ series, categories, height = 350 }) {
  BarChart.propTypes = {
    series: PropTypes.array.isRequired,
    categories: PropTypes.array.isRequired,
    height: PropTypes.number,
  };
  const chartOptions = useChart({
    chart: { type: 'bar' },
    plotOptions: {
      bar: {
        columnWidth: '50%',
      },
    },
    stroke: {
      show: true,
      width: 2,
    },
    xaxis: {
      categories: categories || [],
    },
    tooltip: {
      y: {
        formatter: (value) => `${fNumber(value)} FCFA`,
      },
    },
  });

  if (!series || !categories) {
    return null;
  }

  return <Chart type="bar" series={series} options={chartOptions} height={height} />;
}

BarChart.propTypes = {
  series: PropTypes.array.isRequired,
  categories: PropTypes.array.isRequired,
  height: PropTypes.number,
};

// ----------------------------------------------------------------------

export default function StatisticsGlobalView() {
  const { contextHolder, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getGlobalStatistics();
      if (result.success) {
        setData(result.data);
      } else {
        showError('Erreur', 'Impossible de charger les statistiques');
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      showError('Erreur', 'Une erreur est survenue lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, []); // Charger uniquement au montage, showError est stable

  useEffect(() => {
    loadStatistics();
  }, []); // Charger uniquement au montage

  // Graphique pour les revenus
  const revenusChart = data ? {
    series: [
      {
        name: 'Revenus',
        type: 'column',
        fill: 'solid',
        data: [
          data.revenus?.total || 0,
          data.revenus?.ceMois || 0,
          data.revenus?.cetteAnnee || 0,
        ],
      },
    ],
    categories: ['Total', 'Ce mois', 'Cette année'],
  } : null;

  // Graphique pour les montants des factures
  const facturesChart = data ? {
    series: [
      {
        name: 'Montant total',
        type: 'column',
        fill: 'solid',
        data: [data.factures?.montantTotal || 0],
      },
      {
        name: 'Montant payé',
        type: 'column',
        fill: 'solid',
        data: [data.factures?.montantPaye || 0],
      },
      {
        name: 'Montant en attente',
        type: 'column',
        fill: 'solid',
        data: [data.factures?.montantEnAttente || 0],
      },
      {
        name: 'Montant partiel',
        type: 'column',
        fill: 'solid',
        data: [data.factures?.montantPartiel || 0],
      },
    ],
    categories: ['Factures'],
  } : null;


  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Statistiques Globales | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Statistiques Globales</Typography>
          <LoadingButton
            variant="outlined"
            startIcon={<Iconify icon="eva:refresh-fill" />}
            onClick={loadStatistics}
            loading={loading}
          >
            Actualiser
          </LoadingButton>
        </Stack>

        {loading && !data && (
          <Box>Chargement...</Box>
        )}
        {!loading && data && (
          <>
            {/* Vue d'ensemble */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Utilisateurs"
                  total={fNumber(data.overview?.totalUsers || 0)}
                  icon={<Iconify icon="eva:people-fill" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Clients"
                  total={fNumber(data.overview?.totalClients || 0)}
                  icon={<Iconify icon="solar:users-group-rounded-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Factures"
                  total={fNumber(data.overview?.totalFactures || 0)}
                  icon={<Iconify icon="solar:document-text-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Paiements"
                  total={fNumber(data.overview?.totalPaiements || 0)}
                  icon={<Iconify icon="solar:wallet-money-bold" width={32} />}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Sessions"
                  total={fNumber(data.overview?.totalSessions || 0)}
                  icon={<Iconify icon="solar:chat-round-dots-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Notifications"
                  total={fNumber(data.overview?.totalNotifications || 0)}
                  icon={<Iconify icon="solar:bell-bing-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Utilisateurs actifs"
                  total={fNumber(data.overview?.utilisateursActifs || 0)}
                  color="success"
                  icon={<Iconify icon="solar:user-check-rounded-bold" width={32} />}
                />
              </Grid>
            </Grid>

            {/* Revenus */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Revenus
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {fNumber(data.revenus?.total || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total (FCFA)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {fNumber(data.revenus?.ceMois || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ce mois (FCFA)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {fNumber(data.revenus?.cetteAnnee || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cette année
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              {revenusChart && (
                <Box sx={{ mt: 3 }}>
                  <BarChart
                    series={revenusChart.series}
                    categories={revenusChart.categories}
                  />
                </Box>
              )}
            </Card>

            {/* Factures */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Factures - Montants
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">
                      {fNumber(data.factures?.montantTotal || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Montant total (FCFA)
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="success.main">
                      {fNumber(data.factures?.montantPaye || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Montant payé (FCFA)
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="warning.main">
                      {fNumber(data.factures?.montantEnAttente || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      En attente (FCFA)
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="info.main">
                      {fNumber(data.factures?.montantPartiel || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Partiellement payé
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              {facturesChart && (
                <Box>
                  <BarChart
                    series={facturesChart.series}
                    categories={facturesChart.categories}
                  />
                </Box>
              )}
            </Card>

            {/* Activité */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Activité
              </Typography>
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    <Typography variant="h3" color="primary">
                      {fNumber(data.activite?.nouveauxClientsCeMois || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nouveaux clients ce mois
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={12} md={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    <Typography variant="h3" color="info.main">
                      {fNumber(data.activite?.facturesCeMois || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Factures créées ce mois
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </>
        )}
        {!loading && !data && (
          <Card sx={{ p: 3 }}>
            <Typography>Aucune donnée disponible</Typography>
          </Card>
        )}
      </Container>
    </>
  );
}
