import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

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
  Dialog,
  Select,
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
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fDateTime } from 'src/utils/format-time';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';
import { AdminStorage } from 'src/storages/admins_storage';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  PRISE_CONSTANTES: 'secondary',
  EN_ATTENTE: 'warning',
  EN_COURS: 'info',
  TERMINEE: 'success',
  ANNULEE: 'error',
};

const STATUS_LABELS = {
  PRISE_CONSTANTES: 'Prise de constantes (infirmier)',
  EN_ATTENTE: 'En attente médecin',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

const CONSULTATION_TYPES = {
  PREMIERE_CONSULTATION: 'Première consultation',
  CONSULTATION_SUIVI: 'Consultation de suivi',
  URGENCE: 'Urgence',
};

// ----------------------------------------------------------------------


export default function PatientAccueilView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [activeStep] = useState(0);

  // Patient search modal
  const [patientSearchModal, setPatientSearchModal] = useState({ open: false });
  const [patientSearch, setPatientSearch] = useState('');
  const [allPatients, setAllPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Consultations
  const [consultations, setConsultations] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, loading: false, editing: false });
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferDoctorDialog, setTransferDoctorDialog] = useState({ open: false, medecinId: '' });
  const [medecins, setMedecins] = useState([]);

  // Create patient dialog
  const [createPatientDialog, setCreatePatientDialog] = useState({ open: false, loading: false });
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    maritalStatus: 'SINGLE',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  const loadAllPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const admin = AdminStorage.getInfoAdmin();
      const role = ((admin?.role ?? admin?.service) ?? '').toString().toUpperCase().trim();
      let infirmierId = admin?.infirmierId || admin?.infirmier?.id || null;
      if (role === 'INFIRMIER' && !infirmierId && admin?.id) {
        try {
          const infResult = await ConsumApi.getInfirmiers();
          if (infResult.success && Array.isArray(infResult.data)) {
            const me = infResult.data.find((n) => n.user?.id === admin.id || n.userId === admin.id);
            if (me) infirmierId = me.id;
          }
        } catch (_) { /* infirmier id non trouvé */ }
      }
      const filters = role === 'INFIRMIER' && infirmierId ? { infirmierId } : {};
      const result = await ConsumApi.getPatients(filters);
      if (result.success) {
        let patients = Array.isArray(result.data?.patients) ? result.data.patients : result.data || [];
        if (!Array.isArray(patients)) patients = [];
        if (role === 'INFIRMIER' && infirmierId && patients.length > 0) {
          patients = patients.filter(
            (p) =>
              p.infirmierId === infirmierId ||
              p.nurseId === infirmierId ||
              p.assignedNurseId === infirmierId ||
              p.infirmier?.id === infirmierId ||
              p.nurse?.id === infirmierId
          );
        }
        setAllPatients(patients);
        setFilteredPatients(patients);
      } else {
        console.warn('Failed to load patients:', result.message);
        setAllPatients([]);
        setFilteredPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      setAllPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  const loadAllConsultations = useCallback(async () => {
    setLoadingConsultations(true);
    try {
      const admin = AdminStorage.getInfoAdmin();
      const role = ((admin?.role ?? admin?.service) ?? '').toString().toUpperCase().trim();
      let infirmierId = admin?.infirmierId || admin?.infirmier?.id || null;
      if (role === 'INFIRMIER' && !infirmierId && admin?.id) {
        try {
          const infResult = await ConsumApi.getInfirmiers();
          if (infResult.success && Array.isArray(infResult.data)) {
            const me = infResult.data.find((n) => n.user?.id === admin.id || n.userId === admin.id);
            if (me) infirmierId = me.id;
          }
        } catch (_) { /* infirmier id non trouvé */ }
      }
      const filters = role === 'INFIRMIER' && infirmierId ? { nurseId: infirmierId } : {};
      const result = await ConsumApi.getConsultations(filters);

      if (result.success) {
        let consultationsList = [];
        if (Array.isArray(result.data)) {
          consultationsList = result.data;
        } else if (result.data && Array.isArray(result.data.data)) {
          consultationsList = result.data.data;
        } else if (result.data && typeof result.data === 'object') {
          consultationsList = result.data.consultations || result.data.items || result.data.results || [];
        }
        if (role === 'INFIRMIER' && infirmierId && consultationsList.length > 0) {
          consultationsList = consultationsList.filter(
            (c) =>
              c.nurseId === infirmierId ||
              c.infirmierId === infirmierId ||
              c.nurse?.id === infirmierId ||
              c.infirmier?.id === infirmierId
          );
        }
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
  }, []);

  useEffect(() => {
    loadAllPatients();
    loadAllConsultations();
  }, [loadAllPatients, loadAllConsultations]);

  // Filtrer les patients selon la recherche
  useEffect(() => {
    if (!patientSearch.trim()) {
      // Si pas de recherche, afficher tous les patients
      setFilteredPatients(allPatients);
    } else {
      // Filtrer les patients selon le critère de recherche
      const searchLower = patientSearch.toLowerCase().trim();
      const filtered = allPatients.filter((patient) => {
        const firstName = (patient.firstName || patient.firstname || '').toLowerCase();
        const lastName = (patient.lastName || patient.lastname || '').toLowerCase();
        const patientNumber = (patient.patientNumber || patient.id || '').toLowerCase();
        const phone = (patient.phone || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.toLowerCase();

        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          patientNumber.includes(searchLower) ||
          phone.includes(searchLower) ||
          fullName.includes(searchLower)
        );
      });
      setFilteredPatients(filtered);
    }
  }, [patientSearch, allPatients]);

  const handleOpenCreatePatient = () => {
    setNewPatientForm({
      firstName: '',
      lastName: '',
      gender: 'MALE',
      dateOfBirth: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: '',
      maritalStatus: 'SINGLE',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
    });
    setCreatePatientDialog({ open: true, loading: false });
  };

  const handleCreatePatient = async () => {
    if (!newPatientForm.firstName || !newPatientForm.lastName || !newPatientForm.phone) {
      showError('Erreur', 'Veuillez remplir les champs obligatoires (Nom, Prénom, Téléphone)');
      return;
    }

    if (!newPatientForm.emergencyContactName || !newPatientForm.emergencyContactPhone) {
      showError('Erreur', 'Veuillez remplir les informations du contact d\'urgence (Nom et Téléphone)');
      return;
    }

    setCreatePatientDialog({ ...createPatientDialog, loading: true });
    try {
      const result = await ConsumApi.createPatient(newPatientForm);
      const processed = showApiResponse(result, {
        successTitle: 'Patient créé',
        errorTitle: 'Erreur de création',
      });

      if (processed.success) {
        const createdPatient = result.data?.patient || result.data;
        showSuccess('Succès', 'Patient créé avec succès');
        setCreatePatientDialog({ open: false, loading: false });
        // Recharger la liste des patients
        await loadAllPatients();
        // Fermer le modal de création et ouvrir le modal de recherche
        setCreatePatientDialog({ open: false, loading: false });
        setPatientSearchModal({ open: true });
        // Sélectionner automatiquement le patient créé
        handleSelectPatient(createdPatient);
        // Réinitialiser le formulaire
        setNewPatientForm({
          firstName: '',
          lastName: '',
          gender: 'MALE',
          dateOfBirth: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          country: '',
          maritalStatus: 'SINGLE',
          emergencyContactName: '',
          emergencyContactPhone: '',
          emergencyContactRelationship: '',
        });
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      showError('Erreur', 'Impossible de créer le patient');
    } finally {
      setCreatePatientDialog({ ...createPatientDialog, loading: false });
    }
  };

  const navigate = useNavigate();

  const handleOpenPatientSearch = () => {
    setPatientSearch('');
    setPatientSearchModal({ open: true });
  };

  const handleClosePatientSearch = () => {
    setPatientSearchModal({ open: false });
    setPatientSearch('');
  };

  const handleSelectPatient = (patient) => {
    // Fermer le modal
    handleClosePatientSearch();
    // Rediriger vers la vue de création de consultation
    navigate(routesName.patientsCreateConsultation.replace(':patientId', patient.id));
  };

  const handleOpenDetails = async (consultation) => {
    setDetailsDialog({ open: true, loading: true, editing: false });
    setSelectedConsultation(null);
    setEditForm(null);
    
    try {
      const result = await ConsumApi.getConsultationById(consultation.id);
      if (result.success) {
        const consultationData = result.data?.consultation || result.data;
        setSelectedConsultation(consultationData);
        setEditForm({
          selectedMedecinId: consultationData.medecinId || consultationData.medecin?.id || '',
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
        loadMedecinsForDetails();
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

    const currentMedecinId = selectedConsultation.medecinId || selectedConsultation.medecin?.id;
    const selectedMedecinId = editForm.selectedMedecinId || currentMedecinId;
    if (!selectedMedecinId) {
      showError('Erreur', 'Veuillez sélectionner un médecin pour enregistrer les constantes.');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...editForm,
        patientId: selectedConsultation.patientId || selectedConsultation.patient?.id,
        medecinId: selectedMedecinId,
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
        await loadAllConsultations();
      }
    } catch (error) {
      console.error('Error updating consultation:', error);
      showError('Erreur', 'Erreur lors de la mise à jour de la consultation');
    } finally {
      setSaving(false);
    }
  };

  const loadMedecinsForDetails = useCallback(async () => {
    try {
      const result = await ConsumApi.getMedecins({});
      if (result.success) {
        const list = Array.isArray(result.data) ? result.data : result.data?.medecins || result.data?.data || [];
        setMedecins(list);
      }
    } catch (e) {
      console.error('Error loading medecins:', e);
    }
  }, []);

  const handleOpenTransferToDoctor = async () => {
    try {
      const result = await ConsumApi.getMedecins({});
      if (result.success) {
        const list = Array.isArray(result.data) ? result.data : result.data?.medecins || result.data?.data || [];
        setMedecins(list);
        setTransferDoctorDialog({ open: true, medecinId: list.length > 0 ? list[0].id : '' });
      }
    } catch (e) {
      showError('Erreur', 'Impossible de charger la liste des médecins');
    }
  };

  const handleTransferToDoctor = async () => {
    if (!selectedConsultation) return;
    const { medecinId } = transferDoctorDialog;
    if (!medecinId) {
      showError('Erreur', 'Veuillez sélectionner un médecin');
      return;
    }

    setTransferring(true);
    setTransferDoctorDialog({ open: false, medecinId: '' });
    try {
      const updatePayload = {
        patientId: selectedConsultation.patientId || selectedConsultation.patient?.id,
        medecinId,
        type: selectedConsultation.type || 'PREMIERE_CONSULTATION',
        status: 'EN_COURS',
        consultationDate: selectedConsultation.consultationDate,
        reason: selectedConsultation.reason,
        clinicalExamination: editForm?.clinicalExamination ?? selectedConsultation.clinicalExamination,
        temperature: editForm?.temperature ?? selectedConsultation.temperature,
        systolicBloodPressure: editForm?.systolicBloodPressure ?? selectedConsultation.systolicBloodPressure,
        diastolicBloodPressure: editForm?.diastolicBloodPressure ?? selectedConsultation.diastolicBloodPressure,
        heartRate: editForm?.heartRate ?? selectedConsultation.heartRate,
        respiratoryRate: editForm?.respiratoryRate ?? selectedConsultation.respiratoryRate,
        weight: editForm?.weight ?? selectedConsultation.weight,
        height: editForm?.height ?? selectedConsultation.height,
        oxygenSaturation: editForm?.oxygenSaturation ?? selectedConsultation.oxygenSaturation,
        diagnostic: editForm?.diagnostic ?? selectedConsultation.diagnostic,
        differentialDiagnosis: editForm?.differentialDiagnosis ?? selectedConsultation.differentialDiagnosis,
        treatment: editForm?.treatment ?? selectedConsultation.treatment,
        recommendations: editForm?.recommendations ?? selectedConsultation.recommendations,
        privateNotes: editForm?.privateNotes ?? selectedConsultation.privateNotes,
        nextAppointment: editForm?.nextAppointment ?? selectedConsultation.nextAppointment,
        hospitalizationRequired: editForm?.hospitalizationRequired ?? selectedConsultation.hospitalizationRequired,
        hospitalizationReason: editForm?.hospitalizationReason ?? selectedConsultation.hospitalizationReason,
      };
      const result = await ConsumApi.updateConsultation(selectedConsultation.id, updatePayload);
      const processed = showApiResponse(result, {
        successTitle: 'Patient transféré',
        errorTitle: 'Erreur de transfert',
      });

      if (processed.success) {
        showSuccess('Succès', 'Patient transféré au médecin avec succès');
        await handleOpenDetails({ id: selectedConsultation.id });
        await loadAllConsultations();
      }
    } catch (error) {
      console.error('Error transferring to doctor:', error);
      showError('Erreur', 'Erreur lors du transfert au médecin');
    } finally {
      setTransferring(false);
    }
  };


  return (
    <>
      <Helmet>
        <title> Accueil Patient | PREVENTIC </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Accueil Patient</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enregistrement, paiement et orientation du patient
            </Typography>
          </Box>

          {/* Recherche et sélection du patient */}
          {activeStep === 0 && (
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Recherche et sélection du patient</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="eva:plus-fill" />}
                    onClick={handleOpenCreatePatient}
                  >
                    Créer un nouveau patient
                  </Button>
                </Box>

                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Iconify icon="eva:search-fill" />}
                    onClick={handleOpenPatientSearch}
                    sx={{ minWidth: 250 }}
                  >
                    Rechercher un patient
                  </Button>
                </Box>
              </Stack>
            </Card>
          )}

          {/* Tableau des consultations */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6">Toutes les consultations</Typography>
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
                  return <Alert severity="info">Aucune consultation enregistrée.</Alert>;
                }
                return (
                  <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Numéro</TableCell>
                        <TableCell>Patient</TableCell>
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
                        <TableRow
                          key={consultation.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleOpenDetails(consultation)}
                        >
                          <TableCell>
                            <Typography variant="subtitle2">
                              {consultation.consultationNumber || consultation.id?.substring(0, 8)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {consultation.patient?.firstName || consultation.patient?.firstname || 'N/A'}{' '}
                              {consultation.patient?.lastName || consultation.patient?.lastname || ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {consultation.patient?.phone || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {consultation.status === 'PRISE_CONSTANTES'
                                ? '— Infirmier (constantes)'
                                : `Dr. ${consultation.medecin?.firstName || consultation.medecin?.firstname || 'N/A'} ${consultation.medecin?.lastName || consultation.medecin?.lastname || ''}`}
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

      {/* Dialog de création de patient */}
      <Dialog open={createPatientDialog.open} onClose={() => setCreatePatientDialog({ open: false, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Créer un nouveau patient</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 0 }}>
              Après enregistrement, vous assignerez le patient à un infirmier (prise des constantes), puis l&apos;infirmier l&apos;assignera à un médecin pour la suite de la prise en charge.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Prénom"
                  value={newPatientForm.firstName}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nom"
                  value={newPatientForm.lastName}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Genre</InputLabel>
                  <Select
                    value={newPatientForm.gender}
                    label="Genre"
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                  >
                    <MenuItem value="MALE">Masculin</MenuItem>
                    <MenuItem value="FEMALE">Féminin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de naissance"
                  value={newPatientForm.dateOfBirth}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, dateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Téléphone"
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={newPatientForm.email}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adresse"
                  value={newPatientForm.address}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ville"
                  value={newPatientForm.city}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pays"
                  value={newPatientForm.country}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, country: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Statut marital</InputLabel>
                  <Select
                    value={newPatientForm.maritalStatus}
                    label="Statut marital"
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, maritalStatus: e.target.value })}
                  >
                    <MenuItem value="SINGLE">Célibataire</MenuItem>
                    <MenuItem value="MARRIED">Marié(e)</MenuItem>
                    <MenuItem value="DIVORCED">Divorcé(e)</MenuItem>
                    <MenuItem value="WIDOWED">Veuf(ve)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contact d&apos;urgence
                  </Typography>
                </Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nom du contact d'urgence"
                  value={newPatientForm.emergencyContactName}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyContactName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Téléphone du contact d'urgence"
                  value={newPatientForm.emergencyContactPhone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyContactPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lien de parenté"
                  value={newPatientForm.emergencyContactRelationship}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyContactRelationship: e.target.value })}
                  placeholder="Ex: Époux(se), Parent, Frère/Sœur, etc."
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePatientDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleCreatePatient}
            loading={createPatientDialog.loading}
            disabled={
              !newPatientForm.firstName ||
              !newPatientForm.lastName ||
              !newPatientForm.phone ||
              !newPatientForm.emergencyContactName ||
              !newPatientForm.emergencyContactPhone
            }
          >
            Créer le patient
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Patient Search Modal */}
      <Dialog open={patientSearchModal.open} onClose={handleClosePatientSearch} maxWidth="md" fullWidth>
        <DialogTitle>Rechercher et sélectionner un patient</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              placeholder="Rechercher par numéro, nom ou prénom... (laissez vide pour voir tous les patients)"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              InputProps={{
                startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
              }}
            />

            {loadingPatients ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <LoadingButton loading>Chargement des patients...</LoadingButton>
              </Box>
            ) : (
              <>
                {filteredPatients.length > 0 ? (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      {patientSearch
                        ? `Résultats de recherche (${filteredPatients.length} sur ${allPatients.length})`
                        : `Tous les patients (${filteredPatients.length})`}
                    </Typography>
                    <Stack spacing={1} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {filteredPatients.map((patient) => (
                        <Card
                          key={patient.id}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            border: 1,
                            borderColor: 'divider',
                            '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
                          }}
                          onClick={() => handleSelectPatient(patient)}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="subtitle1">
                                {patient.firstName || patient.firstname} {patient.lastName || patient.lastname}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {patient.patientNumber || patient.id} | {patient.phone || 'N/A'}
                              </Typography>
                            </Box>
                            <Iconify icon="eva:arrow-forward-fill" sx={{ color: 'text.secondary' }} />
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Alert
                    severity="info"
                    action={
                      <Button color="inherit" size="small" onClick={handleOpenCreatePatient}>
                        Créer un nouveau patient
                      </Button>
                    }
                  >
                    {patientSearch
                      ? 'Aucun patient trouvé avec ces critères. Souhaitez-vous créer un nouveau patient ?'
                      : 'Aucun patient enregistré. Créez le premier patient.'}
                  </Alert>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePatientSearch}>Fermer</Button>
          <Button variant="outlined" startIcon={<Iconify icon="eva:plus-fill" />} onClick={handleOpenCreatePatient}>
            Créer un nouveau patient
          </Button>
        </DialogActions>
      </Dialog>

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
                  {detailsDialog.editing && (
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Médecin (obligatoire pour enregistrer)</InputLabel>
                        <Select
                          value={editForm.selectedMedecinId || ''}
                          label="Médecin (obligatoire pour enregistrer)"
                          onChange={(e) => setEditForm({ ...editForm, selectedMedecinId: e.target.value || '' })}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>{medecins.length === 0 ? 'Chargement...' : '— Sélectionner un médecin —'}</em>
                          </MenuItem>
                          {medecins.map((med) => (
                            <MenuItem key={med.id} value={med.id}>
                              Dr. {med.firstName || med.first_name} {med.lastName || med.last_name}
                              {med.speciality ? ` — ${med.speciality}` : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
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
                      disabled={!detailsDialog.editing || !(selectedConsultation.medecinId || selectedConsultation.medecin?.id)}
                      helperText={!(selectedConsultation.medecinId || selectedConsultation.medecin?.id) ? 'Rempli par le médecin après transfert' : undefined}
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
                      disabled={!detailsDialog.editing || !(selectedConsultation.medecinId || selectedConsultation.medecin?.id)}
                      helperText={!(selectedConsultation.medecinId || selectedConsultation.medecin?.id) ? 'Rempli par le médecin après transfert' : undefined}
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
          {!detailsDialog.editing && selectedConsultation && (selectedConsultation.status === 'PRISE_CONSTANTES' || selectedConsultation.status === 'EN_ATTENTE') && (
            <LoadingButton
              variant="contained"
              color="primary"
              onClick={handleOpenTransferToDoctor}
              loading={transferring}
              startIcon={<Iconify icon="eva:person-add-fill" />}
            >
              Transférer au médecin
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog choix du médecin pour le transfert */}
      <Dialog open={transferDoctorDialog.open} onClose={() => setTransferDoctorDialog({ open: false, medecinId: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Choisir le médecin</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Médecin</InputLabel>
            <Select
              value={transferDoctorDialog.medecinId}
              label="Médecin"
              onChange={(e) => setTransferDoctorDialog((prev) => ({ ...prev, medecinId: e.target.value }))}
            >
              {medecins.map((medecin) => (
                <MenuItem key={medecin.id} value={medecin.id}>
                  Dr. {medecin.firstName || medecin.firstname} {medecin.lastName || medecin.lastname} — {medecin.speciality || 'Médecine générale'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDoctorDialog({ open: false, medecinId: '' })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleTransferToDoctor} loading={transferring}>
            Confirmer le transfert
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
