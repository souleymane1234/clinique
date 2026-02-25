import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
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
  InputAdornment,
  TablePagination,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const ROLE_COLORS = {
  DIRECTEUR: 'error',
  RH: 'warning',
  COMPTABLE: 'info',
  ACHAT: 'primary',
  ASSURANCE: 'secondary',
  LABORANTIN: 'success',
  MEDECIN: 'error',
  INFIRMIER: 'warning',
  AIDE_SOIGNANT: 'info',
  ADMINISTRATEUR: 'default',
  // Rôles legacy (au cas où)
  SUPERADMIN: 'error',
  ADMIN: 'warning',
  STATION: 'info',
  POMPISTE: 'primary',
  USER: 'default',
};

const ROLE_LABELS = {
  DIRECTEUR: 'Directeur',
  RH: 'RH',
  COMPTABLE: 'Comptable',
  ACHAT: 'Achat',
  ASSURANCE: 'Assurance',
  LABORANTIN: 'Laborantin',
  MEDECIN: 'Médecin',
  INFIRMIER: 'Infirmier',
  AIDE_SOIGNANT: 'Aide-soignant',
  ADMINISTRATEUR: 'Administrateur',
};

export default function UsersView() {
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isSuspendedFilter, setIsSuspendedFilter] = useState('');

  // Dialogs
  const [statusDialog, setStatusDialog] = useState({ open: false, user: null, loading: false });
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null, newRole: '', loading: false });
  const [passwordDialog, setPasswordDialog] = useState({ open: false, user: null, newPassword: '', showPassword: false, loading: false });
  const [createUserDialog, setCreateUserDialog] = useState({ open: false, loading: false });
  const [roles, setRoles] = useState([]);
  const [createUserForm, setCreateUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id: '',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getUsersNew();
      console.log('loadUsers - result from getUsersNew:', result);
      
      // Traiter la réponse directement
      let usersList = [];
      if (result && result.success) {
        if (Array.isArray(result.data)) {
          usersList = result.data;
        } else if (result.data && Array.isArray(result.data.data)) {
          usersList = result.data.data;
        } else if (result.data && Array.isArray(result.data.users)) {
          usersList = result.data.users;
        }
      } else if (Array.isArray(result)) {
        // Si result est directement un tableau (cas où ApiClient retourne directement le tableau)
        usersList = result;
      } else if (result && Array.isArray(result.data)) {
        usersList = result.data;
      }
      
      console.log('loadUsers - usersList before filters:', usersList.length, usersList);
      
      if (usersList.length > 0 || result) {
        // Appliquer les filtres côté client si nécessaire
        if (search) {
          const searchLower = search.toLowerCase();
          usersList = usersList.filter((user) => {
            const firstName = (user.first_name || user.firstName || '').toLowerCase();
            const lastName = (user.last_name || user.lastName || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            const phone = (user.phone || user.phoneNumber || '').toLowerCase();
            return firstName.includes(searchLower) || 
                   lastName.includes(searchLower) || 
                   email.includes(searchLower) || 
                   phone.includes(searchLower);
          });
        }
        if (roleFilter) {
          usersList = usersList.filter((user) => {
            const userRole = user.role?.id || user.role?.name || user.role_id || user.role;
            return userRole === roleFilter;
          });
        }
        if (isSuspendedFilter !== '') {
          const isSuspended = isSuspendedFilter === 'true';
          usersList = usersList.filter((user) => {
            const userSuspended = user.is_locked || user.isLocked || user.isSuspended || false;
            return userSuspended === isSuspended;
          });
        }
        console.log('loadUsers - usersList after filters:', usersList.length, usersList);
        setUsers(usersList);
      } else {
        console.warn('loadUsers - No users found or invalid response:', result);
        // Même si on n'a pas de données, on définit quand même un tableau vide
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Erreur', 'Impossible de charger les utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, isSuspendedFilter]);

  // Charger les rôles disponibles
  const loadRoles = useCallback(async () => {
    try {
      const result = await ConsumApi.getRoles();
      if (result && result.success) {
        let rolesList = [];
        if (Array.isArray(result.data)) {
          rolesList = result.data;
        } else if (result.data && Array.isArray(result.data.roles)) {
          rolesList = result.data.roles;
        } else if (result.data && Array.isArray(result.data.data)) {
          rolesList = result.data.data;
        }
        setRoles(rolesList);
      } else if (Array.isArray(result)) {
        setRoles(result);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      // En cas d'erreur, utiliser une liste de rôles par défaut
      setRoles([
        { id: 'DIRECTEUR', name: 'Directeur' },
        { id: 'RH', name: 'RH' },
        { id: 'COMPTABLE', name: 'Comptable' },
        { id: 'ACHAT', name: 'Achat' },
        { id: 'ASSURANCE', name: 'Assurance' },
        { id: 'LABORANTIN', name: 'Laborantin' },
        { id: 'MEDECIN', name: 'Médecin' },
        { id: 'INFIRMIER', name: 'Infirmier' },
        { id: 'AIDE_SOIGNANT', name: 'Aide-soignant' },
        { id: 'ADMINISTRATEUR', name: 'Administrateur' },
      ]);
    }
  }, []);

  // Charger les utilisateurs au montage et quand les filtres changent
  useEffect(() => {
    loadRoles();
    const timer = setTimeout(() => {
      loadUsers();
    }, search ? 500 : 0); // Debounce de 500ms seulement pour la recherche textuelle
    
    return () => clearTimeout(timer);
  }, [search, roleFilter, isSuspendedFilter, loadUsers, loadRoles]);

  const handleSearch = () => {
    setPage(0);
    loadUsers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setIsSuspendedFilter('');
    setPage(0);
  };

  const openStatusDialog = (user) => {
    setStatusDialog({ open: true, user, loading: false });
  };

  const handleToggleStatus = async () => {
    if (!statusDialog.user) return;

    setStatusDialog({ ...statusDialog, loading: true });
    try {
      const result = await ConsumApi.toggleUserLock(statusDialog.user.id);
      const processed = showApiResponse(result, {
        successTitle: 'Statut modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        const newStatus = processed.data?.is_locked || processed.data?.isLocked || false;
        showSuccess('Succès', `Utilisateur ${newStatus ? 'bloqué' : 'débloqué'} avec succès`);
        setStatusDialog({ open: false, user: null, loading: false });
        loadUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      showError('Erreur', 'Impossible de modifier le statut de l\'utilisateur');
    } finally {
      setStatusDialog({ ...statusDialog, loading: false });
    }
  };

  const openRoleDialog = (user) => {
    setRoleDialog({ open: true, user, newRole: user.role, loading: false });
  };

  const handleUpdateRole = async () => {
    if (!roleDialog.user || !roleDialog.newRole) return;

    setRoleDialog({ ...roleDialog, loading: true });
    try {
      // Si newRole est un ID de rôle, l'utiliser directement, sinon chercher l'ID
      const roleId = typeof roleDialog.newRole === 'string' && roleDialog.newRole.length > 20 
        ? roleDialog.newRole 
        : roleDialog.newRole; // Supposons que c'est déjà un ID ou qu'il faut le convertir
      
      const result = await ConsumApi.updateUserNew(roleDialog.user.id, { role_id: roleId });
      const processed = showApiResponse(result, {
        successTitle: 'Rôle modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le rôle a été modifié avec succès');
        setRoleDialog({ open: false, user: null, newRole: '', loading: false });
        loadUsers();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      showError('Erreur', 'Impossible de modifier le rôle de l\'utilisateur');
    } finally {
      setRoleDialog({ ...roleDialog, loading: false });
    }
  };

  const openPasswordDialog = (user) => {
    setPasswordDialog({ open: true, user, newPassword: '', showPassword: false, loading: false });
  };

  const handleChangePassword = async () => {
    if (!passwordDialog.user || !passwordDialog.newPassword || passwordDialog.newPassword.length < 8) {
      showError('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setPasswordDialog({ ...passwordDialog, loading: true });
    try {
      const result = await ConsumApi.changeUserPasswordNew(passwordDialog.user.id, passwordDialog.newPassword);
      const processed = showApiResponse(result, {
        successTitle: 'Mot de passe modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le mot de passe a été modifié avec succès');
        setPasswordDialog({ open: false, user: null, newPassword: '', showPassword: false, loading: false });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Erreur', 'Impossible de modifier le mot de passe');
    } finally {
      setPasswordDialog({ ...passwordDialog, loading: false });
    }
  };

  const openCreateUserDialog = () => {
    setCreateUserForm({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role_id: '',
    });
    setCreateUserDialog({ open: true, loading: false });
  };

  const handleCloseCreateUserDialog = () => {
    setCreateUserDialog({ open: false, loading: false });
    setCreateUserForm({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role_id: '',
    });
  };

  const handleCreateUser = async () => {
    if (!createUserForm.first_name.trim() || !createUserForm.last_name.trim() || !createUserForm.email.trim() || !createUserForm.password.trim() || !createUserForm.role_id) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (createUserForm.password.length < 8) {
      showError('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setCreateUserDialog({ open: true, loading: true });
    try {
      const result = await ConsumApi.createUserNew({
        first_name: createUserForm.first_name.trim(),
        last_name: createUserForm.last_name.trim(),
        email: createUserForm.email.trim(),
        password: createUserForm.password,
        role_id: createUserForm.role_id,
      });
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateur créé',
        errorTitle: 'Erreur de création',
      });
      if (processed.success) {
        showSuccess('Succès', 'Utilisateur créé avec succès');
        handleCloseCreateUserDialog();
        loadUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Erreur', 'Impossible de créer l\'utilisateur');
    } finally {
      setCreateUserDialog({ open: true, loading: false });
    }
  };

  return (
    <>
      <Helmet>
        <title> Utilisateurs | PREVENTIC </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4">Gestion des Utilisateurs</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gérez tous les utilisateurs du système
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={openCreateUserDialog}
            >
              Créer un utilisateur
            </Button>
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, prénom, email ou téléphone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                InputProps={{
                  startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
                }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                  <InputLabel>Rôle</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Rôle"
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="DIRECTEUR">Directeur</MenuItem>
                    <MenuItem value="RH">RH</MenuItem>
                    <MenuItem value="COMPTABLE">Comptable</MenuItem>
                    <MenuItem value="ACHAT">Achat</MenuItem>
                    <MenuItem value="ASSURANCE">Assurance</MenuItem>
                    <MenuItem value="LABORANTIN">Laborantin</MenuItem>
                    <MenuItem value="MEDECIN">Médecin</MenuItem>
                    <MenuItem value="INFIRMIER">Infirmier</MenuItem>
                    <MenuItem value="AIDE_SOIGNANT">Aide-soignant</MenuItem>
                    <MenuItem value="ADMINISTRATEUR">Administrateur</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={isSuspendedFilter}
                    label="Statut"
                    onChange={(e) => setIsSuspendedFilter(e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="false">Actif</MenuItem>
                    <MenuItem value="true">Suspendu</MenuItem>
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
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Nom</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Prénom</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Mail</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Rôle</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {(() => {
                      if (loading) {
                        return (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                              <Typography color="text.secondary">Chargement...</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (users.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                              <Typography color="text.secondary">Aucun utilisateur trouvé</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return users
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((user) => (
                          <TableRow key={user.id} hover>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {user.first_name || user.firstName || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" noWrap>
                                {user.last_name || user.lastName || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {user.email || user.mail || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={ROLE_LABELS[user.role?.name || user.role?.id || user.role_id || user.role] || user.role?.name || user.role || 'N/A'}
                                color={ROLE_COLORS[user.role?.name || user.role?.id || user.role_id || user.role] || 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="nowrap">
                                <Tooltip title="Voir les détails">
                                  <IconButton
                                    size="small"
                                    onClick={() => router.push(routesName.adminUserDetails.replace(':id', user.id))}
                                    color="primary"
                                  >
                                    <Iconify icon="eva:eye-fill" width={18} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={(user.is_locked || user.isLocked || user.isSuspended) ? 'Débloquer' : 'Bloquer'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => openStatusDialog(user)}
                                    color={(user.is_locked || user.isLocked || user.isSuspended) ? 'success' : 'warning'}
                                  >
                                    <Iconify icon={(user.is_locked || user.isLocked || user.isSuspended) ? 'solar:user-check-bold' : 'solar:user-block-bold'} width={18} />
                                  </IconButton>
                                </Tooltip>
                                {user.role !== 'SUPERADMIN' && (
                                  <Tooltip title="Modifier le rôle">
                                    <IconButton
                                      size="small"
                                      onClick={() => openRoleDialog(user)}
                                      color="info"
                                    >
                                      <Iconify icon="solar:user-id-bold" width={18} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Changer le mot de passe">
                                  <IconButton
                                    size="small"
                                    onClick={() => openPasswordDialog(user)}
                                    color="warning"
                                  >
                                    <Iconify icon="solar:lock-password-bold" width={18} />
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
              count={users.length}
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

      {/* Status Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, user: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {(statusDialog.user?.is_locked || statusDialog.user?.isLocked || statusDialog.user?.isSuspended) ? 'Débloquer' : 'Bloquer'} l&apos;utilisateur
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir {(statusDialog.user?.is_locked || statusDialog.user?.isLocked || statusDialog.user?.isSuspended) ? 'débloquer' : 'bloquer'} l&apos;utilisateur{' '}
            <strong>
              {statusDialog.user?.first_name || statusDialog.user?.firstName} {statusDialog.user?.last_name || statusDialog.user?.lastName}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, user: null, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color={(statusDialog.user?.is_locked || statusDialog.user?.isLocked || statusDialog.user?.isSuspended) ? 'success' : 'warning'}
            onClick={handleToggleStatus}
            loading={statusDialog.loading}
          >
            {(statusDialog.user?.is_locked || statusDialog.user?.isLocked || statusDialog.user?.isSuspended) ? 'Débloquer' : 'Bloquer'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialog.open} onClose={() => setRoleDialog({ open: false, user: null, newRole: '', loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le rôle</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Alert severity="info">
              Modifier le rôle de <strong>{roleDialog.user?.firstName} {roleDialog.user?.lastName}</strong>
            </Alert>
            <FormControl fullWidth>
              <InputLabel>Nouveau rôle</InputLabel>
              <Select
                value={roleDialog.newRole}
                label="Nouveau rôle"
                onChange={(e) => setRoleDialog({ ...roleDialog, newRole: e.target.value })}
              >
                <MenuItem value="DIRECTEUR">Directeur</MenuItem>
                <MenuItem value="RH">RH</MenuItem>
                <MenuItem value="COMPTABLE">Comptable</MenuItem>
                <MenuItem value="ACHAT">Achat</MenuItem>
                <MenuItem value="ASSURANCE">Assurance</MenuItem>
                <MenuItem value="LABORANTIN">Laborantin</MenuItem>
                <MenuItem value="MEDECIN">Médecin</MenuItem>
                <MenuItem value="INFIRMIER">Infirmier</MenuItem>
                <MenuItem value="AIDE_SOIGNANT">Aide-soignant</MenuItem>
                <MenuItem value="ADMINISTRATEUR">Administrateur</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="warning">
              Attention : Impossible de modifier le rôle d&apos;un Super Admin ou de créer un Super Admin.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog({ open: false, user: null, newRole: '', loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleUpdateRole}
            loading={roleDialog.loading}
            disabled={!roleDialog.newRole || roleDialog.newRole === roleDialog.user?.role}
          >
            Modifier
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserDialog.open} onClose={handleCloseCreateUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un utilisateur</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Prénom *"
              value={createUserForm.first_name}
              onChange={(e) => setCreateUserForm({ ...createUserForm, first_name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Nom *"
              value={createUserForm.last_name}
              onChange={(e) => setCreateUserForm({ ...createUserForm, last_name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={createUserForm.email}
              onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Mot de passe *"
              type="password"
              value={createUserForm.password}
              onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
              required
              helperText="Le mot de passe doit contenir au moins 8 caractères"
            />
            <FormControl fullWidth required>
              <InputLabel>Rôle *</InputLabel>
              <Select
                value={createUserForm.role_id}
                label="Rôle *"
                onChange={(e) => setCreateUserForm({ ...createUserForm, role_id: e.target.value })}
              >
                {roles.length === 0 ? (
                  <MenuItem value="" disabled>
                    Chargement des rôles...
                  </MenuItem>
                ) : (
                  roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name || role.nom_role || role.id}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateUserDialog}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleCreateUser}
            loading={createUserDialog.loading}
            disabled={
              !createUserForm.first_name.trim() ||
              !createUserForm.last_name.trim() ||
              !createUserForm.email.trim() ||
              !createUserForm.password.trim() ||
              createUserForm.password.length < 8 ||
              !createUserForm.role_id
            }
          >
            Créer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialog.open} onClose={() => setPasswordDialog({ open: false, user: null, newPassword: '', showPassword: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Changer le mot de passe</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Alert severity="warning">
              Vous allez modifier le mot de passe de <strong>{passwordDialog.user?.firstName} {passwordDialog.user?.lastName}</strong>.
              L&apos;utilisateur devra utiliser le nouveau mot de passe pour se connecter.
            </Alert>
            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type={passwordDialog.showPassword ? 'text' : 'password'}
              value={passwordDialog.newPassword}
              onChange={(e) => setPasswordDialog({ ...passwordDialog, newPassword: e.target.value })}
              helperText="Le mot de passe doit contenir au moins 8 caractères"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setPasswordDialog({ ...passwordDialog, showPassword: !passwordDialog.showPassword })}
                      edge="end"
                    >
                      <Iconify icon={passwordDialog.showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Alert severity="info">
              Le mot de passe sera hashé avant d&apos;être stocké en base de données.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog({ open: false, user: null, newPassword: '', showPassword: false, loading: false })}>
            Annuler
          </Button>
          <LoadingButton
            variant="contained"
            color="warning"
            onClick={handleChangePassword}
            loading={passwordDialog.loading}
            disabled={!passwordDialog.newPassword || passwordDialog.newPassword.length < 8}
          >
            Modifier le mot de passe
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

