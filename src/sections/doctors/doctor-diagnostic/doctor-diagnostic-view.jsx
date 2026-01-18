import { useState, useEffect, useCallback } from 'react';
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
  Typography,
  TableContainer,
  TablePagination,
  InputAdornment,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function DoctorDiagnosticView() {
  const { contextHolder, showError } = useNotification();

  const [diagnostics, setDiagnostics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { page: page + 1, limit: rowsPerPage };
      if (search) filters.search = search;

      // Simuler le chargement des diagnostics
      const result = await ConsumApi.getPatientConsultations(null, filters);

      if (result.success) {
        const consultations = result.data?.consultations || [];
        setDiagnostics(consultations.map((c) => ({
          id: c.id,
          patientId: c.patientId,
          patientName: `Patient ${c.patientId}`,
          date: c.date,
          diagnostic: c.diagnosis || 'Diagnostic en attente',
          consultationId: c.id,
        })));
      }
    } catch (error) {
      console.error('Error loading diagnostics:', error);
      showError('Erreur', 'Impossible de charger les diagnostics');
      setDiagnostics([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadDiagnostics();
  }, [page, rowsPerPage, search]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  return (
    <>
      <Helmet>
        <title> Diagnostic | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Diagnostic</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gérer les diagnostics des consultations
          </Typography>
        </Box>

        {/* Search */}
        <Card sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher un diagnostic..."
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
        </Card>

        {/* Table */}
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Diagnostic</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (diagnostics.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            Aucun diagnostic trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return diagnostics.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{item.diagnostic}</TableCell>
                        <TableCell align="right">
                          <Button variant="outlined" size="small" onClick={() => handleViewDetails(item)}>
                            Voir détails
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
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Lignes par page:"
          />
        </Card>
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onClose={() => setDetailsDialog({ open: false, item: null })} maxWidth="md" fullWidth>
        <DialogTitle>Détails du Diagnostic</DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2">Patient</Typography>
                <Typography variant="body2">{detailsDialog.item.patientName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Date</Typography>
                <Typography variant="body2">{fDateTime(detailsDialog.item.date)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Diagnostic</Typography>
                <Typography variant="body2">{detailsDialog.item.diagnostic}</Typography>
              </Box>
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
