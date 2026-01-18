import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { useRouter } from 'src/routes/hooks';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Chip,
  Grid,
  Tabs,
  Stack,
  Button,
  Divider,
  Container,
  Typography,
  IconButton,
  TextField,
  Autocomplete,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fDateTime } from 'src/utils/format-time';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function DoctorConsultationDetailsView() {
  const { id: consultationId } = useParams();
  const router = useRouter();
  const { contextHolder, showApiResponse, showSuccess, showError } = useNotification();

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('diagnostic');

  // Données du formulaire
  const [diagnostic, setDiagnostic] = useState('');
  const [prescriptionsExams, setPrescriptionsExams] = useState([]);
  const [prescriptionsMedicaments, setPrescriptionsMedicaments] = useState([]);
  const [newExam, setNewExam] = useState('');
  const [newMedicament, setNewMedicament] = useState({ name: '', dosage: '', duration: '' });

  useEffect(() => {
    loadConsultation();
  }, [consultationId]);

  const loadConsultation = async () => {
    if (!consultationId) return;

    setLoading(true);
    try {
      // Simuler le chargement d'une consultation
      const result = await ConsumApi.getPatientConsultations(null, {});
      const consultations = result.data?.consultations || [];
      const foundConsultation = consultations.find((c) => c.id === consultationId) || consultations[0];

      if (foundConsultation) {
        setConsultation(foundConsultation);
        setDiagnostic(foundConsultation.diagnosis || foundConsultation.diagnostic || '');
        setPrescriptionsExams(foundConsultation.prescriptions?.exams || []);
        setPrescriptionsMedicaments(foundConsultation.prescriptions?.medicaments || []);
      }
    } catch (error) {
      console.error('Error loading consultation:', error);
      showError('Erreur', 'Impossible de charger la consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiagnostic = async () => {
    setSaving(true);
    try {
      // Simuler la sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess('Succès', 'Diagnostic enregistré avec succès');
      setConsultation({ ...consultation, diagnosis: diagnostic });
    } catch (error) {
      showError('Erreur', 'Impossible d\'enregistrer le diagnostic');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExam = () => {
    if (!newExam.trim()) return;
    setPrescriptionsExams([...prescriptionsExams, { id: Date.now(), name: newExam }]);
    setNewExam('');
    showSuccess('Succès', 'Examen ajouté');
  };

  const handleRemoveExam = (examId) => {
    setPrescriptionsExams(prescriptionsExams.filter((exam) => exam.id !== examId));
    showSuccess('Succès', 'Examen retiré');
  };

  const handleAddMedicament = () => {
    if (!newMedicament.name.trim()) return;
    setPrescriptionsMedicaments([
      ...prescriptionsMedicaments,
      {
        id: Date.now(),
        name: newMedicament.name,
        dosage: newMedicament.dosage,
        duration: newMedicament.duration,
      },
    ]);
    setNewMedicament({ name: '', dosage: '', duration: '' });
    showSuccess('Succès', 'Médicament ajouté');
  };

  const handleRemoveMedicament = (medicamentId) => {
    setPrescriptionsMedicaments(prescriptionsMedicaments.filter((med) => med.id !== medicamentId));
    showSuccess('Succès', 'Médicament retiré');
  };

  const handleSavePrescriptions = async () => {
    setSaving(true);
    try {
      // Simuler la sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess('Succès', 'Prescriptions enregistrées avec succès');
    } catch (error) {
      showError('Erreur', 'Impossible d\'enregistrer les prescriptions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title> Détails Consultation | Clinique </title>
        </Helmet>
        {contextHolder}
        <Container maxWidth="xl">
          <Typography>Chargement...</Typography>
        </Container>
      </>
    );
  }

  if (!consultation) {
    return (
      <>
        <Helmet>
          <title> Consultation introuvable | Clinique </title>
        </Helmet>
        {contextHolder}
        <Container maxWidth="xl">
          <Typography>Consultation introuvable</Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title> Détails Consultation | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header avec bouton retour */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.push('/doctors/create-consultation')} sx={{ mr: 1 }}>
              <Iconify icon="eva:arrow-back-fill" />
            </IconButton>
            <Typography variant="h4">Détails de la Consultation</Typography>
          </Box>

          {/* Consultation Info Card */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Patient {consultation.patientId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">{fDateTime(consultation.date || consultation.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Raison de consultation
                  </Typography>
                  <Typography variant="body1">{consultation.reason || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Stack>
          </Card>

          {/* Tabs */}
          <Card sx={{ mb: 3 }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ px: 2.5, pt: 1 }}>
              <Tab
                label="Diagnostic"
                value="diagnostic"
                icon={<Iconify icon="solar:clipboard-heart-bold" />}
                iconPosition="start"
              />
              <Tab
                label="Prescriptions"
                value="prescriptions"
                icon={<Iconify icon="solar:document-medicine-bold" />}
                iconPosition="start"
              />
              <Tab
                label="Ordonnance"
                value="ordonnance"
                icon={<Iconify icon="solar:printer-bold" />}
                iconPosition="start"
              />
            </Tabs>
          </Card>

          {/* Tab Content: Diagnostic */}
          {currentTab === 'diagnostic' && (
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Typography variant="h6">Diagnostic</Typography>
                <Divider />
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Diagnostic"
                  value={diagnostic}
                  onChange={(e) => setDiagnostic(e.target.value)}
                  placeholder="Saisir le diagnostic de la consultation..."
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <LoadingButton variant="contained" loading={saving} onClick={handleSaveDiagnostic}>
                    Enregistrer le diagnostic
                  </LoadingButton>
                </Box>
              </Stack>
            </Card>
          )}

          {/* Tab Content: Prescriptions */}
          {currentTab === 'prescriptions' && (
            <Stack spacing={3}>
              {/* Examens */}
              <Card sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Typography variant="h6">Prescriptions d&apos;examens</Typography>
                  <Divider />
                  <Stack direction="row" spacing={2}>
                    <TextField
                      fullWidth
                      label="Nom de l&apos;examen"
                      value={newExam}
                      onChange={(e) => setNewExam(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddExam();
                        }
                      }}
                      placeholder="Ex: Analyse sanguine complète, Radiographie..."
                    />
                    <Button variant="contained" onClick={handleAddExam} startIcon={<Iconify icon="eva:plus-fill" />}>
                      Ajouter
                    </Button>
                  </Stack>
                  <Stack spacing={1}>
                    {prescriptionsExams.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Aucun examen prescrit
                      </Typography>
                    ) : (
                      prescriptionsExams.map((exam) => (
                        <Box
                          key={exam.id}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography>{exam.name}</Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveExam(exam.id)}
                          >
                            <Iconify icon="eva:trash-2-fill" />
                          </IconButton>
                        </Box>
                      ))
                    )}
                  </Stack>
                </Stack>
              </Card>

              {/* Médicaments */}
              <Card sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Typography variant="h6">Prescriptions de médicaments</Typography>
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Nom du médicament"
                        value={newMedicament.name}
                        onChange={(e) => setNewMedicament({ ...newMedicament, name: e.target.value })}
                        placeholder="Ex: Paracétamol 500mg"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Posologie"
                        value={newMedicament.dosage}
                        onChange={(e) => setNewMedicament({ ...newMedicament, dosage: e.target.value })}
                        placeholder="Ex: 3x/jour"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Durée"
                        value={newMedicament.duration}
                        onChange={(e) => setNewMedicament({ ...newMedicament, duration: e.target.value })}
                        placeholder="Ex: 7 jours"
                      />
                    </Grid>
                  </Grid>
                  <Button variant="contained" onClick={handleAddMedicament} startIcon={<Iconify icon="eva:plus-fill" />}>
                    Ajouter le médicament
                  </Button>
                  <Stack spacing={1}>
                    {prescriptionsMedicaments.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Aucun médicament prescrit
                      </Typography>
                    ) : (
                      prescriptionsMedicaments.map((med) => (
                        <Box
                          key={med.id}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box>
                            <Typography fontWeight="bold">{med.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {med.dosage} - {med.duration}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMedicament(med.id)}
                          >
                            <Iconify icon="eva:trash-2-fill" />
                          </IconButton>
                        </Box>
                      ))
                    )}
                  </Stack>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <LoadingButton variant="contained" loading={saving} onClick={handleSavePrescriptions}>
                      Enregistrer les prescriptions
                    </LoadingButton>
                  </Box>
                </Stack>
              </Card>
            </Stack>
          )}

          {/* Tab Content: Ordonnance */}
          {currentTab === 'ordonnance' && (
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Typography variant="h6">Génération de l&apos;ordonnance</Typography>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  L&apos;ordonnance sera générée automatiquement à partir du diagnostic et des prescriptions enregistrés.
                </Typography>
                <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Aperçu de l&apos;ordonnance:
                  </Typography>
                  {diagnostic && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Diagnostic:
                      </Typography>
                      <Typography variant="body2">{diagnostic}</Typography>
                    </Box>
                  )}
                  {prescriptionsMedicaments.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Médicaments:
                      </Typography>
                      {prescriptionsMedicaments.map((med) => (
                        <Typography key={med.id} variant="body2">
                          • {med.name} - {med.dosage} - {med.duration}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  {prescriptionsExams.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Examens:
                      </Typography>
                      {prescriptionsExams.map((exam) => (
                        <Typography key={exam.id} variant="body2">
                          • {exam.name}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" startIcon={<Iconify icon="eva:eye-fill" />}>
                    Prévisualiser
                  </Button>
                  <Button variant="contained" startIcon={<Iconify icon="eva:printer-fill" />}>
                    Imprimer l&apos;ordonnance
                  </Button>
                </Box>
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
    </>
  );
}
