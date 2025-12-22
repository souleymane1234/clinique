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

import { fDate } from 'src/utils/format-time';
import { fNumber, fCurrency } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Chart, { useChart } from 'src/components/chart';

import AppWidgetSummary from 'src/sections/overview/app-widget-summary';

// ----------------------------------------------------------------------

// Composant wrapper pour les graphiques afin d'éviter les hooks conditionnels
function BarChart({ series, categories, height = 350, isCurrency = false }) {
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
        formatter: (value) => (isCurrency ? fCurrency(value) : fNumber(value)),
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
  isCurrency: PropTypes.bool,
};

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  pending: 'warning',
  partial: 'info',
  paid: 'success',
  cancelled: 'error',
};

export default function StatisticsFacturationView() {
  const { contextHolder, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getFacturationStatistics();
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
            name: 'Montant total',
            data: data.parStatut.map((item) => item.montantTotal || 0),
          },
          {
            name: 'Montant payé',
            data: data.parStatut.map((item) => item.montantPaye || 0),
          },
          {
            name: 'Montant restant',
            data: data.parStatut.map((item) => item.montantRestant || 0),
          },
        ],
        categories: data.parStatut.map((item) => item.statut),
      }
    : null;

  // Graphique par type
  const typeChart = data?.parType
    ? {
        series: [
          {
            name: 'Nombre',
            data: data.parType.map((item) => item.nombre),
          },
          {
            name: 'Montant total',
            data: data.parType.map((item) => item.montantTotal || 0),
          },
        ],
        categories: data.parType.map((item) => item.type),
      }
    : null;

  // Graphique paiements par méthode
  const paiementsChart = data?.paiements?.parMethode
    ? {
        series: [
          {
            name: 'Montant',
            data: data.paiements.parMethode.map((item) => item.montantTotal || 0),
          },
        ],
        categories: data.paiements.parMethode.map((item) => item.methode),
      }
    : null;


  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Statistiques Facturation | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Statistiques Facturation</Typography>
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
                  title="Total factures"
                  total={fNumber(data.resume?.totalFactures || 0)}
                  icon={<Iconify icon="solar:document-text-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Total paiements"
                  total={fNumber(data.resume?.totalPaiements || 0)}
                  color="success"
                  icon={<Iconify icon="solar:wallet-money-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Montant total"
                  total={fCurrency(data.resume?.montantTotal || 0)}
                  color="info"
                  icon={<Iconify icon="solar:bill-list-bold" width={32} />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Factures en retard"
                  total={fNumber(data.resume?.facturesEnRetard || 0)}
                  color="error"
                  icon={<Iconify icon="solar:calendar-mark-bold" width={32} />}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {fCurrency(data.resume?.montantPaye || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Montant payé
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {fCurrency(data.resume?.montantRestant || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Montant restant
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Graphiques */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Graphique par statut */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Factures par statut
                  </Typography>
                  {statutChart ? (
                    <Chart
                      type="bar"
                      series={statutChart.series}
                      options={useChart({
                        chart: { type: 'bar' },
                        plotOptions: {
                          bar: {
                            columnWidth: '50%',
                            borderRadius: 4,
                          },
                        },
                        xaxis: {
                          categories: statutChart.categories || [],
                        },
                        tooltip: {
                          y: {
                            formatter: (value) => fCurrency(value),
                          },
                        },
                      })}
                      height={350}
                    />
                  ) : (
                    <Typography>Aucune donnée</Typography>
                  )}
                </Card>
              </Grid>

              {/* Graphique par type */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Factures par type
                  </Typography>
                  <BarChart
                    series={typeChart?.series}
                    categories={typeChart?.categories}
                    isCurrency
                  />
                </Card>
              </Grid>
            </Grid>

            {/* Paiements par méthode */}
            {paiementsChart && paiementsChart.categories.length > 0 && (
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Paiements par méthode
                </Typography>
                <BarChart
                  series={paiementsChart?.series}
                  categories={paiementsChart?.categories}
                  isCurrency
                />
              </Card>
            )}

            {/* Évolution */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Évolution
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    <Typography variant="h5" color="primary">
                      {fNumber(data.evolution?.facturesCeMois?.nombre || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Factures ce mois
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fCurrency(data.evolution?.facturesCeMois?.montant || 0)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    <Typography variant="h5" color="info.main">
                      {fCurrency(data.evolution?.facturesCeMois?.montant || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Montant factures ce mois
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    <Typography variant="h5" color="success.main">
                      {fNumber(data.paiements?.ceMois?.nombre || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paiements ce mois
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fCurrency(data.paiements?.ceMois?.montant || 0)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    <Typography variant="h5" color="success.main">
                      {fCurrency(data.paiements?.ceMois?.montant || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Montant paiements ce mois
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>

            {/* Factures en retard */}
            {data.facturesEnRetard && data.facturesEnRetard.length > 0 && (
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Factures en retard
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Numéro</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>Date d&apos;échéance</TableCell>
                        <TableCell>Jours de retard</TableCell>
                        <TableCell align="right">Montant restant</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.facturesEnRetard.map((facture) => (
                        <TableRow key={facture.id}>
                          <TableCell>{facture.numeroFacture}</TableCell>
                          <TableCell>{facture.clientName}</TableCell>
                          <TableCell>{fDate(facture.dateEcheance)}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${facture.joursRetard} jours`}
                              color="error"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{fCurrency(facture.montantRestant)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}

            {/* Top factures */}
            {data.topFactures && data.topFactures.length > 0 && (
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Top 10 factures par montant
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Numéro</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell align="right">Montant total</TableCell>
                        <TableCell align="right">Montant payé</TableCell>
                        <TableCell align="right">Montant restant</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topFactures.slice(0, 10).map((facture) => (
                        <TableRow key={facture.id}>
                          <TableCell>{facture.numeroFacture}</TableCell>
                          <TableCell>{facture.clientName}</TableCell>
                          <TableCell>
                            <Chip
                              label={facture.type === 'proforma' ? 'Proforma' : 'Facture'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={facture.status}
                              color={STATUS_COLORS[facture.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{fCurrency(facture.montantTotal)}</TableCell>
                          <TableCell align="right">{fCurrency(facture.montantPaye)}</TableCell>
                          <TableCell align="right">{fCurrency(facture.montantRestant)}</TableCell>
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
