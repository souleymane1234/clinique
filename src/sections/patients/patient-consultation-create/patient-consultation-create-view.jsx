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
  const [detailsDialog, setDetailsDialog] = useState({ open: false, loading: false });
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
        if (result.success) {
          const consultationsList = Array.isArray(result.data) ? result.data : [];
          setConsultations(consultationsList);
        } else {
          console.warn('Failed to load consultations:', result.message);
          setConsultations([]);
        }
      } catch (error) {
        console.error('Error loading consultations:', error);
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
          const consultationsList = Array.isArray(resultConsultations.data) ? resultConsultations.data : [];
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
    setDetailsDialog({ open: true, loading: true });
    setSelectedConsultation(null);
    
    try {
      // Charger les détails complets de la consultation
      const result = await ConsumApi.getConsultationComplete(consultation.id);
      if (result.success) {
        setSelectedConsultation(result.data);
      } else {
        showError('Erreur', 'Impossible de charger les détails de la consultation');
        setDetailsDialog({ open: false, loading: false });
      }
    } catch (error) {
      console.error('Error loading consultation details:', error);
      showError('Erreur', 'Erreur lors du chargement des détails');
      setDetailsDialog({ open: false, loading: false });
    } finally {
      setDetailsDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, loading: false });
    setSelectedConsultation(null);
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
        <DialogTitle>Détails de la Consultation</DialogTitle>
        <DialogContent>
          {detailsDialog.loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <LoadingButton loading>Chargement des détails...</LoadingButton>
            </Box>
          ) : (
            selectedConsultation && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                {/* Informations de base */}
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

                <Divider>Informations Médecin</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Nom complet</Typography>
                    <Typography variant="body1">
                      Dr. {selectedConsultation.medecin?.firstName} {selectedConsultation.medecin?.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Spécialité</Typography>
                    <Typography variant="body1">{selectedConsultation.medecin?.speciality || 'N/A'}</Typography>
                  </Grid>
                </Grid>

                <Divider>Détails de la Consultation</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Date et heure</Typography>
                    <Typography variant="body1">
                      {fDateTime(selectedConsultation.consultationDate || selectedConsultation.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Type de consultation</Typography>
                    <Typography variant="body1">{CONSULTATION_TYPES[selectedConsultation.type] || selectedConsultation.type || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Motif</Typography>
                    <Typography variant="body1">{selectedConsultation.reason || 'N/A'}</Typography>
                  </Grid>
                </Grid>

                {/* Prescriptions */}
                {selectedConsultation.prescriptions && selectedConsultation.prescriptions.length > 0 && (
                  <>
                    <Divider>Prescriptions</Divider>
                    <Stack spacing={1}>
                      {selectedConsultation.prescriptions.map((prescription, index) => (
                        <Box key={prescription.id || index} sx={{ border: '1px dashed', borderColor: 'divider', p: 2, borderRadius: 1 }}>
                          <Typography variant="subtitle2">{prescription.label} ({prescription.type})</Typography>
                          <Typography variant="body2">
                            Dosage: {prescription.dosage || 'N/A'}, Durée: {prescription.duration || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            Instructions: {prescription.instructions || 'N/A'}, Quantité: {prescription.quantity || 'N/A'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}

                {/* Certificats */}
                {selectedConsultation.certificats && selectedConsultation.certificats.length > 0 && (
                  <>
                    <Divider>Certificats Médicaux</Divider>
                    <Stack spacing={1}>
                      {selectedConsultation.certificats.map((certificat, index) => (
                        <Box key={certificat.id || index} sx={{ border: '1px dashed', borderColor: 'divider', p: 2, borderRadius: 1 }}>
                          <Typography variant="subtitle2">{certificat.type}</Typography>
                          <Typography variant="body2">Contenu: {certificat.content || 'N/A'}</Typography>
                          <Typography variant="body2">
                            Durée: {certificat.durationDays || 'N/A'} jours, Du:{' '}
                            {certificat.startDate ? fDateTime(certificat.startDate) : 'N/A'} Au:{' '}
                            {certificat.endDate ? fDateTime(certificat.endDate) : 'N/A'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}

                {/* Boutons pour ajouter prescriptions et certificats */}
                <Divider>Actions</Divider>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="solar:pill-bold" />}
                    onClick={() => {
                      // TODO: Ouvrir dialog pour ajouter prescription
                      showError('Info', 'Fonctionnalité à implémenter: Ajouter prescription');
                    }}
                  >
                    Ajouter Prescription
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="solar:document-bold" />}
                    onClick={() => {
                      // TODO: Ouvrir dialog pour ajouter certificat
                      showError('Info', 'Fonctionnalité à implémenter: Ajouter certificat');
                    }}
                  >
                    Ajouter Certificat
                  </Button>
                </Stack>
              </Stack>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
