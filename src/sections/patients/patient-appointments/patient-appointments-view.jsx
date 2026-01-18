import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Stack,
  Button,
  Dialog,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

const APPOINTMENT_STATUS_COLORS = {
  scheduled: 'info',
  confirmed: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
  no_show: 'default',
};

export default function PatientAppointmentsView() {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;
      if (dateFilter) filters.date = dateFilter;

      const result = await ConsumApi.getAppointments(filters);
      const processed = showApiResponse(result, {
        successTitle: 'Rendez-vous chargés',
        errorTitle: 'Erreur de chargement',
        showNotification: false,
      });

      if (processed.success) {
        setAppointments(Array.isArray(processed.data?.appointments) ? processed.data.appointments : processed.data || []);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      showError('Erreur', 'Impossible de charger les rendez-vous');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, dateFilter]);

  useEffect(() => {
    loadAppointments();
  }, [page, rowsPerPage, search, statusFilter, dateFilter]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const result = await ConsumApi.updateAppointmentStatus(appointmentId, newStatus);
      const processed = showApiResponse(result, {
        successTitle: 'Statut mis à jour',
        errorTitle: 'Erreur lors de la mise à jour',
      });

      if (processed.success) {
        await loadAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      showError('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  return (
    <>
      <Helmet>
        <title> Gestion des Rendez-vous | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Gestion des Rendez-vous</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gestion et suivi des rendez-vous des patients
            </Typography>
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par patient, médecin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadAppointments();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="scheduled">Planifié</MenuItem>
                    <MenuItem value="confirmed">Confirmé</MenuItem>
                    <MenuItem value="in_progress">En cours</MenuItem>
                    <MenuItem value="completed">Terminé</MenuItem>
                    <MenuItem value="cancelled">Annulé</MenuItem>
                    <MenuItem value="no_show">Absent</MenuItem>
                  </Select>
                </FormControl>

                <LoadingButton
                  variant="outlined"
                  onClick={loadAppointments}
                  loading={loading}
                  startIcon={<Iconify icon="eva:search-fill" />}
                >
                  Rechercher
                </LoadingButton>
              </Stack>
            </Stack>
          </Card>

          {/* Appointments Table */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date & Heure</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Médecin</TableCell>
                      <TableCell>Motif</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (loading && appointments.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              Chargement...
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (appointments.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              Aucun rendez-vous trouvé
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return appointments.map((appointment) => (
                        <TableRow key={appointment.id} hover>
                          <TableCell>{fDateTime(appointment.date || appointment.dateTime)}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {appointment.patient?.firstName || appointment.patientName || 'N/A'}{' '}
                              {appointment.patient?.lastName || ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {appointment.patientId || appointment.patient?.id || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{appointment.doctor?.name || appointment.doctorName || 'N/A'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{appointment.reason || appointment.motif || 'Consultation'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={(() => {
                                if (appointment.status === 'scheduled') return 'Planifié';
                                if (appointment.status === 'confirmed') return 'Confirmé';
                                if (appointment.status === 'in_progress') return 'En cours';
                                if (appointment.status === 'completed') return 'Terminé';
                                if (appointment.status === 'cancelled') return 'Annulé';
                                return 'Absent';
                              })()}
                              color={APPOINTMENT_STATUS_COLORS[appointment.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {appointment.status === 'scheduled' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                >
                                  Confirmer
                                </Button>
                              )}
                              {appointment.status === 'confirmed' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={() => handleStatusChange(appointment.id, 'in_progress')}
                                >
                                  Démarrer
                                </Button>
                              )}
                              {appointment.status === 'in_progress' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleStatusChange(appointment.id, 'completed')}
                                >
                                  Terminer
                                </Button>
                              )}
                              {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                >
                                  Annuler
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
          </Card>
        </Stack>
      </Container>
    </>
  );
}
