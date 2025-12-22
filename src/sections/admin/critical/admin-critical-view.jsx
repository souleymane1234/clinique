import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { TabList , TabPanel, TabContext, LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Grid,
  Chip,
  Alert,
  Stack,
  alpha,
  Table,
  Button,
  Dialog,
  Divider,
  Tooltip,
  TableRow,
  TextField,
  Container,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  AlertTitle,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
  CircularProgress,
} from '@mui/material';

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

export default function AdminCriticalView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();
  
  const [currentTab, setCurrentTab] = useState('kill-switch');
  const [loading, setLoading] = useState(false);

  // Data states
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [pompistes, setPompistes] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingPompistes, setLoadingPompistes] = useState(false);

  // Pagination
  const [usersPage, setUsersPage] = useState(0);
  const [stationsPage, setStationsPage] = useState(0);
  const [pompistesPage, setPompistesPage] = useState(0);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);
  const [stationsRowsPerPage, setStationsRowsPerPage] = useState(10);
  const [pompistesRowsPerPage, setPompistesRowsPerPage] = useState(10);

  // Kill Switch Dialog
  const [killSwitchDialog, setKillSwitchDialog] = useState(false);

  // Pompiste Actions Dialogs
  const [pompisteReassignDialog, setPompisteReassignDialog] = useState({ 
    open: false, 
    pompisteId: '', 
    newStationId: '' 
  });

  // Session Actions Dialogs
  const [sessionReservoirDialog, setSessionReservoirDialog] = useState({ 
    open: false, 
    sessionId: '', 
    correctedCapacity: '' 
  });
  const [sessionServedDialog, setSessionServedDialog] = useState({ 
    open: false, 
    sessionId: '', 
    correctedCapacity: '' 
  });

  const handleKillSwitch = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.activateKillSwitch();
      showApiResponse(result, {
        successTitle: 'Kill Switch activé',
        errorTitle: 'Erreur',
      });
      if (result.success) {
        setKillSwitchDialog(false);
      }
    } catch (error) {
      showError('Erreur', 'Impossible d\'activer le kill switch');
    } finally {
      setLoading(false);
    }
  };

  // Load data functions
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await ConsumApi.getUsers();
      if (result.success) {
        setUsers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadStations = async () => {
    setLoadingStations(true);
    try {
      const result = await ConsumApi.getStations();
      if (result.success) {
        setStations(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('Error loading stations:', error);
      showError('Erreur', 'Impossible de charger les stations');
    } finally {
      setLoadingStations(false);
    }
  };

  const loadPompistes = async () => {
    setLoadingPompistes(true);
    try {
      const stationsResult = await ConsumApi.getStations();
      if (stationsResult.success) {
        const allPompistes = [];
        const stationsData = Array.isArray(stationsResult.data) ? stationsResult.data : [];
        
        // Utiliser Promise.all pour éviter await dans une boucle
        const stationDetailsPromises = stationsData.map(async (station) => {
          try {
            const stationDetailsResult = await ConsumApi.getStationById(station.id);
            if (stationDetailsResult.success && stationDetailsResult.data?.pompistes) {
              const stationPompistes = Array.isArray(stationDetailsResult.data.pompistes) 
                ? stationDetailsResult.data.pompistes 
                : [];
              return stationPompistes.map((pompiste) => ({
                ...pompiste,
                stationId: station.id,
                stationName: station.name,
              }));
            }
            return [];
          } catch (err) {
            console.error(`Error loading pompistes for station ${station.id}:`, err);
            return [];
          }
        });
        
        const results = await Promise.all(stationDetailsPromises);
        results.forEach((stationPompistes) => {
          allPompistes.push(...stationPompistes);
        });
        
        setPompistes(allPompistes);
      }
    } catch (error) {
      console.error('Error loading pompistes:', error);
      showError('Erreur', 'Impossible de charger les pompistes');
    } finally {
      setLoadingPompistes(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'users') {
      loadUsers();
    } else if (currentTab === 'stations') {
      loadStations();
    } else if (currentTab === 'pompistes') {
      loadPompistes();
    }
    // Les fonctions load* sont stables et utilisent uniquement des setters
  }, [currentTab]);

  const handleBanUser = async (userId) => {
    setLoading(true);
    try {
      const result = await ConsumApi.banUser(userId);
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateur banni',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'L\'utilisateur a été banni avec succès');
        loadUsers();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de bannir l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setLoading(true);
    try {
      const result = await ConsumApi.deleteUserPermanent(userId);
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateur supprimé',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'L\'utilisateur a été supprimé avec succès');
        loadUsers();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de supprimer l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleResetUserPassages = async (userId) => {
    setLoading(true);
    try {
      const result = await ConsumApi.resetUserPassages(userId);
      const processed = showApiResponse(result, {
        successTitle: 'Passages réinitialisés',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'Les passages ont été réinitialisés avec succès');
        loadUsers();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de réinitialiser les passages');
    } finally {
      setLoading(false);
    }
  };

  const handleBanStation = async (stationId) => {
    setLoading(true);
    try {
      const result = await ConsumApi.banStation(stationId);
      const processed = showApiResponse(result, {
        successTitle: 'Station bannie',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'La station a été bannie avec succès');
        loadStations();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de bannir la station');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStation = async (stationId) => {
    setLoading(true);
    try {
      const result = await ConsumApi.deleteStationPermanent(stationId);
      const processed = showApiResponse(result, {
        successTitle: 'Station supprimée',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'La station a été supprimée avec succès');
        loadStations();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de supprimer la station');
    } finally {
      setLoading(false);
    }
  };

  const handleBanPompiste = async (pompisteId) => {
    setLoading(true);
    try {
      const result = await ConsumApi.banPompiste(pompisteId);
      const processed = showApiResponse(result, {
        successTitle: 'Pompiste banni',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le pompiste a été banni avec succès');
        loadPompistes();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de bannir le pompiste');
    } finally {
      setLoading(false);
    }
  };

  const handleReassignPompiste = async () => {
    if (!pompisteReassignDialog.pompisteId.trim() || !pompisteReassignDialog.newStationId.trim()) {
      showError('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const result = await ConsumApi.reassignPompiste(
        pompisteReassignDialog.pompisteId,
        pompisteReassignDialog.newStationId
      );
      showApiResponse(result, {
        successTitle: 'Pompiste réassigné',
        errorTitle: 'Erreur',
      });
      if (result.success) {
        setPompisteReassignDialog({ open: false, pompisteId: '', newStationId: '' });
      }
    } catch (error) {
      showError('Erreur', 'Impossible de réassigner le pompiste');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectReservoir = async () => {
    if (!sessionReservoirDialog.sessionId.trim() || !sessionReservoirDialog.correctedCapacity) {
      showError('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const result = await ConsumApi.correctReservoir(
        sessionReservoirDialog.sessionId,
        Number(sessionReservoirDialog.correctedCapacity)
      );
      showApiResponse(result, {
        successTitle: 'Réservoir corrigé',
        errorTitle: 'Erreur',
      });
      if (result.success) {
        setSessionReservoirDialog({ open: false, sessionId: '', correctedCapacity: '' });
      }
    } catch (error) {
      showError('Erreur', 'Impossible de corriger le réservoir');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectServed = async () => {
    if (!sessionServedDialog.sessionId.trim() || !sessionServedDialog.correctedCapacity) {
      showError('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const result = await ConsumApi.correctServedCapacity(
        sessionServedDialog.sessionId,
        Number(sessionServedDialog.correctedCapacity)
      );
      showApiResponse(result, {
        successTitle: 'Capacité servie corrigée',
        errorTitle: 'Erreur',
      });
      if (result.success) {
        setSessionServedDialog({ open: false, sessionId: '', correctedCapacity: '' });
      }
    } catch (error) {
      showError('Erreur', 'Impossible de corriger la capacité servie');
    } finally {
      setLoading(false);
    }
  };

  const renderKillSwitchSection = () => (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Iconify icon="solar:power-bold" width={24} sx={{ color: 'primary.main' }} />
            <Typography variant="h6">
              Kill Switch - Blocage Système d&apos;Urgence
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            ACTION CRITIQUE : Ferme toutes les sessions, désactive toutes les stations, suspend tous les utilisateurs (sauf Super Admin)
          </Typography>
        </Box>

        <Divider />

        <Alert severity="warning" icon={<Iconify icon="solar:danger-triangle-bold" width={24} />}>
          <AlertTitle>Attention</AlertTitle>
          Cette action est irréversible et affectera tous les utilisateurs du système.
        </Alert>

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<Iconify icon="solar:danger-triangle-bold" />}
          onClick={() => setKillSwitchDialog(true)}
          sx={{
            alignSelf: 'flex-start',
            px: 4,
            py: 1.5,
            boxShadow: 4,
            '&:hover': { boxShadow: 6 },
          }}
        >
          Activer le Kill Switch
        </Button>
      </Stack>
    </Card>
  );

  const renderUserActionsSection = () => (
    <Card>
      <TableContainer>
        <Scrollbar>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Utilisateur</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>Email</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>Téléphone</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Rôle</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Statut</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                if (loadingUsers) {
                  return (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  );
                }
                if (users.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">Aucun utilisateur trouvé</Typography>
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  users
                    .slice(usersPage * usersRowsPerPage, usersPage * usersRowsPerPage + usersRowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" noWrap>
                          {user.firstName} {user.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" noWrap>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2" noWrap>
                          {user.phone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={ROLE_COLORS[user.role] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isSuspended ? 'Suspendu' : 'Actif'}
                          color={user.isSuspended ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="nowrap">
                          {user.role !== 'SUPERADMIN' && (
                            <>
                              <Tooltip title="Bannir">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleBanUser(user.id)}
                                  disabled={loading}
                                >
                                  <Iconify icon="solar:user-block-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={loading}
                                >
                                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Réinitialiser passages">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleResetUserPassages(user.id)}
                              disabled={loading}
                            >
                              <Iconify icon="solar:refresh-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    ))
                );
              })()}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
      <TablePagination
        component="div"
        count={users.length}
        page={usersPage}
        onPageChange={(event, newPage) => setUsersPage(newPage)}
        rowsPerPage={usersRowsPerPage}
        onRowsPerPageChange={(event) => {
          setUsersRowsPerPage(parseInt(event.target.value, 10));
          setUsersPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Card>
  );

  const renderStationActionsSection = () => (
    <Card>
      <TableContainer>
        <Scrollbar>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Nom</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>ID</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>Coordonnées</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Statut</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                if (loadingStations) {
                  return (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  );
                }
                if (stations.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">Aucune station trouvée</Typography>
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  stations
                    .slice(stationsPage * stationsRowsPerPage, stationsPage * stationsRowsPerPage + stationsRowsPerPage)
                    .map((station) => (
                    <TableRow key={station.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" noWrap>
                          {station.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" noWrap sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {station.id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2" noWrap>
                          {station.latitude?.toFixed(4)}, {station.longitude?.toFixed(4)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={station.isActive ? 'Active' : 'Inactive'}
                          color={station.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="nowrap">
                          <Tooltip title="Bannir">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleBanStation(station.id)}
                              disabled={loading}
                            >
                              <Iconify icon="solar:shop-block-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDeleteStation(station.id)}
                              disabled={loading}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    ))
                );
              })()}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
      <TablePagination
        component="div"
        count={stations.length}
        page={stationsPage}
        onPageChange={(event, newPage) => setStationsPage(newPage)}
        rowsPerPage={stationsRowsPerPage}
        onRowsPerPageChange={(event) => {
          setStationsRowsPerPage(parseInt(event.target.value, 10));
          setStationsPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Card>
  );

  const renderPompisteActionsSection = () => (
    <Card>
      <TableContainer>
        <Scrollbar>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Nom</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>Email</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>Téléphone</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Station</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                if (loadingPompistes) {
                  return (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  );
                }
                if (pompistes.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">Aucun pompiste trouvé</Typography>
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  pompistes
                    .slice(pompistesPage * pompistesRowsPerPage, pompistesPage * pompistesRowsPerPage + pompistesRowsPerPage)
                    .map((pompiste) => (
                    <TableRow key={pompiste.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" noWrap>
                          {pompiste.firstName} {pompiste.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" noWrap>
                          {pompiste.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2" noWrap>
                          {pompiste.phone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {pompiste.stationName || pompiste.stationId || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="nowrap">
                          <Tooltip title="Bannir">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleBanPompiste(pompiste.id)}
                              disabled={loading}
                            >
                              <Iconify icon="solar:user-block-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Réassigner">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setPompisteReassignDialog({ open: true, pompisteId: pompiste.id, newStationId: '' })}
                              disabled={loading}
                            >
                              <Iconify icon="solar:user-change-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    ))
                );
              })()}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
      <TablePagination
        component="div"
        count={pompistes.length}
        page={pompistesPage}
        onPageChange={(event, newPage) => setPompistesPage(newPage)}
        rowsPerPage={pompistesRowsPerPage}
        onRowsPerPageChange={(event) => {
          setPompistesRowsPerPage(parseInt(event.target.value, 10));
          setPompistesPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Card>
  );

  const renderSessionActionsSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3, height: '100%', border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:cup-bold" width={24} sx={{ color: 'warning.main' }} />
              <Typography variant="h6">Corriger un réservoir</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Modifier un réservoir (erreur déclarée) pour une session.
            </Typography>
            <Divider />
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Iconify icon="solar:cup-bold" width={20} />}
              onClick={() => setSessionReservoirDialog({ open: true, sessionId: '', correctedCapacity: '' })}
              fullWidth
              sx={{ mt: 'auto', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              Corriger un réservoir
            </Button>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3, height: '100%', border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:cup-star-bold" width={24} sx={{ color: 'warning.main' }} />
              <Typography variant="h6">Corriger une capacité servie</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Corriger une capacité servie (en cas de fraude) pour une session.
            </Typography>
            <Divider />
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Iconify icon="solar:cup-star-bold" width={20} />}
              onClick={() => setSessionServedDialog({ open: true, sessionId: '', correctedCapacity: '' })}
              fullWidth
              sx={{ mt: 'auto', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              Corriger une capacité servie
            </Button>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <>
      <Helmet>
        <title>Actions Critiques | AnnourTravel</title>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Iconify icon="solar:danger-triangle-bold" width={32} sx={{ color: 'primary.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4">Actions Critiques</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Gestion des actions critiques réservées au Super Admin
                </Typography>
              </Box>
              <Chip
                label="Super Admin uniquement"
                color="primary"
                size="medium"
                icon={<Iconify icon="solar:shield-check-bold" width={18} />}
              />
            </Box>
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Attention</AlertTitle>
              Toutes les actions de cette page sont irréversibles ou critiques. Utilisez-les avec précaution.
            </Alert>
          </Card>

          <Card>
            <TabContext value={currentTab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                  onChange={(e, newValue) => setCurrentTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab
                    label="Kill Switch"
                    value="kill-switch"
                    icon={<Iconify icon="solar:danger-triangle-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Utilisateurs"
                    value="users"
                    icon={<Iconify icon="solar:user-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Stations"
                    value="stations"
                    icon={<Iconify icon="solar:shop-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Pompistes"
                    value="pompistes"
                    icon={<Iconify icon="solar:users-group-rounded-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Sessions"
                    value="sessions"
                    icon={<Iconify icon="solar:document-bold" />}
                    iconPosition="start"
                  />
                </TabList>
              </Box>

              <Box sx={{ p: 3 }}>
                <TabPanel value="kill-switch" sx={{ p: 0 }}>
                  {renderKillSwitchSection()}
                </TabPanel>
                <TabPanel value="users" sx={{ p: 0 }}>
                  {renderUserActionsSection()}
                </TabPanel>
                <TabPanel value="stations" sx={{ p: 0 }}>
                  {renderStationActionsSection()}
                </TabPanel>
                <TabPanel value="pompistes" sx={{ p: 0 }}>
                  {renderPompisteActionsSection()}
                </TabPanel>
                <TabPanel value="sessions" sx={{ p: 0 }}>
                  {renderSessionActionsSection()}
                </TabPanel>
              </Box>
            </TabContext>
          </Card>
        </Stack>
      </Container>

      {/* Kill Switch Dialog */}
      <Dialog open={killSwitchDialog} onClose={() => setKillSwitchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Activer le Kill Switch</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Action critique</AlertTitle>
            Cette action va :
            <ul>
              <li>Fermer toutes les sessions actives</li>
              <li>Désactiver toutes les stations</li>
              <li>Suspendre tous les utilisateurs (sauf Super Admin)</li>
            </ul>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Êtes-vous sûr de vouloir activer le kill switch ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKillSwitchDialog(false)}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color="primary"
            onClick={handleKillSwitch}
            loading={loading}
          >
            Activer le Kill Switch
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* User Ban Dialog - Supprimé, maintenant via les boutons du tableau */}

      {/* User Delete Dialog - Supprimé, maintenant via les boutons du tableau */}

      {/* User Reset Passages Dialog - Supprimé, maintenant via les boutons du tableau */}

      {/* Station Ban Dialog - Supprimé, maintenant via les boutons du tableau */}

      {/* Station Delete Dialog - Supprimé, maintenant via les boutons du tableau */}

      {/* Pompiste Ban Dialog - Supprimé, maintenant via les boutons du tableau */}

      {/* Pompiste Reassign Dialog */}
      <Dialog open={pompisteReassignDialog.open} onClose={() => setPompisteReassignDialog({ open: false, pompisteId: '', newStationId: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Réassigner un pompiste</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="ID Pompiste"
              value={pompisteReassignDialog.pompisteId}
              onChange={(e) => setPompisteReassignDialog({ ...pompisteReassignDialog, pompisteId: e.target.value })}
              helperText="Entrez l'ID du pompiste à réassigner"
            />
            <TextField
              fullWidth
              label="ID Nouvelle Station"
              value={pompisteReassignDialog.newStationId}
              onChange={(e) => setPompisteReassignDialog({ ...pompisteReassignDialog, newStationId: e.target.value })}
              helperText="Entrez l'ID de la nouvelle station"
            />
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }}>
            Impossible de réassigner un pompiste avec des sessions actives.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPompisteReassignDialog({ open: false, pompisteId: '', newStationId: '' })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color="primary"
            onClick={handleReassignPompiste}
            loading={loading}
          >
            Réassigner
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Session Correct Reservoir Dialog */}
      <Dialog open={sessionReservoirDialog.open} onClose={() => setSessionReservoirDialog({ open: false, sessionId: '', correctedCapacity: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Corriger un réservoir</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="ID Session"
              value={sessionReservoirDialog.sessionId}
              onChange={(e) => setSessionReservoirDialog({ ...sessionReservoirDialog, sessionId: e.target.value })}
              helperText="Entrez l'ID de la session"
            />
            <TextField
              fullWidth
              type="number"
              label="Capacité corrigée"
              value={sessionReservoirDialog.correctedCapacity}
              onChange={(e) => setSessionReservoirDialog({ ...sessionReservoirDialog, correctedCapacity: e.target.value })}
              helperText="Entrez la capacité corrigée en litres"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionReservoirDialog({ open: false, sessionId: '', correctedCapacity: '' })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color="primary"
            onClick={handleCorrectReservoir}
            loading={loading}
          >
            Corriger
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Session Correct Served Dialog */}
      <Dialog open={sessionServedDialog.open} onClose={() => setSessionServedDialog({ open: false, sessionId: '', correctedCapacity: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Corriger une capacité servie</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cette action corrige une capacité servie en cas de fraude.
          </Alert>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="ID Session"
              value={sessionServedDialog.sessionId}
              onChange={(e) => setSessionServedDialog({ ...sessionServedDialog, sessionId: e.target.value })}
              helperText="Entrez l'ID de la session"
            />
            <TextField
              fullWidth
              type="number"
              label="Capacité servie corrigée"
              value={sessionServedDialog.correctedCapacity}
              onChange={(e) => setSessionServedDialog({ ...sessionServedDialog, correctedCapacity: e.target.value })}
              helperText="Entrez la capacité servie corrigée en litres"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionServedDialog({ open: false, sessionId: '', correctedCapacity: '' })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color="primary"
            onClick={handleCorrectServed}
            loading={loading}
          >
            Corriger
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

