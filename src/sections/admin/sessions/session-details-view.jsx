import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Alert,
  Paper,
  alpha,
  Button,
  Dialog,
  Select,
  Divider,
  TableRow,
  MenuItem,
  TextField,
  TableBody,
  TableCell,
  Container,
  TableHead,
  Accordion,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  TableContainer,
  LinearProgress,
  CircularProgress,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fNumber } from 'src/utils/format-number';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  PENDING: 'default',
  OPEN: 'info',
  ACTIVE: 'success',
  CLOSED: 'warning',
  FORCE_CLOSED: 'error',
};

const FUEL_TYPE_COLORS = {
  ESSENCE: 'warning',
  DIESEL: 'info',
  GAZOLE: 'primary',
};

const FILE_STATUS_COLORS = {
  WAITING: 'default',
  IN_SERVICE: 'info',
  SERVED: 'success',
  REFUSED: 'warning',
  EXPIRED: 'error',
};

export default function SessionDetailsView() {
  const { id: sessionId } = useParams();
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Dialogs
  const [closeDialog, setCloseDialog] = useState({ open: false, loading: false });
  const [refreshDialog, setRefreshDialog] = useState({ open: false, loading: false });
  const [resolveDialog, setResolveDialog] = useState({ open: false, loading: false });
  const [capacityDialog, setCapacityDialog] = useState({ open: false, loading: false });
  const [radiusDialog, setRadiusDialog] = useState({ open: false, loading: false });
  const [statusDialog, setStatusDialog] = useState({ open: false, loading: false });
  const [volumeDialog, setVolumeDialog] = useState({ open: false, loading: false });

  // Forms
  const [capacityForm, setCapacityForm] = useState({
    capacityTotal: '',
    capacityRemaining: '',
    radiusKm: '',
  });
  const [radiusForm, setRadiusForm] = useState({ radiusKm: '' });
  const [statusForm, setStatusForm] = useState({ status: '' });
  const [volumeForm, setVolumeForm] = useState({ volumePerService: '' });

  const loadSessionDetails = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getSessionById(sessionId);
      const processed = showApiResponse(result, {
        successTitle: 'Détails chargés',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success && processed.data) {
        setSession(processed.data);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      showError('Erreur', 'Impossible de charger les détails de la session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
    }
  }, [sessionId]);

  const handleCloseSession = async () => {
    setCloseDialog({ open: true, loading: true });
    try {
      const result = await ConsumApi.closeSession(sessionId);
      const processed = showApiResponse(result, {
        successTitle: 'Session fermée',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'La session a été fermée avec succès');
        setCloseDialog({ open: false, loading: false });
        loadSessionDetails();
      }
    } catch (error) {
      console.error('Error closing session:', error);
      showError('Erreur', 'Impossible de fermer la session');
    } finally {
      setCloseDialog({ open: false, loading: false });
    }
  };

  const handleRefreshFile = async () => {
    setRefreshDialog({ open: true, loading: true });
    try {
      const result = await ConsumApi.refreshSessionFile(sessionId);
      const processed = showApiResponse(result, {
        successTitle: 'File rafraîchie',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'La file active a été rafraîchie avec succès');
        setRefreshDialog({ open: false, loading: false });
        loadSessionDetails();
      }
    } catch (error) {
      console.error('Error refreshing file:', error);
      showError('Erreur', 'Impossible de rafraîchir la file active');
    } finally {
      setRefreshDialog({ open: false, loading: false });
    }
  };

  const handleResolveSession = async () => {
    setResolveDialog({ open: true, loading: true });
    try {
      const result = await ConsumApi.resolveSession(sessionId);
      const processed = showApiResponse(result, {
        successTitle: 'Session résolue',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'La session bloquée a été résolue avec succès');
        setResolveDialog({ open: false, loading: false });
        loadSessionDetails();
      }
    } catch (error) {
      console.error('Error resolving session:', error);
      showError('Erreur', 'Impossible de résoudre la session');
    } finally {
      setResolveDialog({ open: false, loading: false });
    }
  };

  const handleUpdateCapacity = async () => {
    if (!capacityForm.capacityTotal || !capacityForm.capacityRemaining || !capacityForm.radiusKm) {
      showError('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setCapacityDialog({ ...capacityDialog, loading: true });
    try {
      const result = await ConsumApi.updateSessionCapacity(sessionId, {
        capacityTotal: parseInt(capacityForm.capacityTotal, 10),
        capacityRemaining: parseInt(capacityForm.capacityRemaining, 10),
        radiusKm: parseInt(capacityForm.radiusKm, 10),
      });
      const processed = showApiResponse(result, {
        successTitle: 'Capacité modifiée',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'La capacité a été modifiée avec succès');
        setCapacityDialog({ open: false, loading: false });
        setCapacityForm({ capacityTotal: '', capacityRemaining: '', radiusKm: '' });
        loadSessionDetails();
      }
    } catch (error) {
      console.error('Error updating capacity:', error);
      showError('Erreur', 'Impossible de modifier la capacité');
    } finally {
      setCapacityDialog({ ...capacityDialog, loading: false });
    }
  };

  const handleUpdateRadius = async () => {
    if (!radiusForm.radiusKm) {
      showError('Erreur', 'Veuillez entrer un rayon');
      return;
    }

    setRadiusDialog({ ...radiusDialog, loading: true });
    try {
      const result = await ConsumApi.updateSessionRadius(sessionId, parseInt(radiusForm.radiusKm, 10));
      const processed = showApiResponse(result, {
        successTitle: 'Rayon modifié',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le rayon a été modifié avec succès');
        setRadiusDialog({ open: false, loading: false });
        setRadiusForm({ radiusKm: '' });
        loadSessionDetails();
      }
    } catch (error) {
      console.error('Error updating radius:', error);
      showError('Erreur', 'Impossible de modifier le rayon');
    } finally {
      setRadiusDialog({ ...radiusDialog, loading: false });
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusForm.status) {
      showError('Erreur', 'Veuillez sélectionner un statut');
      return;
    }

    setStatusDialog({ ...statusDialog, loading: true });
    try {
      const result = await ConsumApi.updateSessionStatus(sessionId, statusForm.status);
      const processed = showApiResponse(result, {
        successTitle: 'Statut modifié',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le statut a été modifié avec succès');
        setStatusDialog({ open: false, loading: false });
        setStatusForm({ status: '' });
        loadSessionDetails();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Erreur', 'Impossible de modifier le statut');
    } finally {
      setStatusDialog({ ...statusDialog, loading: false });
    }
  };

  const handleUpdateVolume = async () => {
    if (!volumeForm.volumePerService) {
      showError('Erreur', 'Veuillez entrer un volume');
      return;
    }

    setVolumeDialog({ ...volumeDialog, loading: true });
    try {
      const result = await ConsumApi.updateSessionVolumePerService(sessionId, parseInt(volumeForm.volumePerService, 10));
      const processed = showApiResponse(result, {
        successTitle: 'Volume modifié',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le volume par service a été modifié avec succès');
        setVolumeDialog({ open: false, loading: false });
        setVolumeForm({ volumePerService: '' });
        loadSessionDetails();
      }
    } catch (error) {
      console.error('Error updating volume:', error);
      showError('Erreur', 'Impossible de modifier le volume');
    } finally {
      setVolumeDialog({ ...volumeDialog, loading: false });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openCapacityDialog = () => {
    if (session) {
      setCapacityForm({
        capacityTotal: session.capacityTotal?.toString() || '',
        capacityRemaining: session.capacityRemaining?.toString() || '',
        radiusKm: session.radiusKm?.toString() || '',
      });
      setCapacityDialog({ open: true, loading: false });
    }
  };

  const openRadiusDialog = () => {
    if (session) {
      setRadiusForm({
        radiusKm: session.radiusKm?.toString() || '',
      });
      setRadiusDialog({ open: true, loading: false });
    }
  };

  const openStatusDialog = () => {
    if (session) {
      setStatusForm({
        status: session.status || '',
      });
      setStatusDialog({ open: true, loading: false });
    }
  };

  const openVolumeDialog = () => {
    if (session) {
      setVolumeForm({
        volumePerService: session.volumePerService?.toString() || '',
      });
      setVolumeDialog({ open: true, loading: false });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error">Session non trouvée</Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title> Détails Session | CarbuGo </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header */}
          <Card
            sx={{
              p: 3,
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Button
                    startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                    onClick={() => router.back()}
                    variant="outlined"
                    size="small"
                  >
                    Retour
                  </Button>
                  <Chip
                    label={`ID: ${session.id.slice(0, 8)}...`}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h4" sx={{ wordBreak: 'break-word' }}>
                    Session de distribution
                  </Typography>
                  <Chip
                    label={session.fuelType}
                    color={FUEL_TYPE_COLORS[session.fuelType] || 'default'}
                    size="medium"
                    icon={<Iconify icon="solar:fuel-bold" width={18} />}
                  />
                  <Chip
                    label={session.status}
                    color={STATUS_COLORS[session.status] || 'default'}
                    size="medium"
                    icon={
                      <Iconify
                        icon={(() => {
                          if (session.status === 'OPEN' || session.status === 'ACTIVE') {
                            return 'solar:check-circle-bold';
                          }
                          if (session.status === 'CLOSED' || session.status === 'FORCE_CLOSED') {
                            return 'solar:close-circle-bold';
                          }
                          return 'solar:clock-circle-bold';
                        })()}
                        width={18}
                      />
                    }
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {session.station?.name || session.stationId} • Détails et historique de la session
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Informations principales */}
          <Grid container spacing={3}>
            {/* Informations de la Session */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Informations de la Session</Typography>
                  <Chip
                    label={session.status}
                    color={STATUS_COLORS[session.status] || 'default'}
                    size="medium"
                  />
                </Box>
                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:fuel-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Type de carburant
                      </Typography>
                    </Box>
                    <Chip
                      label={session.fuelType}
                      color={FUEL_TYPE_COLORS[session.fuelType] || 'default'}
                      size="medium"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  <Divider />

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Iconify icon="solar:cup-bold" width={20} sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Capacité
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {((1 - (session.capacityRemaining || 0) / (session.capacityTotal || 1)) * 100).toFixed(1)}% utilisée
                      </Typography>
                    </Box>
                    <Stack spacing={1}>
                      <LinearProgress
                        variant="determinate"
                        value={(1 - (session.capacityRemaining || 0) / (session.capacityTotal || 1)) * 100}
                        color={(() => {
                          const percentage = (1 - (session.capacityRemaining || 0) / (session.capacityTotal || 1)) * 100;
                          if (percentage > 80) {
                            return 'error';
                          }
                          if (percentage > 50) {
                            return 'warning';
                          }
                          return 'success';
                        })()}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Restant
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {fNumber(session.capacityRemaining || 0)} / {fNumber(session.capacityTotal || 0)} L
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Divider />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Iconify icon="solar:cup-star-bold" width={20} sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Volume/service
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary.main">
                          {fNumber(session.volumePerService || 0)} L
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Iconify icon="solar:map-point-bold" width={20} sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Rayon
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary.main">
                          {session.radiusKm || 0} km
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider />

                  <Grid container spacing={2}>
                    {session.createdAt && (
                      <Grid item xs={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Iconify icon="solar:calendar-bold" width={20} sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Création
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {new Date(session.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(session.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {session.closedAt && (
                      <Grid item xs={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Iconify icon="solar:clock-circle-bold" width={20} sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Fermeture
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {new Date(session.closedAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(session.closedAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Stack>
              </Card>
            </Grid>

            {/* Informations de la Station */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Informations de la Station</Typography>
                  {session.station?.isActive !== undefined && (
                    <Chip
                      label={session.station.isActive ? 'Active' : 'Inactive'}
                      color={session.station.isActive ? 'success' : 'default'}
                      size="medium"
                    />
                  )}
                </Box>
                {session.station ? (
                  <Stack spacing={3}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Iconify icon="solar:shop-bold" width={20} sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Nom de la station
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {session.station.name}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Iconify icon="solar:hashtag-circle-bold" width={20} sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Identifiant
                        </Typography>
                      </Box>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          mt: 0.5,
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                          display: 'inline-block',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                          {session.station.id}
                        </Typography>
                      </Paper>
                    </Box>

                    {session.station.latitude && session.station.longitude && (
                      <>
                        <Divider />
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Iconify icon="solar:map-point-wave-bold" width={20} sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Coordonnées géographiques
                            </Typography>
                          </Box>
                          <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={6}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Latitude
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {session.station.latitude?.toFixed(6)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Longitude
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {session.station.longitude?.toFixed(6)}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </>
                    )}

                    {session.station?.isActive !== undefined && (
                      <>
                        <Divider />
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Iconify icon="solar:shield-check-bold" width={20} sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Statut opérationnel
                            </Typography>
                          </Box>
                          <Chip
                            label={session.station.isActive ? 'Station active' : 'Station inactive'}
                            color={session.station.isActive ? 'success' : 'default'}
                            size="medium"
                            icon={
                              <Iconify
                                icon={session.station.isActive ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                                width={18}
                              />
                            }
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </>
                    )}
                  </Stack>
                ) : (
                  <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" width={24} />}>
                    Informations de station non disponibles pour cette session
                  </Alert>
                )}
              </Card>
            </Grid>
          </Grid>

          {/* Actions */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Iconify icon="solar:widget-5-bold" width={24} />
              <Typography variant="h6">Actions de gestion</Typography>
            </Box>
            <Grid container spacing={2}>
              {/* Actions principales */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                  Actions principales
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
                  {session.status !== 'CLOSED' && session.status !== 'FORCE_CLOSED' && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<Iconify icon="solar:power-bold" />}
                      onClick={handleCloseSession}
                      sx={{
                        minWidth: { xs: '100%', sm: 200 },
                        py: 1.5,
                        boxShadow: 2,
                        '&:hover': { boxShadow: 4 },
                      }}
                    >
                      Fermer la session
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<Iconify icon="solar:refresh-bold" />}
                    onClick={handleRefreshFile}
                    sx={{
                      minWidth: { xs: '100%', sm: 200 },
                      py: 1.5,
                      boxShadow: 2,
                      '&:hover': { boxShadow: 4 },
                    }}
                  >
                    Rafraîchir la file active
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Iconify icon="solar:shield-check-bold" />}
                    onClick={handleResolveSession}
                    sx={{
                      minWidth: { xs: '100%', sm: 200 },
                      py: 1.5,
                      boxShadow: 2,
                      '&:hover': { boxShadow: 4 },
                    }}
                  >
                    Résoudre session bloquée
                  </Button>
                </Stack>
              </Grid>

              {/* Actions de configuration */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                  Modifications de configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<Iconify icon="solar:cup-bold" />}
                      onClick={openCapacityDialog}
                      fullWidth
                      sx={{
                        py: 1.5,
                        justifyContent: 'flex-start',
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                      }}
                    >
                      <Box sx={{ textAlign: 'left', ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Capacité
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Modifier la capacité
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<Iconify icon="solar:map-point-bold" />}
                      onClick={openRadiusDialog}
                      fullWidth
                      sx={{
                        py: 1.5,
                        justifyContent: 'flex-start',
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                      }}
                    >
                      <Box sx={{ textAlign: 'left', ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Rayon
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Modifier le rayon
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<Iconify icon="solar:transfer-horizontal-bold" />}
                      onClick={openStatusDialog}
                      fullWidth
                      sx={{
                        py: 1.5,
                        justifyContent: 'flex-start',
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                      }}
                    >
                      <Box sx={{ textAlign: 'left', ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Statut
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Modifier le statut
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<Iconify icon="solar:cup-star-bold" />}
                      onClick={openVolumeDialog}
                      fullWidth
                      sx={{
                        py: 1.5,
                        justifyContent: 'flex-start',
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                      }}
                    >
                      <Box sx={{ textAlign: 'left', ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Volume/service
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Modifier le volume
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Card>

          {/* Files Actives */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Files Actives ({session.fileActive?.length || session._count?.fileActive || 0})
              </Typography>
              <Button
                size="small"
                onClick={() => router.push(routesName.adminFileActiveBySession.replace(':sessionId', sessionId))}
                startIcon={<Iconify icon="eva:eye-fill" />}
              >
                Voir la file active
              </Button>
            </Box>
            {session.fileActive && session.fileActive.length > 0 ? (
              <TableContainer>
                <Scrollbar>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Utilisateur</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Date d&apos;ajout</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {session.fileActive.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {file.user?.firstName} {file.user?.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>{file.user?.email || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={file.status}
                              color={FILE_STATUS_COLORS[file.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(file.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>
            ) : (
              <Alert severity="info">Aucune file active pour cette session</Alert>
            )}
          </Card>

          {/* Logs */}
          {session.logs && session.logs.length > 0 && (
            <Card sx={{ p: 3 }}>
              <Accordion>
                <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="h6">Logs</Typography>
                    <Chip label={session.logs.length} size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Scrollbar>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Message</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>Rôle acteur</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {session.logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</TableCell>
                              <TableCell>
                                <Chip label={log.type} size="small" color="info" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                  {log.message}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                {log.actorRole || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Scrollbar>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Card>
          )}
        </Stack>
      </Container>

      {/* Close Dialog */}
      <Dialog open={closeDialog.open} onClose={() => setCloseDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Fermer la session</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir fermer cette session ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color="warning"
            onClick={handleCloseSession}
            loading={closeDialog.loading}
          >
            Fermer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Refresh Dialog */}
      <Dialog open={refreshDialog.open} onClose={() => setRefreshDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Rafraîchir la file active</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous forcer le rafraîchissement de la file active pour cette session ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefreshDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color="info"
            onClick={handleRefreshFile}
            loading={refreshDialog.loading}
          >
            Rafraîchir
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog.open} onClose={() => setResolveDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Résoudre la session bloquée</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous résoudre cette session bloquée ? Cette action peut forcer la fermeture ou la réactivation.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color="error"
            onClick={handleResolveSession}
            loading={resolveDialog.loading}
          >
            Résoudre
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Capacity Dialog */}
      <Dialog open={capacityDialog.open} onClose={() => setCapacityDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier la capacité</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Capacité totale (L)"
              value={capacityForm.capacityTotal}
              onChange={(e) => setCapacityForm({ ...capacityForm, capacityTotal: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="number"
              label="Capacité restante (L)"
              value={capacityForm.capacityRemaining}
              onChange={(e) => setCapacityForm({ ...capacityForm, capacityRemaining: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="number"
              label="Rayon (km)"
              value={capacityForm.radiusKm}
              onChange={(e) => setCapacityForm({ ...capacityForm, radiusKm: e.target.value })}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCapacityDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleUpdateCapacity}
            loading={capacityDialog.loading}
            disabled={!capacityForm.capacityTotal || !capacityForm.capacityRemaining || !capacityForm.radiusKm}
          >
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Radius Dialog */}
      <Dialog open={radiusDialog.open} onClose={() => setRadiusDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le rayon</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Rayon (km)"
              value={radiusForm.radiusKm}
              onChange={(e) => setRadiusForm({ ...radiusForm, radiusKm: e.target.value })}
              required
              helperText="Le rayon doit être d&apos;au moins 1 km"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRadiusDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleUpdateRadius}
            loading={radiusDialog.loading}
            disabled={!radiusForm.radiusKm || parseInt(radiusForm.radiusKm, 10) < 1}
          >
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le statut</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Nouveau statut</InputLabel>
              <Select
                value={statusForm.status}
                label="Nouveau statut"
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              >
                <MenuItem value="PENDING">En attente</MenuItem>
                <MenuItem value="OPEN">Ouverte</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="CLOSED">Fermée</MenuItem>
                <MenuItem value="FORCE_CLOSED">Fermée forcément</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info">
              Transitions valides : PENDING → OPEN, CLOSED | OPEN → ACTIVE, CLOSED | ACTIVE → CLOSED, FORCE_CLOSED
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleUpdateStatus}
            loading={statusDialog.loading}
            disabled={!statusForm.status}
          >
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Volume Dialog */}
      <Dialog open={volumeDialog.open} onClose={() => setVolumeDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le volume par service</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Volume par service (L)"
              value={volumeForm.volumePerService}
              onChange={(e) => setVolumeForm({ ...volumeForm, volumePerService: e.target.value })}
              required
              helperText="La session doit être en statut OPEN ou ACTIVE"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVolumeDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleUpdateVolume}
            loading={volumeDialog.loading}
            disabled={!volumeForm.volumePerService}
          >
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

