import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import { LoadingButton } from '@mui/lab';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { useNotification } from 'src/hooks/useNotification';

import { fNumber, fCurrency } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Chart, { useChart } from 'src/components/chart';

import AppWidgetSummary from 'src/sections/overview/app-widget-summary';

// ----------------------------------------------------------------------

// Composant wrapper pour les graphiques afin d'éviter les hooks conditionnels
function BarChart({ series, categories, height = 350 }) {
  const chartOptions = useChart({
    chart: { type: 'bar' },
    plotOptions: {
      bar: {
        columnWidth: '50%',
        borderRadius: 4,
      },
    },
    xaxis: {
      categories: categories || [],
    },
    tooltip: {
      y: {
        formatter: (value) => fNumber(value),
      },
    },
  });

  if (!series || !categories) {
    return <Typography>Aucune donnée</Typography>;
  }

  return <Chart type="bar" series={series} options={chartOptions} height={height} />;
}

BarChart.propTypes = {
  series: PropTypes.array.isRequired,
  categories: PropTypes.array.isRequired,
  height: PropTypes.number,
};

// ----------------------------------------------------------------------

export default function StatisticsClientsView() {
  const { contextHolder, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getClientStatistics();
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

  // Graphique par statut
  const statutChart = data?.parStatut
    ? {
        series: [
          {
            name: 'Clients',
            data: data.parStatut.map((item) => item.nombre),
          },
        ],
        categories: data.parStatut.map((item) => item.statut),
      }
    : null;

  // Graphique par étape
  const etapeChart = data?.parEtape
    ? {
        series: [
          {
            name: 'Clients',
            data: data.parEtape.map((item) => item.nombre),
          },
        ],
        categories: data.parEtape.map((item) => `Étape ${item.etape}`),
      }
    : null;

  // Graphique par commercial
  const commercialChart = data?.parCommercial
    ? {
        series: [
          {
            name: 'Clients assignés',
            data: data.parCommercial.map((item) => item.nombreClients),
          },
        ],
        categories: data.parCommercial.map((item) => item.nom || item.email),
      }
    : null;


  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Statistiques Clients | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Statistiques Clients</Typography>
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
            {/* Résumé */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Total clients"
                  total={fNumber(data.resume?.total || 0)}
                  icon={<Iconify icon="solar:users-group-rounded-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Assignés"
                  total={fNumber(data.resume?.assignes || 0)}
                  color="success"
                  icon={<Iconify icon="solar:user-check-rounded-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Non assignés"
                  total={fNumber(data.resume?.nonAssignes || 0)}
                  color="warning"
                  icon={<Iconify icon="solar:user-cross-rounded-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Sessions actives"
                  total={fNumber(data.resume?.sessionsActives || 0)}
                  color="info"
                  icon={<Iconify icon="solar:chat-round-dots-bold" width={32} />}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Graphique par statut */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Clients par statut
                  </Typography>
                  <BarChart
                    series={statutChart?.series}
                    categories={statutChart?.categories}
                  />
                </Card>
              </Grid>

              {/* Graphique par étape */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Clients par étape
                  </Typography>
                  <BarChart
                    series={etapeChart?.series}
                    categories={etapeChart?.categories}
                  />
                </Card>
              </Grid>
            </Grid>

            {/* Graphique par commercial */}
            {commercialChart && commercialChart.categories.length > 0 && (
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Clients par commercial
                </Typography>
                <BarChart
                  series={commercialChart?.series}
                  categories={commercialChart?.categories}
                />
              </Card>
            )}

            {/* Évolution */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Évolution
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    <Typography variant="h3" color="primary">
                      {fNumber(data.evolution?.nouveauxClientsCeMois || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nouveaux clients ce mois
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    <Typography variant="h3" color="info.main">
                      {fNumber(data.evolution?.nouveauxClientsCetteAnnee || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nouveaux clients cette année
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>

            {/* Top clients par factures */}
            {data.topClients?.parFactures && data.topClients.parFactures.length > 0 && (
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Top clients par nombre de factures
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Numéro</TableCell>
                        <TableCell align="right">Nombre de factures</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topClients.parFactures.slice(0, 10).map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>{client.nom}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.numero}</TableCell>
                          <TableCell align="right">{fNumber(client.nombreFactures)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}

            {/* Top clients par revenus */}
            {data.topClients?.parRevenus && data.topClients.parRevenus.length > 0 && (
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Top clients par revenus générés
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Numéro</TableCell>
                        <TableCell align="right">Revenus générés</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topClients.parRevenus.slice(0, 10).map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>{client.nom}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.numero}</TableCell>
                          <TableCell align="right">{fCurrency(client.totalRevenus)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
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
