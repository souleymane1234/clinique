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
  TablePagination,
  InputAdornment,
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.search = search;
      if (roleFilter) filters.role = roleFilter;
      if (isSuspendedFilter !== '') {
        filters.isSuspended = isSuspendedFilter === 'true';
      }

      const result = await ConsumApi.getUsers(filters);
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateurs chargés',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success) {
        setUsers(Array.isArray(processed.data) ? processed.data : []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Erreur', 'Impossible de charger les utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, isSuspendedFilter]);

  // Charger les utilisateurs avec debounce pour éviter trop de requêtes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, search ? 500 : 0); // Debounce de 500ms seulement pour la recherche textuelle
    
    return () => clearTimeout(timer);
  }, [loadUsers]);

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
      const newStatus = !statusDialog.user.isSuspended;
      const result = await ConsumApi.updateUserStatus(statusDialog.user.id, newStatus);
      const processed = showApiResponse(result, {
        successTitle: 'Statut modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', `Utilisateur ${newStatus ? 'suspendu' : 'réactivé'} avec succès`);
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
      const result = await ConsumApi.updateUserRole(roleDialog.user.id, roleDialog.newRole);
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
      const result = await ConsumApi.changeUserPassword(passwordDialog.user.id, passwordDialog.newPassword);
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

  return (
    <>
      <Helmet>
        <title> Utilisateurs | AnnourTravel </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Gestion des Utilisateurs</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gérez tous les utilisateurs du système
            </Typography>
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
                    onClick={handleSearch} 
                    startIcon={<Iconify icon="eva:search-fill" />}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
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
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Matricule</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Noms</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Numéro</TableCell>
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
                                {user.matricule || user.id?.substring(0, 8) || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" noWrap>
                                {user.firstName || ''} {user.lastName || ''}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {user.phone || user.phoneNumber || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={ROLE_LABELS[user.role] || user.role || 'N/A'}
                                color={ROLE_COLORS[user.role] || 'default'}
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
                                <Tooltip title={user.isSuspended ? 'Réactiver' : 'Suspendre'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => openStatusDialog(user)}
                                    color={user.isSuspended ? 'success' : 'warning'}
                                  >
                                    <Iconify icon={user.isSuspended ? 'solar:user-check-bold' : 'solar:user-block-bold'} width={18} />
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
          {statusDialog.user?.isSuspended ? 'Réactiver' : 'Suspendre'} l&apos;utilisateur
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir {statusDialog.user?.isSuspended ? 'réactiver' : 'suspendre'} l&apos;utilisateur{' '}
            <strong>
              {statusDialog.user?.firstName} {statusDialog.user?.lastName}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, user: null, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            color={statusDialog.user?.isSuspended ? 'success' : 'warning'}
            onClick={handleToggleStatus}
            loading={statusDialog.loading}
          >
            {statusDialog.user?.isSuspended ? 'Réactiver' : 'Suspendre'}
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

