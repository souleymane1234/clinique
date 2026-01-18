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

export default function DoctorPrescriptionsView() {
  const { contextHolder, showError } = useNotification();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { page: page + 1, limit: rowsPerPage };
      if (search) filters.search = search;

      // Simuler le chargement des prescriptions (médicaments et examens)
      const mockPrescriptions = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: Math.random() > 0.5 ? 'medicament' : 'examen',
        description: Math.random() > 0.5 ? 'Paracétamol 500mg - 3x/jour' : 'Analyse sanguine complète',
      }));

      let filtered = mockPrescriptions;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.patientName.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower)
        );
      }
      if (typeFilter) {
        filtered = filtered.filter((p) => p.type === typeFilter);
      }

      setPrescriptions(filtered);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      showError('Erreur', 'Impossible de charger les prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadPrescriptions();
  }, [page, rowsPerPage, search, typeFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  return (
    <>
      <Helmet>
        <title> Prescriptions | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Prescriptions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gérer les prescriptions de médicaments et d&apos;examens
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              placeholder="Rechercher..."
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
            <TextField
              select
              label="Type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 150 }}
              SelectProps={{ native: true }}
            >
              <option value="">Tous</option>
              <option value="medicament">Médicament</option>
              <option value="examen">Examen</option>
            </TextField>
          </Stack>
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
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (prescriptions.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            Aucune prescription trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return prescriptions.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.type === 'medicament' ? 'Médicament' : 'Examen'}
                            size="small"
                            color={item.type === 'medicament' ? 'primary' : 'info'}
                          />
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
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
        <DialogTitle>Détails de la Prescription</DialogTitle>
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
                <Typography variant="subtitle2">Type</Typography>
                <Typography variant="body2">
                  {detailsDialog.item.type === 'medicament' ? 'Médicament' : 'Examen'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Description</Typography>
                <Typography variant="body2">{detailsDialog.item.description}</Typography>
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
