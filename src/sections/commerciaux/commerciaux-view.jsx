import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Menu,
  Table,
  Stack,
  Button,
  Dialog,
  Avatar,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Container,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export default function CommerciauxView() {
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, user: null });
  
  // Dialog pour modifier un utilisateur
  const [editDialog, setEditDialog] = useState({
    open: false,
    loading: false,
    user: null,
    formData: {
      email: '',
      firstname: '',
      lastname: '',
      telephone: '',
    },
  });
  
  // Dialog pour confirmer la suppression
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    loading: false,
    user: null,
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getUsers();
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateurs chargés',
        errorTitle: 'Erreur de chargement',
      });

      if (processed.success) {
        const usersList = Array.isArray(processed.data) ? processed.data : [];
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Erreur', 'Impossible de charger les utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenActionMenu = (event, user) => {
    setActionMenu({ anchorEl: event.currentTarget, user });
  };

  const handleCloseActionMenu = () => {
    setActionMenu({ anchorEl: null, user: null });
  };

  const handleViewDetails = (user) => {
    handleCloseActionMenu();
    router.push(routesName.commercialDetails.replace(':id', user.id));
  };

  const handleEdit = (user) => {
    handleCloseActionMenu();
    setEditDialog({
      open: true,
      loading: false,
      user,
      formData: {
        email: user.email || '',
        firstname: user.firstname || user.firstName || '',
        lastname: user.lastname || user.lastName || '',
        telephone: user.telephone || user.phoneNumber || user.phone || '',
      },
    });
  };

  const handleCloseEditDialog = () => {
    setEditDialog({
      open: false,
      loading: false,
      user: null,
      formData: {
        email: '',
        firstname: '',
        lastname: '',
        telephone: '',
      },
    });
  };

  const handleUpdateUser = async () => {
    if (!editDialog.user) return;

    setEditDialog(prev => ({ ...prev, loading: true }));
    try {
      const result = await ConsumApi.updateCommercial(editDialog.user.id, editDialog.formData);
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateur modifié',
        errorTitle: 'Erreur de modification',
      });

      if (processed.success) {
        showSuccess('Succès', 'Utilisateur modifié avec succès');
        handleCloseEditDialog();
        loadUsers();
      } else {
        setEditDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Erreur', 'Erreur lors de la modification de l\'utilisateur');
      setEditDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDelete = (user) => {
    handleCloseActionMenu();
    setDeleteDialog({
      open: true,
      loading: false,
      user,
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      loading: false,
      user: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.user) return;

    setDeleteDialog({ ...deleteDialog, loading: true });
    try {
      const result = await ConsumApi.deleteCommercial(deleteDialog.user.id);
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateur supprimé',
        errorTitle: 'Erreur de suppression',
      });

      if (processed.success) {
        showSuccess('Succès', 'Utilisateur supprimé avec succès');
        handleCloseDeleteDialog();
        loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Erreur', 'Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  const handleSuspend = async (user) => {
    handleCloseActionMenu();
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'suspendre' : 'réactiver';
    
    try {
      const result = await ConsumApi.suspendCommercial(user.id, newStatus);
      const processed = showApiResponse(result, {
        successTitle: `Utilisateur ${action} avec succès`,
        errorTitle: `Erreur lors de la ${action}`,
      });

      if (processed.success) {
        showSuccess('Succès', `Utilisateur ${action} avec succès`);
        loadUsers();
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      showError('Erreur', `Erreur lors de la ${action} de l'utilisateur`);
    }
  };

  const getInitials = (firstname, lastname) => {
    const first = firstname ? firstname.charAt(0).toUpperCase() : '';
    const last = lastname ? lastname.charAt(0).toUpperCase() : '';
    return `${first}${last}` || '?';
  };

  const getFullName = (user) => {
    const firstname = user.firstname || user.firstName || '';
    const lastname = user.lastname || user.lastName || '';
    const fullName = `${firstname} ${lastname}`.trim();
    return fullName || user.email || 'Utilisateur';
  };

  const getRoleLabel = (user) => {
    const role = user.role || user.service || 'USER';
    const roleLabels = {
      ADMIN: 'Administrateur',
      COMMERCIAL: 'Commercial',
      COMPTABLE: 'Comptable',
      ADMIN_SITE_WEB: 'Administrateur site web',
      USER: 'Utilisateur',
    };
    return roleLabels[role.toUpperCase()] || role;
  };

  const getRoleColor = (user) => {
    const role = user.role || user.service || 'USER';
    const roleColors = {
      ADMIN: 'error',
      COMMERCIAL: 'primary',
      COMPTABLE: 'warning',
      ADMIN_SITE_WEB: 'info',
      USER: 'default',
    };
    return roleColors[role.toUpperCase()] || 'default';
  };

  // Pagination
  const paginatedUsers = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      {contextHolder}
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Box>
            <Typography variant="h4">Utilisateurs</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Gérez vos utilisateurs et leurs informations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => router.push(routesName.createCommercial)}
          >
            Créer un utilisateur
          </Button>
        </Stack>

        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Téléphone</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date de création</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && paginatedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Iconify icon="solar:user-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          Aucun utilisateur trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && paginatedUsers.length > 0 && paginatedUsers.map((user) => {
                      const fullName = getFullName(user);
                      const initials = getInitials(
                        user.firstname || user.firstName,
                        user.lastname || user.lastName
                      );

                      return (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>{initials}</Avatar>
                              <Typography variant="subtitle2">{fullName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{user.email || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {user.telephone || user.phoneNumber || user.phone || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getRoleLabel(user)}
                              color={getRoleColor(user)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.status === 'suspended' ? 'Suspendu' : 'Actif'}
                              color={user.status === 'suspended' ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {user.createdAt ? fDate(user.createdAt) : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={(e) => handleOpenActionMenu(e, user)}
                              size="small"
                            >
                              <Iconify icon="eva:more-vertical-fill" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePagination
            page={page}
            component="div"
            count={users.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </Card>

        {/* Menu d'actions */}
        <Menu
          open={Boolean(actionMenu.anchorEl)}
          anchorEl={actionMenu.anchorEl}
          onClose={handleCloseActionMenu}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => handleViewDetails(actionMenu.user)}>
            <Iconify icon="eva:eye-fill" sx={{ mr: 2 }} />
            Voir les détails
          </MenuItem>
          <MenuItem onClick={() => handleEdit(actionMenu.user)}>
            <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
            Modifier
          </MenuItem>
          <MenuItem
            onClick={() => handleSuspend(actionMenu.user)}
            sx={{ color: actionMenu.user?.status === 'active' ? 'warning.main' : 'success.main' }}
          >
            <Iconify 
              icon={actionMenu.user?.status === 'active' ? 'eva:lock-fill' : 'eva:unlock-fill'} 
              sx={{ mr: 2 }} 
            />
            {actionMenu.user?.status === 'active' ? 'Suspendre' : 'Réactiver'}
          </MenuItem>
          <MenuItem
            onClick={() => handleDelete(actionMenu.user)}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="eva:trash-2-fill" sx={{ mr: 2 }} />
            Supprimer
          </MenuItem>
        </Menu>

        {/* Dialog pour modifier un utilisateur */}
        <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Prénom"
                value={editDialog.formData.firstname}
                onChange={(e) =>
                  setEditDialog({
                    ...editDialog,
                    formData: { ...editDialog.formData, firstname: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Nom"
                value={editDialog.formData.lastname}
                onChange={(e) =>
                  setEditDialog({
                    ...editDialog,
                    formData: { ...editDialog.formData, lastname: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editDialog.formData.email}
                onChange={(e) =>
                  setEditDialog({
                    ...editDialog,
                    formData: { ...editDialog.formData, email: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Téléphone"
                value={editDialog.formData.telephone}
                onChange={(e) =>
                  setEditDialog({
                    ...editDialog,
                    formData: { ...editDialog.formData, telephone: e.target.value },
                  })
                }
                placeholder="+221771234567"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog} disabled={editDialog.loading}>
              Annuler
            </Button>
            <LoadingButton
              onClick={handleUpdateUser}
              variant="contained"
              loading={editDialog.loading}
            >
              Enregistrer
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog pour confirmer la suppression */}
        <Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{' '}
              {deleteDialog.user
                ? `${deleteDialog.user.firstname || ''} ${deleteDialog.user.lastname || ''}`.trim() ||
                  deleteDialog.user.email
                : ''}
              ? Cette action est irréversible.
            </Typography>
            {deleteDialog.user && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                Note: Impossible de supprimer un utilisateur qui a des clients assignés.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} disabled={deleteDialog.loading}>
              Annuler
            </Button>
            <LoadingButton
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              loading={deleteDialog.loading}
            >
              Supprimer
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

