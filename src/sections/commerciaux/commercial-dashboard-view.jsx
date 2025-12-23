import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import { alpha } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { useNotification } from 'src/hooks/useNotification';

import { fDate, fTime } from 'src/utils/format-time';

import { routesName } from 'src/constants/routes';
import { useAdminStore } from 'src/store/useAdminStore';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function CommercialDashboardView() {
  const { contextHolder, showError, showSuccess, showApiResponse } = useNotification();
  const { admin } = useAdminStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rendezVous, setRendezVous] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialogs
  const [reprogrammerDialog, setReprogrammerDialog] = useState({
    open: false,
    rendezVous: null,
    newDate: '',
    loading: false,
  });
  
  const [terminerDialog, setTerminerDialog] = useState({
    open: false,
    rendezVous: null,
    loading: false,
  });

  const loadRendezVous = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Récupérer les rendez-vous du jour depuis l'API
      if (!admin?.id) {
        setRendezVous([]);
        return;
      }

      const result = await ConsumApi.getRendezVousDuJour(admin.id);
      
      if (result.success && Array.isArray(result.data)) {
        // Transformer les données pour correspondre au format attendu
        const rendezVousList = result.data.map((rdv) => {
          const session = rdv.session || {};
          const client = session.client || {};
          
          return {
            id: rdv.id,
            sessionId: rdv.sessionId,
            dateRendezVous: rdv.reminderDate,
            client: {
              id: client.id,
              nom: client.nom || client.nom_complet,
              telephone: client.telephone,
            },
            clientId: client.id,
            clientNom: client.nom || client.nom_complet,
            service: session.service,
            description: rdv.text,
            status: rdv.status || 'scheduled',
            session,
          };
        });
        
        console.log('📅 Rendez-vous du jour chargés:', rendezVousList.length, rendezVousList);
        setRendezVous(rendezVousList);
      } else {
        console.log('⚠️ Aucun rendez-vous trouvé ou erreur:', result);
        setRendezVous([]);
      }
    } catch (error) {
      console.error('Error loading rendez-vous:', error);
      // Ne pas afficher d'erreur si c'est un 404
      if (!error.message?.includes('404') && !error.response?.status === 404) {
        showError('Erreur', 'Impossible de charger les rendez-vous');
      }
      setRendezVous([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [admin?.id]);

  useEffect(() => {
    if (admin?.id) {
      loadRendezVous();
    }
  }, [admin?.id]);

  const getStatusColor = (status) => {
    const statusColors = {
      scheduled: 'info',
      planned: 'info',
      confirmed: 'success',
      completed: 'default',
      cancelled: 'error',
      pending: 'warning',
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      scheduled: 'Programmé',
      planned: 'Planifié',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé',
      pending: 'En attente',
    };
    return statusLabels[status] || status;
  };

  // const formatDateHeure = (dateString) => {
  //   if (!dateString) return '-';
  //   const date = new Date(dateString);
  //   return `${fDate(date)} à ${fTime(date)}`;
  // };

  const handleViewClient = (clientId) => {
    if (clientId) {
      navigate(routesName.clientDetails.replace(':id', clientId));
    }
  };

  const handleReprogrammer = (rdv) => {
    setReprogrammerDialog({
      open: true,
      rendezVous: rdv,
      newDate: rdv.dateRendezVous ? new Date(rdv.dateRendezVous).toISOString().slice(0, 16) : '',
      loading: false,
    });
  };

  const handleConfirmReprogrammer = async () => {
    if (!reprogrammerDialog.rendezVous || !reprogrammerDialog.newDate) {
      showError('Erreur', 'Veuillez sélectionner une nouvelle date');
      return;
    }
  
    setReprogrammerDialog({ ...reprogrammerDialog, loading: true });
  
    try {
      // Convertir la date locale en format ISO 8601 (ex: 2024-12-25T10:00:00Z)
      const dateObj = new Date(reprogrammerDialog.newDate);
      const reminderDateISO = dateObj.toISOString();
  
      const result = await ConsumApi.reprogrammerRendezVous(
        reprogrammerDialog.rendezVous.id,
        admin.id,
        reminderDateISO
      );
  
      const processed = showApiResponse(result, {
        successTitle: 'Rendez-vous reprogrammé',
        errorTitle: 'Erreur de reprogrammation',
      });
  
      if (processed.success) {
        showSuccess('Succès', 'Le rendez-vous a été reprogrammé avec succès');
        setReprogrammerDialog({ open: false, rendezVous: null, newDate: '', loading: false });
        loadRendezVous(true);
      } else {
        // En cas d'échec, on garde le modal ouvert mais on arrête le loading
        setReprogrammerDialog({ ...reprogrammerDialog, loading: false });
      }
    } catch (error) {
      console.error('Error reprogramming rendez-vous:', error);
      showError('Erreur', 'Impossible de reprogrammer le rendez-vous');
      setReprogrammerDialog({ ...reprogrammerDialog, loading: false });
    }
  };

  const handleTerminer = (rdv) => {
    setTerminerDialog({
      open: true,
      rendezVous: rdv,
      loading: false,
    });
  };

  const handleConfirmTerminer = async () => {
    if (!terminerDialog.rendezVous || !admin?.id) return;
  
    setTerminerDialog({ ...terminerDialog, loading: true });
  
    try {
      const result = await ConsumApi.prendreRendezVous(terminerDialog.rendezVous.id, admin.id);
      const processed = showApiResponse(result, {
        successTitle: 'Rendez-vous terminé',
        errorTitle: 'Erreur',
      });
  
      if (processed.success) {
        // Mettre à jour immédiatement le statut local pour que les statistiques se mettent à jour
        setRendezVous((prevRendezVous) =>
          prevRendezVous.map((rdv) =>
            rdv.id === terminerDialog.rendezVous.id
              ? { ...rdv, status: 'completed' }
              : rdv
          )
        );
        
        showSuccess('Succès', 'Le rendez-vous a été marqué comme terminé');
        setTerminerDialog({ open: false, rendezVous: null, loading: false });
        
        // Recharger depuis l'API pour avoir les données à jour
        loadRendezVous(true);
      } else {
        // En cas d'échec, on garde le modal ouvert mais on arrête le loading
        setTerminerDialog({ ...terminerDialog, loading: false });
      }
    } catch (error) {
      console.error('Error completing rendez-vous:', error);
      showError('Erreur', 'Impossible de terminer le rendez-vous');
      setTerminerDialog({ ...terminerDialog, loading: false });
    }
  };

  // L'API retourne déjà les rendez-vous du jour, donc pas besoin de filtrer
  // Trier par heure (plus tôt en premier)
  const todayRendezVous = [...rendezVous].sort((a, b) => {
    if (!a.dateRendezVous || !b.dateRendezVous) return 0;
    const dateA = new Date(a.dateRendezVous);
    const dateB = new Date(b.dateRendezVous);
    return dateA - dateB;
  });

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Tableau de bord | Annour Travel </title>
      </Helmet>
      <Container maxWidth="xl">
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 5,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4">Tableau de Bord</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Vos rendez-vous et tâches du jour
            </Typography>
          </Box>
          <LoadingButton
            variant="outlined"
            startIcon={<Iconify icon="solar:refresh-bold" />}
            onClick={() => loadRendezVous(true)}
            loading={refreshing}
            sx={{ flexShrink: 0 }}
          >
            Actualiser
          </LoadingButton>
        </Box>

        {/* Section Rendez-vous du jour */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6">Rendez-vous du jour</Typography>
              <Typography variant="body2" color="text.secondary">
                {fDate(new Date())}
              </Typography>
            </Box>
            <Chip
              label={`${todayRendezVous.length} rendez-vous`}
              color="primary"
              icon={<Iconify icon="solar:calendar-bold" width={16} />}
            />
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {loading && (
            <Box sx={{ py: 4 }}>
              <LinearProgress />
            </Box>
          )}
          {!loading && todayRendezVous.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Aucun rendez-vous programmé pour aujourd&apos;hui
            </Alert>
          )}
          {!loading && todayRendezVous.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Heure</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayRendezVous.map((rdv) => (
                    <TableRow key={rdv.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {rdv.dateRendezVous ? fTime(new Date(rdv.dateRendezVous)) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {rdv.client?.nom || rdv.client?.nom_complet || rdv.clientNom || '-'}
                        </Typography>
                        {rdv.client?.telephone && (
                          <Typography variant="caption" color="text.secondary">
                            {rdv.client.telephone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {rdv.service || rdv.client?.service || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {rdv.description || rdv.notes || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(rdv.status)}
                          color={getStatusColor(rdv.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                        {rdv.clientId && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Iconify icon="solar:user-bold" width={16} />}
                            onClick={() => handleViewClient(rdv.clientId)}
                          >
                            Voir client
                          </Button>
                        )}
                          {rdv.status !== 'completed' && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                startIcon={<Iconify icon="solar:calendar-mark-bold" width={16} />}
                                onClick={() => handleReprogrammer(rdv)}
                              >
                                Reprogrammer
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<Iconify icon="solar:check-circle-bold" width={16} />}
                                onClick={() => handleTerminer(rdv)}
                              >
                                Terminer
                              </Button>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        {/* Section Informations rapides */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
          }}
        >
          <Card
            sx={{
              p: 3,
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)' },
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:calendar-bold" width={32} sx={{ color: 'common.white' }} />
              </Box>
              <Box>
                <Typography variant="h4">{todayRendezVous.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Rendez-vous aujourd&apos;hui
                </Typography>
              </Box>
            </Stack>
          </Card>

          <Card
            sx={{
              p: 3,
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)' },
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:user-check-rounded-bold" width={32} sx={{ color: 'common.white' }} />
              </Box>
              <Box>
                <Typography variant="h4">
                  {todayRendezVous.filter((rdv) => rdv.status === 'confirmed' || rdv.status === 'completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confirmés/Terminés
                </Typography>
              </Box>
            </Stack>
          </Card>

          <Card
            sx={{
              p: 3,
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)' },
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'warning.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:clock-circle-bold" width={32} sx={{ color: 'common.white' }} />
              </Box>
              <Box>
                <Typography variant="h4">
                  {todayRendezVous.filter((rdv) => rdv.status === 'scheduled' || rdv.status === 'planned' || rdv.status === 'pending').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  En attente
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Box>

        {/* Dialog Reprogrammer rendez-vous */}
        <Dialog
          open={reprogrammerDialog.open}
          onClose={() => setReprogrammerDialog({ open: false, rendezVous: null, newDate: '', loading: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reprogrammer le rendez-vous</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  Client: <strong>{reprogrammerDialog.rendezVous?.client?.nom || reprogrammerDialog.rendezVous?.clientNom || '-'}</strong>
                </Typography>
                <Typography variant="body2">
                  Date actuelle: <strong>
                    {reprogrammerDialog.rendezVous?.dateRendezVous
                      ? `${fDate(new Date(reprogrammerDialog.rendezVous.dateRendezVous))} à ${fTime(new Date(reprogrammerDialog.rendezVous.dateRendezVous))}`
                      : '-'}
                  </strong>
                </Typography>
              </Alert>
              <TextField
                fullWidth
                label="Nouvelle date et heure"
                type="datetime-local"
                value={reprogrammerDialog.newDate}
                onChange={(e) => setReprogrammerDialog({ ...reprogrammerDialog, newDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setReprogrammerDialog({ open: false, rendezVous: null, newDate: '', loading: false })}
              disabled={reprogrammerDialog.loading}
            >
              Annuler
            </Button>
            <LoadingButton
              variant="contained"
              onClick={handleConfirmReprogrammer}
              loading={reprogrammerDialog.loading}
              disabled={!reprogrammerDialog.newDate}
              startIcon={<Iconify icon="solar:calendar-mark-bold" />}
            >
              Reprogrammer
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog Terminer rendez-vous */}
        <Dialog
          open={terminerDialog.open}
          onClose={() => setTerminerDialog({ open: false, rendezVous: null, loading: false })}
        >
          <DialogTitle>Terminer le rendez-vous</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir marquer ce rendez-vous comme terminé ?
            </Typography>
            {terminerDialog.rendezVous && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Client:</strong> {terminerDialog.rendezVous.client?.nom || terminerDialog.rendezVous.clientNom || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {terminerDialog.rendezVous.dateRendezVous
                    ? `${fDate(new Date(terminerDialog.rendezVous.dateRendezVous))} à ${fTime(new Date(terminerDialog.rendezVous.dateRendezVous))}`
                    : '-'}
                </Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setTerminerDialog({ open: false, rendezVous: null, loading: false })}
              disabled={terminerDialog.loading}
            >
              Annuler
            </Button>
            <LoadingButton
              variant="contained"
              color="success"
              onClick={handleConfirmTerminer}
              loading={terminerDialog.loading}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Terminer
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

