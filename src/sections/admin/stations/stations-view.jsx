import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Stack,
  Alert,
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

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import MapPicker from 'src/components/map-picker';

// ----------------------------------------------------------------------

export default function StationsView() {
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialogs
  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });
  const [editDialog, setEditDialog] = useState({ open: false, station: null, loading: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, station: null, loading: false });
  const [statusDialog, setStatusDialog] = useState({ open: false, station: null, loading: false });
  const [resetDialog, setResetDialog] = useState({ open: false, station: null, loading: false });

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    capacityTotal: '',
    capacityRemaining: '',
    volumePerService: '',
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    capacityTotal: '',
    capacityRemaining: '',
    volumePerService: '',
    isActive: true,
  });

  const loadStations = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getStations();
      const processed = showApiResponse(result, {
        successTitle: 'Stations chargées',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success) {
        setStations(Array.isArray(processed.data) ? processed.data : []);
      }
    } catch (error) {
      console.error('Error loading stations:', error);
      showError('Erreur', 'Impossible de charger les stations');
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const handleCreateStation = async () => {
    if (!createForm.name || !createForm.latitude || !createForm.longitude || !createForm.capacityTotal || !createForm.volumePerService) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreateDialog({ ...createDialog, loading: true });
    try {
      const result = await ConsumApi.createStation({
        name: createForm.name,
        latitude: parseFloat(createForm.latitude),
        longitude: parseFloat(createForm.longitude),
        capacityTotal: parseInt(createForm.capacityTotal, 10),
        capacityRemaining: createForm.capacityRemaining ? parseInt(createForm.capacityRemaining, 10) : parseInt(createForm.capacityTotal, 10),
        volumePerService: parseInt(createForm.volumePerService, 10),
        isActive: createForm.isActive,
      });
      const processed = showApiResponse(result, {
        successTitle: 'Station créée',
        errorTitle: 'Erreur de création',
      });
      if (processed.success) {
        showSuccess('Succès', 'La station a été créée avec succès');
        setCreateDialog({ open: false, loading: false });
        setCreateForm({
          name: '',
          latitude: '',
          longitude: '',
          capacityTotal: '',
          capacityRemaining: '',
          volumePerService: '',
          isActive: true,
        });
        loadStations();
      }
    } catch (error) {
      console.error('Error creating station:', error);
      showError('Erreur', 'Impossible de créer la station');
    } finally {
      setCreateDialog({ ...createDialog, loading: false });
    }
  };

  const handleUpdateStation = async () => {
    if (!editDialog.station || !editForm.name || !editForm.latitude || !editForm.longitude || !editForm.capacityTotal || !editForm.volumePerService) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setEditDialog({ ...editDialog, loading: true });
    try {
      const result = await ConsumApi.updateStation(editDialog.station.id, {
        name: editForm.name,
        latitude: parseFloat(editForm.latitude),
        longitude: parseFloat(editForm.longitude),
        capacityTotal: parseInt(editForm.capacityTotal, 10),
        capacityRemaining: parseInt(editForm.capacityRemaining, 10),
        volumePerService: parseInt(editForm.volumePerService, 10),
        isActive: editForm.isActive,
      });
      const processed = showApiResponse(result, {
        successTitle: 'Station modifiée',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', 'La station a été modifiée avec succès');
        setEditDialog({ open: false, station: null, loading: false });
        loadStations();
      }
    } catch (error) {
      console.error('Error updating station:', error);
      showError('Erreur', 'Impossible de modifier la station');
    } finally {
      setEditDialog({ ...editDialog, loading: false });
    }
  };

  const handleDeleteStation = async () => {
    if (!deleteDialog.station) {
      return;
    }

    setDeleteDialog({ ...deleteDialog, loading: true });
    try {
      const result = await ConsumApi.deleteStation(deleteDialog.station.id);
      const processed = showApiResponse(result, {
        successTitle: 'Station supprimée',
        errorTitle: 'Erreur de suppression',
      });
      if (processed.success) {
        showSuccess('Succès', 'La station a été supprimée avec succès');
        setDeleteDialog({ open: false, station: null, loading: false });
        loadStations();
      }
    } catch (error) {
      console.error('Error deleting station:', error);
      showError('Erreur', 'Impossible de supprimer la station');
    } finally {
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  const handleToggleStatus = async () => {
    if (!statusDialog.station) {
      return;
    }

    setStatusDialog({ ...statusDialog, loading: true });
    try {
      const newStatus = !statusDialog.station.isActive;
      const result = await ConsumApi.updateStationStatus(statusDialog.station.id, newStatus);
      const processed = showApiResponse(result, {
        successTitle: 'Statut modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', `La station a été ${newStatus ? 'activée' : 'désactivée'} avec succès`);
        setStatusDialog({ open: false, station: null, loading: false });
        loadStations();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      showError('Erreur', 'Impossible de modifier le statut de la station');
    } finally {
      setStatusDialog({ ...statusDialog, loading: false });
    }
  };

  const handleResetStation = async () => {
    if (!resetDialog.station) {
      return;
    }

    setResetDialog({ ...resetDialog, loading: true });
    try {
      const result = await ConsumApi.resetStation(resetDialog.station.id);
      const processed = showApiResponse(result, {
        successTitle: 'Station réinitialisée',
        errorTitle: 'Erreur de réinitialisation',
      });
      if (processed.success) {
        showSuccess('Succès', 'La station a été réinitialisée avec succès');
        setResetDialog({ open: false, station: null, loading: false });
        loadStations();
      }
    } catch (error) {
      console.error('Error resetting station:', error);
      showError('Erreur', 'Impossible de réinitialiser la station');
    } finally {
      setResetDialog({ ...resetDialog, loading: false });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openEditDialog = (station) => {
    setEditForm({
      name: station.name || '',
      latitude: station.latitude?.toString() || '',
      longitude: station.longitude?.toString() || '',
      capacityTotal: station.capacityTotal?.toString() || '',
      capacityRemaining: station.capacityRemaining?.toString() || '',
      volumePerService: station.volumePerService?.toString() || '',
      isActive: station.isActive ?? true,
    });
    setEditDialog({ open: true, station, loading: false });
  };

  const openDeleteDialog = (station) => {
    setDeleteDialog({ open: true, station, loading: false });
  };

  const openStatusDialog = (station) => {
    setStatusDialog({ open: true, station, loading: false });
  };

  const openResetDialog = (station) => {
    setResetDialog({ open: true, station, loading: false });
  };

  return (
    <>
      <Helmet>
        <title> Stations | CarbuGo </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4">Gestion des Stations</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gérez toutes les stations du système
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setCreateDialog({ open: true, loading: false })}
            >
              Nouvelle Station
            </Button>
          </Box>

          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="medium" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Coordonnées</TableCell>
                      <TableCell>Capacité</TableCell>
                      <TableCell>Volume/Service</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Statistiques</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {(() => {
                      if (loading) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                              <Typography color="text.secondary">Chargement...</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (stations.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                              <Typography color="text.secondary">Aucune station trouvée</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return stations
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((station) => (
                          <TableRow key={station.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2">{station.name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {station.latitude?.toFixed(4)}, {station.longitude?.toFixed(4)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {fNumber(station.capacityRemaining || 0)} / {fNumber(station.capacityTotal || 0)} L
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {station.capacityTotal > 0
                                  ? `${Math.round(((station.capacityRemaining || 0) / station.capacityTotal) * 100)}% restant`
                                  : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{fNumber(station.volumePerService || 0)} L</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={station.isActive ? 'Active' : 'Inactive'}
                                color={station.isActive ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                  Sessions: {station._count?.sessions || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Pompistes: {station._count?.pompistes || 0}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Voir les détails">
                                  <IconButton
                                    size="small"
                                    onClick={() => router.push(`/admin/stations/${station.id}`)}
                                  >
                                    <Iconify icon="solar:eye-bold" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Modifier">
                                  <IconButton size="small" onClick={() => openEditDialog(station)}>
                                    <Iconify icon="solar:pen-bold" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={station.isActive ? 'Désactiver' : 'Activer'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => openStatusDialog(station)}
                                    color={station.isActive ? 'warning' : 'success'}
                                  >
                                    <Iconify icon={station.isActive ? 'solar:power-bold' : 'solar:power-bold'} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Réinitialiser">
                                  <IconButton
                                    size="small"
                                    onClick={() => openResetDialog(station)}
                                    color="info"
                                  >
                                    <Iconify icon="solar:refresh-bold" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Supprimer">
                                  <IconButton
                                    size="small"
                                    onClick={() => openDeleteDialog(station)}
                                    color="error"
                                  >
                                    <Iconify icon="solar:trash-bin-trash-bold" />
                                  </IconButton>
                                </Tooltip>
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
              count={stations.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Card>
        </Stack>
      </Container>

      {/* Dialog de création */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false, loading: false })} maxWidth="lg" fullWidth>
        <DialogTitle>Créer une nouvelle station</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nom de la station"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <Box>
              <MapPicker
                latitude={createForm.latitude}
                longitude={createForm.longitude}
                onLocationChange={(lat, lng) => {
                  setCreateForm({
                    ...createForm,
                    latitude: lat.toString(),
                    longitude: lng.toString(),
                  });
                }}
                height={300}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={createForm.latitude}
                  onChange={(e) => setCreateForm({ ...createForm, latitude: e.target.value })}
                  required
                  inputProps={{ step: 'any' }}
                  helperText="Ou sélectionnez sur la carte ci-dessus"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={createForm.longitude}
                  onChange={(e) => setCreateForm({ ...createForm, longitude: e.target.value })}
                  required
                  inputProps={{ step: 'any' }}
                  helperText="Ou sélectionnez sur la carte ci-dessus"
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Capacité totale (L)"
                  type="number"
                  value={createForm.capacityTotal}
                  onChange={(e) => setCreateForm({ ...createForm, capacityTotal: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Capacité restante (L)"
                  type="number"
                  value={createForm.capacityRemaining}
                  onChange={(e) => setCreateForm({ ...createForm, capacityRemaining: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Volume par service (L)"
              type="number"
              value={createForm.volumePerService}
              onChange={(e) => setCreateForm({ ...createForm, volumePerService: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={createForm.isActive ? 'active' : 'inactive'}
                label="Statut"
                onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.value === 'active' })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleCreateStation} loading={createDialog.loading}>
            Créer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, station: null, loading: false })} maxWidth="lg" fullWidth>
        <DialogTitle>Modifier la station</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nom de la station"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <Box>
              <MapPicker
                latitude={editForm.latitude}
                longitude={editForm.longitude}
                onLocationChange={(lat, lng) => {
                  setEditForm({
                    ...editForm,
                    latitude: lat.toString(),
                    longitude: lng.toString(),
                  });
                }}
                height={300}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                  required
                  inputProps={{ step: 'any' }}
                  helperText="Ou sélectionnez sur la carte ci-dessus"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                  required
                  inputProps={{ step: 'any' }}
                  helperText="Ou sélectionnez sur la carte ci-dessus"
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Capacité totale (L)"
                  type="number"
                  value={editForm.capacityTotal}
                  onChange={(e) => setEditForm({ ...editForm, capacityTotal: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Capacité restante (L)"
                  type="number"
                  value={editForm.capacityRemaining}
                  onChange={(e) => setEditForm({ ...editForm, capacityRemaining: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Volume par service (L)"
              type="number"
              value={editForm.volumePerService}
              onChange={(e) => setEditForm({ ...editForm, volumePerService: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={editForm.isActive ? 'active' : 'inactive'}
                label="Statut"
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, station: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleUpdateStation} loading={editDialog.loading}>
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, station: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer la station</DialogTitle>
        <DialogContent>
          {deleteDialog.station && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Êtes-vous sûr de vouloir supprimer la station &quot;{deleteDialog.station.name}&quot; ? Cette action est irréversible.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, station: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" color="error" onClick={handleDeleteStation} loading={deleteDialog.loading}>
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog de changement de statut */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, station: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{statusDialog.station?.isActive ? 'Désactiver' : 'Activer'} la station</DialogTitle>
        <DialogContent>
          {statusDialog.station && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Êtes-vous sûr de vouloir {statusDialog.station.isActive ? 'désactiver' : 'activer'} la station &quot;{statusDialog.station.name}&quot; ?
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, station: null, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color={statusDialog.station?.isActive ? 'warning' : 'success'}
            onClick={handleToggleStatus}
            loading={statusDialog.loading}
          >
            {statusDialog.station?.isActive ? 'Désactiver' : 'Activer'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog de réinitialisation */}
      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, station: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Réinitialiser la station</DialogTitle>
        <DialogContent>
          {resetDialog.station && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cette action va forcer la fermeture de toutes les sessions actives de la station &quot;{resetDialog.station.name}&quot;. Êtes-vous sûr de vouloir continuer ?
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog({ open: false, station: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" color="warning" onClick={handleResetStation} loading={resetDialog.loading}>
            Réinitialiser
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

