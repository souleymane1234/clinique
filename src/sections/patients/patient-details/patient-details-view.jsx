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
  alpha,
  Avatar,
  Divider,
  Container,
  Typography,
  IconButton,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';

import ConsumApi from 'src/services_workers/consum_api';
import { AdminStorage } from 'src/storages/admins_storage';

import Iconify from 'src/components/iconify';

// Import des composants d'onglets
import PatientHistoryView from '../patient-history/patient-history-view';
import PatientAllergiesView from '../patient-allergies/patient-allergies-view';
import PatientDocumentsView from '../patient-documents/patient-documents-view';
import PatientAntecedentsView from '../patient-antecedents/patient-antecedents-view';
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

  const admin = AdminStorage.getInfoAdmin();
  const roleRaw = admin?.role ?? admin?.service;
  const roleSource =
    typeof roleRaw === 'object' && roleRaw !== null
      ? (roleRaw.name || roleRaw.slug || roleRaw.label || '')
      : String(roleRaw || '');
  const currentRole = roleSource.trim().toUpperCase().replace(/\s+/g, '_');
  const isSecretary = currentRole === 'SECRETAIRE' || currentRole === 'SECRÉTAIRE';
  const isAdminOrDirector =
    currentRole === 'ADMIN' ||
    currentRole === 'ADMINISTRATEUR' ||
    currentRole === 'DIRECTEUR' ||
    currentRole === 'DIRECTION';

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('overview');
  const [timeTrackingLoading, setTimeTrackingLoading] = useState(false);
  const [patientVisits, setPatientVisits] = useState([]);
  const [serviceAggregates, setServiceAggregates] = useState([]);

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

  const formatDuration = (minutes) => {
    if (minutes == null || Number.isNaN(Number(minutes))) return 'N/A';
    const total = Math.max(0, Math.round(Number(minutes)));
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h}h ${m}min`;
  };

  const loadTimeTracking = async () => {
    if (!id) return;
    setTimeTrackingLoading(true);
    try {
      const [visitsRes, aggrRes] = await Promise.all([
        ConsumApi.getPatientVisitsWithDurations(id),
        ConsumApi.getServiceAggregates(),
      ]);
      const visits = Array.isArray(visitsRes?.data) ? visitsRes.data : visitsRes?.data?.data || [];
      const aggr = Array.isArray(aggrRes?.data) ? aggrRes.data : aggrRes?.data?.data || [];
      setPatientVisits(Array.isArray(visits) ? visits : []);
      setServiceAggregates(Array.isArray(aggr) ? aggr : []);
    } catch (error) {
      console.error('Error loading time tracking:', error);
      setPatientVisits([]);
      setServiceAggregates([]);
    } finally {
      setTimeTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'timeTracking' && isAdminOrDirector) {
      loadTimeTracking();
    }
  }, [currentTab, isAdminOrDirector, id]);

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

          {/* Tabs : masqués pour la secrétaire (elle ne voit que la vue d'ensemble) */}
          {!isSecretary && (
            <Card sx={{ mb: 3 }}>
              <Tabs
                value={currentTab}
                onChange={(e, newValue) => setCurrentTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{ px: 2.5, pt: 1 }}
              >
                <Tab
                  label="Vue d'ensemble"
                  value="overview"
                  icon={<Iconify icon="solar:widget-5-bold" />}
                  iconPosition="start"
                />
                {/* <Tab
                  label="Historique médical"
                  value="history"
                  icon={<Iconify icon="solar:history-bold" />}
                  iconPosition="start"
                /> */}
                <Tab
                  label="Antécédents"
                  value="antecedents"
                  icon={<Iconify icon="solar:heart-pulse-bold" />}
                  iconPosition="start"
                />
                <Tab
                  label="Allergies"
                  value="allergies"
                  icon={<Iconify icon="solar:heart-pulse-bold" />}
                  iconPosition="start"
                />
                {/* <Tab
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
                /> */}
                {isAdminOrDirector && (
                  <Tab
                    label="Time Tracking"
                    value="timeTracking"
                    icon={<Iconify icon="solar:clock-circle-bold" />}
                    iconPosition="start"
                  />
                )}
              </Tabs>
            </Card>
          )}

          {/* Tab Content : secrétaire = uniquement vue d'ensemble */}
          {(currentTab === 'overview' || isSecretary) && (
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

          {!isSecretary && currentTab === 'history' && (
            <Box sx={{ position: 'relative' }}>
              <PatientHistoryView patientId={id} />
            </Box>
          )}

          {!isSecretary && currentTab === 'antecedents' && (
            <Box sx={{ position: 'relative' }}>
              <PatientAntecedentsView patientId={id} />
            </Box>
          )}

          {!isSecretary && currentTab === 'allergies' && (
            <Box sx={{ position: 'relative' }}>
              <PatientAllergiesView patientId={id} />
            </Box>
          )}

          {!isSecretary && currentTab === 'documents' && (
            <Box sx={{ position: 'relative' }}>
              <PatientDocumentsView patientId={id} />
            </Box>
          )}

          {!isSecretary && currentTab === 'consultations' && (
            <Box sx={{ position: 'relative' }}>
              <PatientConsultationsView patientId={id} />
            </Box>
          )}

          {!isSecretary && isAdminOrDirector && currentTab === 'timeTracking' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Visites du patient
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {(() => {
                    if (timeTrackingLoading) {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      );
                    }
                    if (patientVisits.length === 0) {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Aucune visite enregistrée.
                        </Typography>
                      );
                    }
                    return (
                      <Stack spacing={1.5}>
                        {patientVisits.map((visit) => (
                          <Box
                            key={visit.id}
                            sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                          >
                            <Typography variant="subtitle2">Visite #{String(visit.id).slice(0, 8)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Arrivée: {visit.arriveAt ? new Date(visit.arriveAt).toLocaleString() : 'N/A'}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              Sortie: {visit.leaveAt ? new Date(visit.leaveAt).toLocaleString() : 'En cours'}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              Durée: {formatDuration(visit.durationMinutes)}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    );
                  })()}
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Temps par service (global)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {(() => {
                    if (timeTrackingLoading) {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      );
                    }
                    if (serviceAggregates.length === 0) {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Aucune statistique disponible.
                        </Typography>
                      );
                    }
                    return (
                      <Stack spacing={1.2}>
                        {serviceAggregates.map((item, idx) => (
                          <Box
                            key={`${item.serviceType || item.service || 'service'}-${idx}`}
                            sx={{ display: 'flex', justifyContent: 'space-between' }}
                          >
                            <Typography variant="body2">{item.serviceType || item.service || 'Service'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Moy: {formatDuration(item.averageMinutes ?? item.avgMinutes ?? item.avg)} | Max:{' '}
                              {formatDuration(item.maxMinutes ?? item.max)}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    );
                  })()}
                </Card>
              </Grid>
            </Grid>
          )}
        </Stack>
      </Container>
    </>
  );
}
