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
  TablePagination,
  InputAdornment,
  Divider,
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

const CONSULTATION_STATUS_COLORS = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

export default function PatientConsultationsView() {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, consultation: null });

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    try {
      // Charger toutes les consultations de tous les patients
      const allConsultations = await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const patientId = String(Math.floor(Math.random() * 50) + 1);
          const result = await ConsumApi.getPatientConsultations(patientId);
          if (result.success && Array.isArray(result.data)) {
            return result.data.map((consultation) => ({
              ...consultation,
              patientId,
              patientName: `Patient ${patientId}`,
            }));
          }
          return [];
        })
      );

      let allItems = allConsultations.flat();

      if (search) {
        const searchLower = search.toLowerCase();
        allItems = allItems.filter(
          (consultation) =>
            (consultation.patientName || '').toLowerCase().includes(searchLower) ||
            (consultation.reason || '').toLowerCase().includes(searchLower) ||
            (consultation.doctor?.name || '').toLowerCase().includes(searchLower)
        );
      }

      if (statusFilter) {
        allItems = allItems.filter((consultation) => consultation.status === statusFilter);
      }

      // Pagination
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      const paginatedItems = allItems.slice(start, end);

      setConsultations(paginatedItems);
    } catch (error) {
      console.error('Error loading consultations:', error);
      showError('Erreur', 'Impossible de charger les consultations');
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadConsultations();
  }, [page, rowsPerPage, search, statusFilter]);

  return (
    <>
      <Helmet>
        <title> Suivi des Consultations | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Suivi des Consultations</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Historique et suivi des consultations médicales des patients
            </Typography>
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par patient, motif, médecin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadConsultations();
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
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="scheduled">Planifiée</MenuItem>
                    <MenuItem value="in_progress">En cours</MenuItem>
                    <MenuItem value="completed">Terminée</MenuItem>
                    <MenuItem value="cancelled">Annulée</MenuItem>
                  </Select>
                </FormControl>

                <LoadingButton
                  variant="outlined"
                  onClick={loadConsultations}
                  loading={loading}
                  startIcon={<Iconify icon="eva:search-fill" />}
                >
                  Rechercher
                </LoadingButton>
              </Stack>
            </Stack>
          </Card>

          {/* Consultations Table */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Médecin</TableCell>
                      <TableCell>Motif</TableCell>
                      <TableCell>Diagnostic</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (loading && consultations.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              Chargement...
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (consultations.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              Aucune consultation trouvée
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return consultations.map((consultation, index) => (
                        <TableRow
                          key={`${consultation.patientId}-${consultation.id}-${index}`}
                          hover
                          onClick={() => setDetailsDialog({ open: true, consultation })}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Typography variant="subtitle2">{consultation.patientName || `Patient ${consultation.patientId}`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {consultation.patientId}
                            </Typography>
                          </TableCell>
                          <TableCell>{fDateTime(consultation.date || consultation.createdAt)}</TableCell>
                          <TableCell>{consultation.doctor?.name || consultation.medecin || 'N/A'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{consultation.reason || consultation.motif || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {consultation.diagnosis || consultation.diagnostic || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={(() => {
                                if (consultation.status === 'scheduled') return 'Planifiée';
                                if (consultation.status === 'in_progress') return 'En cours';
                                if (consultation.status === 'completed') return 'Terminée';
                                return 'Annulée';
                              })()}
                              color={CONSULTATION_STATUS_COLORS[consultation.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<Iconify icon="eva:eye-fill" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailsDialog({ open: true, consultation });
                              }}
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
              page={page}
              component="div"
              count={-1}
              rowsPerPage={rowsPerPage}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to }) => `${from}-${to}`}
            />
          </Card>
        </Stack>
      </Container>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, consultation: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Détails de la consultation</DialogTitle>
        <DialogContent>
          {detailsDialog.consultation && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {detailsDialog.consultation.patientName || `Patient ${detailsDialog.consultation.patientId}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {detailsDialog.consultation.patientId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">{fDateTime(detailsDialog.consultation.date || detailsDialog.consultation.createdAt)}</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Médecin
                  </Typography>
                  <Typography variant="body1">
                    {detailsDialog.consultation.doctor?.name || detailsDialog.consultation.medecin || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Statut
                  </Typography>
                  <Chip
                    label={(() => {
                      if (detailsDialog.consultation.status === 'scheduled') return 'Planifiée';
                      if (detailsDialog.consultation.status === 'in_progress') return 'En cours';
                      if (detailsDialog.consultation.status === 'completed') return 'Terminée';
                      return 'Annulée';
                    })()}
                    color={CONSULTATION_STATUS_COLORS[detailsDialog.consultation.status] || 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Motif de consultation
                </Typography>
                <Typography variant="body1">{detailsDialog.consultation.reason || detailsDialog.consultation.motif || 'N/A'}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Diagnostic
                </Typography>
                <Typography variant="body1">{detailsDialog.consultation.diagnosis || detailsDialog.consultation.diagnostic || 'N/A'}</Typography>
              </Box>

              {detailsDialog.consultation.notes && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">{detailsDialog.consultation.notes}</Typography>
                </Box>
              )}

              {detailsDialog.consultation.prescription && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prescription
                  </Typography>
                  <Typography variant="body1">{detailsDialog.consultation.prescription}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, consultation: null })}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
