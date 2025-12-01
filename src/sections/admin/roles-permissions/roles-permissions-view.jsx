import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { TabList, TabPanel, TabContext, LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Chip,
  Stack,
  Table,
  Alert,
  Paper,
  Button,
  Dialog,
  Select,
  Divider,
  Tooltip,
  MenuItem,
  TableRow,
  TextField,
  Container,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const ROLE_COLORS = {
  SUPERADMIN: 'error',
  ADMIN: 'warning',
  STATION: 'info',
  POMPISTE: 'secondary',
  USER: 'default',
};

export default function RolesPermissionsView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();
  
  const [currentTab, setCurrentTab] = useState('matrix');
  const [loading, setLoading] = useState(false);

  // Matrice des permissions
  const [permissionsMatrix, setPermissionsMatrix] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);

  // Liste des utilisateurs
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Dialogs
  const [changeRoleDialog, setChangeRoleDialog] = useState({ open: false, user: null, newRole: '' });
  const [resetPasswordDialog, setResetPasswordDialog] = useState({ open: false, user: null, newPassword: '', confirmPassword: '' });
  const [disconnectDialog, setDisconnectDialog] = useState({ open: false, user: null });

  useEffect(() => {
    if (currentTab === 'matrix') {
      loadPermissionsMatrix();
    } else if (currentTab === 'users') {
      loadUsers();
    }
  }, [currentTab]);

  const loadPermissionsMatrix = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getRolesPermissionsMatrix();
      const processed = showApiResponse(result, {
        successTitle: 'Matrice chargée',
        errorTitle: 'Erreur de chargement',
      });
      if (processed.success && processed.data) {
        setPermissionsMatrix(processed.data.matrix);
        setHierarchy(processed.data.hierarchy);
      }
    } catch (error) {
      console.error('Error loading permissions matrix:', error);
      showError('Erreur', 'Impossible de charger la matrice des permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await ConsumApi.getRolesUsers();
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
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChangeRole = async () => {
    if (!changeRoleDialog.user || !changeRoleDialog.newRole) {
      showError('Erreur', 'Veuillez sélectionner un rôle');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.updateRolesUserRole(changeRoleDialog.user.id, changeRoleDialog.newRole);
      const processed = showApiResponse(result, {
        successTitle: 'Rôle modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le rôle de l\'utilisateur a été modifié avec succès');
        setChangeRoleDialog({ open: false, user: null, newRole: '' });
        loadUsers();
      }
    } catch (error) {
      console.error('Error changing role:', error);
      showError('Erreur', 'Impossible de modifier le rôle');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordDialog.user || !resetPasswordDialog.newPassword) {
      showError('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (resetPasswordDialog.newPassword !== resetPasswordDialog.confirmPassword) {
      showError('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (resetPasswordDialog.newPassword.length < 8) {
      showError('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.resetRolesUserPassword(resetPasswordDialog.user.id, resetPasswordDialog.newPassword);
      const processed = showApiResponse(result, {
        successTitle: 'Mot de passe réinitialisé',
        errorTitle: 'Erreur de réinitialisation',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le mot de passe de l\'utilisateur a été réinitialisé avec succès');
        setResetPasswordDialog({ open: false, user: null, newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showError('Erreur', 'Impossible de réinitialiser le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectDialog.user) {
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.disconnectRolesUser(disconnectDialog.user.id);
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateur déconnecté',
        errorTitle: 'Erreur de déconnexion',
      });
      if (processed.success) {
        showSuccess('Succès', 'L\'utilisateur a été déconnecté avec succès');
        setDisconnectDialog({ open: false, user: null });
      }
    } catch (error) {
      console.error('Error disconnecting user:', error);
      showError('Erreur', 'Impossible de déconnecter l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const renderPermissionsMatrixSection = () => (
      <Stack spacing={3}>
        <Alert severity="info">
          Visualisez la hiérarchie des rôles et leurs permissions respectives.
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Matrice des Permissions</Typography>
              <LoadingButton
                variant="contained"
                onClick={loadPermissionsMatrix}
                loading={loading}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Charger
              </LoadingButton>
            </Box>
            <Divider />
          </Stack>
        </Card>

        {!permissionsMatrix || !hierarchy ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            {loading ? 'Chargement...' : 'Cliquez sur "Charger" pour afficher la matrice'}
          </Typography>
        ) : (
          renderPermissionsMatrixContent()
        )}
      </Stack>
    );

  const renderPermissionsMatrixContent = () => {
    if (!permissionsMatrix || !hierarchy) {
      return null;
    }

    const roles = Object.keys(permissionsMatrix).sort((a, b) => (permissionsMatrix[b].level || 0) - (permissionsMatrix[a].level || 0));

    return (
      <>
        {roles.map((role) => {
          const roleData = permissionsMatrix[role];
          const subRoles = hierarchy[role] || [];

          return (
            <Card key={role} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={role}
                      color={ROLE_COLORS[role] || 'default'}
                      size="large"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Niveau {roleData.level || 0}
                    </Typography>
                  </Box>
                  {subRoles.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        Peut gérer:
                      </Typography>
                      {subRoles.map((subRole) => (
                        <Chip
                          key={subRole}
                          label={subRole}
                          size="small"
                          variant="outlined"
                          color={ROLE_COLORS[subRole] || 'default'}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Permissions:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {roleData.permissions.map((permission, index) => (
                      <Chip
                        key={index}
                        label={permission}
                        size="small"
                        sx={{ bgcolor: 'primary.lighter' }}
                      />
                    ))}
                  </Box>
                </Box>
              </Stack>
            </Card>
          );
        })}
      </>
    );
  };

  const renderUsersSection = () => (
      <Stack spacing={3}>
        <Alert severity="info">
          Gérez tous les utilisateurs du système, leurs rôles et leurs permissions.
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Tous les Utilisateurs</Typography>
              <LoadingButton
                variant="contained"
                onClick={loadUsers}
                loading={loadingUsers}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Actualiser
              </LoadingButton>
            </Box>
            <Divider />

            {users.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Téléphone</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Rôle</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date Création</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {user.firstName} {user.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            color={ROLE_COLORS[user.role] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isSuspended ? 'Suspendu' : 'Actif'}
                            color={user.isSuspended ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('fr-FR')
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Modifier le rôle">
                              <IconButton
                                size="small"
                                onClick={() => setChangeRoleDialog({ open: true, user, newRole: user.role })}
                                disabled={user.role === 'SUPERADMIN'}
                              >
                                <Iconify icon="solar:user-id-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Réinitialiser le mot de passe">
                              <IconButton
                                size="small"
                                onClick={() => setResetPasswordDialog({ open: true, user, newPassword: '', confirmPassword: '' })}
                              >
                                <Iconify icon="solar:lock-password-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Forcer la déconnexion">
                              <IconButton
                                size="small"
                                onClick={() => setDisconnectDialog({ open: true, user })}
                                color="error"
                              >
                                <Iconify icon="solar:logout-2-bold" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                {loadingUsers ? 'Chargement...' : 'Aucun utilisateur trouvé'}
              </Typography>
            )}
          </Stack>
        </Card>
      </Stack>
    );

  return (
    <>
      <Helmet>
        <title> Rôles & Permissions | CarbuGo </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Rôles & Permissions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gérez les rôles, permissions et utilisateurs du système
            </Typography>
          </Box>

          <Card>
            <TabContext value={currentTab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                  onChange={(event, newValue) => setCurrentTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab
                    label="Matrice des Permissions"
                    value="matrix"
                    icon={<Iconify icon="solar:shield-check-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Gestion des Utilisateurs"
                    value="users"
                    icon={<Iconify icon="solar:users-group-rounded-bold" />}
                    iconPosition="start"
                  />
                </TabList>
              </Box>

              <Box sx={{ p: 3 }}>
                <TabPanel value="matrix" sx={{ p: 0 }}>
                  {renderPermissionsMatrixSection()}
                </TabPanel>
                <TabPanel value="users" sx={{ p: 0 }}>
                  {renderUsersSection()}
                </TabPanel>
              </Box>
            </TabContext>
          </Card>
        </Stack>
      </Container>

      {/* Dialog pour changer le rôle */}
      <Dialog
        open={changeRoleDialog.open}
        onClose={() => setChangeRoleDialog({ open: false, user: null, newRole: '' })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Modifier le Rôle
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {changeRoleDialog.user && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Utilisateur:
                </Typography>
                <Typography variant="subtitle1">
                  {changeRoleDialog.user.firstName} {changeRoleDialog.user.lastName} ({changeRoleDialog.user.email})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Rôle actuel: <Chip label={changeRoleDialog.user.role} size="small" color={ROLE_COLORS[changeRoleDialog.user.role]} />
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Nouveau Rôle</InputLabel>
                <Select
                  value={changeRoleDialog.newRole}
                  label="Nouveau Rôle"
                  onChange={(e) => setChangeRoleDialog({ ...changeRoleDialog, newRole: e.target.value })}
                >
                  <MenuItem value="USER">USER</MenuItem>
                  <MenuItem value="POMPISTE">POMPISTE</MenuItem>
                  <MenuItem value="STATION">STATION</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="warning">
                Attention: La modification du rôle peut affecter les permissions et l&apos;accès de l&apos;utilisateur.
              </Alert>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => setChangeRoleDialog({ open: false, user: null, newRole: '' })}
                  variant="outlined"
                >
                  Annuler
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleChangeRole}
                  loading={loading}
                >
                  Modifier
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Box>
      </Dialog>

      {/* Dialog pour réinitialiser le mot de passe */}
      <Dialog
        open={resetPasswordDialog.open}
        onClose={() => setResetPasswordDialog({ open: false, user: null, newPassword: '', confirmPassword: '' })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Réinitialiser le Mot de Passe
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {resetPasswordDialog.user && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Utilisateur:
                </Typography>
                <Typography variant="subtitle1">
                  {resetPasswordDialog.user.firstName} {resetPasswordDialog.user.lastName} ({resetPasswordDialog.user.email})
                </Typography>
              </Box>

              <TextField
                fullWidth
                type="password"
                label="Nouveau Mot de Passe"
                value={resetPasswordDialog.newPassword}
                onChange={(e) => setResetPasswordDialog({ ...resetPasswordDialog, newPassword: e.target.value })}
                helperText="Minimum 8 caractères"
              />

              <TextField
                fullWidth
                type="password"
                label="Confirmer le Mot de Passe"
                value={resetPasswordDialog.confirmPassword}
                onChange={(e) => setResetPasswordDialog({ ...resetPasswordDialog, confirmPassword: e.target.value })}
                error={resetPasswordDialog.newPassword !== resetPasswordDialog.confirmPassword && resetPasswordDialog.confirmPassword !== ''}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => setResetPasswordDialog({ open: false, user: null, newPassword: '', confirmPassword: '' })}
                  variant="outlined"
                >
                  Annuler
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleResetPassword}
                  loading={loading}
                  disabled={resetPasswordDialog.newPassword !== resetPasswordDialog.confirmPassword || resetPasswordDialog.newPassword.length < 8}
                >
                  Réinitialiser
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Box>
      </Dialog>

      {/* Dialog pour forcer la déconnexion */}
      <Dialog
        open={disconnectDialog.open}
        onClose={() => setDisconnectDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Forcer la Déconnexion
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {disconnectDialog.user && (
            <Stack spacing={3}>
              <Alert severity="warning">
                Êtes-vous sûr de vouloir forcer la déconnexion de cet utilisateur ?
              </Alert>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Utilisateur:
                </Typography>
                <Typography variant="subtitle1">
                  {disconnectDialog.user.firstName} {disconnectDialog.user.lastName} ({disconnectDialog.user.email})
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => setDisconnectDialog({ open: false, user: null })}
                  variant="outlined"
                >
                  Annuler
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleDisconnect}
                  loading={loading}
                  color="error"
                >
                  Déconnecter
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Box>
      </Dialog>
    </>
  );
}

