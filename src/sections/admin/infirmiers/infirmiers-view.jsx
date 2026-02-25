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

const SPECIALITY_OPTIONS = [
  'Soins intensifs',
  'Pédiatrie',
  'Bloc opératoire',
  'Urgences',
  'Médecine générale',
  'Chirurgie',
  'Réanimation',
  'Soins palliatifs',
];

const SUCCESS_AUTO_CLOSE_MS = 2000;

export default function InfirmiersView() {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [infirmiers, setInfirmiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [specialityFilter, setSpecialityFilter] = useState('');

  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });
  const [editDialog, setEditDialog] = useState({ open: false, infirmier: null, loading: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, infirmier: null, loading: false });
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });

  const [formData, setFormData] = useState({
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

  const loadInfirmiers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getInfirmiers();
      if (result.success) {
        let list = Array.isArray(result.data) ? result.data : [];
        if (search) {
          const s = search.toLowerCase();
          list = list.filter(
            (n) =>
              (n.firstName || '').toLowerCase().includes(s) ||
              (n.lastName || '').toLowerCase().includes(s) ||
              (n.email || '').toLowerCase().includes(s) ||
              (n.phone || '').toLowerCase().includes(s) ||
              (n.speciality || '').toLowerCase().includes(s)
          );
        }
        if (statusFilter) {
          list = list.filter((n) => (n.status || 'ACTIVE') === statusFilter);
        }
        if (specialityFilter) {
          list = list.filter((n) => (n.speciality || '') === specialityFilter);
        }
        setInfirmiers(list);
      } else {
        showError('Erreur', result.message || 'Impossible de charger les infirmiers');
        setInfirmiers([]);
      }
    } catch (error) {
      console.error('Error loading infirmiers:', error);
      showError('Erreur', 'Impossible de charger les infirmiers');
      setInfirmiers([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, specialityFilter]);

  useEffect(() => {
    loadInfirmiers();
  }, [loadInfirmiers]);

  // Fermeture automatique du modal de succès après 2 secondes
  useEffect(() => {
    if (!successModal.open) return undefined;
    const timer = setTimeout(() => {
      setSuccessModal({ open: false, message: '' });
    }, SUCCESS_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [successModal.open]);

  const handleSearch = () => {
    setPage(0);
    loadInfirmiers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSpecialityFilter('');
    setPage(0);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'MALE',
      speciality: 'Médecine générale',
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
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires (prénom, nom, email, mot de passe)');
      return;
    }
    if (!formData.speciality || !String(formData.speciality).trim()) {
      showError('Erreur', 'La spécialité est obligatoire');
      return;
    }

    setCreateDialog((d) => ({ ...d, loading: true }));
    try {
      const result = await ConsumApi.createInfirmier(formData);
      if (result.success) {
        setCreateDialog({ open: false, loading: false });
        resetForm();
        loadInfirmiers();
        setSuccessModal({ open: true, message: 'Infirmier créé avec succès' });
      } else {
        showApiResponse(result, { successTitle: '', errorTitle: 'Erreur de création' });
      }
    } catch (error) {
      console.error('Error creating infirmier:', error);
      showError('Erreur', 'Impossible de créer l\'infirmier');
    } finally {
      setCreateDialog((d) => ({ ...d, loading: false }));
    }
  };

  const openEditDialog = (infirmier) => {
    setFormData({
      firstName: infirmier.firstName || infirmier.first_name || '',
      lastName: infirmier.lastName || infirmier.last_name || '',
      gender: infirmier.gender || 'MALE',
      speciality: (infirmier.speciality && String(infirmier.speciality).trim()) ? infirmier.speciality : 'Médecine générale',
      phone: infirmier.phone || '',
      email: infirmier.email || '',
      address: infirmier.address || '',
      city: infirmier.city || '',
      country: infirmier.country || '',
      status: infirmier.status || 'ACTIVE',
      isActive: infirmier.isActive !== undefined ? infirmier.isActive : true,
      password: '',
      userId: infirmier.userId || infirmier.user?.id || null,
    });
    setEditDialog({ open: true, infirmier, loading: false });
  };

  const handleUpdate = async () => {
    const inf = editDialog.infirmier;
    if (!inf || !formData.firstName || !formData.lastName || !formData.email) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!formData.speciality || !String(formData.speciality).trim()) {
      showError('Erreur', 'La spécialité est obligatoire');
      return;
    }

    setEditDialog((d) => ({ ...d, loading: true }));
    try {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      const result = await ConsumApi.updateInfirmier(inf.id, updateData);
      if (result.success) {
        setEditDialog({ open: false, infirmier: null, loading: false });
        resetForm();
        loadInfirmiers();
        setSuccessModal({ open: true, message: 'Infirmier modifié avec succès' });
      } else {
        showApiResponse(result, { successTitle: '', errorTitle: 'Erreur de modification' });
      }
    } catch (error) {
      console.error('Error updating infirmier:', error);
      showError('Erreur', 'Impossible de modifier l\'infirmier');
    } finally {
      setEditDialog((d) => ({ ...d, loading: false }));
    }
  };

  const openDeleteDialog = (infirmier) => {
    setDeleteDialog({ open: true, infirmier, loading: false });
  };

  const handleDelete = async () => {
    if (!deleteDialog.infirmier) return;

    setDeleteDialog((d) => ({ ...d, loading: true }));
    try {
      const result = await ConsumApi.deleteInfirmier(deleteDialog.infirmier.id);
      if (result.success) {
        setDeleteDialog({ open: false, infirmier: null, loading: false });
        loadInfirmiers();
        setSuccessModal({ open: true, message: 'Infirmier supprimé avec succès' });
      } else {
        showApiResponse(result, { successTitle: '', errorTitle: 'Erreur de suppression' });
      }
    } catch (error) {
      console.error('Error deleting infirmier:', error);
      showError('Erreur', 'Impossible de supprimer l\'infirmier');
    } finally {
      setDeleteDialog((d) => ({ ...d, loading: false }));
    }
  };

  const paginatedInfirmiers = infirmiers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const total = infirmiers.length;

  return (
    <>
      <Helmet>
        <title> Infirmiers | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4">Gestion des Infirmiers</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Gérez tous les infirmiers du système
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={openCreateDialog}
              >
                Ajouter un infirmier
              </Button>
            </Stack>
          </Box>

          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, prénom, email, téléphone ou spécialité..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
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
                    {SPECIALITY_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
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
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Nom complet</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Spécialité</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Téléphone</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Email</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Statut</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">Chargement...</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && paginatedInfirmiers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">Aucun infirmier trouvé</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && paginatedInfirmiers.length > 0 && paginatedInfirmiers.map((infirmier) => (
                        <TableRow key={infirmier.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" noWrap>
                              {infirmier.firstName || ''} {infirmier.lastName || ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {GENDER_LABELS[infirmier.gender] || infirmier.gender}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {infirmier.speciality || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {infirmier.phone || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {infirmier.email || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={infirmier.status || 'ACTIVE'}
                              color={STATUS_COLORS[infirmier.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="nowrap">
                              <Tooltip title="Modifier">
                                <IconButton size="small" onClick={() => openEditDialog(infirmier)} color="primary">
                                  <Iconify icon="solar:pen-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton size="small" onClick={() => openDeleteDialog(infirmier)} color="error">
                                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
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
        <DialogTitle>Ajouter un infirmier</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Grid container spacing={2}>
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
              <Grid item xs={12} sm={6} />
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
                <FormControl fullWidth required sx={{ minWidth: '200px' }}>
                  <InputLabel id="create-speciality-label">Spécialité</InputLabel>
                  <Select
                    labelId="create-speciality-label"
                    value={formData.speciality || 'Médecine générale'}
                    label="Spécialité"
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                    sx={{
                      minHeight: 80,
                      fontSize: '1.1rem',
                      '& .MuiSelect-select': { py: 2 },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          '& .MuiMenuItem-root': { fontSize: '1rem', minHeight: 48, py: 1.5 },
                        },
                      },
                    }}
                  >
                    {SPECIALITY_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, infirmier: null, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Modifier l&apos;infirmier</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Grid container spacing={2}>
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
              <Grid item xs={12} sm={6} />
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
              <Grid item xs={12}>
                <FormControl fullWidth required size="medium" sx={{ minWidth: '100%' }}>
                  <InputLabel id="edit-speciality-label">Spécialité</InputLabel>
                  <Select
                    labelId="edit-speciality-label"
                    value={formData.speciality || 'Médecine générale'}
                    label="Spécialité"
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                    sx={{
                      minHeight: 80,
                      fontSize: '1.1rem',
                      '& .MuiSelect-select': { py: 2 },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          '& .MuiMenuItem-root': { fontSize: '1rem', minHeight: 48, py: 1.5 },
                        },
                      },
                    }}
                  >
                    {SPECIALITY_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
          <Button onClick={() => setEditDialog({ open: false, infirmier: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleUpdate} loading={editDialog.loading}>
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, infirmier: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer l&apos;infirmier</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l&apos;infirmier{' '}
            <strong>
              {deleteDialog.infirmier?.firstName} {deleteDialog.infirmier?.lastName}
            </strong>
            ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, infirmier: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" color="error" onClick={handleDelete} loading={deleteDialog.loading}>
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Modal de succès (fermeture auto après 2 s) */}
      <Dialog
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, message: '' })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: (theme) => theme.shadows[20],
          },
        }}
      >
        <Box
          sx={{
            py: 5,
            px: 3,
            textAlign: 'center',
            bgcolor: (theme) => theme.palette.success.main,
            color: (theme) => theme.palette.success.contrastText,
          }}
        >
          <Iconify
            icon="eva:checkmark-circle-2-fill"
            width={72}
            sx={{ mb: 1.5, opacity: 0.95 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Succès
          </Typography>
        </Box>
        <DialogContent sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.primary">
            {successModal.message}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Ce message se ferme automatiquement…
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}
