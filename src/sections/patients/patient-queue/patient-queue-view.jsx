import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Button,
  Dialog,
  TextField,
  Container,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

const PRIORITY_COLORS = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  urgent: 'error',
};

export default function PatientQueueView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [triageDialog, setTriageDialog] = useState({ open: false, loading: false });
  const [priorityFilter, setPriorityFilter] = useState('');

  const [triageForm, setTriageForm] = useState({
    priority: 'medium',
    symptoms: '',
    notes: '',
  });

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (priorityFilter) filters.priority = priorityFilter;

      const result = await ConsumApi.getPatientQueue(filters);
      const processed = showApiResponse(result, {
        successTitle: 'File d\'attente chargée',
        errorTitle: 'Erreur de chargement',
        showNotification: false,
      });

      if (processed.success) {
        setQueue(Array.isArray(processed.data) ? processed.data : []);
      } else {
        setQueue([]);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
      showError('Erreur', 'Impossible de charger la file d\'attente');
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, [priorityFilter]);

  useEffect(() => {
    loadQueue();
    // Recharger toutes les 30 secondes
    const interval = setInterval(() => {
      loadQueue();
    }, 30000);
    return () => clearInterval(interval);
  }, [priorityFilter]);

  const handleTriage = async () => {
    if (!selectedPatient || !triageForm.priority) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setTriageDialog({ ...triageDialog, loading: true });
    try {
      const result = await ConsumApi.updatePatientTriage(selectedPatient.id, triageForm);
      const processed = showApiResponse(result, {
        successTitle: 'Triage mis à jour',
        errorTitle: 'Erreur lors de la mise à jour',
      });

      if (processed.success) {
        setTriageDialog({ open: false, loading: false });
        setSelectedPatient(null);
        setTriageForm({ priority: 'medium', symptoms: '', notes: '' });
        await loadQueue();
      }
    } catch (error) {
      console.error('Error updating triage:', error);
      showError('Erreur', 'Impossible de mettre à jour le triage');
    } finally {
      setTriageDialog({ ...triageDialog, loading: false });
    }
  };

  const handleRemoveFromQueue = async (patientId) => {
    try {
      const result = await ConsumApi.removeFromQueue(patientId);
      const processed = showApiResponse(result, {
        successTitle: 'Patient retiré de la file',
        errorTitle: 'Erreur lors de la suppression',
      });

      if (processed.success) {
        await loadQueue();
      }
    } catch (error) {
      console.error('Error removing from queue:', error);
      showError('Erreur', 'Impossible de retirer le patient');
    }
  };

  const handleOpenTriage = (patient) => {
    setSelectedPatient(patient);
    setTriageForm({
      priority: patient.priority || 'medium',
      symptoms: patient.symptoms || '',
      notes: patient.triageNotes || '',
    });
    setTriageDialog({ open: true, loading: false });
  };

  const sortedQueue = [...queue].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority] || 2;
    const bPriority = priorityOrder[b.priority] || 2;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return new Date(a.arrivalTime || a.createdAt) - new Date(b.arrivalTime || b.createdAt);
  });

  const waitingTime = (arrivalTime) => {
    if (!arrivalTime) return 'N/A';
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diff = Math.floor((now - arrival) / 60000); // en minutes
    if (diff < 60) return `${diff} min`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}min`;
  };

  return (
    <>
      <Helmet>
        <title> File d&apos;attente / Triage | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">File d&apos;attente / Triage</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gestion de la file d&apos;attente et triage des patients selon la priorité
            </Typography>
          </Box>

          {/* Stats */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {sortedQueue.filter((p) => p.priority === 'urgent').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Urgent
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {sortedQueue.filter((p) => p.priority === 'high').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Haute priorité
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {sortedQueue.filter((p) => p.priority === 'medium').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Priorité moyenne
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">{sortedQueue.filter((p) => p.priority === 'low').length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Priorité basse
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Filter */}
          <Card sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Filtrer par priorité</InputLabel>
                <Select value={priorityFilter} label="Filtrer par priorité" onChange={(e) => setPriorityFilter(e.target.value)}>
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">Haute</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="low">Basse</MenuItem>
                </Select>
              </FormControl>

              <LoadingButton
                variant="outlined"
                onClick={loadQueue}
                loading={loading}
                startIcon={<Iconify icon="eva:refresh-fill" />}
              >
                Actualiser
              </LoadingButton>
            </Stack>
          </Card>

          {/* Queue List */}
          <Stack spacing={2}>
            {(() => {
              if (loading && sortedQueue.length === 0) {
                return (
                  <Card sx={{ p: 3 }}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                      Chargement...
                    </Typography>
                  </Card>
                );
              }
              if (sortedQueue.length === 0) {
                return <Alert severity="info">Aucun patient dans la file d&apos;attente</Alert>;
              }
              return sortedQueue.map((patient, index) => (
                <Card key={patient.id} sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="h5" color="primary.main">
                            #{index + 1}
                          </Typography>
                          <Box>
                            <Typography variant="h6">
                              {patient.patient?.firstName || patient.patientName || 'Patient inconnu'}{' '}
                              {patient.patient?.lastName || ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {patient.patientId || patient.patient?.id || 'N/A'} | Arrivé:{' '}
                              {fDateTime(patient.arrivalTime || patient.createdAt)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                      <Chip
                        label={(() => {
                          if (patient.priority === 'urgent') return 'URGENT';
                          if (patient.priority === 'high') return 'Haute';
                          if (patient.priority === 'medium') return 'Moyenne';
                          return 'Basse';
                        })()}
                        color={PRIORITY_COLORS[patient.priority] || 'default'}
                        size="medium"
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Temps d&apos;attente
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {waitingTime(patient.arrivalTime || patient.createdAt)}
                        </Typography>
                      </Grid>
                      {patient.symptoms && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Symptômes
                          </Typography>
                          <Typography variant="body1">{patient.symptoms}</Typography>
                        </Grid>
                      )}
                    </Grid>

                    {patient.triageNotes && (
                      <Alert severity="info" icon={<Iconify icon="eva:info-fill" />}>
                        <Typography variant="body2">{patient.triageNotes}</Typography>
                      </Alert>
                    )}

                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<Iconify icon="eva:edit-fill" />}
                        onClick={() => handleOpenTriage(patient)}
                      >
                        Triage
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Iconify icon="eva:checkmark-fill" />}
                        onClick={() => handleRemoveFromQueue(patient.id)}
                      >
                        Retirer de la file
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              ));
            })()}
          </Stack>
        </Stack>
      </Container>

      {/* Triage Dialog */}
      <Dialog open={triageDialog.open} onClose={() => setTriageDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Triage du patient</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedPatient.patient?.firstName || selectedPatient.patientName || 'Patient inconnu'}{' '}
                  {selectedPatient.patient?.lastName || ''}
                </Typography>
              </Box>

              <FormControl fullWidth required>
                <InputLabel>Priorité</InputLabel>
                <Select
                  value={triageForm.priority}
                  label="Priorité"
                  onChange={(e) => setTriageForm({ ...triageForm, priority: e.target.value })}
                >
                  <MenuItem value="low">Basse</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="high">Haute</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Symptômes"
                value={triageForm.symptoms}
                onChange={(e) => setTriageForm({ ...triageForm, symptoms: e.target.value })}
                placeholder="Décrire les symptômes du patient"
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes de triage"
                value={triageForm.notes}
                onChange={(e) => setTriageForm({ ...triageForm, notes: e.target.value })}
                placeholder="Notes supplémentaires sur l'état du patient"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTriageDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleTriage} loading={triageDialog.loading}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
