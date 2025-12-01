import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { TabList, TabPanel, TabContext, LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Grid,
  Chip,
  Stack,
  Alert,
  Paper,
  Table,
  Select,
  Divider,
  MenuItem,
  TableRow,
  TextField,
  Container,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputLabel,
  FormControl,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fNumber } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ReportsView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();
  
  const [currentTab, setCurrentTab] = useState('occupation');
  const [loading, setLoading] = useState(false);

  // Data states
  const [activeFilesOccupation, setActiveFilesOccupation] = useState(null);
  const [averageServiceTime, setAverageServiceTime] = useState(null);
  const [litersDistribution, setLitersDistribution] = useState(null);
  const [litersPeriod, setLitersPeriod] = useState('day');
  const [mostActiveStations, setMostActiveStations] = useState(null);
  const [mostActiveStationsLimit, setMostActiveStationsLimit] = useState(10);
  const [refusalExpirationRates, setRefusalExpirationRates] = useState(null);
  const [totalPassages, setTotalPassages] = useState(null);
  const [passagesPeriod, setPassagesPeriod] = useState('day');
  const [userGrowth, setUserGrowth] = useState(null);

  // Export form
  const [exportForm, setExportForm] = useState({
    reportType: 'NATIONAL',
    format: 'CSV',
    stationId: '',
    startDate: '',
    endDate: '',
  });
  const [exportLoading, setExportLoading] = useState(false);

  const loadActiveFilesOccupation = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getReportsActiveFilesOccupation();
      const processed = showApiResponse(result, {
        successTitle: 'Données chargées',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success) {
        setActiveFilesOccupation(processed.data);
      }
    } catch (error) {
      console.error('Error loading active files occupation:', error);
      showError('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadAverageServiceTime = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getReportsAverageServiceTime();
      const processed = showApiResponse(result, {
        successTitle: 'Données chargées',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success) {
        setAverageServiceTime(processed.data);
      }
    } catch (error) {
      console.error('Error loading average service time:', error);
      showError('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadLitersDistribution = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getReportsLitersDistribution(litersPeriod);
      const processed = showApiResponse(result, {
        successTitle: 'Données chargées',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success) {
        setLitersDistribution(processed.data);
      }
    } catch (error) {
      console.error('Error loading liters distribution:', error);
      showError('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadMostActiveStations = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getReportsMostActiveStations(mostActiveStationsLimit);
      const processed = showApiResponse(result, {
        successTitle: 'Données chargées',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success) {
        setMostActiveStations(processed.data);
      }
    } catch (error) {
      console.error('Error loading most active stations:', error);
      showError('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadRefusalExpirationRates = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getReportsRefusalExpirationRates();
      const processed = showApiResponse(result, {
        successTitle: 'Données chargées',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success) {
        setRefusalExpirationRates(processed.data);
      }
    } catch (error) {
      console.error('Error loading refusal expiration rates:', error);
      showError('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadTotalPassages = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getReportsTotalPassages(passagesPeriod);
      const processed = showApiResponse(result, {
        successTitle: 'Données chargées',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success) {
        setTotalPassages(processed.data);
      }
    } catch (error) {
      console.error('Error loading total passages:', error);
      showError('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadUserGrowth = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getReportsUserGrowth();
      const processed = showApiResponse(result, {
        successTitle: 'Données chargées',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success) {
        setUserGrowth(processed.data);
      }
    } catch (error) {
      console.error('Error loading user growth:', error);
      showError('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (exportForm.reportType === 'STATION' && !exportForm.stationId) {
      showError('Erreur', 'L\'ID de la station est requis pour un rapport STATION');
      return;
    }

    setExportLoading(true);
    try {
      const result = await ConsumApi.exportReports({
        reportType: exportForm.reportType,
        format: exportForm.format,
        stationId: exportForm.stationId || null,
        startDate: exportForm.startDate || null,
        endDate: exportForm.endDate || null,
      });

      if (result.success && result.blob) {
        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Déterminer l'extension du fichier
        const extension = exportForm.format.toLowerCase();
        const filename = `rapport_${exportForm.reportType.toLowerCase()}_${Date.now()}.${extension}`;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSuccess('Succès', 'Rapport exporté avec succès');
      } else {
        showApiResponse(result, {
          errorTitle: 'Erreur d\'export',
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      showError('Erreur', 'Impossible d\'exporter le rapport');
    } finally {
      setExportLoading(false);
    }
  };



  const renderOccupationSection = () => {
    const sessions = activeFilesOccupation?.activeSessions || [];
    const totalSessions = activeFilesOccupation?.totalActiveSessions || 0;

    return (
      <Stack spacing={3}>
        <Alert severity="info">
          Consultez l&apos;occupation des files actives en temps réel.
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Occupation des Files Actives</Typography>
              <LoadingButton
                variant="contained"
                onClick={loadActiveFilesOccupation}
                loading={loading}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Charger
              </LoadingButton>
            </Box>
            <Divider />

            {activeFilesOccupation ? (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total des sessions actives: <strong>{totalSessions}</strong>
                  </Typography>
                </Box>

                {sessions.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Station</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Utilisateurs Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>En Service</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>En Attente</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Taux d&apos;Occupation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sessions.map((session) => (
                          <TableRow key={session.sessionId}>
                            <TableCell>
                              <Typography variant="subtitle2">{session.stationName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {session.stationId}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{fNumber(session.totalUsers)}</TableCell>
                            <TableCell align="right">
                              <Chip label={fNumber(session.inService)} color="success" size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <Chip label={fNumber(session.waiting)} color="warning" size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${fNumber(session.occupationRate)}%`}
                                color={(() => {
                                  if (session.occupationRate > 80) return 'error';
                                  if (session.occupationRate > 50) return 'warning';
                                  return 'success';
                                })()}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    Aucune session active
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography color="text.secondary">Cliquez sur &quot;Charger&quot; pour afficher les données</Typography>
            )}
          </Stack>
        </Card>
      </Stack>
    );
  };

  const renderAverageServiceTimeSection = () => {
    const data = averageServiceTime;

    return (
      <Stack spacing={3}>
        <Alert severity="info">
          Consultez le temps moyen de service par pompiste.
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Temps Moyen de Service</Typography>
              <LoadingButton
                variant="contained"
                onClick={loadAverageServiceTime}
                loading={loading}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Charger
              </LoadingButton>
            </Box>
            <Divider />

            {data ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                    <Typography variant="h4" color="primary.main">
                      {data.averageServiceTimeMinutes ? fNumber(Math.round(data.averageServiceTimeMinutes)) : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Minutes
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.lighter' }}>
                    <Typography variant="h4" color="info.main">
                      {data.averageServiceTimeHours ? fNumber(data.averageServiceTimeHours.toFixed(2)) : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Heures
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter' }}>
                    <Typography variant="h4" color="success.main">
                      {data.sessionsAnalyzed || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sessions Analysées
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary">Cliquez sur &quot;Charger&quot; pour afficher les données</Typography>
            )}
          </Stack>
        </Card>
      </Stack>
    );
  };

  const renderLitersDistributionSection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Consultez la distribution des litres par jour, semaine ou mois.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Distribution des Litres</Typography>
            <LoadingButton
              variant="contained"
              onClick={loadLitersDistribution}
              loading={loading}
              startIcon={<Iconify icon="eva:refresh-outline" />}
            >
              Charger
            </LoadingButton>
          </Box>
          <Divider />
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Période</InputLabel>
                <Select
                  value={litersPeriod}
                  label="Période"
                  onChange={(e) => setLitersPeriod(e.target.value)}
                >
                  <MenuItem value="day">Jour</MenuItem>
                  <MenuItem value="week">Semaine</MenuItem>
                  <MenuItem value="month">Mois</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {litersDistribution ? (
            <Stack spacing={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                    <Typography variant="h4" color="primary.main">
                      {fNumber(litersDistribution.totalLiters || 0)} L
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Litres Distribués
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.lighter' }}>
                    <Typography variant="h4" color="info.main">
                      {fNumber(litersDistribution.sessionsCount || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nombre de Sessions
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Période: {new Date(litersDistribution.startDate).toLocaleDateString('fr-FR')} - {new Date(litersDistribution.endDate).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">Cliquez sur &quot;Charger&quot; pour afficher les données</Typography>
          )}
        </Stack>
      </Card>
    </Stack>
  );

  const renderMostActiveStationsSection = () => {
    const stations = mostActiveStations?.stations || [];
    const period = mostActiveStations?.period || '';

    return (
      <Stack spacing={3}>
        <Alert severity="info">
          Consultez les stations les plus actives du système.
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Stations les Plus Actives</Typography>
              <LoadingButton
                variant="contained"
                onClick={loadMostActiveStations}
                loading={loading}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Charger
              </LoadingButton>
            </Box>
            <Divider />
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Nombre de stations"
                  type="number"
                  value={mostActiveStationsLimit}
                  onChange={(e) => setMostActiveStationsLimit(parseInt(e.target.value, 10) || 10)}
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                />
              </Grid>
              {period && (
                <Grid item xs={12} md={8}>
                  <Typography variant="body2" color="text.secondary">
                    Période: <strong>{period}</strong>
                  </Typography>
                </Grid>
              )}
            </Grid>

            {(() => {
              if (!mostActiveStations) {
                return <Typography color="text.secondary">Cliquez sur &quot;Charger&quot; pour afficher les données</Typography>;
              }
              if (stations.length === 0) {
                return (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    Aucune station active
                  </Typography>
                );
              }
              return (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Station</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Sessions</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Litres Distribués</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Sessions</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pompistes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stations.map((station) => (
                        <TableRow key={station.stationId}>
                          <TableCell>
                            <Typography variant="subtitle2">{station.stationName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {station.stationId}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{fNumber(station.sessionsCount)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${fNumber(station.litersDistributed)} L`}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{fNumber(station.totalSessions)}</TableCell>
                          <TableCell align="right">{fNumber(station.pompistesCount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </Stack>
        </Card>
      </Stack>
    );
  };

  const renderRefusalExpirationRatesSection = () => {
    const rates = refusalExpirationRates?.rates || [];

    return (
      <Stack spacing={3}>
        <Alert severity="info">
          Consultez les taux de refus et d&apos;expiration par station.
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Taux de Refus / Expiration</Typography>
              <LoadingButton
                variant="contained"
                onClick={loadRefusalExpirationRates}
                loading={loading}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Charger
              </LoadingButton>
            </Box>
            <Divider />

            {(() => {
              if (!refusalExpirationRates) {
                return <Typography color="text.secondary">Cliquez sur &quot;Charger&quot; pour afficher les données</Typography>;
              }
              if (rates.length === 0) {
                return (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    Aucune donnée disponible
                  </Typography>
                );
              }
              return (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Station</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Files Actives</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Refusés</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Expirés</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Taux Refus</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Taux Expiration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rates.map((rate) => (
                        <TableRow key={rate.stationId}>
                          <TableCell>
                            <Typography variant="subtitle2">{rate.stationName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {rate.stationId}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{fNumber(rate.totalFileActives)}</TableCell>
                          <TableCell align="right">
                            <Chip label={fNumber(rate.refusedCount)} color="error" size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={fNumber(rate.expiredCount)} color="warning" size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${fNumber(rate.refusalRate)}%`}
                              color={rate.refusalRate > 10 ? 'error' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${fNumber(rate.expirationRate)}%`}
                              color={(() => {
                                if (rate.expirationRate > 50) return 'error';
                                if (rate.expirationRate > 25) return 'warning';
                                return 'default';
                              })()}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </Stack>
        </Card>
      </Stack>
    );
  };

  const renderTotalPassagesSection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Consultez le nombre total de passages par jour ou par semaine.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Total des Passages</Typography>
            <LoadingButton
              variant="contained"
              onClick={loadTotalPassages}
              loading={loading}
              startIcon={<Iconify icon="eva:refresh-outline" />}
            >
              Charger
            </LoadingButton>
          </Box>
          <Divider />
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Période</InputLabel>
                <Select
                  value={passagesPeriod}
                  label="Période"
                  onChange={(e) => setPassagesPeriod(e.target.value)}
                >
                  <MenuItem value="day">Jour</MenuItem>
                  <MenuItem value="week">Semaine</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {totalPassages ? (
            <Stack spacing={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter' }}>
                    <Typography variant="h4" color="success.main">
                      {fNumber(totalPassages.totalPassages || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Passages
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Période: {new Date(totalPassages.startDate).toLocaleDateString('fr-FR')} - {new Date(totalPassages.endDate).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
              {totalPassages.dailyBreakdown && totalPassages.dailyBreakdown.length > 0 && (
                <>
                  <Typography variant="subtitle2">Répartition quotidienne</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Nombre de Passages</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {totalPassages.dailyBreakdown.map((day, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(day.date).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell align="right">{fNumber(day.count || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Stack>
          ) : (
            <Typography color="text.secondary">Cliquez sur &quot;Charger&quot; pour afficher les données</Typography>
          )}
        </Stack>
      </Card>
    </Stack>
  );

  const renderUserGrowthSection = () => {
    const data = userGrowth;
    const dailyGrowth = data?.dailyGrowth || [];

    return (
      <Stack spacing={3}>
        <Alert severity="info">
          Consultez la croissance du nombre d&apos;utilisateurs.
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Croissance des Utilisateurs</Typography>
              <LoadingButton
                variant="contained"
                onClick={loadUserGrowth}
                loading={loading}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Charger
              </LoadingButton>
            </Box>
            <Divider />

            {data ? (
              <Stack spacing={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                      <Typography variant="h4" color="primary.main">
                        {fNumber(data.totalUsers || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Utilisateurs
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter' }}>
                      <Typography variant="h4" color="success.main">
                        {fNumber(data.newUsersLast30Days || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nouveaux (30 jours)
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.lighter' }}>
                      <Typography variant="h4" color="info.main">
                        {fNumber(data.growthRate || 0)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Taux de Croissance
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {dailyGrowth.length > 0 && (
                  <>
                    <Typography variant="subtitle2">Croissance quotidienne ({data.period})</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>STATION</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>USER</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>ADMIN</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>SUPERADMIN</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dailyGrowth.map((day, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(day.date).toLocaleDateString('fr-FR')}</TableCell>
                              <TableCell align="right">
                                <Chip label={fNumber(day.total)} color="primary" size="small" />
                              </TableCell>
                              <TableCell align="right">{fNumber(day.byRole?.STATION || 0)}</TableCell>
                              <TableCell align="right">{fNumber(day.byRole?.USER || 0)}</TableCell>
                              <TableCell align="right">{fNumber(day.byRole?.ADMIN || 0)}</TableCell>
                              <TableCell align="right">{fNumber(day.byRole?.SUPERADMIN || 0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </Stack>
            ) : (
              <Typography color="text.secondary">Cliquez sur &quot;Charger&quot; pour afficher les données</Typography>
            )}
          </Stack>
        </Card>
      </Stack>
    );
  };

  const renderExportSection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Exportez des rapports détaillés au format CSV, Excel ou PDF.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Export de Rapports</Typography>
          <Divider />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type de rapport</InputLabel>
                <Select
                  value={exportForm.reportType}
                  label="Type de rapport"
                  onChange={(e) => setExportForm({ ...exportForm, reportType: e.target.value, stationId: e.target.value === 'STATION' ? exportForm.stationId : '' })}
                >
                  <MenuItem value="NATIONAL">National</MenuItem>
                  <MenuItem value="STATION">Par Station</MenuItem>
                  <MenuItem value="AUDIT">Audit</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={exportForm.format}
                  label="Format"
                  onChange={(e) => setExportForm({ ...exportForm, format: e.target.value })}
                >
                  <MenuItem value="CSV">CSV</MenuItem>
                  <MenuItem value="EXCEL">Excel</MenuItem>
                  <MenuItem value="PDF">PDF</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {exportForm.reportType === 'STATION' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ID de la Station"
                  value={exportForm.stationId}
                  onChange={(e) => setExportForm({ ...exportForm, stationId: e.target.value })}
                  required
                  helperText="Requis pour les rapports par station"
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date de début"
                value={exportForm.startDate}
                onChange={(e) => setExportForm({ ...exportForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date de fin"
                value={exportForm.endDate}
                onChange={(e) => setExportForm({ ...exportForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <LoadingButton
              variant="contained"
              onClick={handleExport}
              loading={exportLoading}
              startIcon={<Iconify icon="eva:download-outline" />}
            >
              Exporter
            </LoadingButton>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <>
      <Helmet>
        <title> Rapports & Statistiques | CarbuGo </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Rapports & Statistiques</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Consultez les statistiques et exportez des rapports détaillés
            </Typography>
          </Box>

          <Card>
            <TabContext value={currentTab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                  onChange={(event, newValue) => setCurrentTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab
                    label="Occupation Files"
                    value="occupation"
                    icon={<Iconify icon="solar:users-group-rounded-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Temps Service"
                    value="service-time"
                    icon={<Iconify icon="solar:clock-circle-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Distribution Litres"
                    value="liters"
                    icon={<Iconify icon="solar:fuel-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Stations Actives"
                    value="stations"
                    icon={<Iconify icon="solar:shop-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Taux Refus/Expiration"
                    value="refusal"
                    icon={<Iconify icon="solar:close-circle-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Total Passages"
                    value="passages"
                    icon={<Iconify icon="solar:user-check-rounded-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Croissance Utilisateurs"
                    value="growth"
                    icon={<Iconify icon="solar:graph-up-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Export"
                    value="export"
                    icon={<Iconify icon="solar:document-download-bold" />}
                    iconPosition="start"
                  />
                </TabList>
              </Box>

              <Box sx={{ p: 3 }}>
                <TabPanel value="occupation" sx={{ p: 0 }}>
                  {renderOccupationSection()}
                </TabPanel>
                <TabPanel value="service-time" sx={{ p: 0 }}>
                  {renderAverageServiceTimeSection()}
                </TabPanel>
                <TabPanel value="liters" sx={{ p: 0 }}>
                  {renderLitersDistributionSection()}
                </TabPanel>
                <TabPanel value="stations" sx={{ p: 0 }}>
                  {renderMostActiveStationsSection()}
                </TabPanel>
                <TabPanel value="refusal" sx={{ p: 0 }}>
                  {renderRefusalExpirationRatesSection()}
                </TabPanel>
                <TabPanel value="passages" sx={{ p: 0 }}>
                  {renderTotalPassagesSection()}
                </TabPanel>
                <TabPanel value="growth" sx={{ p: 0 }}>
                  {renderUserGrowthSection()}
                </TabPanel>
                <TabPanel value="export" sx={{ p: 0 }}>
                  {renderExportSection()}
                </TabPanel>
              </Box>
            </TabContext>
          </Card>
        </Stack>
      </Container>
    </>
  );
}

