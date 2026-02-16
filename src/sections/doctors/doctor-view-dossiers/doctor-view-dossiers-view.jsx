import { Helmet } from 'react-helmet-async';
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
  TableBody,
  TableCell,
  TableHead,
  TextField,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  InputAdornment,
  TableContainer,
  TablePagination,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDateTime } from 'src/utils/format-time';

import ConsumApi from 'src/services_workers/consum_api';
import { AdminStorage } from 'src/storages/admins_storage';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

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

export default function DoctorViewDossiersView() {
  const router = useRouter();
  const { contextHolder, showError, showSuccess } = useNotification();

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // Par défaut, afficher toutes les consultations (EN_ATTENTE et EN_COURS)
  const [detailsDialog, setDetailsDialog] = useState({ open: false, consultation: null, loading: false });
  const [currentMedecinId, setCurrentMedecinId] = useState(null);

  // Récupérer l'ID du médecin connecté
  useEffect(() => {
    const loadCurrentMedecin = async () => {
      try {
        // Récupérer les informations de l'utilisateur connecté
        const adminInfo = AdminStorage.getInfoAdmin();
        console.log('Admin info:', adminInfo);
        
        // Si l'utilisateur a un ID de médecin directement
        if (adminInfo.medecinId || adminInfo.medecin?.id) {
          setCurrentMedecinId(adminInfo.medecinId || adminInfo.medecin?.id);
          return;
        }
        
        // Sinon, essayer de récupérer l'utilisateur depuis l'API
        const userResult = await ConsumApi.getCurrentUser();
        if (userResult.success && userResult.data) {
          const userData = userResult.data;
          // Chercher l'ID du médecin dans les données utilisateur
          if (userData.medecinId || userData.medecin?.id) {
            setCurrentMedecinId(userData.medecinId || userData.medecin?.id);
          } else if (userData.id) {
            // Si l'utilisateur est un médecin, son ID peut être l'ID du médecin
            // Essayer de trouver le médecin par l'ID utilisateur
            const medecinsResult = await ConsumApi.getMedecins({});
            if (medecinsResult.success) {
              const medecins = Array.isArray(medecinsResult.data) ? medecinsResult.data : [];
              const medecin = medecins.find((m) => m.user?.id === userData.id || m.userId === userData.id);
              if (medecin) {
                setCurrentMedecinId(medecin.id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading current medecin:', error);
      }
    };
    
    loadCurrentMedecin();
  }, []);

  const loadConsultations = useCallback(async () => {
    if (!currentMedecinId) {
      console.log('Waiting for medecin ID...');
      return;
    }

    setLoading(true);
    try {
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
        medecinId: currentMedecinId, // Filtrer par médecin connecté
      };

      // Si un statut est sélectionné, l'ajouter au filtre
      if (statusFilter) {
        filters.status = statusFilter;
      } else {
        // Si aucun statut n'est sélectionné, charger EN_ATTENTE et EN_COURS
        // On va charger toutes les consultations et filtrer côté client
      }

      const result = await ConsumApi.getConsultationsPaginated(page + 1, rowsPerPage, filters);

      if (result.success) {
        let consultationsData = result.data?.data || result.data?.consultations || [];
        
        // Si aucun filtre de statut, filtrer pour ne garder que EN_ATTENTE et EN_COURS
        if (!statusFilter) {
          consultationsData = consultationsData.filter(
            (c) => c.status === 'EN_ATTENTE' || c.status === 'EN_COURS'
          );
        }
        
        // Filtrer aussi par médecin côté client pour être sûr
        consultationsData = consultationsData.filter(
          (c) => c.medecinId === currentMedecinId || c.medecin?.id === currentMedecinId
        );
        
        setConsultations(consultationsData);
        setTotal(result.data?.pagination?.total || result.data?.total || consultationsData.length);
      } else {
        showError('Erreur', result.message || 'Impossible de charger les consultations');
        setConsultations([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
      showError('Erreur', 'Impossible de charger les consultations');
      setConsultations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, search, currentMedecinId]);

  useEffect(() => {
    if (currentMedecinId) {
      loadConsultations();
      // Recharger toutes les 30 secondes pour les consultations en attente ou en cours
      if (!statusFilter || statusFilter === 'EN_ATTENTE' || statusFilter === 'EN_COURS') {
        const interval = setInterval(() => {
          loadConsultations();
        }, 30000);
        return () => clearInterval(interval);
      }
    }
    return undefined;
  }, [loadConsultations, statusFilter, currentMedecinId]);

  const handleViewDetails = async (consultation) => {
    setDetailsDialog({ open: true, consultation, loading: true });
    try {
      // Charger les détails complets de la consultation
      const result = await ConsumApi.getConsultationComplete(consultation.id);
      if (result.success) {
        setDetailsDialog({ open: true, consultation: result.data, loading: false });
      } else {
        // Si l'API complète échoue, utiliser les données de base
        setDetailsDialog({ open: true, consultation, loading: false });
      }
    } catch (error) {
      console.error('Error loading consultation details:', error);
      setDetailsDialog({ open: true, consultation, loading: false });
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, consultation: null, loading: false });
  };

  const handleStartConsultation = async (consultationId) => {
    try {
      const result = await ConsumApi.updateConsultationStatus(consultationId, 'EN_COURS');
      if (result.success) {
        showSuccess('Succès', 'Consultation démarrée');
        loadConsultations();
        // Rediriger vers la page de consultation
        router.push(`/doctors/create-consultation?id=${consultationId}`);
      } else {
        showError('Erreur', 'Impossible de démarrer la consultation');
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      showError('Erreur', 'Impossible de démarrer la consultation');
    }
  };

  return (
    <>
      <Helmet>
        <title> Consultations | PREVENTIC </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Liste des Consultations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Consulter et gérer les consultations des patients
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Rechercher par numéro, patient, médecin..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Toutes (En attente + En cours)</MenuItem>
                <MenuItem value="EN_ATTENTE">En attente</MenuItem>
                <MenuItem value="EN_COURS">En cours</MenuItem>
                <MenuItem value="TERMINEE">Terminée</MenuItem>
                <MenuItem value="ANNULEE">Annulée</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Table */}
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
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
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (consultations.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            Aucune consultation trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return consultations.map((consultation) => (
                      <TableRow key={consultation.id} hover>
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
                            Dr. {consultation.medecin?.firstName || consultation.medecin?.firstname || 'N/A'}{' '}
                            {consultation.medecin?.lastName || consultation.medecin?.lastname || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(() => {
                              if (consultation.type === 'PREMIERE_CONSULTATION') return 'Première';
                              if (consultation.type === 'CONSULTATION_SUIVI') return 'Suivi';
                              return consultation.type || 'N/A';
                            })()}
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
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewDetails(consultation)}
                            >
                              Détails
                            </Button>
                            {consultation.status === 'EN_ATTENTE' && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStartConsultation(consultation.id)}
                                startIcon={<Iconify icon="solar:user-check-bold" />}
                              >
                                Recevoir
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePagination
            page={page}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Card>
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle>Détails de la Consultation</DialogTitle>
        <DialogContent>
          {detailsDialog.loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <LoadingButton loading>Chargement des détails...</LoadingButton>
            </Box>
          ) : (
            detailsDialog.consultation && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                {/* Informations de base */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numéro de consultation
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {detailsDialog.consultation.consultationNumber || detailsDialog.consultation.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Statut
                    </Typography>
                    <Chip
                      label={STATUS_LABELS[detailsDialog.consultation.status] || detailsDialog.consultation.status}
                      color={STATUS_COLORS[detailsDialog.consultation.status] || 'default'}
                      size="small"
                    />
                  </Grid>
                </Grid>

                <Divider />

                {/* Informations patient */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Informations Patient
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Nom complet
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {detailsDialog.consultation.patient?.firstName || detailsDialog.consultation.patient?.firstname}{' '}
                        {detailsDialog.consultation.patient?.lastName || detailsDialog.consultation.patient?.lastname}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Téléphone
                      </Typography>
                      <Typography variant="body1">{detailsDialog.consultation.patient?.phone || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{detailsDialog.consultation.patient?.email || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date de naissance
                      </Typography>
                      <Typography variant="body1">
                        {detailsDialog.consultation.patient?.dateOfBirth
                          ? fDateTime(detailsDialog.consultation.patient.dateOfBirth)
                          : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Informations médecin */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Informations Médecin
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Médecin
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        Dr. {detailsDialog.consultation.medecin?.firstName || detailsDialog.consultation.medecin?.firstname}{' '}
                        {detailsDialog.consultation.medecin?.lastName || detailsDialog.consultation.medecin?.lastname}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Spécialité
                      </Typography>
                      <Typography variant="body1">{detailsDialog.consultation.medecin?.speciality || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Informations consultation */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Informations Consultation
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date et heure
                      </Typography>
                      <Typography variant="body1">
                        {fDateTime(detailsDialog.consultation.consultationDate || detailsDialog.consultation.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body1">
                        {(() => {
                          if (detailsDialog.consultation.type === 'PREMIERE_CONSULTATION') return 'Première consultation';
                          if (detailsDialog.consultation.type === 'CONSULTATION_SUIVI') return 'Consultation de suivi';
                          if (detailsDialog.consultation.type === 'URGENCE') return 'Urgence';
                          return detailsDialog.consultation.type || 'N/A';
                        })()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Motif de consultation
                      </Typography>
                      <Typography variant="body1">{detailsDialog.consultation.reason || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Examen clinique */}
                {(detailsDialog.consultation.temperature ||
                  detailsDialog.consultation.systolicBloodPressure ||
                  detailsDialog.consultation.heartRate ||
                  detailsDialog.consultation.weight ||
                  detailsDialog.consultation.height) && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Examen Clinique
                      </Typography>
                      <Grid container spacing={2}>
                        {detailsDialog.consultation.temperature && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Température
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.temperature} °C</Typography>
                          </Grid>
                        )}
                        {(detailsDialog.consultation.systolicBloodPressure ||
                          detailsDialog.consultation.diastolicBloodPressure) && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Tension artérielle
                            </Typography>
                            <Typography variant="body1">
                              {detailsDialog.consultation.systolicBloodPressure || 'N/A'} /{' '}
                              {detailsDialog.consultation.diastolicBloodPressure || 'N/A'} mmHg
                            </Typography>
                          </Grid>
                        )}
                        {detailsDialog.consultation.heartRate && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Fréquence cardiaque
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.heartRate} bpm</Typography>
                          </Grid>
                        )}
                        {detailsDialog.consultation.respiratoryRate && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Fréquence respiratoire
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.respiratoryRate} /min</Typography>
                          </Grid>
                        )}
                        {detailsDialog.consultation.weight && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Poids
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.weight} kg</Typography>
                          </Grid>
                        )}
                        {detailsDialog.consultation.height && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Taille
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.height} cm</Typography>
                          </Grid>
                        )}
                        {detailsDialog.consultation.oxygenSaturation && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Saturation O2
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.oxygenSaturation} %</Typography>
                          </Grid>
                        )}
                        {detailsDialog.consultation.clinicalExamination && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Examen clinique
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.clinicalExamination}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </>
                )}

                {/* Diagnostic et traitement */}
                {(detailsDialog.consultation.diagnostic ||
                  detailsDialog.consultation.differentialDiagnosis ||
                  detailsDialog.consultation.treatment ||
                  detailsDialog.consultation.recommendations) && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Diagnostic et Traitement
                      </Typography>
                      <Stack spacing={2}>
                        {detailsDialog.consultation.diagnostic && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Diagnostic
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.diagnostic}</Typography>
                          </Box>
                        )}
                        {detailsDialog.consultation.differentialDiagnosis && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Diagnostic différentiel
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.differentialDiagnosis}</Typography>
                          </Box>
                        )}
                        {detailsDialog.consultation.treatment && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Traitement
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.treatment}</Typography>
                          </Box>
                        )}
                        {detailsDialog.consultation.recommendations && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Recommandations
                            </Typography>
                            <Typography variant="body1">{detailsDialog.consultation.recommendations}</Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </>
                )}

                {/* Prescriptions */}
                {detailsDialog.consultation.prescriptions &&
                  Array.isArray(detailsDialog.consultation.prescriptions) &&
                  detailsDialog.consultation.prescriptions.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Prescriptions ({detailsDialog.consultation.prescriptions.length})
                        </Typography>
                        <Stack spacing={1}>
                          {detailsDialog.consultation.prescriptions.map((prescription, index) => (
                            <Card key={prescription.id || index} sx={{ p: 2 }}>
                              <Stack spacing={1}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {prescription.label || prescription.type || `Prescription ${index + 1}`}
                                </Typography>
                                {prescription.dosage && (
                                  <Typography variant="body2">
                                    <strong>Dosage:</strong> {prescription.dosage}
                                  </Typography>
                                )}
                                {prescription.duration && (
                                  <Typography variant="body2">
                                    <strong>Durée:</strong> {prescription.duration}
                                  </Typography>
                                )}
                                {prescription.instructions && (
                                  <Typography variant="body2">
                                    <strong>Instructions:</strong> {prescription.instructions}
                                  </Typography>
                                )}
                                {prescription.quantity && (
                                  <Typography variant="body2">
                                    <strong>Quantité:</strong> {prescription.quantity}
                                  </Typography>
                                )}
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    </>
                  )}

                {/* Certificats */}
                {detailsDialog.consultation.certificats &&
                  Array.isArray(detailsDialog.consultation.certificats) &&
                  detailsDialog.consultation.certificats.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Certificats ({detailsDialog.consultation.certificats.length})
                        </Typography>
                        <Stack spacing={1}>
                          {detailsDialog.consultation.certificats.map((certificat, index) => (
                            <Card key={certificat.id || index} sx={{ p: 2 }}>
                              <Stack spacing={1}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {certificat.type || `Certificat ${index + 1}`}
                                </Typography>
                                {certificat.content && (
                                  <Typography variant="body2">{certificat.content}</Typography>
                                )}
                                {certificat.durationDays && (
                                  <Typography variant="body2">
                                    <strong>Durée:</strong> {certificat.durationDays} jours
                                  </Typography>
                                )}
                                {certificat.startDate && certificat.endDate && (
                                  <Typography variant="body2" color="text.secondary">
                                    Du {fDateTime(certificat.startDate)} au {fDateTime(certificat.endDate)}
                                  </Typography>
                                )}
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    </>
                  )}

                {/* Hospitalisation */}
                {detailsDialog.consultation.hospitalizationRequired && (
                  <>
                    <Divider />
                    <Alert severity="warning">
                      <Typography variant="subtitle2" fontWeight="bold">
                        Hospitalisation requise
                      </Typography>
                      {detailsDialog.consultation.hospitalizationReason && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Raison:</strong> {detailsDialog.consultation.hospitalizationReason}
                        </Typography>
                      )}
                    </Alert>
                  </>
                )}

                {/* Prochain rendez-vous */}
                {detailsDialog.consultation.nextAppointment && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Prochain rendez-vous
                      </Typography>
                      <Typography variant="body1">
                        {fDateTime(detailsDialog.consultation.nextAppointment)}
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Notes privées */}
                {detailsDialog.consultation.privateNotes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Notes privées
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {detailsDialog.consultation.privateNotes}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
          {detailsDialog.consultation?.status === 'EN_ATTENTE' && (
            <Button
              variant="contained"
              onClick={() => {
                handleStartConsultation(detailsDialog.consultation.id);
                handleCloseDetails();
              }}
            >
              Recevoir le patient
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
