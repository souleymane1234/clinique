import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  Button,
  Dialog,
  Select,
  Tooltip,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
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

export default function SessionsView() {
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Stations list for create dialog
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  // Dialogs
  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });
  const [closeDialog, setCloseDialog] = useState({ open: false, session: null, loading: false });

  // Create form
  const [createForm, setCreateForm] = useState({
    stationId: '',
    fuelType: 'ESSENCE',
    capacityTotal: '',
    capacityRemaining: '',
    volumePerService: '',
    radiusKm: '',
    status: 'PENDING',
  });

  const loadStations = async () => {
    setLoadingStations(true);
    try {
      const result = await ConsumApi.getStations();
      if (result.success) {
        setStations(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      setLoadingStations(false);
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      let result;
      if (activeOnly) {
        result = await ConsumApi.getActiveSessions();
      } else {
        result = await ConsumApi.getSessions();
      }

      const processed = showApiResponse(result, {
        successTitle: 'Sessions chargées',
        errorTitle: 'Erreur de chargement',
      });

      if (processed.success) {
        let sessionsData = Array.isArray(processed.data) ? processed.data : [];

        // Appliquer les filtres côté client
        if (statusFilter) {
          sessionsData = sessionsData.filter((s) => s.status === statusFilter);
        }
        if (fuelTypeFilter) {
          sessionsData = sessionsData.filter((s) => s.fuelType === fuelTypeFilter);
        }

        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      showError('Erreur', 'Impossible de charger les sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [statusFilter, fuelTypeFilter, activeOnly, loadSessions]);

  useEffect(() => {
    if (createDialog.open) {
      loadStations();
    }
  }, [createDialog.open, loadStations]);

  const handleCreateSession = async () => {
    if (!createForm.stationId || !createForm.capacityTotal || !createForm.volumePerService || !createForm.radiusKm) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreateDialog({ ...createDialog, loading: true });
    try {
      const result = await ConsumApi.createSession({
        stationId: createForm.stationId,
        fuelType: createForm.fuelType,
        capacityTotal: parseInt(createForm.capacityTotal, 10),
        capacityRemaining: createForm.capacityRemaining ? parseInt(createForm.capacityRemaining, 10) : parseInt(createForm.capacityTotal, 10),
        volumePerService: parseInt(createForm.volumePerService, 10),
        radiusKm: parseInt(createForm.radiusKm, 10),
        status: createForm.status,
      });

      const processed = showApiResponse(result, {
        successTitle: 'Session créée',
        errorTitle: 'Erreur de création',
      });

      if (processed.success) {
        showSuccess('Succès', 'La session a été créée avec succès');
        setCreateDialog({ open: false, loading: false });
        setCreateForm({
          stationId: '',
          fuelType: 'ESSENCE',
          capacityTotal: '',
          capacityRemaining: '',
          volumePerService: '',
          radiusKm: '',
          status: 'PENDING',
        });
        loadSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      showError('Erreur', 'Impossible de créer la session');
    } finally {
      setCreateDialog({ ...createDialog, loading: false });
    }
  };

  const handleCloseSession = async () => {
    if (!closeDialog.session) return;

    setCloseDialog({ ...closeDialog, loading: true });
    try {
      const result = await ConsumApi.closeSession(closeDialog.session.id);
      const processed = showApiResponse(result, {
        successTitle: 'Session fermée',
        errorTitle: 'Erreur',
      });

      if (processed.success) {
        showSuccess('Succès', 'La session a été fermée avec succès');
        setCloseDialog({ open: false, session: null, loading: false });
        loadSessions();
      }
    } catch (error) {
      console.error('Error closing session:', error);
      showError('Erreur', 'Impossible de fermer la session');
    } finally {
      setCloseDialog({ ...closeDialog, loading: false });
    }
  };


  return (
    <>
      <Helmet>
        <title> Sessions | CarbuGo </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4">Gestion des Sessions</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gérez toutes les sessions de distribution
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setCreateDialog({ open: true, loading: false })}
            >
              Nouvelle Session
            </Button>
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
              <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={statusFilter}
                  label="Statut"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="PENDING">En attente</MenuItem>
                  <MenuItem value="OPEN">Ouverte</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="CLOSED">Fermée</MenuItem>
                  <MenuItem value="FORCE_CLOSED">Fermée forcément</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <InputLabel>Type de carburant</InputLabel>
                <Select
                  value={fuelTypeFilter}
                  label="Type de carburant"
                  onChange={(e) => setFuelTypeFilter(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="ESSENCE">Essence</MenuItem>
                  <MenuItem value="DIESEL">Diesel</MenuItem>
                  <MenuItem value="GAZOLE">Gazole</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant={activeOnly ? 'contained' : 'outlined'}
                onClick={() => setActiveOnly(!activeOnly)}
                startIcon={<Iconify icon={activeOnly ? 'solar:check-circle-bold' : 'solar:circle-bold'} />}
                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
              >
                Sessions actives uniquement
              </Button>
            </Stack>
          </Card>

          <Card>
            <TableContainer>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Station</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Type</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Statut</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>Capacité</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, whiteSpace: 'nowrap' }}>Volume/Service</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>Rayon</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>Files actives</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {(() => {
                      if (loading) {
                        return (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                              <Typography color="text.secondary">Chargement...</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (sessions.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                              <Typography color="text.secondary">Aucune session trouvée</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return sessions
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((session) => (
                          <TableRow key={session.id} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2" noWrap>
                                  {session.station?.name || session.stationId}
                                </Typography>
                                {session.station && (
                                  <Typography variant="caption" color="text.secondary">
                                    {session.station.id}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={session.fuelType}
                                color={FUEL_TYPE_COLORS[session.fuelType] || 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={session.status}
                                color={STATUS_COLORS[session.status] || 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Typography variant="body2">
                                {fNumber(session.capacityRemaining || 0)} / {fNumber(session.capacityTotal || 0)} L
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                              {fNumber(session.volumePerService || 0)} L
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              {session.radiusKm || 0} km
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              {session._count?.fileActive || session.fileActive?.length || 0}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="nowrap">
                                <Tooltip title="Voir les détails">
                                  <IconButton
                                    size="small"
                                    onClick={() => router.push(routesName.adminSessionDetails.replace(':id', session.id))}
                                    color="primary"
                                  >
                                    <Iconify icon="eva:eye-fill" width={18} />
                                  </IconButton>
                                </Tooltip>
                                {session.status !== 'CLOSED' && session.status !== 'FORCE_CLOSED' && (
                                  <Tooltip title="Fermer">
                                    <IconButton
                                      size="small"
                                      onClick={() => setCloseDialog({ open: true, session, loading: false })}
                                      color="warning"
                                    >
                                      <Iconify icon="solar:power-bold" width={18} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ));
                    })()}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>

            <TablePagination
              component="div"
              count={sessions.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Card>
        </Stack>
      </Container>

      {/* Create Dialog */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Créer une nouvelle Session</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Station</InputLabel>
              <Select
                value={createForm.stationId}
                label="Station"
                onChange={(e) => setCreateForm({ ...createForm, stationId: e.target.value })}
                disabled={loadingStations}
              >
                {loadingStations ? (
                  <MenuItem disabled>Chargement...</MenuItem>
                ) : (
                  stations
                    .filter((station) => station.isActive)
                    .map((station) => (
                      <MenuItem key={station.id} value={station.id}>
                        {station.name} ({station.id})
                      </MenuItem>
                    ))
                )}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Type de carburant</InputLabel>
              <Select
                value={createForm.fuelType}
                label="Type de carburant"
                onChange={(e) => setCreateForm({ ...createForm, fuelType: e.target.value })}
              >
                <MenuItem value="ESSENCE">Essence</MenuItem>
                <MenuItem value="DIESEL">Diesel</MenuItem>
                <MenuItem value="GAZOLE">Gazole</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Capacité totale (L)"
              value={createForm.capacityTotal}
              onChange={(e) => setCreateForm({ ...createForm, capacityTotal: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="number"
              label="Capacité restante (L)"
              value={createForm.capacityRemaining}
              onChange={(e) => setCreateForm({ ...createForm, capacityRemaining: e.target.value })}
              helperText="Laissez vide pour utiliser la capacité totale"
            />
            <TextField
              fullWidth
              type="number"
              label="Volume par service (L)"
              value={createForm.volumePerService}
              onChange={(e) => setCreateForm({ ...createForm, volumePerService: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="number"
              label="Rayon (km)"
              value={createForm.radiusKm}
              onChange={(e) => setCreateForm({ ...createForm, radiusKm: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Statut initial</InputLabel>
              <Select
                value={createForm.status}
                label="Statut initial"
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
              >
                <MenuItem value="PENDING">En attente</MenuItem>
                <MenuItem value="OPEN">Ouverte</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleCreateSession}
            loading={createDialog.loading}
            disabled={
              !createForm.stationId ||
              !createForm.capacityTotal ||
              !createForm.volumePerService ||
              !createForm.radiusKm
            }
          >
            Créer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeDialog.open} onClose={() => setCloseDialog({ open: false, session: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Fermer la session</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir fermer la session de{' '}
            <strong>{closeDialog.session?.station?.name || closeDialog.session?.stationId}</strong> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialog({ open: false, session: null, loading: false })}>Annuler</Button>
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
    </>
  );
}

