import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  InputLabel,
  FormControl,
  TableContainer,
  TablePagination,
  InputAdornment,
  Select,
  MenuItem,
  Divider,
  Grid,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

const HISTORY_TYPE_COLORS = {
  consultation: 'primary',
  examen: 'info',
  hospitalisation: 'warning',
  chirurgie: 'error',
  traitement: 'success',
};

export default function PatientHistoryView({ patientId }) {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Si un patientId est fourni, charger uniquement l'historique de ce patient
      if (patientId) {
        const filters = {
          page: page + 1,
          limit: rowsPerPage,
        };

        if (search) filters.search = search;
        if (typeFilter) filters.type = typeFilter;

        const result = await ConsumApi.getPatientMedicalHistory(patientId, filters);
        if (result.success && result.data?.history) {
          let filteredHistory = result.data.history.map((item) => ({
            ...item,
            patientId,
          }));

          if (search) {
            const searchLower = search.toLowerCase();
            filteredHistory = filteredHistory.filter(
              (item) =>
                (item.description || '').toLowerCase().includes(searchLower) ||
                (item.doctor?.name || '').toLowerCase().includes(searchLower)
            );
          }

          if (typeFilter) {
            filteredHistory = filteredHistory.filter((item) => item.type === typeFilter);
          }

          // Pagination
          const start = page * rowsPerPage;
          const end = start + rowsPerPage;
          setHistory(filteredHistory.slice(start, end));
          setLoading(false);
          return;
        }
      }

      // Sinon, charger tous les historiques (comportement par défaut)
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (search) filters.search = search;
      if (typeFilter) filters.type = typeFilter;

      // Simuler le chargement de tous les historiques
      const allHistory = await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const randomPatientId = String(Math.floor(Math.random() * 50) + 1);
          const result = await ConsumApi.getPatientMedicalHistory(randomPatientId, {});
          if (result.success && result.data?.history) {
            return result.data.history.map((item) => ({
              ...item,
              patientId: randomPatientId,
              patientName: `Patient ${randomPatientId}`,
            }));
          }
          return [];
        })
      );

      let allItems = allHistory.flat();

      if (search) {
        const searchLower = search.toLowerCase();
        allItems = allItems.filter(
          (item) =>
            (item.patientName || '').toLowerCase().includes(searchLower) ||
            (item.description || '').toLowerCase().includes(searchLower) ||
            (item.doctor?.name || '').toLowerCase().includes(searchLower)
        );
      }

      if (typeFilter) {
        allItems = allItems.filter((item) => item.type === typeFilter);
      }

      // Pagination
      const start = (page - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      const paginatedItems = allItems.slice(start, end);

      setHistory(paginatedItems);
    } catch (error) {
      console.error('Error loading history:', error);
      showError('Erreur', 'Impossible de charger l\'historique');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter, patientId]);

  useEffect(() => {
    loadHistory();
  }, [page, rowsPerPage, search, typeFilter]);

  return (
    <>
      <Helmet>
        <title> Historique Médical | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Historique Médical</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Consultation de l&apos;historique médical complet des patients
            </Typography>
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par patient, description, médecin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadHistory();
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
                  <InputLabel>Type d&apos;événement</InputLabel>
                  <Select value={typeFilter} label="Type d'événement" onChange={(e) => setTypeFilter(e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="consultation">Consultation</MenuItem>
                    <MenuItem value="examen">Examen</MenuItem>
                    <MenuItem value="hospitalisation">Hospitalisation</MenuItem>
                    <MenuItem value="chirurgie">Chirurgie</MenuItem>
                    <MenuItem value="traitement">Traitement</MenuItem>
                  </Select>
                </FormControl>

                <LoadingButton
                  variant="outlined"
                  onClick={loadHistory}
                  loading={loading}
                  startIcon={<Iconify icon="eva:search-fill" />}
                >
                  Rechercher
                </LoadingButton>
              </Stack>
            </Stack>
          </Card>

          {/* History Table */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Médecin</TableCell>
                      <TableCell>Diagnostic</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (loading && history.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              Chargement...
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (history.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              Aucun historique trouvé
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return history.map((item, index) => (
                        <TableRow
                          key={`${item.patientId}-${item.id}-${index}`}
                          hover
                          onClick={() => setDetailsDialog({ open: true, item })}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Typography variant="subtitle2">{item.patientName || `Patient ${item.patientId}`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {item.patientId}
                            </Typography>
                          </TableCell>
                          <TableCell>{fDateTime(item.date || item.createdAt)}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.type || 'Consultation'}
                              color={HISTORY_TYPE_COLORS[item.type] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.description || item.title || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>{item.doctor?.name || item.medecin || 'N/A'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.diagnosis || item.diagnostic || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<Iconify icon="eva:eye-fill" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailsDialog({ open: true, item });
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
        onClose={() => setDetailsDialog({ open: false, item: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Détails de l&apos;historique médical</DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {detailsDialog.item.patientName || `Patient ${detailsDialog.item.patientId}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {detailsDialog.item.patientId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">{fDateTime(detailsDialog.item.date || detailsDialog.item.createdAt)}</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Chip
                    label={detailsDialog.item.type || 'Consultation'}
                    color={HISTORY_TYPE_COLORS[detailsDialog.item.type] || 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Médecin
                  </Typography>
                  <Typography variant="body1">{detailsDialog.item.doctor?.name || detailsDialog.item.medecin || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">{detailsDialog.item.description || detailsDialog.item.title || 'N/A'}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Diagnostic
                </Typography>
                <Typography variant="body1">{detailsDialog.item.diagnosis || detailsDialog.item.diagnostic || 'N/A'}</Typography>
              </Box>

              {detailsDialog.item.notes && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">{detailsDialog.item.notes}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, item: null })}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

PatientHistoryView.propTypes = {
  patientId: PropTypes.string,
};
