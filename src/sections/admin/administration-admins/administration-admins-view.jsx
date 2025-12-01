import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  Alert,
  Button,
  Dialog,
  Tooltip,
  TableRow,
  Checkbox,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export default function AdministrationAdminsView() {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  // Dialogs
  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });
  const [editDialog, setEditDialog] = useState({ open: false, admin: null, loading: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, admin: null, loading: false });
  const [resetPasswordDialog, setResetPasswordDialog] = useState({ open: false, admin: null, newPassword: '', loading: false });
  const [activityDialog, setActivityDialog] = useState({ open: false, admin: null, activity: null, loading: false });
  const [statusDialog, setStatusDialog] = useState({ open: false, admin: null, loading: false });

  // Form states
  const [createForm, setCreateForm] = useState({
    email: '',
    phone: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const [editForm, setEditForm] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    isSuspended: false,
  });

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getAdministrationAdmins();
      if (result.success) {
        const adminsList = result.data.admins || result.data || [];
        setAdmins(Array.isArray(adminsList) ? adminsList : []);
      } else {
        showApiResponse(result);
        setAdmins([]);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      showError('Erreur', 'Impossible de charger les administrateurs');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async () => {
    if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName) {
      showError('Erreur de validation', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreateDialog({ ...createDialog, loading: true });
    try {
      const result = await ConsumApi.createAdministrationAdmin(createForm);
      const processed = showApiResponse(result, {
        successTitle: 'Admin créé',
        errorTitle: 'Erreur de création',
      });

      if (processed.success) {
        setCreateDialog({ open: false, loading: false });
        setCreateForm({ email: '', phone: '', password: '', firstName: '', lastName: '' });
        loadAdmins();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de créer l\'administrateur');
    } finally {
      setCreateDialog({ ...createDialog, loading: false });
    }
  };

  const handleEditAdmin = async () => {
    if (!editDialog.admin) return;

    setEditDialog({ ...editDialog, loading: true });
    try {
      const result = await ConsumApi.updateAdministrationAdmin(editDialog.admin.id, editForm);
      const processed = showApiResponse(result, {
        successTitle: 'Admin modifié',
        errorTitle: 'Erreur de modification',
      });

      if (processed.success) {
        setEditDialog({ open: false, admin: null, loading: false });
        loadAdmins();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de modifier l\'administrateur');
    } finally {
      setEditDialog({ ...editDialog, loading: false });
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteDialog.admin) return;

    setDeleteDialog({ ...deleteDialog, loading: true });
    try {
      const result = await ConsumApi.deleteAdministrationAdmin(deleteDialog.admin.id);
      const processed = showApiResponse(result, {
        successTitle: 'Admin supprimé',
        errorTitle: 'Erreur de suppression',
      });

      if (processed.success) {
        setDeleteDialog({ open: false, admin: null, loading: false });
        loadAdmins();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de supprimer l\'administrateur');
    } finally {
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordDialog.admin || !resetPasswordDialog.newPassword) {
      showError('Erreur', 'Veuillez entrer un nouveau mot de passe');
      return;
    }

    setResetPasswordDialog({ ...resetPasswordDialog, loading: true });
    try {
      const result = await ConsumApi.resetAdministrationAdminPassword(
        resetPasswordDialog.admin.id,
        resetPasswordDialog.newPassword
      );
      const processed = showApiResponse(result, {
        successTitle: 'Mot de passe réinitialisé',
        errorTitle: 'Erreur de réinitialisation',
      });

      if (processed.success) {
        setResetPasswordDialog({ open: false, admin: null, newPassword: '', loading: false });
      }
    } catch (error) {
      showError('Erreur', 'Impossible de réinitialiser le mot de passe');
    } finally {
      setResetPasswordDialog({ ...resetPasswordDialog, loading: false });
    }
  };

  const handleToggleStatus = async () => {
    if (!statusDialog.admin) return;

    setStatusDialog({ ...statusDialog, loading: true });
    try {
      const result = await ConsumApi.updateAdministrationAdminStatus(
        statusDialog.admin.id,
        !statusDialog.admin.isSuspended
      );
      const processed = showApiResponse(result, {
        successTitle: 'Statut modifié',
        errorTitle: 'Erreur de modification',
      });

      if (processed.success) {
        setStatusDialog({ open: false, admin: null, loading: false });
        loadAdmins();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de modifier le statut');
    } finally {
      setStatusDialog({ ...statusDialog, loading: false });
    }
  };

  const handleViewActivity = async (admin) => {
    setActivityDialog({ open: true, admin, activity: null, loading: true });
    try {
      const result = await ConsumApi.getAdministrationAdminActivity(admin.id);
      if (result.success) {
        setActivityDialog({ ...activityDialog, activity: result.data, loading: false });
      } else {
        showApiResponse(result);
        setActivityDialog({ ...activityDialog, loading: false });
      }
    } catch (error) {
      showError('Erreur', 'Impossible de charger l\'activité');
      setActivityDialog({ ...activityDialog, loading: false });
    }
  };

  const openEditDialog = (admin) => {
    setEditForm({
      email: admin.email || '',
      phone: admin.phone || '',
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      isSuspended: admin.isSuspended || false,
    });
    setEditDialog({ open: true, admin, loading: false });
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = admins.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const isNotFound = !admins.length && !loading;

  return (
    <>
      <Helmet>
        <title>Gestion des Administrateurs | CarbuGo</title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4">Gestion des Administrateurs</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Gérez les administrateurs de la plateforme (Super Admin uniquement)
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:user-plus-bold" />}
              onClick={() => setCreateDialog({ open: true, loading: false })}
            >
              Créer un admin
            </Button>
          </Box>

          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="medium" sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selected.length > 0 && selected.length < admins.length}
                          checked={admins.length > 0 && selected.length === admins.length}
                          onChange={handleSelectAllClick}
                        />
                      </TableCell>
                      <TableCell>Nom</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Téléphone</TableCell>
                      <TableCell>Rôle</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Date de création</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admins.map((admin) => {
                      const selectedAdmin = selected.indexOf(admin.id) !== -1;
                      const fullName = admin.firstName && admin.lastName
                        ? `${admin.firstName} ${admin.lastName}`
                        : admin.email;

                      return (
                        <TableRow
                          hover
                          key={admin.id}
                          tabIndex={-1}
                          role="checkbox"
                          selected={selectedAdmin}
                          onClick={(event) => handleClick(event, admin.id)}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox disableRipple checked={selectedAdmin} />
                          </TableCell>
                          <TableCell component="th" scope="row" padding="none">
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 2 }}>
                              <Typography variant="subtitle2" noWrap>
                                {fullName}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>{admin.phone || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={admin.role || 'ADMIN'}
                              color={admin.role === 'SUPERADMIN' ? 'error' : 'primary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={admin.isSuspended ? 'Suspendu' : 'Actif'}
                              color={admin.isSuspended ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {admin.createdAt
                              ? new Date(admin.createdAt).toLocaleDateString('fr-FR')
                              : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Voir l'activité">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewActivity(admin);
                                }}
                              >
                                <Iconify icon="solar:eye-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Modifier">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(admin);
                                }}
                              >
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Réinitialiser le mot de passe">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResetPasswordDialog({ open: true, admin, newPassword: '', loading: false });
                                }}
                              >
                                <Iconify icon="solar:key-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={admin.isSuspended ? 'Activer' : 'Suspendre'}>
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStatusDialog({ open: true, admin, loading: false });
                                }}
                              >
                                <Iconify
                                  icon={admin.isSuspended ? 'solar:check-circle-bold' : 'solar:forbidden-circle-bold'}
                                />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDialog({ open: true, admin, loading: false });
                                }}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {loading && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    )}

                    {isNotFound && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="h6" sx={{ py: 3 }}>
                            Aucun administrateur trouvé
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          </Card>
        </Stack>
      </Container>

      {/* Create Admin Dialog */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un administrateur</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Prénom *"
              value={createForm.firstName}
              onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Nom *"
              value={createForm.lastName}
              onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Téléphone"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
            <TextField
              fullWidth
              label="Mot de passe *"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false, loading: false })}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateAdmin}
            disabled={createDialog.loading}
          >
            {createDialog.loading ? 'Création...' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, admin: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l&apos;administrateur</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Prénom *"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Nom *"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Téléphone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, admin: null, loading: false })}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleEditAdmin}
            disabled={editDialog.loading}
          >
            {editDialog.loading ? 'Modification...' : 'Modifier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Admin Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, admin: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer l&apos;administrateur</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cette action est irréversible. Impossible de supprimer le dernier admin actif.
          </Alert>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l&apos;administrateur{' '}
            <strong>{deleteDialog.admin?.firstName} {deleteDialog.admin?.lastName}</strong> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, admin: null, loading: false })}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAdmin}
            disabled={deleteDialog.loading}
          >
            {deleteDialog.loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog.open} onClose={() => setResetPasswordDialog({ open: false, admin: null, newPassword: '', loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Nouveau mot de passe pour{' '}
              <strong>{resetPasswordDialog.admin?.firstName} {resetPasswordDialog.admin?.lastName}</strong>
            </Typography>
            <TextField
              fullWidth
              label="Nouveau mot de passe *"
              type="password"
              value={resetPasswordDialog.newPassword}
              onChange={(e) => setResetPasswordDialog({ ...resetPasswordDialog, newPassword: e.target.value })}
              helperText="Le mot de passe doit contenir au moins 8 caractères"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialog({ open: false, admin: null, newPassword: '', loading: false })}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={resetPasswordDialog.loading}
          >
            {resetPasswordDialog.loading ? 'Réinitialisation...' : 'Réinitialiser'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog
        open={activityDialog.open}
        onClose={() => setActivityDialog({ open: false, admin: null, activity: null, loading: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Activité de {activityDialog.admin?.firstName} {activityDialog.admin?.lastName}
        </DialogTitle>
        <DialogContent>
          {(() => {
            if (activityDialog.loading) {
              return (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              );
            }
            if (activityDialog.activity) {
              return (
                <Box sx={{ mt: 2 }}>
                  <Stack spacing={3}>
                    {activityDialog.activity.connexions && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Connexions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activityDialog.activity.connexions.length || 0} connexion(s)
                        </Typography>
                      </Box>
                    )}
                    {activityDialog.activity.stationActions && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Actions sur les stations
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activityDialog.activity.stationActions.length || 0} action(s)
                        </Typography>
                      </Box>
                    )}
                    {activityDialog.activity.userActions && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Actions sur les utilisateurs
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activityDialog.activity.userActions.length || 0} action(s)
                        </Typography>
                      </Box>
                    )}
                    {(!activityDialog.activity.connexions && 
                      !activityDialog.activity.stationActions && 
                      !activityDialog.activity.userActions) && (
                      <Typography variant="body2" color="text.secondary">
                        Aucune activité enregistrée
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            }
            return (
              <Typography variant="body2" color="text.secondary">
                Aucune activité trouvée
              </Typography>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialog({ open: false, admin: null, activity: null, loading: false })}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, admin: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {statusDialog.admin?.isSuspended ? 'Activer' : 'Suspendre'} l&apos;administrateur
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir {statusDialog.admin?.isSuspended ? 'activer' : 'suspendre'} l&apos;administrateur{' '}
            <strong>{statusDialog.admin?.firstName} {statusDialog.admin?.lastName}</strong> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, admin: null, loading: false })}>Annuler</Button>
          <Button
            variant="contained"
            color={statusDialog.admin?.isSuspended ? 'success' : 'warning'}
            onClick={handleToggleStatus}
            disabled={statusDialog.loading}
          >
            {(() => {
              if (statusDialog.loading) return 'Modification...';
              return statusDialog.admin?.isSuspended ? 'Activer' : 'Suspendre';
            })()}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

