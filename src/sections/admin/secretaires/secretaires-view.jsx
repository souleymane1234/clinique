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
  'Accueil',
  'Standard',
  'Administratif',
  'Rendez-vous',
  'Facturation',
  'Archivage',
];

const SUCCESS_AUTO_CLOSE_MS = 2000;

export default function SecretairesView() {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [secretaires, setSecretaires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });
  const [editDialog, setEditDialog] = useState({ open: false, secretaire: null, loading: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, secretaire: null, loading: false });
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    speciality: 'Accueil',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    status: 'ACTIVE',
    isActive: true,
    password: '',
  });

  const loadSecretaires = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getSecretaires();
      if (result.success) {
        let list = Array.isArray(result.data) ? result.data : [];
        if (search) {
          const s = search.toLowerCase();
          list = list.filter(
            (n) =>
              (n.firstName || '').toLowerCase().includes(s) ||
              (n.lastName || '').toLowerCase().includes(s) ||
              (n.email || '').toLowerCase().includes(s) ||
              (n.phone || '').toLowerCase().includes(s)
          );
        }
        if (statusFilter) {
          list = list.filter((n) => (n.status || 'ACTIVE') === statusFilter);
        }
        setSecretaires(list);
      } else {
        showError('Erreur', result.message || 'Impossible de charger les secrétaires');
        setSecretaires([]);
      }
    } catch (error) {
      console.error('Error loading secretaires:', error);
      showError('Erreur', 'Impossible de charger les secrétaires');
      setSecretaires([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadSecretaires();
  }, [loadSecretaires]);

  useEffect(() => {
    if (!successModal.open) return undefined;
    const timer = setTimeout(() => {
      setSuccessModal({ open: false, message: '' });
    }, SUCCESS_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [successModal.open]);

  const handleSearch = () => {
    setPage(0);
    loadSecretaires();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(0);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'MALE',
      speciality: 'Accueil',
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
      showError('Erreur', 'La spécialité/département est obligatoire');
      return;
    }

    setCreateDialog((d) => ({ ...d, loading: true }));
    try {
      const result = await ConsumApi.createSecretaire(formData);
      if (result.success) {
        setCreateDialog({ open: false, loading: false });
        resetForm();
        loadSecretaires();
        setSuccessModal({ open: true, message: 'Secrétaire créé(e) avec succès' });
      } else {
        showApiResponse(result, { successTitle: '', errorTitle: 'Erreur de création' });
      }
    } catch (error) {
      console.error('Error creating secretaire:', error);
      showError('Erreur', 'Impossible de créer le/la secrétaire');
    } finally {
      setCreateDialog((d) => ({ ...d, loading: false }));
    }
  };

  const openEditDialog = (secretaire) => {
    setFormData({
      firstName: secretaire.firstName || secretaire.first_name || '',
      lastName: secretaire.lastName || secretaire.last_name || '',
      gender: secretaire.gender || 'MALE',
      speciality: (secretaire.speciality && String(secretaire.speciality).trim()) ? secretaire.speciality : 'Accueil',
      phone: secretaire.phone || '',
      email: secretaire.email || '',
      address: secretaire.address || '',
      city: secretaire.city || '',
      country: secretaire.country || '',
      status: secretaire.status || 'ACTIVE',
      isActive: secretaire.isActive !== undefined ? secretaire.isActive : true,
      password: '',
      userId: secretaire.userId || secretaire.user?.id || null,
    });
    setEditDialog({ open: true, secretaire, loading: false });
  };

  const handleUpdate = async () => {
    const sec = editDialog.secretaire;
    if (!sec || !formData.firstName || !formData.lastName || !formData.email) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!formData.speciality || !String(formData.speciality).trim()) {
      showError('Erreur', 'La spécialité/département est obligatoire');
      return;
    }

    setEditDialog((d) => ({ ...d, loading: true }));
    try {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      const result = await ConsumApi.updateSecretaire(sec.id, updateData);
      if (result.success) {
        setEditDialog({ open: false, secretaire: null, loading: false });
        resetForm();
        loadSecretaires();
        setSuccessModal({ open: true, message: 'Secrétaire modifié(e) avec succès' });
      } else {
        showApiResponse(result, { successTitle: '', errorTitle: 'Erreur de modification' });
      }
    } catch (error) {
      console.error('Error updating secretaire:', error);
      showError('Erreur', 'Impossible de modifier le/la secrétaire');
    } finally {
      setEditDialog((d) => ({ ...d, loading: false }));
    }
  };

  const openDeleteDialog = (secretaire) => {
    setDeleteDialog({ open: true, secretaire, loading: false });
  };

  const handleDelete = async () => {
    if (!deleteDialog.secretaire) return;

    setDeleteDialog((d) => ({ ...d, loading: true }));
    try {
      const result = await ConsumApi.deleteSecretaire(deleteDialog.secretaire.id);
      if (result.success) {
        setDeleteDialog({ open: false, secretaire: null, loading: false });
        loadSecretaires();
        setSuccessModal({ open: true, message: 'Secrétaire supprimé(e) avec succès' });
      } else {
        showApiResponse(result, { successTitle: '', errorTitle: 'Erreur de suppression' });
      }
    } catch (error) {
      console.error('Error deleting secretaire:', error);
      showError('Erreur', 'Impossible de supprimer le/la secrétaire');
    } finally {
      setDeleteDialog((d) => ({ ...d, loading: false }));
    }
  };

  const paginatedSecretaires = secretaires.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const total = secretaires.length;

  return (
    <>
      <Helmet>
        <title> Secrétaires | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4">Gestion des Secrétaires</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Gérez tous les secrétaires du système
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={openCreateDialog}
              >
                Ajouter un(e) secrétaire
              </Button>
            </Stack>
          </Box>

          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, prénom, email ou téléphone..."
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
                <Table size="small" sx={{ minWidth: 700 }}>
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
                    {!loading && paginatedSecretaires.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">Aucun(e) secrétaire trouvé(e)</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && paginatedSecretaires.length > 0 && paginatedSecretaires.map((secretaire) => (
                        <TableRow key={secretaire.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" noWrap>
                              {secretaire.firstName || ''} {secretaire.lastName || ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {GENDER_LABELS[secretaire.gender] || secretaire.gender}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {secretaire.speciality || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {secretaire.phone || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {secretaire.email || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={secretaire.status || 'ACTIVE'}
                              color={STATUS_COLORS[secretaire.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="nowrap">
                              <Tooltip title="Modifier">
                                <IconButton size="small" onClick={() => openEditDialog(secretaire)} color="primary">
                                  <Iconify icon="solar:pen-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton size="small" onClick={() => openDeleteDialog(secretaire)} color="error">
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
        <DialogTitle>Ajouter un(e) secrétaire</DialogTitle>
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
                <FormControl fullWidth required>
                  <InputLabel>Spécialité / Département</InputLabel>
                  <Select
                    value={formData.speciality || 'Accueil'}
                    label="Spécialité / Département"
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
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
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, secretaire: null, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Modifier le/la secrétaire</DialogTitle>
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
                <FormControl fullWidth required>
                  <InputLabel>Spécialité / Département</InputLabel>
                  <Select
                    value={formData.speciality || 'Accueil'}
                    label="Spécialité / Département"
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
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
          <Button onClick={() => setEditDialog({ open: false, secretaire: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleUpdate} loading={editDialog.loading}>
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, secretaire: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer le/la secrétaire</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le/la secrétaire{' '}
            <strong>
              {deleteDialog.secretaire?.firstName} {deleteDialog.secretaire?.lastName}
            </strong>
            ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, secretaire: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" color="error" onClick={handleDelete} loading={deleteDialog.loading}>
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Modal de succès */}
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
