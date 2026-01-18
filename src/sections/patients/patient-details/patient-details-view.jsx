import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import {
  Box,
  Tab,
  Card,
  Chip,
  Grid,
  Tabs,
  Stack,
  Avatar,
  Divider,
  Container,
  Typography,
  IconButton,
  alpha,
  Paper,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// Import des composants d'onglets
import PatientHistoryView from '../patient-history/patient-history-view';
import PatientAntecedentsView from '../patient-antecedents/patient-antecedents-view';
import PatientDocumentsView from '../patient-documents/patient-documents-view';
import PatientConsultationsView from '../patient-consultations/patient-consultations-view';

// ----------------------------------------------------------------------

const GENDER_COLORS = {
  M: 'info',
  F: 'error',
};

export default function PatientDetailsView() {
  const { id } = useParams();
  const router = useRouter();
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('overview');

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const result = await ConsumApi.getPatientById(id);
      const processed = showApiResponse(result, {
        successTitle: 'Patient chargé',
        errorTitle: 'Erreur de chargement',
        showNotification: false,
      });

      if (processed.success) {
        setPatient(processed.data);
      } else {
        showError('Erreur', 'Impossible de charger le patient');
        router.push('/patients/dossiers');
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      showError('Erreur', 'Impossible de charger le patient');
      router.push('/patients/dossiers');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age;
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title> Dossier Patient | Clinique </title>
        </Helmet>
        {contextHolder}
        <Container maxWidth="xl">
          <Typography>Chargement...</Typography>
        </Container>
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <Helmet>
          <title> Patient introuvable | Clinique </title>
        </Helmet>
        {contextHolder}
        <Container maxWidth="xl">
          <Typography>Patient introuvable</Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title> Dossier Patient: {patient.firstName || patient.firstname} {patient.lastName || patient.lastname} | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header avec bouton retour */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.push('/patients/dossiers')} sx={{ mr: 1 }}>
              <Iconify icon="eva:arrow-back-fill" />
            </IconButton>
            <Typography variant="h4">Dossier Patient</Typography>
          </Box>

          {/* Patient Info Card */}
          <Card sx={{ p: 3 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                  color: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {(patient.firstName || patient.firstname)?.charAt(0) || 'P'}
                {(patient.lastName || patient.lastname)?.charAt(0) || ''}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="h5">
                  {patient.firstName || patient.firstname} {patient.lastName || patient.lastname}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  ID: {patient.patientId || patient.id}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Date de naissance
                    </Typography>
                    <Typography variant="body2">{fDate(patient.dateOfBirth)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Âge
                    </Typography>
                    <Typography variant="body2">{calculateAge(patient.dateOfBirth)} ans</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Genre
                    </Typography>
                    <Chip
                      label={(() => {
                        if (patient.gender === 'M') return 'Masculin';
                        if (patient.gender === 'F') return 'Féminin';
                        return 'N/A';
                      })()}
                      color={GENDER_COLORS[patient.gender] || 'default'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Téléphone
                    </Typography>
                    <Typography variant="body2">{patient.phone || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2">{patient.email || 'N/A'}</Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Card>

          {/* Tabs */}
          <Card sx={{ mb: 3 }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ px: 2.5, pt: 1 }}>
              <Tab
                label="Vue d'ensemble"
                value="overview"
                icon={<Iconify icon="solar:widget-5-bold" />}
                iconPosition="start"
              />
              <Tab
                label="Historique médical"
                value="history"
                icon={<Iconify icon="solar:history-bold" />}
                iconPosition="start"
              />
              <Tab
                label="Antécédents & Allergies"
                value="antecedents"
                icon={<Iconify icon="solar:heart-pulse-bold" />}
                iconPosition="start"
              />
              <Tab
                label="Documents médicaux"
                value="documents"
                icon={<Iconify icon="solar:document-bold" />}
                iconPosition="start"
              />
              <Tab
                label="Suivi consultations"
                value="consultations"
                icon={<Iconify icon="solar:notes-medical-bold" />}
                iconPosition="start"
              />
            </Tabs>
          </Card>

          {/* Tab Content */}
          {currentTab === 'overview' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Informations personnelles
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Prénom
                      </Typography>
                      <Typography variant="body1">{patient.firstName || patient.firstname}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Nom
                      </Typography>
                      <Typography variant="body1">{patient.lastName || patient.lastname}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Date de naissance
                      </Typography>
                      <Typography variant="body1">{fDate(patient.dateOfBirth)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Genre
                      </Typography>
                      <Typography variant="body1">
                        {(() => {
                          if (patient.gender === 'M') return 'Masculin';
                          if (patient.gender === 'F') return 'Féminin';
                          return 'N/A';
                        })()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Contact
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Téléphone
                      </Typography>
                      <Typography variant="body1">{patient.phone || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{patient.email || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Adresse
                      </Typography>
                      <Typography variant="body1">{patient.address || 'N/A'}</Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          )}

          {currentTab === 'history' && (
            <Box sx={{ position: 'relative' }}>
              <PatientHistoryView patientId={id} />
            </Box>
          )}

          {currentTab === 'antecedents' && (
            <Box sx={{ position: 'relative' }}>
              <PatientAntecedentsView patientId={id} />
            </Box>
          )}

          {currentTab === 'documents' && (
            <Box sx={{ position: 'relative' }}>
              <PatientDocumentsView patientId={id} />
            </Box>
          )}

          {currentTab === 'consultations' && (
            <Box sx={{ position: 'relative' }}>
              <PatientConsultationsView patientId={id} />
            </Box>
          )}
        </Stack>
      </Container>
    </>
  );
}
