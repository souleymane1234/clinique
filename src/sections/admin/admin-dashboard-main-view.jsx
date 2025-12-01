import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useNotification } from 'src/hooks/useNotification';

import { fNumber } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Chart, { useChart } from 'src/components/chart';

import AppWidgetSummary from 'src/sections/overview/app-widget-summary';

// ----------------------------------------------------------------------

export default function AdminDashboardMainView() {
  const { contextHolder, showError } = useNotification();


  // États pour les statistiques CarbuGo
  const [carbuGoStats, setCarbuGoStats] = useState({
    userGrowth: null,
    mostActiveStations: null,
    activeFilesOccupation: null,
    averageServiceTime: null,
    litersDistribution: null,
  });
  const [loadingCarbuGo, setLoadingCarbuGo] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);


  // Cache pour éviter les requêtes répétées
  const [dataLoaded, setDataLoaded] = useState(false);

  // Charger les statistiques CarbuGo
  const loadCarbuGoStats = useCallback(async (isRefresh = false) => {
    try {
      setLoadingCarbuGo(true);
      const [userGrowthResult, stationsResult, occupationResult, serviceTimeResult] = await Promise.allSettled([
        ConsumApi.getReportsUserGrowth(),
        ConsumApi.getReportsMostActiveStations(5),
        ConsumApi.getReportsActiveFilesOccupation(),
        ConsumApi.getReportsAverageServiceTime(),
      ]);

      setCarbuGoStats({
        userGrowth: userGrowthResult.status === 'fulfilled' && userGrowthResult.value.success ? userGrowthResult.value.data : null,
        mostActiveStations: stationsResult.status === 'fulfilled' && stationsResult.value.success ? stationsResult.value.data : null,
        activeFilesOccupation: occupationResult.status === 'fulfilled' && occupationResult.value.success ? occupationResult.value.data : null,
        averageServiceTime: serviceTimeResult.status === 'fulfilled' && serviceTimeResult.value.success ? serviceTimeResult.value.data : null,
        litersDistribution: null,
      });

      // Marquer que le premier chargement est terminé
      if (isInitialLoading) {
        setIsInitialLoading(false);
      }
    } catch (error) {
      console.error('Error loading CarbuGo stats:', error);
      if (isInitialLoading) {
        setIsInitialLoading(false);
      }
    } finally {
      setLoadingCarbuGo(false);
    }
  }, [isInitialLoading]);

  const loadData = useCallback(async () => {
    // Éviter les requêtes répétées
    if (dataLoaded) {
      return;
    }

    try {
      // Les données CarbuGo sont déjà chargées via loadCarbuGoStats
      // Cette fonction sert uniquement à marquer les données comme chargées
      setDataLoaded(true);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard admin:', error);
      showError('Erreur', 'Impossible de charger les statistiques. Veuillez réessayer.');
      setDataLoaded(true);
    }
  }, [showError, dataLoaded]);

  useEffect(() => {
    loadCarbuGoStats();
  }, [loadCarbuGoStats]);

  useEffect(() => {
    // Charger les données après que les stats CarbuGo soient disponibles
    if (carbuGoStats.userGrowth && !dataLoaded) {
      loadData();
    }
  }, [loadData, carbuGoStats.userGrowth, dataLoaded]);

  // Préparer les options des graphiques de manière inconditionnelle pour respecter les règles des hooks
  const userGrowthChartOptions = carbuGoStats.userGrowth?.dailyGrowth && carbuGoStats.userGrowth.dailyGrowth.length > 0
    ? useChart({
        xaxis: {
          categories: carbuGoStats.userGrowth.dailyGrowth.map((day) =>
            new Date(day.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
          ),
        },
        tooltip: {
          y: {
            formatter: (value) => fNumber(value),
          },
        },
      })
    : useChart({
        xaxis: {
          categories: [],
        },
        tooltip: {
          y: {
            formatter: (value) => fNumber(value),
          },
        },
      });

  const stationsChartOptions = carbuGoStats.mostActiveStations?.stations && carbuGoStats.mostActiveStations.stations.length > 0
    ? useChart({
        xaxis: {
          categories: carbuGoStats.mostActiveStations.stations.map((s) =>
            s.stationName.length > 15 ? `${s.stationName.substring(0, 15)}...` : s.stationName
          ),
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '70%',
            borderRadius: 2,
          },
        },
        tooltip: {
          y: {
            formatter: (value) => `${fNumber(value)} L`,
          },
        },
      })
    : useChart({
        xaxis: {
          categories: [],
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '70%',
            borderRadius: 2,
          },
        },
        tooltip: {
          y: {
            formatter: (value) => `${fNumber(value)} L`,
          },
        },
      });

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Tableau de bord | CarbuGo </title>
      </Helmet>
      <Container maxWidth="xl">
        {/* Header avec titre et bouton actualiser */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 5,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4">Tableau de Bord Administration</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Vue d&apos;ensemble de la plateforme
            </Typography>
          </Box>
          <LoadingButton
            variant="outlined"
            startIcon={<Iconify icon="solar:refresh-bold" />}
            onClick={async () => {
              setDataLoaded(false);
              await loadCarbuGoStats(true);
            }}
            loading={loadingCarbuGo && !isInitialLoading}
            disabled={loadingCarbuGo && isInitialLoading}
            sx={{ flexShrink: 0 }}
          >
            Actualiser
          </LoadingButton>
        </Box>


        {isInitialLoading ? (
          // Skeleton loading - uniquement au premier chargement
          <Stack spacing={3}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
              }}
            >
              {Array.from(new Array(4)).map((_, index) => (
                <Box key={`skeleton-${index}`} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
                  <Skeleton variant="rectangular" width="100%" height={120} />
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
              }}
            >
              <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(66.66% - 12px)' } }}>
                <Card sx={{ p: 2 }}>
                  <Skeleton width="40%" variant="text" sx={{ fontSize: '1rem', mb: 2 }} />
                  <Skeleton width="60%" variant="text" sx={{ fontSize: '0.875rem', mb: 3 }} />
                  <Skeleton variant="rectangular" width="100%" height={450} />
                </Card>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(33.33% - 12px)' } }}>
                <Card sx={{ p: 2, height: 540 }}>
                  <Skeleton width="50%" variant="text" sx={{ fontSize: '1rem', mb: 2 }} />
                  <Skeleton variant="circular" width="60%" height={300} sx={{ mx: 'auto', my: 5 }} />
                </Card>
              </Box>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={4}>
            {/* Section Statistiques CarbuGo */}
            {carbuGoStats.userGrowth ? (
              <>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="h5" sx={{ px: 2 }}>
                    Statistiques CarbuGo
                  </Typography>
                </Divider>

                {/* Widgets CarbuGo */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
              }}
            >
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
                <AppWidgetSummary
                      title="Total Utilisateurs"
                      total={carbuGoStats.userGrowth.totalUsers || 0}
                  color="primary"
                      icon={<Iconify icon="solar:users-group-rounded-bold" width={32} />}
                />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
                <AppWidgetSummary
                      title="Nouveaux (30j)"
                      total={carbuGoStats.userGrowth.newUsersLast30Days || 0}
                  color="success"
                      icon={<Iconify icon="solar:user-plus-bold" width={32} />}
                />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
                    <Card
                      component={Stack}
                      spacing={3}
                      direction="row"
                  sx={{
                        px: 3,
                        py: 5,
                        borderRadius: 2,
                        bgcolor: (themeParam) => alpha(themeParam.palette.info.main, 0.08),
                      }}
                    >
                      <Box sx={{ width: 64, height: 64 }}>
                        <Iconify icon="solar:graph-up-bold" width={32} />
                      </Box>
                      <Stack spacing={0.5}>
                        <Typography variant="h4">
                          {fNumber(carbuGoStats.userGrowth?.growthRate || 0)}%
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'text.disabled' }}>
                          Taux Croissance
                        </Typography>
                      </Stack>
                    </Card>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
                <AppWidgetSummary
                      title="Sessions Actives"
                      total={carbuGoStats.activeFilesOccupation?.totalActiveSessions || 0}
                      color="warning"
                      icon={<Iconify icon="solar:users-group-rounded-bold" width={32} />}
                />
              </Box>
            </Box>

                {/* Graphiques CarbuGo */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
              }}
            >
                  {/* Croissance utilisateurs */}
                  {carbuGoStats.userGrowth?.dailyGrowth && carbuGoStats.userGrowth.dailyGrowth.length > 0 && (
              <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(66.66% - 12px)' } }}>
                      <Card>
                        <Box sx={{ p: 3, pb: 1 }}>
                          <Typography variant="h6">Croissance des Utilisateurs</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {carbuGoStats.userGrowth.period}
                          </Typography>
                          <Chart
                            dir="ltr"
                            type="line"
                            series={[
                              {
                                name: 'Total Utilisateurs',
                                data: carbuGoStats.userGrowth.dailyGrowth.map((day) => day.total),
                              },
                            ]}
                            options={userGrowthChartOptions}
                            width="100%"
                            height={364}
                />
              </Box>
                      </Card>
                    </Box>
                  )}

                  {/* Stations les plus actives */}
                  {carbuGoStats.mostActiveStations?.stations && carbuGoStats.mostActiveStations.stations.length > 0 && (
              <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(33.33% - 12px)' } }}>
                      <Card>
                        <Box sx={{ p: 3 }}>
                          <Typography variant="h6">Stations les Plus Actives</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {carbuGoStats.mostActiveStations.period}
                          </Typography>
                          <Chart
                            dir="ltr"
                            type="bar"
                            series={[
                              {
                                name: 'Litres Distribués',
                                data: carbuGoStats.mostActiveStations.stations.map((s) => s.litersDistributed),
                              },
                            ]}
                            options={stationsChartOptions}
                            width="100%"
                            height={364}
                />
              </Box>
                      </Card>
            </Box>
                  )}
            </Box>

                {/* Temps moyen de service et Occupation */}
                {carbuGoStats.averageServiceTime && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
              }}
            >
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
                      <Card sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Temps Moyen de Service
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          <Box sx={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
                            <Typography variant="h4" color="primary.main">
                              {fNumber(Math.round(carbuGoStats.averageServiceTime.averageServiceTimeMinutes || 0))}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Minutes
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
                            <Typography variant="h4" color="info.main">
                              {fNumber((carbuGoStats.averageServiceTime.averageServiceTimeHours || 0).toFixed(2))}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Heures
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
                            <Typography variant="h4" color="success.main">
                              {carbuGoStats.averageServiceTime.sessionsAnalyzed || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Sessions
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Box>

                    {carbuGoStats.activeFilesOccupation?.activeSessions && carbuGoStats.activeFilesOccupation.activeSessions.length > 0 && (
                      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
                        <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                            Occupation des Files Actives
                          </Typography>
                          <Stack spacing={1}>
                            {carbuGoStats.activeFilesOccupation.activeSessions.slice(0, 3).map((session) => (
                              <Box key={session.sessionId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">{session.stationName}</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {session.inService} en service
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    • {session.waiting} en attente
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Stack>
                        </Card>
                      </Box>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucune statistique disponible
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Les statistiques CarbuGo seront affichées ici une fois disponibles.
                </Typography>
              </Card>
            )}

          </Stack>
        )}
      </Container>
    </>
  );
}
