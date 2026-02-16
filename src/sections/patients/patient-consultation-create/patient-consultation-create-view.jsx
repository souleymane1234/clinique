import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Select,
  Dialog,
  Divider,
  MenuItem,
  TableRow,
  Container,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  InputLabel,
  Typography,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fDateTime } from 'src/utils/format-time';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const CONSULTATION_TYPES = {
  PREMIERE_CONSULTATION: 'Première consultation',
  CONSULTATION_SUIVI: 'Consultation de suivi',
  URGENCE: 'Urgence',
};

const STATUS_COLORS = {
  EN_ATTENTE: 'warning',
  EN_COURS: 'info',
  TERMINEE: 'success',
  ANNULEE: 'error',
};

const STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

// ----------------------------------------------------------------------

export default function PatientConsultationCreateView() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { showSuccess, showError, showApiResponse } = useNotification();

  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingMedecins, setLoadingMedecins] = useState(true);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [patient, setPatient] = useState(null);
  const [medecins, setMedecins] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, loading: false, editing: false });
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    patientId: patientId || '',
    medecinId: '',
    type: 'PREMIERE_CONSULTATION',
    reason: '',
    consultationDate: new Date().toISOString(),
  });

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        showError('Erreur', 'Aucun patient sélectionné');
        navigate('/patients/accueil');
        return;
      }

      setLoadingPatient(true);
      try {
        const result = await ConsumApi.getPatientById(patientId);
        if (result.success) {
          setPatient(result.data?.patient || result.data);
          setConsultationForm((prev) => ({ ...prev, patientId }));
        } else {
          showError('Erreur', 'Impossible de charger les informations du patient');
          navigate('/patients/accueil');
        }
      } catch (error) {
        console.error('Error loading patient:', error);
        showError('Erreur', 'Erreur lors du chargement du patient');
        navigate('/patients/accueil');
      } finally {
        setLoadingPatient(false);
      }
    };

    const loadMedecins = async () => {
      setLoadingMedecins(true);
      try {
        // Charger tous les médecins depuis l'API
        const result = await ConsumApi.getMedecins({});
        
        console.log('=== DEBUG MEDECINS ===');
        console.log('Full result:', JSON.stringify(result, null, 2));
        console.log('result.success:', result.success);
        console.log('result.data:', result.data);
        console.log('result.data type:', typeof result.data);
        console.log('result.data is array:', Array.isArray(result.data));
        if (result.data && typeof result.data === 'object') {
          console.log('result.data keys:', Object.keys(result.data));
        }
        console.log('====================');
        
        if (result.success) {
          // L'API retourne directement un tableau dans result.data
          let medecinsList = [];
          
          if (Array.isArray(result.data)) {
            medecinsList = result.data;
            console.log('Using direct array, length:', medecinsList.length);
          } else if (result.data && Array.isArray(result.data.data)) {
            // Format paginé
            medecinsList = result.data.data;
            console.log('Using paginated format, length:', medecinsList.length);
          } else if (result.data && typeof result.data === 'object') {
            // Peut-être un objet avec une propriété array
            medecinsList = result.data.medecins || result.data.items || result.data.results || [];
            console.log('Using object format, length:', medecinsList.length);
          }
          
          console.log('Medecins list before filter:', medecinsList.length);
          
          // Filtrer pour ne garder que les médecins actifs
          const activeMedecins = medecinsList.filter(
            (medecin) => medecin.status === 'ACTIVE' || medecin.isActive === true
          );
          
          console.log('Active medecins:', activeMedecins.length);
          
          // Utiliser les médecins actifs s'il y en a, sinon tous les médecins
          const finalMedecinsList = activeMedecins.length > 0 ? activeMedecins : medecinsList;
          
          console.log('Final medecins list:', finalMedecinsList.length);
          console.log('First medecin:', finalMedecinsList[0]);
          
          setMedecins(finalMedecinsList);
          
          if (finalMedecinsList.length === 0) {
            console.warn('Aucun médecin trouvé dans la base de données');
            showError('Avertissement', 'Aucun médecin disponible. Veuillez contacter l\'administrateur.');
          } else {
            console.log(`Chargé ${finalMedecinsList.length} médecin(s)`);
          }
        } else {
          console.error('Failed to load medecins:', result.message || result.errors);
          showError('Erreur', `Impossible de charger les médecins: ${result.message || 'Erreur inconnue'}`);
          setMedecins([]);
        }
      } catch (error) {
        console.error('Error loading medecins:', error);
        console.error('Error stack:', error.stack);
        showError('Erreur', 'Erreur lors du chargement des médecins. Veuillez réessayer.');
        setMedecins([]);
      } finally {
        setLoadingMedecins(false);
      }
    };

    const loadConsultations = async () => {
      if (!patientId) return;
      
      setLoadingConsultations(true);
      try {
        const result = await ConsumApi.getConsultations({ patientId });
        
        console.log('=== DEBUG CONSULTATIONS ===');
        console.log('Full result:', JSON.stringify(result, null, 2));
        console.log('result.success:', result.success);
        console.log('result.data:', result.data);
        console.log('result.data type:', typeof result.data);
        console.log('result.data is array:', Array.isArray(result.data));
        if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          console.log('result.data keys:', Object.keys(result.data));
        }
        console.log('===========================');
        
        if (result.success) {
          let consultationsList = [];
          
          if (Array.isArray(result.data)) {
            consultationsList = result.data;
            console.log('Using direct array, length:', consultationsList.length);
          } else if (result.data && Array.isArray(result.data.data)) {
            // Format paginé
            consultationsList = result.data.data;
            console.log('Using paginated format, length:', consultationsList.length);
          } else if (result.data && typeof result.data === 'object') {
            // Peut-être un objet avec une propriété array
            consultationsList = result.data.consultations || result.data.items || result.data.results || [];
            console.log('Using object format, length:', consultationsList.length);
          }
          
          console.log('Final consultations list:', consultationsList.length);
          setConsultations(consultationsList);
          
          if (consultationsList.length === 0) {
            console.warn('Aucune consultation trouvée pour ce patient');
          }
        } else {
          console.error('Failed to load consultations:', result.message || result.errors);
          setConsultations([]);
        }
      } catch (error) {
        console.error('Error loading consultations:', error);
        console.error('Error stack:', error.stack);
        setConsultations([]);
      } finally {
        setLoadingConsultations(false);
      }
    };

    loadPatient();
    loadMedecins();
    loadConsultations();
  }, [patientId]); // Seulement patientId comme dépendance pour éviter les boucles

  const handleCreateConsultation = async () => {
    if (!consultationForm.patientId || !consultationForm.medecinId || !consultationForm.reason.trim()) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const consultationData = {
        patientId: consultationForm.patientId,
        medecinId: consultationForm.medecinId,
        type: consultationForm.type,
        status: 'EN_ATTENTE',
        consultationDate: consultationForm.consultationDate,
        reason: consultationForm.reason,
        clinicalExamination: '',
        temperature: 0,
        systolicBloodPressure: 0,
        diastolicBloodPressure: 0,
        heartRate: 0,
        respiratoryRate: 0,
        weight: 0,
        height: 0,
        oxygenSaturation: 0,
        diagnostic: '',
        differentialDiagnosis: '',
        treatment: '',
        recommendations: '',
        privateNotes: '',
        hospitalizationRequired: false,
        hospitalizationReason: '',
      };

      const result = await ConsumApi.createConsultation(consultationData);
      const processed = showApiResponse(result, {
        successTitle: 'Consultation créée',
        errorTitle: 'Erreur de création',
      });

      if (processed.success) {
        showSuccess('Succès', 'Consultation créée avec succès');
        // Recharger la liste des consultations
        const resultConsultations = await ConsumApi.getConsultations({ patientId });
        if (resultConsultations.success) {
          let consultationsList = [];
          if (Array.isArray(resultConsultations.data)) {
            consultationsList = resultConsultations.data;
          } else if (resultConsultations.data && Array.isArray(resultConsultations.data.data)) {
            consultationsList = resultConsultations.data.data;
          } else if (resultConsultations.data && typeof resultConsultations.data === 'object') {
            consultationsList = resultConsultations.data.consultations || resultConsultations.data.items || resultConsultations.data.results || [];
          }
          setConsultations(consultationsList);
        }
        // Réinitialiser le formulaire
        setConsultationForm({
          patientId: patientId || '',
          medecinId: '',
          type: 'PREMIERE_CONSULTATION',
          reason: '',
          consultationDate: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error creating consultation:', error);
      showError('Erreur', 'Erreur lors de la création de la consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/patients/accueil');
  };

  const handleOpenDetails = async (consultation) => {
    setDetailsDialog({ open: true, loading: true, editing: false });
    setSelectedConsultation(null);
    setEditForm(null);
    
    try {
      // Charger les détails complets de la consultation
      const result = await ConsumApi.getConsultationById(consultation.id);
      if (result.success) {
        const consultationData = result.data?.consultation || result.data;
        setSelectedConsultation(consultationData);
        // Initialiser le formulaire d'édition avec les données
        setEditForm({
          clinicalExamination: consultationData.clinicalExamination || '',
          temperature: consultationData.temperature || 0,
          systolicBloodPressure: consultationData.systolicBloodPressure || 0,
          diastolicBloodPressure: consultationData.diastolicBloodPressure || 0,
          heartRate: consultationData.heartRate || 0,
          respiratoryRate: consultationData.respiratoryRate || 0,
          weight: consultationData.weight || 0,
          height: consultationData.height || 0,
          oxygenSaturation: consultationData.oxygenSaturation || 0,
          diagnostic: consultationData.diagnostic || '',
          differentialDiagnosis: consultationData.differentialDiagnosis || '',
          treatment: consultationData.treatment || '',
          recommendations: consultationData.recommendations || '',
          privateNotes: consultationData.privateNotes || '',
          nextAppointment: consultationData.nextAppointment || '',
          hospitalizationRequired: consultationData.hospitalizationRequired || false,
          hospitalizationReason: consultationData.hospitalizationReason || '',
        });
      } else {
        showError('Erreur', 'Impossible de charger les détails de la consultation');
        setDetailsDialog({ open: false, loading: false, editing: false });
      }
    } catch (error) {
      console.error('Error loading consultation details:', error);
      showError('Erreur', 'Erreur lors du chargement des détails');
      setDetailsDialog({ open: false, loading: false, editing: false });
    } finally {
      setDetailsDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, loading: false, editing: false });
    setSelectedConsultation(null);
    setEditForm(null);
  };

  const handleToggleEdit = () => {
    setDetailsDialog((prev) => ({ ...prev, editing: !prev.editing }));
  };

  const handleSaveConsultation = async () => {
    if (!selectedConsultation || !editForm) return;

    setSaving(true);
    try {
      const updateData = {
        ...editForm,
        patientId: selectedConsultation.patientId || selectedConsultation.patient?.id,
        medecinId: selectedConsultation.medecinId || selectedConsultation.medecin?.id,
        type: selectedConsultation.type,
        status: selectedConsultation.status,
        consultationDate: selectedConsultation.consultationDate,
        reason: selectedConsultation.reason,
      };

      const result = await ConsumApi.updateConsultation(selectedConsultation.id, updateData);
      const processed = showApiResponse(result, {
        successTitle: 'Consultation mise à jour',
        errorTitle: 'Erreur de mise à jour',
      });

      if (processed.success) {
        showSuccess('Succès', 'Consultation mise à jour avec succès');
        setDetailsDialog((prev) => ({ ...prev, editing: false }));
        // Recharger les détails
        await handleOpenDetails({ id: selectedConsultation.id });
        // Recharger la liste des consultations
        const resultConsultations = await ConsumApi.getConsultations({ patientId });
        if (resultConsultations.success) {
          let consultationsList = [];
          if (Array.isArray(resultConsultations.data)) {
            consultationsList = resultConsultations.data;
          } else if (resultConsultations.data && Array.isArray(resultConsultations.data.data)) {
            consultationsList = resultConsultations.data.data;
          } else if (resultConsultations.data && typeof resultConsultations.data === 'object') {
            consultationsList = resultConsultations.data.consultations || resultConsultations.data.items || resultConsultations.data.results || [];
          }
          setConsultations(consultationsList);
        }
      }
    } catch (error) {
      console.error('Error updating consultation:', error);
      showError('Erreur', 'Erreur lors de la mise à jour de la consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleTransferToDoctor = async () => {
    if (!selectedConsultation) return;

    setTransferring(true);
    try {
      // Changer le statut de la consultation à EN_COURS pour que le médecin la voie
      const result = await ConsumApi.updateConsultationStatus(selectedConsultation.id, 'EN_COURS');
      const processed = showApiResponse(result, {
        successTitle: 'Patient transféré',
        errorTitle: 'Erreur de transfert',
      });

      if (processed.success) {
        showSuccess('Succès', 'Patient transféré au médecin avec succès');
        // Recharger les détails
        await handleOpenDetails({ id: selectedConsultation.id });
        // Recharger la liste des consultations
        const resultConsultations = await ConsumApi.getConsultations({ patientId });
        if (resultConsultations.success) {
          let consultationsList = [];
          if (Array.isArray(resultConsultations.data)) {
            consultationsList = resultConsultations.data;
          } else if (resultConsultations.data && Array.isArray(resultConsultations.data.data)) {
            consultationsList = resultConsultations.data.data;
          } else if (resultConsultations.data && typeof resultConsultations.data === 'object') {
            consultationsList = resultConsultations.data.consultations || resultConsultations.data.items || resultConsultations.data.results || [];
          }
          setConsultations(consultationsList);
        }
      }
    } catch (error) {
      console.error('Error transferring to doctor:', error);
      showError('Erreur', 'Erreur lors du transfert au médecin');
    } finally {
      setTransferring(false);
    }
  };

  if (loadingPatient) {
    return (
      <>
        <Helmet>
          <title> Création Consultation | PREVENTIC </title>
        </Helmet>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <LoadingButton loading>Chargement des informations du patient...</LoadingButton>
          </Box>
        </Container>
      </>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title> Création Consultation | PREVENTIC </title>
      </Helmet>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Créer une consultation</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Remplissez les informations pour créer une nouvelle consultation
            </Typography>
          </Box>

          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6">Informations du patient</Typography>
              </Box>

              <Alert
                severity="info"
                icon={<Iconify icon="eva:info-fill" />}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Typography variant="body2">
                    Patient : <strong>{patient.firstName} {patient.lastName}</strong>
                  </Typography>
                  <Chip
                    label={patient.gender === 'MALE' || patient.gender === 'M' ? 'M.' : 'F.'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                  {patient.phone && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      {patient.phone}
                    </Typography>
                  )}
                </Box>
              </Alert>

              <Divider />

              <Box>
                <Typography variant="h6">Informations de la consultation</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Médecin *</InputLabel>
                    <Select
                      value={consultationForm.medecinId}
                      label="Médecin *"
                      onChange={(e) => setConsultationForm((prev) => ({ ...prev, medecinId: e.target.value }))}
                      disabled={loadingMedecins}
                    >
                      {(() => {
                        if (loadingMedecins) {
                          return <MenuItem disabled>Chargement des médecins...</MenuItem>;
                        }
                        if (medecins.length === 0) {
                          return <MenuItem disabled>Aucun médecin disponible</MenuItem>;
                        }
                        return medecins.map((medecin) => (
                          <MenuItem key={medecin.id} value={medecin.id}>
                            Dr. {medecin.firstName || medecin.firstname} {medecin.lastName || medecin.lastname} -{' '}
                            {medecin.speciality || 'Médecine générale'}
                          </MenuItem>
                        ));
                      })()}
                    </Select>
                    {medecins.length === 0 && !loadingMedecins && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        Aucun médecin disponible. Veuillez contacter l&apos;administrateur.
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Type de consultation</InputLabel>
                    <Select
                      value={consultationForm.type}
                      label="Type de consultation"
                      onChange={(e) => setConsultationForm((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      {Object.entries(CONSULTATION_TYPES).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={3}
                    label="Motif de consultation"
                    value={consultationForm.reason}
                    onChange={(e) => setConsultationForm((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="Décrire le motif de la consultation..."
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Date et heure de consultation"
                    value={
                      consultationForm.consultationDate
                        ? new Date(consultationForm.consultationDate).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setConsultationForm((prev) => ({
                        ...prev,
                        consultationDate: new Date(e.target.value).toISOString(),
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button onClick={handleCancel}>Annuler</Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleCreateConsultation}
                  loading={loading}
                  disabled={!consultationForm.patientId || !consultationForm.medecinId || !consultationForm.reason.trim()}
                >
                  Créer la consultation
                </LoadingButton>
              </Stack>
            </Stack>
          </Card>

          {/* Liste des consultations */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6">Consultations du patient</Typography>
              </Box>

              {(() => {
                if (loadingConsultations) {
                  return (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <LoadingButton loading>Chargement des consultations...</LoadingButton>
                    </Box>
                  );
                }
                if (consultations.length === 0) {
                  return <Alert severity="info">Aucune consultation enregistrée pour ce patient.</Alert>;
                }
                return (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Numéro</TableCell>
                        <TableCell>Médecin</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Motif</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consultations.map((consultation) => (
                        <TableRow key={consultation.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetails(consultation)}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {consultation.consultationNumber || consultation.id?.substring(0, 8)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              Dr. {consultation.medecin?.firstName || consultation.medecin?.firstname || 'N/A'}{' '}
                              {consultation.medecin?.lastName || consultation.medecin?.lastname || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {CONSULTATION_TYPES[consultation.type] || consultation.type || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {fDateTime(consultation.consultationDate || consultation.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {consultation.reason || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[consultation.status] || consultation.status}
                              color={STATUS_COLORS[consultation.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetails(consultation);
                              }}
                            >
                              Voir détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                );
              })()}
            </Stack>
          </Card>
        </Stack>
      </Container>

      {/* Dialog de détails de consultation */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Détails de la Consultation</Typography>
            {!detailsDialog.loading && selectedConsultation && (
              <Button
                variant={detailsDialog.editing ? 'outlined' : 'contained'}
                startIcon={<Iconify icon={detailsDialog.editing ? 'eva:close-fill' : 'eva:edit-fill'} />}
                onClick={handleToggleEdit}
              >
                {detailsDialog.editing ? 'Annuler' : 'Modifier'}
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <LoadingButton loading>Chargement des détails...</LoadingButton>
            </Box>
          ) : (
            selectedConsultation && editForm && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                {/* Informations de base (lecture seule) */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Numéro de consultation</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedConsultation.consultationNumber || selectedConsultation.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Statut</Typography>
                    <Chip
                      label={STATUS_LABELS[selectedConsultation.status] || selectedConsultation.status}
                      color={STATUS_COLORS[selectedConsultation.status] || 'default'}
                      size="small"
                    />
                  </Grid>
                </Grid>

                <Divider>Informations Patient</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Nom complet</Typography>
                    <Typography variant="body1">
                      {selectedConsultation.patient?.firstName} {selectedConsultation.patient?.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Téléphone</Typography>
                    <Typography variant="body1">{selectedConsultation.patient?.phone || 'N/A'}</Typography>
                  </Grid>
                </Grid>

                <Divider>Examen Clinique</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Examen clinique"
                      value={editForm.clinicalExamination}
                      onChange={(e) => setEditForm({ ...editForm, clinicalExamination: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                </Grid>

                <Divider>Signes Vitaux</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Température (°C)"
                      value={editForm.temperature}
                      onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) || 0 })}
                      disabled={!detailsDialog.editing}
                      inputProps={{ step: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Pression artérielle systolique (mmHg)"
                      value={editForm.systolicBloodPressure}
                      onChange={(e) => setEditForm({ ...editForm, systolicBloodPressure: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Pression artérielle diastolique (mmHg)"
                      value={editForm.diastolicBloodPressure}
                      onChange={(e) => setEditForm({ ...editForm, diastolicBloodPressure: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Fréquence cardiaque (bpm)"
                      value={editForm.heartRate}
                      onChange={(e) => setEditForm({ ...editForm, heartRate: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Fréquence respiratoire (rpm)"
                      value={editForm.respiratoryRate}
                      onChange={(e) => setEditForm({ ...editForm, respiratoryRate: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Saturation en oxygène (%)"
                      value={editForm.oxygenSaturation}
                      onChange={(e) => setEditForm({ ...editForm, oxygenSaturation: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Poids (kg)"
                      value={editForm.weight}
                      onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || 0 })}
                      disabled={!detailsDialog.editing}
                      inputProps={{ step: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Taille (m)"
                      value={editForm.height}
                      onChange={(e) => setEditForm({ ...editForm, height: parseFloat(e.target.value) || 0 })}
                      disabled={!detailsDialog.editing}
                      inputProps={{ step: 0.01 }}
                    />
                  </Grid>
                </Grid>

                <Divider>Diagnostic et Traitement</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Diagnostic"
                      value={editForm.diagnostic}
                      onChange={(e) => setEditForm({ ...editForm, diagnostic: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Diagnostic différentiel"
                      value={editForm.differentialDiagnosis}
                      onChange={(e) => setEditForm({ ...editForm, differentialDiagnosis: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Traitement"
                      value={editForm.treatment}
                      onChange={(e) => setEditForm({ ...editForm, treatment: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Recommandations"
                      value={editForm.recommendations}
                      onChange={(e) => setEditForm({ ...editForm, recommendations: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes privées"
                      value={editForm.privateNotes}
                      onChange={(e) => setEditForm({ ...editForm, privateNotes: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Prochain rendez-vous"
                      value={editForm.nextAppointment ? new Date(editForm.nextAppointment).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditForm({ ...editForm, nextAppointment: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      disabled={!detailsDialog.editing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Divider>Hospitalisation</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Hospitalisation requise</InputLabel>
                      <Select
                        value={editForm.hospitalizationRequired ? 'true' : 'false'}
                        label="Hospitalisation requise"
                        onChange={(e) => setEditForm({ ...editForm, hospitalizationRequired: e.target.value === 'true' })}
                        disabled={!detailsDialog.editing}
                      >
                        <MenuItem value="false">Non</MenuItem>
                        <MenuItem value="true">Oui</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {editForm.hospitalizationRequired && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Raison de l'hospitalisation"
                        value={editForm.hospitalizationReason}
                        onChange={(e) => setEditForm({ ...editForm, hospitalizationReason: e.target.value })}
                        disabled={!detailsDialog.editing}
                      />
                    </Grid>
                  )}
                </Grid>
              </Stack>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
          {detailsDialog.editing && (
            <LoadingButton variant="contained" onClick={handleSaveConsultation} loading={saving}>
              Enregistrer
            </LoadingButton>
          )}
          {!detailsDialog.editing && selectedConsultation && selectedConsultation.status === 'EN_ATTENTE' && (
            <LoadingButton
              variant="contained"
              color="primary"
              onClick={handleTransferToDoctor}
              loading={transferring}
              startIcon={<Iconify icon="eva:person-add-fill" />}
            >
              Transférer au médecin
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
