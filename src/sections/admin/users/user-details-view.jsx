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
  alpha,
  Button,
  Dialog,
  Select,
  Divider,
  TableRow,
  MenuItem,
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
  CircularProgress,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const ROLE_COLORS = {
  SUPERADMIN: 'error',
  ADMIN: 'warning',
  STATION: 'info',
  POMPISTE: 'primary',
  USER: 'default',
};

export default function UserDetailsView() {
  const { id: userId } = useParams();
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [incidents, setIncidents] = useState(null);
  const [passages, setPassages] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [loadingPassages, setLoadingPassages] = useState(false);

  // Dialogs
  const [statusDialog, setStatusDialog] = useState({ open: false, loading: false });
  const [roleDialog, setRoleDialog] = useState({ open: false, newRole: '', loading: false });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getUserProfile(userId);
      const processed = showApiResponse(result, {
        successTitle: 'Profil chargé',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success && processed.data) {
        setProfile(processed.data);
        // Le profil inclut déjà le véhicule, l'utiliser si disponible
        if (processed.data.vehicle) {
          setVehicle(processed.data.vehicle);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const loadIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const result = await ConsumApi.getUserIncidents(userId);
      const processed = showApiResponse(result, {
        successTitle: 'Incidents chargés',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success && processed.data) {
        setIncidents(processed.data);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      showError('Erreur', 'Impossible de charger les incidents');
    } finally {
      setLoadingIncidents(false);
    }
  };

  const loadPassages = async () => {
    setLoadingPassages(true);
    try {
      const result = await ConsumApi.getUserPassages(userId);
      const processed = showApiResponse(result, {
        successTitle: 'Passages chargés',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success && processed.data) {
        setPassages(processed.data);
      }
    } catch (error) {
      console.error('Error loading passages:', error);
      showError('Erreur', 'Impossible de charger les passages');
    } finally {
      setLoadingPassages(false);
    }
  };

  const loadVehicle = async () => {
    setLoadingVehicle(true);
    try {
      const result = await ConsumApi.getUserVehicle(userId);
      if (result.success && result.data) {
        // L'API retourne { user: {...}, vehicle: {...} }
        setVehicle(result.data.vehicle || result.data);
      } else {
        setVehicle(null);
      }
    } catch (error) {
      // 404 is expected if no vehicle
      setVehicle(null);
    } finally {
      setLoadingVehicle(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadIncidents();
      loadPassages();
      loadVehicle();
    }
  }, [userId, loadProfile, loadIncidents, loadPassages, loadVehicle]);

  const handleToggleStatus = async () => {
    if (!profile) return;

    setStatusDialog({ open: true, loading: true });
    try {
      const newStatus = !profile.isSuspended;
      const result = await ConsumApi.updateUserStatus(userId, newStatus);
      const processed = showApiResponse(result, {
        successTitle: 'Statut modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', `Utilisateur ${newStatus ? 'suspendu' : 'réactivé'} avec succès`);
        setStatusDialog({ open: false, loading: false });
        loadProfile();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      showError('Erreur', 'Impossible de modifier le statut de l\'utilisateur');
    } finally {
      setStatusDialog({ open: false, loading: false });
    }
  };

  const handleUpdateRole = async () => {
    if (!profile || !roleDialog.newRole) return;

    setRoleDialog({ ...roleDialog, loading: true });
    try {
      const result = await ConsumApi.updateUserRole(userId, roleDialog.newRole);
      const processed = showApiResponse(result, {
        successTitle: 'Rôle modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le rôle a été modifié avec succès');
        setRoleDialog({ open: false, newRole: '', loading: false });
        loadProfile();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      showError('Erreur', 'Impossible de modifier le rôle de l\'utilisateur');
    } finally {
      setRoleDialog({ open: false, newRole: '', loading: false });
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

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error">Utilisateur non trouvé</Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title> Détails Utilisateur | CarbuGo </title>
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
                    label={`ID: ${profile.id.slice(0, 8)}...`}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h4" sx={{ wordBreak: 'break-word' }}>
                    {profile.firstName} {profile.lastName}
                  </Typography>
                  <Chip
                    label={profile.role}
                    color={ROLE_COLORS[profile.role] || 'default'}
                    size="medium"
                    icon={<Iconify icon="solar:user-id-bold" width={18} />}
                  />
                  <Chip
                    label={profile.isSuspended ? 'Suspendu' : 'Actif'}
                    color={profile.isSuspended ? 'error' : 'success'}
                    size="medium"
                    icon={
                      <Iconify
                        icon={profile.isSuspended ? 'solar:user-block-bold' : 'solar:user-check-bold'}
                        width={18}
                      />
                    }
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Profil complet et historique de l&apos;utilisateur
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Informations principales */}
          <Grid container spacing={3}>
            {/* Informations Personnelles */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Informations Personnelles
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:user-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Nom complet
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {profile.firstName} {profile.lastName}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:letter-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Email
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {profile.email}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:phone-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Téléphone
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {profile.phone}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:user-id-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Rôle
                      </Typography>
                    </Box>
                    <Chip
                      label={profile.role}
                      color={ROLE_COLORS[profile.role] || 'default'}
                      size="medium"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  {profile.createdAt && (
                    <>
                      <Divider />
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Iconify icon="solar:calendar-bold" width={20} sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Date de création
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                          {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(profile.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </Card>
            </Grid>

            {/* Statistiques */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Statistiques
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:calendar-mark-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Passages hebdomadaires
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="primary.main">
                      {profile.weeklyPassages || 0}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:clock-circle-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Dernier passage
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {profile.lastPassageDate ? formatDate(profile.lastPassageDate) : 'Aucun passage enregistré'}
                    </Typography>
                  </Box>

                  {passages && passages.statistics && (
                    <>
                      <Divider />
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Iconify icon="solar:graph-up-bold" width={20} sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Total passages
                          </Typography>
                        </Box>
                        <Typography variant="h4" color="primary.main">
                          {passages.statistics.totalPassages || 0}
                        </Typography>
                      </Box>

                      <Divider />

                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Iconify icon="solar:check-circle-bold" width={16} sx={{ color: 'success.main' }} />
                              <Typography variant="caption" color="text.secondary">
                                Servis
                              </Typography>
                            </Box>
                            <Typography variant="h6" color="success.main">
                              {passages.statistics.servedPassages || 0}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Iconify icon="solar:close-circle-bold" width={16} sx={{ color: 'warning.main' }} />
                              <Typography variant="caption" color="text.secondary">
                                Refusés
                              </Typography>
                            </Box>
                            <Typography variant="h6" color="warning.main">
                              {passages.statistics.refusedPassages || 0}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Iconify icon="solar:danger-triangle-bold" width={16} sx={{ color: 'error.main' }} />
                              <Typography variant="caption" color="text.secondary">
                                Expirés
                              </Typography>
                            </Box>
                            <Typography variant="h6" color="error.main">
                              {passages.statistics.expiredPassages || 0}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </>
                  )}
                </Stack>
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
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant={profile.isSuspended ? 'contained' : 'outlined'}
                  color={profile.isSuspended ? 'success' : 'warning'}
                  startIcon={<Iconify icon={profile.isSuspended ? 'solar:user-check-bold' : 'solar:user-block-bold'} />}
                  onClick={handleToggleStatus}
                  fullWidth
                  sx={{
                    py: 1.5,
                    justifyContent: 'flex-start',
                    borderWidth: profile.isSuspended ? 0 : 2,
                    '&:hover': { borderWidth: profile.isSuspended ? 0 : 2 },
                  }}
                >
                  <Box sx={{ textAlign: 'left', ml: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {profile.isSuspended ? 'Réactiver' : 'Suspendre'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {profile.isSuspended ? 'Réactiver l\'utilisateur' : 'Suspendre l\'utilisateur'}
                    </Typography>
                  </Box>
                </Button>
              </Grid>
              {profile.role !== 'SUPERADMIN' && (
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={<Iconify icon="solar:user-id-bold" />}
                    onClick={() => setRoleDialog({ open: true, newRole: profile.role, loading: false })}
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
                        Modifier le rôle
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Changer le rôle de l&apos;utilisateur
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              )}
            </Grid>
          </Card>

          {/* Véhicule */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Véhicule</Typography>
              <Button
                size="small"
                onClick={loadVehicle}
                startIcon={<Iconify icon="eva:refresh-fill" />}
                disabled={loadingVehicle}
              >
                Actualiser
              </Button>
            </Box>
            {(() => {
              if (loadingVehicle) {
                return (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                );
              }
              if (vehicle) {
                return (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:fuel-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Type de carburant
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {vehicle.fuelType || '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:car-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Marque
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {vehicle.brand || '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:car-side-view-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Modèle
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {vehicle.model || '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:card-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Plaque d&apos;immatriculation
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {vehicle.plate || '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify icon="solar:fuel-tank-bold" width={20} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Capacité du réservoir
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {vehicle.capacityLiters ? `${vehicle.capacityLiters} L` : '-'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
                );
              }
              return <Alert severity="info">Aucun véhicule associé à cet utilisateur</Alert>;
            })()}
          </Card>

          {/* Incidents */}
          <Card sx={{ p: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h6">Incidents</Typography>
                  {incidents && (
                    <Chip
                      label={incidents.incidentsCount || 0}
                      color={incidents.incidentsCount > 0 ? 'error' : 'default'}
                      size="small"
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {(() => {
                  if (loadingIncidents) {
                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    );
                  }
                  if (incidents && incidents.incidents && incidents.incidents.length > 0) {
                    return (
                  <TableContainer>
                    <Scrollbar>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Date</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Type</TableCell>
                            <TableCell>Description</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {incidents.incidents.map((incident) => (
                            <TableRow key={incident.id}>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(incident.createdAt)}</TableCell>
                              <TableCell>
                                <Chip label={incident.type} size="small" color="error" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                  {incident.description || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Scrollbar>
                  </TableContainer>
                    );
                  }
                  return <Alert severity="info">Aucun incident enregistré</Alert>;
                })()}
              </AccordionDetails>
            </Accordion>
          </Card>

          {/* Historique des passages */}
          <Card sx={{ p: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h6">Historique des Passages</Typography>
                  {passages && passages.statistics && (
                    <Chip label={passages.statistics.totalPassages || 0} size="small" />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {(() => {
                  if (loadingPassages) {
                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    );
                  }
                  if (passages && passages.passages && passages.passages.length > 0) {
                    return (
                  <TableContainer>
                    <Scrollbar>
                      <Table size="small" sx={{ minWidth: 600 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Date</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>Station</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, whiteSpace: 'nowrap' }}>Type de carburant</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Statut</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Volume</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {passages.passages.map((passage) => (
                            <TableRow key={passage.id}>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(passage.createdAt)}</TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                  {passage.stationName || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                {passage.fuelType || '-'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={passage.status || '-'}
                                  size="small"
                                  color={(() => {
                                    if (passage.status === 'SERVED') {
                                      return 'success';
                                    }
                                    if (passage.status === 'REFUSED') {
                                      return 'warning';
                                    }
                                    if (passage.status === 'EXPIRED') {
                                      return 'error';
                                    }
                                    return 'default';
                                  })()}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{passage.volume || '-'} L</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Scrollbar>
                                  </TableContainer>
                    );
                  }
                  return <Alert severity="info">Aucun passage enregistré</Alert>;
                })()}
              </AccordionDetails>
            </Accordion>
          </Card>
        </Stack>
      </Container>

      {/* Status Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {profile?.isSuspended ? 'Réactiver' : 'Suspendre'} l&apos;utilisateur
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir {profile?.isSuspended ? 'réactiver' : 'suspendre'} l&apos;utilisateur{' '}
            <strong>
              {profile?.firstName} {profile?.lastName}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color={profile?.isSuspended ? 'success' : 'warning'}
            onClick={handleToggleStatus}
            loading={statusDialog.loading}
          >
            {profile?.isSuspended ? 'Réactiver' : 'Suspendre'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialog.open} onClose={() => setRoleDialog({ open: false, newRole: '', loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le rôle</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Alert severity="info">
              Modifier le rôle de <strong>{profile?.firstName} {profile?.lastName}</strong>
            </Alert>
            <FormControl fullWidth>
              <InputLabel>Nouveau rôle</InputLabel>
              <Select
                value={roleDialog.newRole}
                label="Nouveau rôle"
                onChange={(e) => setRoleDialog({ ...roleDialog, newRole: e.target.value })}
              >
                <MenuItem value="USER">Utilisateur</MenuItem>
                <MenuItem value="POMPISTE">Pompiste</MenuItem>
                <MenuItem value="STATION">Station</MenuItem>
                <MenuItem value="ADMIN">Administrateur</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="warning">
              Attention : Impossible de modifier le rôle d&apos;un Super Admin ou de créer un Super Admin.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog({ open: false, newRole: '', loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleUpdateRole}
            loading={roleDialog.loading}
            disabled={!roleDialog.newRole || roleDialog.newRole === profile?.role}
          >
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

