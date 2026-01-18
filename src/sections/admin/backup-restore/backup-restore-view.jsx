import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Stack,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Container,
  Typography,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import { fDate, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function BackupRestoreView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [autoBackup, setAutoBackup] = useState({
    enabled: false,
    frequency: 'daily', // daily, weekly, monthly
    time: '02:00',
    keepLast: 30,
  });

  // Dialogs
  const [backupDialog, setBackupDialog] = useState({ open: false, name: '', description: '' });
  const [restoreDialog, setRestoreDialog] = useState({ open: false, backup: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, backup: null });
  const [autoBackupDialog, setAutoBackupDialog] = useState({ open: false });


  useEffect(() => {
    loadBackups();
    loadAutoBackupSettings();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getBackups();
      const processed = showApiResponse(result, {
        successTitle: 'Sauvegardes chargées',
        errorTitle: 'Erreur de chargement',
        showNotification: false,
      });

      if (processed.success) {
        setBackups(Array.isArray(processed.data) ? processed.data : []);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      showError('Erreur', 'Impossible de charger les sauvegardes');
    } finally {
      setLoading(false);
    }
  };

  const loadAutoBackupSettings = async () => {
    try {
      const result = await ConsumApi.getAutoBackupSettings();
      if (result.success && result.data) {
        setAutoBackup(result.data);
      }
    } catch (error) {
      console.error('Error loading auto backup settings:', error);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.createBackup({
        name: backupDialog.name || `Sauvegarde ${new Date().toLocaleString()}`,
        description: backupDialog.description,
      });

      const processed = showApiResponse(result, {
        successTitle: 'Sauvegarde créée',
        errorTitle: 'Erreur lors de la création',
      });

      if (processed.success) {
        setBackupDialog({ open: false, name: '', description: '' });
        await loadBackups();
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      showError('Erreur', 'Impossible de créer la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreDialog.backup) return;

    setLoading(true);
    try {
      const result = await ConsumApi.restoreBackup(restoreDialog.backup.id);

      const processed = showApiResponse(result, {
        successTitle: 'Restauration réussie',
        errorTitle: 'Erreur lors de la restauration',
      });

      if (processed.success) {
        setRestoreDialog({ open: false, backup: null });
        showSuccess('Restauration', 'La restauration a été effectuée avec succès. Le système peut nécessiter un redémarrage.');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      showError('Erreur', 'Impossible de restaurer la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!deleteDialog.backup) return;

    setLoading(true);
    try {
      const result = await ConsumApi.deleteBackup(deleteDialog.backup.id);

      const processed = showApiResponse(result, {
        successTitle: 'Sauvegarde supprimée',
        errorTitle: 'Erreur lors de la suppression',
      });

      if (processed.success) {
        setDeleteDialog({ open: false, backup: null });
        await loadBackups();
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      showError('Erreur', 'Impossible de supprimer la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      const result = await ConsumApi.downloadBackup(backup.id);
      if (result.success && result.data?.url) {
        window.open(result.data.url, '_blank');
        showSuccess('Téléchargement', 'Téléchargement démarré');
      } else {
        showError('Erreur', 'Impossible de télécharger la sauvegarde');
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      showError('Erreur', 'Impossible de télécharger la sauvegarde');
    }
  };

  const handleSaveAutoBackup = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.updateAutoBackupSettings(autoBackup);
      const processed = showApiResponse(result, {
        successTitle: 'Paramètres sauvegardés',
        errorTitle: 'Erreur lors de la sauvegarde',
      });

      if (processed.success) {
        setAutoBackupDialog({ open: false });
        await loadAutoBackupSettings();
      }
    } catch (error) {
      console.error('Error saving auto backup settings:', error);
      showError('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / (k ** i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <>
      <Helmet>
        <title> Sauvegarde &amp; Restauration | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Sauvegarde &amp; Restauration</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gérez les sauvegardes et restaurez vos données
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Les sauvegardes incluent toutes les données de la clinique : utilisateurs, clients, factures, configurations, etc.
          </Alert>

          {/* Auto Backup Card */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">Sauvegarde automatique</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configurez les sauvegardes automatiques du système
                  </Typography>
                </Box>
                <Chip
                  label={autoBackup.enabled ? 'Activée' : 'Désactivée'}
                  color={autoBackup.enabled ? 'success' : 'default'}
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:settings-fill" />}
                  onClick={() => setAutoBackupDialog({ open: true })}
                >
                  Configurer
                </Button>
              </Box>

              {autoBackup.enabled && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fréquence: {(() => {
                      if (autoBackup.frequency === 'daily') return 'Quotidienne';
                      if (autoBackup.frequency === 'weekly') return 'Hebdomadaire';
                      return 'Mensuelle';
                    })()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Heure: {autoBackup.time}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conserver les {autoBackup.keepLast} dernières sauvegardes
                  </Typography>
                </Box>
              )}
            </Stack>
          </Card>

          {/* Manual Backup */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">Sauvegarde manuelle</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Créez une sauvegarde immédiate de vos données
                  </Typography>
                </Box>
                <LoadingButton
                  variant="contained"
                  startIcon={<Iconify icon="eva:save-fill" />}
                  onClick={() => setBackupDialog({ open: true, name: '', description: '' })}
                  loading={loading}
                >
                  Créer une sauvegarde
                </LoadingButton>
              </Box>
            </Stack>
          </Card>

          {/* Backups List */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Liste des sauvegardes
            </Typography>

            {(() => {
              if (loading && backups.length === 0) return <LinearProgress sx={{ mb: 2 }} />;
              if (backups.length === 0) return <Alert severity="info">Aucune sauvegarde disponible</Alert>;
              return (
              <List>
                {backups.map((backup) => (
                  <ListItem
                    key={backup.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: backup.type === 'auto' ? 'action.hover' : 'background.paper',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1">{backup.name || 'Sauvegarde sans nom'}</Typography>
                          {backup.type === 'auto' && <Chip label="Automatique" size="small" color="info" />}
                          {backup.type === 'manual' && <Chip label="Manuelle" size="small" color="primary" />}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                          {backup.description && (
                            <Typography variant="body2" color="text.secondary">
                              {backup.description}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={2}>
                            <Typography variant="caption" color="text.secondary">
                              Créée: {fDateTime(backup.createdAt)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Taille: {formatSize(backup.size)}
                            </Typography>
                          </Stack>
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          edge="end"
                          onClick={() => handleDownloadBackup(backup)}
                          color="primary"
                          title="Télécharger"
                        >
                          <Iconify icon="eva:download-fill" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => setRestoreDialog({ open: true, backup })}
                          color="success"
                          title="Restaurer"
                        >
                          <Iconify icon="eva:refresh-fill" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => setDeleteDialog({ open: true, backup })}
                          color="error"
                          title="Supprimer"
                        >
                          <Iconify icon="eva:trash-2-fill" />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              );
            })()}
          </Card>
        </Stack>
      </Container>

      {/* Create Backup Dialog */}
      <Dialog open={backupDialog.open} onClose={() => setBackupDialog({ open: false, name: '', description: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Créer une sauvegarde</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nom de la sauvegarde"
              value={backupDialog.name}
              onChange={(e) => setBackupDialog({ ...backupDialog, name: e.target.value })}
              placeholder="Sauvegarde manuelle"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (optionnel)"
              value={backupDialog.description}
              onChange={(e) => setBackupDialog({ ...backupDialog, description: e.target.value })}
              placeholder="Description de la sauvegarde..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialog({ open: false, name: '', description: '' })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleCreateBackup} loading={loading}>
            Créer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialog.open} onClose={() => setRestoreDialog({ open: false, backup: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Restaurer une sauvegarde</DialogTitle>
        <DialogContent>
          {restoreDialog.backup && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Attention : La restauration va remplacer toutes les données actuelles par celles de la sauvegarde du{' '}
              {fDateTime(restoreDialog.backup.createdAt)}. Cette action est irréversible.
            </Alert>
          )}
          <Typography variant="body2">
            Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Toutes les données actuelles seront remplacées.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog({ open: false, backup: null })}>Annuler</Button>
          <LoadingButton variant="contained" color="error" onClick={handleRestore} loading={loading}>
            Restaurer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, backup: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer une sauvegarde</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Êtes-vous sûr de vouloir supprimer la sauvegarde &quot;{deleteDialog.backup?.name}&quot; ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, backup: null })}>Annuler</Button>
          <LoadingButton variant="contained" color="error" onClick={handleDeleteBackup} loading={loading}>
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Auto Backup Settings Dialog */}
      <Dialog open={autoBackupDialog.open} onClose={() => setAutoBackupDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Configuration de la sauvegarde automatique</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              select
              label="Fréquence"
              value={autoBackup.frequency}
              onChange={(e) => setAutoBackup({ ...autoBackup, frequency: e.target.value })}
              SelectProps={{ native: false }}
            >
              <MenuItem value="daily">Quotidienne</MenuItem>
              <MenuItem value="weekly">Hebdomadaire</MenuItem>
              <MenuItem value="monthly">Mensuelle</MenuItem>
            </TextField>

            <TextField
              fullWidth
              type="time"
              label="Heure"
              value={autoBackup.time}
              onChange={(e) => setAutoBackup({ ...autoBackup, time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              type="number"
              label="Conserver les N dernières sauvegardes"
              value={autoBackup.keepLast}
              onChange={(e) => setAutoBackup({ ...autoBackup, keepLast: parseInt(e.target.value, 10) || 30 })}
              inputProps={{ min: 1, max: 365 }}
              helperText="Les sauvegardes plus anciennes seront supprimées automatiquement"
            />

            <Box>
              <Button
                variant={autoBackup.enabled ? 'outlined' : 'contained'}
                color={autoBackup.enabled ? 'error' : 'success'}
                fullWidth
                onClick={() => setAutoBackup({ ...autoBackup, enabled: !autoBackup.enabled })}
              >
                {autoBackup.enabled ? 'Désactiver' : 'Activer'} la sauvegarde automatique
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoBackupDialog({ open: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleSaveAutoBackup} loading={loading}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
