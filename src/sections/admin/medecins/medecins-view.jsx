import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
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
  InputAdornment,
  TablePagination,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  ACTIVE: 'success',
  INACTIVE: 'error',
};

const GENDER_LABELS = {
  MALE: 'Homme',
  FEMALE: 'Femme',
};

export default function MedecinsView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [specialityFilter, setSpecialityFilter] = useState('');

  // Dialogs
  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });
  const [editDialog, setEditDialog] = useState({ open: false, medecin: null, loading: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, medecin: null, loading: false });

  // Form data
  const [formData, setFormData] = useState({
    doctorNumber: '',
    firstName: '',
    lastName: '',
    gender: 'MALE',
    speciality: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    status: 'ACTIVE',
    isActive: true,
    password: '',
  });

  const loadMedecins = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getMedecinsPaginated(page + 1, rowsPerPage, {
        search,
        status: statusFilter,
        speciality: specialityFilter,
      });

      if (result.success) {
        setMedecins(result.data?.medecins || result.data?.data || []);
        setTotal(result.data?.total || result.data?.count || 0);
      } else {
        showError('Erreur', result.message || 'Impossible de charger les médecins');
        setMedecins([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading medecins:', error);
      showError('Erreur', 'Impossible de charger les médecins');
      setMedecins([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, specialityFilter]);

  useEffect(() => {
    loadMedecins();
  }, [loadMedecins]);

  const handleSearch = () => {
    setPage(0);
    loadMedecins();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSpecialityFilter('');
    setPage(0);
  };

  const resetForm = () => {
    setFormData({
      doctorNumber: '',
      firstName: '',
      lastName: '',
      gender: 'MALE',
      speciality: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: '',
      status: 'ACTIVE',
      isActive: true,
      password: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialog({ open: true, loading: false });
  };

  const handleCreate = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreateDialog({ ...createDialog, loading: true });
    try {
      const result = await ConsumApi.createMedecin(formData);
      const processed = showApiResponse(result, {
        successTitle: 'Médecin créé',
        errorTitle: 'Erreur de création',
      });

      if (processed.success) {
        showSuccess('Succès', 'Médecin créé avec succès');
        setCreateDialog({ open: false, loading: false });
        resetForm();
        loadMedecins();
      }
    } catch (error) {
      console.error('Error creating medecin:', error);
      showError('Erreur', 'Impossible de créer le médecin');
    } finally {
      setCreateDialog({ ...createDialog, loading: false });
    }
  };

  const openEditDialog = (medecin) => {
    setFormData({
      doctorNumber: medecin.doctorNumber || '',
      firstName: medecin.firstName || medecin.firstname || '',
      lastName: medecin.lastName || medecin.lastname || '',
      gender: medecin.gender || 'MALE',
      speciality: medecin.speciality || '',
      phone: medecin.phone || '',
      email: medecin.email || '',
      address: medecin.address || '',
      city: medecin.city || '',
      country: medecin.country || '',
      status: medecin.status || 'ACTIVE',
      isActive: medecin.isActive !== undefined ? medecin.isActive : true,
      password: '', // Ne pas pré-remplir le mot de passe
      userId: medecin.userId || medecin.user?.id || null,
    });
    setEditDialog({ open: true, medecin, loading: false });
  };

  const handleUpdate = async () => {
    if (!editDialog.medecin || !formData.firstName || !formData.lastName || !formData.email) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setEditDialog({ ...editDialog, loading: true });
    try {
      // Ne pas envoyer le mot de passe s'il est vide
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const result = await ConsumApi.updateMedecin(editDialog.medecin.id, updateData);
      const processed = showApiResponse(result, {
        successTitle: 'Médecin modifié',
        errorTitle: 'Erreur de modification',
      });

      if (processed.success) {
        showSuccess('Succès', 'Médecin modifié avec succès');
        setEditDialog({ open: false, medecin: null, loading: false });
        resetForm();
        loadMedecins();
      }
    } catch (error) {
      console.error('Error updating medecin:', error);
      showError('Erreur', 'Impossible de modifier le médecin');
    } finally {
      setEditDialog({ ...editDialog, loading: false });
    }
  };

  const openDeleteDialog = (medecin) => {
    setDeleteDialog({ open: true, medecin, loading: false });
  };

  const handleDelete = async () => {
    if (!deleteDialog.medecin) return;

    setDeleteDialog({ ...deleteDialog, loading: true });
    try {
      const result = await ConsumApi.deleteMedecin(deleteDialog.medecin.id);
      const processed = showApiResponse(result, {
        successTitle: 'Médecin supprimé',
        errorTitle: 'Erreur de suppression',
      });

      if (processed.success) {
        showSuccess('Succès', 'Médecin supprimé avec succès');
        setDeleteDialog({ open: false, medecin: null, loading: false });
        loadMedecins();
      }
    } catch (error) {
      console.error('Error deleting medecin:', error);
      showError('Erreur', 'Impossible de supprimer le médecin');
    } finally {
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  return (
    <>
      <Helmet>
        <title> Médecins | PREVENTIC </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4">Gestion des Médecins</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Gérez tous les médecins du système
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={openCreateDialog}
              >
                Ajouter un médecin
              </Button>
            </Stack>
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, prénom, email, téléphone ou numéro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Statut"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="ACTIVE">Actif</MenuItem>
                    <MenuItem value="INACTIVE">Inactif</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                  <InputLabel>Spécialité</InputLabel>
                  <Select
                    value={specialityFilter}
                    label="Spécialité"
                    onChange={(e) => setSpecialityFilter(e.target.value)}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    <MenuItem value="Médecine générale">Médecine générale</MenuItem>
                    <MenuItem value="Cardiologie">Cardiologie</MenuItem>
                    <MenuItem value="Pédiatrie">Pédiatrie</MenuItem>
                    <MenuItem value="Gynécologie">Gynécologie</MenuItem>
                    <MenuItem value="Dermatologie">Dermatologie</MenuItem>
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={2} sx={{ flex: 1, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSearch}
                    startIcon={<Iconify icon="eva:search-fill" />}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' }, whiteSpace: 'nowrap' }}
                  >
                    Rechercher
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleClearFilters}
                    startIcon={<Iconify icon="eva:close-fill" />}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                  >
                    Réinitialiser
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Card>

          <Card>
            <TableContainer>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Numéro</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Nom complet</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Spécialité</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Téléphone</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Email</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Statut</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
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
                      if (medecins.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                              <Typography color="text.secondary">Aucun médecin trouvé</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return medecins.map((medecin) => (
                        <TableRow key={medecin.id} hover>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {medecin.doctorNumber || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" noWrap>
                              {medecin.firstName || medecin.firstname || ''} {medecin.lastName || medecin.lastname || ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {GENDER_LABELS[medecin.gender] || medecin.gender}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {medecin.speciality || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {medecin.phone || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {medecin.email || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={medecin.status || 'ACTIVE'}
                              color={STATUS_COLORS[medecin.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="nowrap">
                              <Tooltip title="Modifier">
                                <IconButton size="small" onClick={() => openEditDialog(medecin)} color="primary">
                                  <Iconify icon="solar:pen-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton
                                  size="small"
                                  onClick={() => openDeleteDialog(medecin)}
                                  color="error"
                                >
                                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
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
              count={total}
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
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Ajouter un médecin</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Numéro de médecin"
                  value={formData.doctorNumber}
                  onChange={(e) => setFormData({ ...formData, doctorNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Genre</InputLabel>
                  <Select
                    value={formData.gender}
                    label="Genre"
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <MenuItem value="MALE">Homme</MenuItem>
                    <MenuItem value="FEMALE">Femme</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Prénom"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nom"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Spécialité"
                  value={formData.speciality}
                  onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                />
              </Grid>
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
                  required
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="password"
                  label="Mot de passe"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Adresse"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={formData.status}
                    label="Statut"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="ACTIVE">Actif</MenuItem>
                    <MenuItem value="INACTIVE">Inactif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, medecin: null, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Modifier le médecin</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Numéro de médecin"
                  value={formData.doctorNumber}
                  onChange={(e) => setFormData({ ...formData, doctorNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Genre</InputLabel>
                  <Select
                    value={formData.gender}
                    label="Genre"
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <MenuItem value="MALE">Homme</MenuItem>
                    <MenuItem value="FEMALE">Femme</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Prénom"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nom"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Spécialité"
                  value={formData.speciality}
                  onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                />
              </Grid>
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
                  required
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Nouveau mot de passe (laisser vide pour ne pas modifier)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Adresse"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={formData.status}
                    label="Statut"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="ACTIVE">Actif</MenuItem>
                    <MenuItem value="INACTIVE">Inactif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, medecin: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleUpdate} loading={editDialog.loading}>
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, medecin: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer le médecin</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le médecin{' '}
            <strong>
              {deleteDialog.medecin?.firstName} {deleteDialog.medecin?.lastName}
            </strong>
            ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, medecin: null, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color="error"
            onClick={handleDelete}
            loading={deleteDialog.loading}
          >
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
