import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
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

BarChart.propTypes = {
  series: PropTypes.array.isRequired,
  categories: PropTypes.array.isRequired,
  height: PropTypes.number,
};

// ----------------------------------------------------------------------

export default function StatisticsUsersView() {
  const { contextHolder, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getUserStatistics();
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
            name: 'Utilisateurs',
            data: data.parStatut.map((item) => item.nombre),
          },
        ],
        categories: data.parStatut.map((item) => item.statut),
      }
    : null;

  // Graphique par service
  const serviceChart = data?.parService
    ? {
        series: [
          {
            name: 'Utilisateurs',
            data: data.parService.map((item) => item.nombre),
          },
        ],
        categories: data.parService.map((item) => item.service),
      }
    : null;


  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Statistiques Utilisateurs | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Statistiques Utilisateurs</Typography>
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
                  title="Total utilisateurs"
                  total={fNumber(data.resume?.total || 0)}
                  icon={<Iconify icon="eva:people-fill" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Actifs"
                  total={fNumber(data.resume?.actifs || 0)}
                  color="success"
                  icon={<Iconify icon="solar:user-check-rounded-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Suspendus"
                  total={fNumber(data.resume?.suspendus || 0)}
                  color="error"
                  icon={<Iconify icon="solar:user-block-rounded-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Nouveaux ce mois"
                  total={fNumber(data.resume?.nouveauxCeMois || 0)}
                  color="info"
                  icon={<Iconify icon="solar:user-plus-rounded-bold" width={32} />}
                />
              </Grid>
            </Grid>

            {/* Graphiques */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Graphique par statut */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Utilisateurs par statut
                  </Typography>
                  <BarChart
                    series={statutChart?.series}
                    categories={statutChart?.categories}
                  />
                </Card>
              </Grid>

              {/* Graphique par service */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Utilisateurs par service
                  </Typography>
                  <BarChart
                    series={serviceChart?.series}
                    categories={serviceChart?.categories}
                  />
                </Card>
              </Grid>
            </Grid>

            {/* Commerciaux */}
            {data.commerciaux && data.commerciaux.length > 0 && (
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Statistiques des commerciaux
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell align="right">Clients assignés</TableCell>
                        <TableCell align="right">Factures créées</TableCell>
                        <TableCell align="right">Montant factures</TableCell>
                        <TableCell align="right">Revenus générés</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.commerciaux.map((commercial) => (
                        <TableRow key={commercial.id}>
                          <TableCell>{commercial.nom}</TableCell>
                          <TableCell>{commercial.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={commercial.status === 'active' ? 'Actif' : 'Suspendu'}
                              color={commercial.status === 'active' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{fNumber(commercial.nombreClients)}</TableCell>
                          <TableCell align="right">{fNumber(commercial.nombreFacturesCreees)}</TableCell>
                          <TableCell align="right">{fCurrency(commercial.montantFacturesCreees)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="success.main">
                              {fCurrency(commercial.revenusGeneres)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}

            {/* Utilisateurs actifs */}
            {data.utilisateursActifs && data.utilisateursActifs.length > 0 && (
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Top utilisateurs les plus actifs
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell align="right">Factures créées</TableCell>
                        <TableCell align="right">Clients assignés</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.utilisateursActifs.slice(0, 10).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.nom}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip label={user.service} size="small" />
                          </TableCell>
                          <TableCell align="right">{fNumber(user.nombreFacturesCreees)}</TableCell>
                          <TableCell align="right">{fNumber(user.nombreClientsAssignes)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}

            {/* Notifications */}
            {data.notifications && data.notifications.length > 0 && (
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Notifications par utilisateur
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell align="right">Total notifications</TableCell>
                        <TableCell align="right">Non lues</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.notifications.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.nom}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip label={user.service} size="small" />
                          </TableCell>
                          <TableCell align="right">{fNumber(user.totalNotifications)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={fNumber(user.notificationsNonLues)}
                              color={user.notificationsNonLues > 0 ? 'error' : 'default'}
                              size="small"
                            />
                          </TableCell>
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
