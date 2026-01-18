import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Alert,
  Button,
  Dialog,
  Select,
  Switch,
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
  FormControlLabel,
  InputAdornment,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  active: 'success',
  inactive: 'default',
  suspended: 'error',
};

export default function MultiClinicsView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentClinic, setCurrentClinic] = useState(null);

  // Dialogs
  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });
  const [editDialog, setEditDialog] = useState({ open: false, clinic: null, loading: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, clinic: null, loading: false });
  const [switchDialog, setSwitchDialog] = useState({ open: false, clinic: null, loading: false });

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: 'CI',
    phone: '',
    email: '',
    license: '',
    status: 'active',
    settings: {
      timezone: 'Africa/Abidjan',
      language: 'fr',
      currency: 'XOF',
    },
  });

  useEffect(() => {
    loadClinics();
    loadCurrentClinic();
  }, []);

  const loadClinics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getClinics();
      const processed = showApiResponse(result, {
        successTitle: 'Cliniques chargées',
        errorTitle: 'Erreur de chargement',
        showNotification: false,
      });

      if (processed.success) {
        setClinics(Array.isArray(processed.data) ? processed.data : []);
      } else {
        setClinics([]);
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
      showError('Erreur', 'Impossible de charger les cliniques');
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, [showApiResponse, showError]);

  const loadCurrentClinic = async () => {
    try {
      const result = await ConsumApi.getCurrentClinic();
      if (result.success && result.data) {
        setCurrentClinic(result.data);
      }
    } catch (error) {
      console.error('Error loading current clinic:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.address) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreateDialog({ ...createDialog, loading: true });
    try {
      const result = await ConsumApi.createClinic(formData);
      const processed = showApiResponse(result, {
        successTitle: 'Clinique créée',
        errorTitle: 'Erreur lors de la création',
      });

      if (processed.success) {
        setCreateDialog({ open: false, loading: false });
        setFormData({
          name: '',
          address: '',
          city: '',
          country: 'CI',
          phone: '',
          email: '',
          license: '',
          status: 'active',
          settings: {
            timezone: 'Africa/Abidjan',
            language: 'fr',
            currency: 'XOF',
          },
        });
        await loadClinics();
      }
    } catch (error) {
      console.error('Error creating clinic:', error);
      showError('Erreur', 'Impossible de créer la clinique');
    } finally {
      setCreateDialog({ ...createDialog, loading: false });
    }
  };

  const handleEdit = async () => {
    if (!editDialog.clinic || !formData.name || !formData.address) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setEditDialog({ ...editDialog, loading: true });
    try {
      const result = await ConsumApi.updateClinic(editDialog.clinic.id, formData);
      const processed = showApiResponse(result, {
        successTitle: 'Clinique mise à jour',
        errorTitle: 'Erreur lors de la mise à jour',
      });

      if (processed.success) {
        setEditDialog({ open: false, clinic: null, loading: false });
        await loadClinics();
        if (currentClinic?.id === editDialog.clinic.id) {
          await loadCurrentClinic();
        }
      }
    } catch (error) {
      console.error('Error updating clinic:', error);
      showError('Erreur', 'Impossible de mettre à jour la clinique');
    } finally {
      setEditDialog({ ...editDialog, loading: false });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.clinic) return;

    setDeleteDialog({ ...deleteDialog, loading: true });
    try {
      const result = await ConsumApi.deleteClinic(deleteDialog.clinic.id);
      const processed = showApiResponse(result, {
        successTitle: 'Clinique supprimée',
        errorTitle: 'Erreur lors de la suppression',
      });

      if (processed.success) {
        setDeleteDialog({ open: false, clinic: null, loading: false });
        await loadClinics();
      }
    } catch (error) {
      console.error('Error deleting clinic:', error);
      showError('Erreur', 'Impossible de supprimer la clinique');
    } finally {
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  const handleSwitchClinic = async () => {
    if (!switchDialog.clinic) return;

    setSwitchDialog({ ...switchDialog, loading: true });
    try {
      const result = await ConsumApi.switchClinic(switchDialog.clinic.id);
      const processed = showApiResponse(result, {
        successTitle: 'Clinique changée',
        errorTitle: 'Erreur lors du changement',
      });

      if (processed.success) {
        setSwitchDialog({ open: false, clinic: null, loading: false });
        await loadCurrentClinic();
        showSuccess('Succès', `Vous travaillez maintenant avec la clinique : ${switchDialog.clinic.name}`);
        // Recharger la page pour mettre à jour tout le contexte
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error switching clinic:', error);
      showError('Erreur', 'Impossible de changer de clinique');
    } finally {
      setSwitchDialog({ ...switchDialog, loading: false });
    }
  };

  const handleEditOpen = (clinic) => {
    setFormData({
      name: clinic.name || '',
      address: clinic.address || '',
      city: clinic.city || '',
      country: clinic.country || 'CI',
      phone: clinic.phone || '',
      email: clinic.email || '',
      license: clinic.license || '',
      status: clinic.status || 'active',
      settings: clinic.settings || {
        timezone: 'Africa/Abidjan',
        language: 'fr',
        currency: 'XOF',
      },
    });
    setEditDialog({ open: true, clinic, loading: false });
  };

  return (
    <>
      <Helmet>
        <title> Multi-Cliniques | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Multi-Cliniques</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gérez plusieurs cliniques dans le même système
            </Typography>
          </Box>

          {currentClinic && (
            <Alert severity="info" icon={<Iconify icon="eva:info-fill" />}>
              Clinique actuelle : <strong>{currentClinic.name}</strong> ({currentClinic.city}, {currentClinic.country})
            </Alert>
          )}

          {/* Stats */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Cliniques
                </Typography>
                <Typography variant="h4">{clinics.length}</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cliniques Actives
                </Typography>
                <Typography variant="h4">{clinics.filter((c) => c.status === 'active').length}</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Clinique Actuelle
                </Typography>
                <Typography variant="h4">{currentClinic?.name || 'N/A'}</Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Actions */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Liste des cliniques</Typography>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => setCreateDialog({ open: true, loading: false })}
              >
                Ajouter une clinique
              </Button>
            </Box>
          </Card>

          {/* Clinics List */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Adresse</TableCell>
                      <TableCell>Téléphone</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (loading && clinics.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              Chargement...
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (clinics.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              Aucune clinique trouvée
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return clinics.map((clinic) => (
                        <TableRow key={clinic.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {clinic.name}
                              {currentClinic?.id === clinic.id && (
                                <Chip label="Actuelle" color="primary" size="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {clinic.address}
                            {clinic.city && `, ${clinic.city}`}
                          </TableCell>
                          <TableCell>{clinic.phone || 'N/A'}</TableCell>
                          <TableCell>{clinic.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={(() => {
                                if (clinic.status === 'active') return 'Active';
                                if (clinic.status === 'inactive') return 'Inactive';
                                return 'Suspendue';
                              })()}
                              color={STATUS_COLORS[clinic.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {currentClinic?.id !== clinic.id && (
                                <IconButton
                                  size="small"
                                  onClick={() => setSwitchDialog({ open: true, clinic, loading: false })}
                                  color="primary"
                                  title="Basculer vers cette clinique"
                                >
                                  <Iconify icon="eva:refresh-fill" />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleEditOpen(clinic)}
                                color="info"
                                title="Modifier"
                              >
                                <Iconify icon="eva:edit-fill" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setDeleteDialog({ open: true, clinic, loading: false })}
                                color="error"
                                title="Supprimer"
                              >
                                <Iconify icon="eva:trash-2-fill" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </table>
              </Scrollbar>
            </TableContainer>
          </Card>
        </Stack>
      </Container>

      {/* Create Dialog */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Créer une nouvelle clinique</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nom de la clinique *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Adresse *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              multiline
              rows={2}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ville"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pays"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Numéro de licence"
              value={formData.license}
              onChange={(e) => setFormData({ ...formData, license: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={formData.status}
                label="Statut"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspendue</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleCreate} loading={createDialog.loading}>
            Créer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, clinic: null, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Modifier la clinique</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nom de la clinique *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Adresse *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              multiline
              rows={2}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ville"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pays"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Numéro de licence"
              value={formData.license}
              onChange={(e) => setFormData({ ...formData, license: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={formData.status}
                label="Statut"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspendue</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, clinic: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleEdit} loading={editDialog.loading}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, clinic: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer la clinique</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Attention : Cette action est irréversible. Toutes les données associées à cette clinique seront également supprimées.
          </Alert>
          <Typography variant="body2">
            Êtes-vous sûr de vouloir supprimer la clinique &quot;{deleteDialog.clinic?.name}&quot; ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, clinic: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" color="error" onClick={handleDelete} loading={deleteDialog.loading}>
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Switch Dialog */}
      <Dialog open={switchDialog.open} onClose={() => setSwitchDialog({ open: false, clinic: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Basculer vers une autre clinique</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Êtes-vous sûr de vouloir basculer vers la clinique &quot;{switchDialog.clinic?.name}&quot; ? Vous serez redirigé après cette action.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwitchDialog({ open: false, clinic: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleSwitchClinic} loading={switchDialog.loading}>
            Basculer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
