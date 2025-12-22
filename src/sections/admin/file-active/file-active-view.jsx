import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

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
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

// Transitions de statut valides selon la documentation
const STATUS_TRANSITIONS = {
  ACCEPTED: ['IN_SERVICE', 'REFUSED', 'EXPIRED', 'REMOVED'],
  IN_SERVICE: ['SERVED', 'REFUSED'],
  SERVED: [], // Aucune transition possible
  REFUSED: [], // Aucune transition possible
  EXPIRED: [], // Aucune transition possible
  REMOVED: [], // Aucune transition possible
};

const STATUS_COLORS = {
  ACCEPTED: 'info',
  IN_SERVICE: 'warning',
  SERVED: 'success',
  REFUSED: 'error',
  EXPIRED: 'default',
  REMOVED: 'error',
};

const STATUS_LABELS = {
  ACCEPTED: 'Accepté',
  IN_SERVICE: 'En service',
  SERVED: 'Servi',
  REFUSED: 'Refusé',
  EXPIRED: 'Expiré',
  REMOVED: 'Retiré',
};

export default function FileActiveView() {
  const { sessionId: sessionIdFromRoute } = useParams();
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [sessionId, setSessionId] = useState(sessionIdFromRoute || '');
  const [fileActive, setFileActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    fileActiveId: null,
    currentStatus: null,
    newStatus: '',
    loading: false,
  });

  const handleLoadFileActive = async (targetSessionId = null) => {
    const idToUse = targetSessionId || sessionId;
    if (!idToUse || !idToUse.trim()) {
      showError('Erreur', 'Veuillez entrer un ID de session');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.getFileActiveBySession(idToUse.trim());
      const processed = showApiResponse(result, {
        successTitle: 'File active chargée',
        errorTitle: 'Erreur de chargement',
      });

      if (processed.success) {
        setFileActive(processed.data);
      } else {
        setFileActive(null);
      }
    } catch (error) {
      console.error('Error loading file active:', error);
      showError('Erreur', 'Impossible de charger la file active');
      setFileActive(null);
    } finally {
      setLoading(false);
    }
  };

  // Charger automatiquement la file active si sessionId est dans l'URL
  useEffect(() => {
    if (sessionIdFromRoute) {
      setSessionId(sessionIdFromRoute);
      handleLoadFileActive(sessionIdFromRoute);
    }
  }, [sessionIdFromRoute]);

  const handleUpdateStatus = async () => {
    if (!statusDialog.fileActiveId || !statusDialog.newStatus) {
      showError('Erreur', 'Veuillez sélectionner un nouveau statut');
      return;
    }

    setStatusDialog({ ...statusDialog, loading: true });
    try {
      const result = await ConsumApi.updateFileActiveStatus(
        statusDialog.fileActiveId,
        statusDialog.newStatus
      );
      const processed = showApiResponse(result, {
        successTitle: 'Statut modifié',
        errorTitle: 'Erreur de modification',
      });

      if (processed.success) {
        setStatusDialog({ open: false, fileActiveId: null, currentStatus: null, newStatus: '', loading: false });
        // Recharger la file active
        handleLoadFileActive();
      }
    } catch (error) {
      showError('Erreur', 'Impossible de modifier le statut');
    } finally {
      setStatusDialog({ ...statusDialog, loading: false });
    }
  };

  const openStatusDialog = (fileActiveEntry) => {
    const availableTransitions = STATUS_TRANSITIONS[fileActiveEntry.status] || [];
    setStatusDialog({
      open: true,
      fileActiveId: fileActiveEntry.id,
      currentStatus: fileActiveEntry.status,
      newStatus: availableTransitions.length > 0 ? availableTransitions[0] : '',
      loading: false,
    });
  };

  const availableTransitions = statusDialog.currentStatus
    ? STATUS_TRANSITIONS[statusDialog.currentStatus] || []
    : [];

  const entries = fileActive?.entries || fileActive?.users || fileActive || [];

  return (
    <>
      <Helmet>
        <title>Gestion des Files Actives | AnnourTravel</title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Gestion des Files Actives</Typography>
            <Typography variant="body2" color="text.secondary">
              Consultez et gérez les files actives des sessions
            </Typography>
          </Box>

          <Card sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
              <TextField
                fullWidth
                label="ID de Session"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Entrez l'ID de la session"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLoadFileActive();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleLoadFileActive}
                disabled={loading || !sessionId.trim()}
                startIcon={<Iconify icon="solar:magnifer-bold" />}
                sx={{ minWidth: 150 }}
              >
                {loading ? 'Chargement...' : 'Charger'}
              </Button>
            </Stack>
          </Card>

          {fileActive && (
            <Card>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">File Active - Session {sessionId}</Typography>
                {fileActive.sessionInfo && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {JSON.stringify(fileActive.sessionInfo)}
                  </Typography>
                )}
              </Box>

              <TableContainer>
                <Scrollbar>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Utilisateur</TableCell>
                        <TableCell>Téléphone</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Date d&apos;entrée</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(entries) && entries.length > 0 ? (
                        entries.map((entry, index) => {
                          const canTransition = STATUS_TRANSITIONS[entry.status]?.length > 0;
                          const userName = entry.userName || entry.user?.firstName && entry.user?.lastName
                            ? `${entry.user?.firstName} ${entry.user?.lastName}`
                            : entry.userEmail || entry.user?.email || 'Utilisateur';

                          return (
                            <TableRow key={entry.id || index} hover>
                              <TableCell>
                                <Box>
                                  <Typography variant="subtitle2">{userName}</Typography>
                                  {entry.userEmail || entry.user?.email && (
                                    <Typography variant="caption" color="text.secondary">
                                      {entry.userEmail || entry.user?.email}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>{entry.phone || entry.user?.phone || '-'}</TableCell>
                              <TableCell>
                                <Chip label={`#${entry.position || index + 1}`} size="small" />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={STATUS_LABELS[entry.status] || entry.status}
                                  color={STATUS_COLORS[entry.status] || 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {entry.createdAt || entry.joinedAt
                                  ? new Date(entry.createdAt || entry.joinedAt).toLocaleString('fr-FR')
                                  : '-'}
                              </TableCell>
                              <TableCell align="right">
                                {canTransition ? (
                                  <Tooltip title="Modifier le statut">
                                    <IconButton
                                      color="primary"
                                      onClick={() => openStatusDialog(entry)}
                                    >
                                      <Iconify icon="solar:pen-bold" />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    Final
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              Aucune entrée dans la file active
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>
            </Card>
          )}

          {fileActive === null && !loading && sessionId && (
            <Alert severity="info">
              Aucune file active trouvée pour cette session. Vérifiez l&apos;ID de session et réessayez.
            </Alert>
          )}
        </Stack>
      </Container>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, fileActiveId: null, currentStatus: null, newStatus: '', loading: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modifier le statut</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Statut actuel : <strong>{STATUS_LABELS[statusDialog.currentStatus] || statusDialog.currentStatus}</strong>
            </Alert>

            {availableTransitions.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel>Nouveau statut *</InputLabel>
                <Select
                  value={statusDialog.newStatus}
                  label="Nouveau statut *"
                  onChange={(e) => setStatusDialog({ ...statusDialog, newStatus: e.target.value })}
                >
                  {availableTransitions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {STATUS_LABELS[status] || status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Alert severity="warning">
                Aucune transition possible depuis le statut actuel.
              </Alert>
            )}

            <Box>
              <Typography variant="caption" color="text.secondary">
                Transitions possibles :
              </Typography>
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {STATUS_TRANSITIONS[statusDialog.currentStatus]?.map((transition) => (
                    <li key={transition}>{STATUS_LABELS[transition] || transition}</li>
                  ))}
                </ul>
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setStatusDialog({ open: false, fileActiveId: null, currentStatus: null, newStatus: '', loading: false })}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={statusDialog.loading || !statusDialog.newStatus || availableTransitions.length === 0}
          >
            {statusDialog.loading ? 'Modification...' : 'Modifier'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

