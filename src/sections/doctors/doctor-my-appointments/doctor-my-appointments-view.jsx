import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
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

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';

import ConsumApi from 'src/services_workers/consum_api';
import { AdminStorage } from 'src/storages/admins_storage';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  PROGRAMME: 'default',
  CONFIRME: 'info',
  ANNULE: 'error',
  TERMINE: 'success',
};

const STATUS_LABELS = {
  PROGRAMME: 'Programmé',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
};

export default function DoctorMyAppointmentsView() {
  const { contextHolder, showError, showSuccess, showApiResponse } = useNotification();
  const adminInfo = AdminStorage.getInfoAdmin() || {};
  const normalizedRole = String(adminInfo?.role?.name || adminInfo?.role || adminInfo?.service || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  const isAdminOrDirecteur = normalizedRole === 'ADMIN' || normalizedRole === 'DIRECTEUR' || normalizedRole === 'ADMINISTRATEUR';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, appointment: null, loading: false });
  const [currentMedecinId, setCurrentMedecinId] = useState(null);

  // Récupérer l'ID du médecin connecté
  useEffect(() => {
    const loadCurrentMedecin = async () => {
      try {
        const storedAdminInfo = AdminStorage.getInfoAdmin();
        
        if (storedAdminInfo.medecinId || storedAdminInfo.medecin?.id) {
          const medecinId = storedAdminInfo.medecinId || storedAdminInfo.medecin?.id;
          setCurrentMedecinId(medecinId);
          return;
        }
        
        const userResult = await ConsumApi.getCurrentUser();
        if (userResult.success && userResult.data) {
          const userData = userResult.data;
          
          if (userData.medecinId || userData.medecin?.id) {
            const medecinId = userData.medecinId || userData.medecin?.id;
            setCurrentMedecinId(medecinId);
            return;
          }
          
          if (userData.id) {
            const medecinsResult = await ConsumApi.getMedecins({});
            if (medecinsResult.success) {
              let medecins = [];
              if (Array.isArray(medecinsResult.data)) {
                medecins = medecinsResult.data;
              } else if (medecinsResult.data && Array.isArray(medecinsResult.data.data)) {
                medecins = medecinsResult.data.data;
              } else if (medecinsResult.data && typeof medecinsResult.data === 'object') {
                medecins = medecinsResult.data.medecins || medecinsResult.data.items || [];
              }
              
              const medecin = medecins.find(
                (m) => 
                  m.user?.id === userData.id || 
                  m.userId === userData.id ||
                  m.user?.id === storedAdminInfo.id ||
                  m.userId === storedAdminInfo.id
              );
              
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

  const loadAppointments = useCallback(async () => {
    if (!isAdminOrDirecteur && !currentMedecinId) {
      return;
    }

    setLoading(true);
    try {
      // Admin/Directeur: liste globale. Médecin: ses rendez-vous.
      const result = isAdminOrDirecteur
        ? await ConsumApi.getAppointments()
        : await ConsumApi.getAppointmentsByMedecin(currentMedecinId);
      
      if (result.success) {
        let appointmentsData = Array.isArray(result.data) ? result.data : [];
        
        // Filtrer par statut si sélectionné
        if (statusFilter) {
          appointmentsData = appointmentsData.filter((a) => a.status === statusFilter);
        }
        
        // Filtrer par recherche si présente
        if (search) {
          const searchLower = search.toLowerCase();
          appointmentsData = appointmentsData.filter(
            (a) =>
              (a.patient?.firstName || '').toLowerCase().includes(searchLower) ||
              (a.patient?.lastName || '').toLowerCase().includes(searchLower) ||
              (a.patient?.phone || '').toLowerCase().includes(searchLower) ||
              (a.reason || '').toLowerCase().includes(searchLower)
          );
        }
        
        // Trier par date et heure (plus récents en premier)
        appointmentsData.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
          const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
          return dateB - dateA;
        });
        
        // Pagination côté client
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedData = appointmentsData.slice(start, end);
        
        setAppointments(paginatedData);
        setTotal(appointmentsData.length);
      } else {
        setAppointments([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, search, currentMedecinId, isAdminOrDirecteur]);

  useEffect(() => {
    if (isAdminOrDirecteur || currentMedecinId) {
      loadAppointments();
    }
  }, [loadAppointments, currentMedecinId, isAdminOrDirecteur]);

  const handleViewDetails = async (appointment) => {
    setDetailsDialog({ open: true, appointment, loading: true });
    try {
      const result = await ConsumApi.getAppointmentById(appointment.id);
      if (result.success) {
        setDetailsDialog({ open: true, appointment: result.data, loading: false });
      } else {
        setDetailsDialog({ open: true, appointment, loading: false });
      }
    } catch (error) {
      console.error('Error loading appointment details:', error);
      setDetailsDialog({ open: true, appointment, loading: false });
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, appointment: null, loading: false });
  };

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      const result = await ConsumApi.confirmAppointment(appointmentId);
      const processed = showApiResponse(result, {
        successTitle: 'Rendez-vous confirmé',
        errorTitle: 'Erreur',
      });

      if (processed.success) {
        showSuccess('Succès', 'Rendez-vous confirmé avec succès');
        loadAppointments();
        handleCloseDetails();
      }
    } catch (error) {
      console.error('Error confirming appointment:', error);
      showError('Erreur', 'Erreur lors de la confirmation du rendez-vous');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const result = await ConsumApi.cancelAppointment(appointmentId);
      const processed = showApiResponse(result, {
        successTitle: 'Rendez-vous annulé',
        errorTitle: 'Erreur',
      });

      if (processed.success) {
        showSuccess('Succès', 'Rendez-vous annulé avec succès');
        loadAppointments();
        handleCloseDetails();
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      showError('Erreur', 'Erreur lors de l\'annulation du rendez-vous');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Mes Rendez-vous | PREVENTIC </title>
      </Helmet>

      <Stack spacing={3}>
        <Typography variant="h4">Mes Rendez-vous</Typography>

        <Card>
          <Stack spacing={2} sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={statusFilter}
                  label="Statut"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="PROGRAMME">Programmé</MenuItem>
                  <MenuItem value="CONFIRME">Confirmé</MenuItem>
                  <MenuItem value="ANNULE">Annulé</MenuItem>
                  <MenuItem value="TERMINE">Terminé</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TableContainer>
              <Scrollbar>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Heure</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Téléphone</TableCell>
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
                            <TableCell colSpan={7} align="center">
                              <Typography variant="body2" color="text.secondary">
                                Chargement...
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (appointments.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography variant="body2" color="text.secondary">
                                Aucun rendez-vous trouvé
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return appointments.map((appointment) => (
                        <TableRow key={appointment.id} hover>
                          <TableCell>{fDate(appointment.date)}</TableCell>
                          <TableCell>{appointment.time || 'N/A'}</TableCell>
                          <TableCell>
                            {appointment.patient
                              ? `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{appointment.patient?.phone || 'N/A'}</TableCell>
                          <TableCell>{appointment.reason || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[appointment.status] || appointment.status}
                              color={STATUS_COLORS[appointment.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDetails(appointment)}
                            >
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Stack>
        </Card>
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Détails du rendez-vous</DialogTitle>
        <DialogContent>
          {(() => {
            if (detailsDialog.loading) {
              return (
                <Typography variant="body2" color="text.secondary">
                  Chargement...
                </Typography>
              );
            }
            if (!detailsDialog.appointment) {
              return (
                <Typography variant="body2" color="text.secondary">
                  Aucune information disponible
                </Typography>
              );
            }
            return (
              <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1">{fDate(detailsDialog.appointment.date)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Heure
                </Typography>
                <Typography variant="body1">{detailsDialog.appointment.time || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1">
                  {(() => {
                    if (!detailsDialog.appointment.patient) return 'N/A';
                    const firstName = detailsDialog.appointment.patient.firstName || '';
                    const lastName = detailsDialog.appointment.patient.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    return fullName || 'N/A';
                  })()}
                </Typography>
                {detailsDialog.appointment.patient?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    Téléphone: {detailsDialog.appointment.patient.phone}
                  </Typography>
                )}
                {detailsDialog.appointment.patient?.email && (
                  <Typography variant="body2" color="text.secondary">
                    Email: {detailsDialog.appointment.patient.email}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Motif
                </Typography>
                <Typography variant="body1">{detailsDialog.appointment.reason || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Statut
                </Typography>
                <Chip
                  label={STATUS_LABELS[detailsDialog.appointment.status] || detailsDialog.appointment.status}
                  color={STATUS_COLORS[detailsDialog.appointment.status] || 'default'}
                  size="small"
                />
              </Box>
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
          {detailsDialog.appointment?.status === 'PROGRAMME' && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleConfirmAppointment(detailsDialog.appointment.id)}
              >
                Confirmer
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleCancelAppointment(detailsDialog.appointment.id)}
              >
                Annuler
              </Button>
            </>
          )}
          {detailsDialog.appointment?.status === 'CONFIRME' && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleCancelAppointment(detailsDialog.appointment.id)}
            >
              Annuler
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
