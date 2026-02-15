import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  Select,
  Divider,
  MenuItem,
  Container,
  TextField,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------


export default function PatientAccueilView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [activeStep, setActiveStep] = useState(0);

  // Patient search modal
  const [patientSearchModal, setPatientSearchModal] = useState({ open: false });
  const [patientSearch, setPatientSearch] = useState('');
  const [allPatients, setAllPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

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
      const result = await ConsumApi.getPatients({});
      if (result.success) {
        const patients = Array.isArray(result.data?.patients) ? result.data.patients : result.data || [];
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

  useEffect(() => {
    loadAllPatients();
  }, [loadAllPatients]);

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

  const handleReset = () => {
    setActiveStep(0);
    setPatientSearch('');
    // Recharger la liste des patients
    loadAllPatients();
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

        </Stack>
      </Container>

      {/* Dialog de création de patient */}
      <Dialog open={createPatientDialog.open} onClose={() => setCreatePatientDialog({ open: false, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Créer un nouveau patient</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
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
    </>
  );
}
