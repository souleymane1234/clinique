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

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function NurseTraitementsView() {
  const { contextHolder, showError, showSuccess } = useNotification();

  const [traitements, setTraitements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });
  const [administerDialog, setAdministerDialog] = useState({ open: false, item: null, loading: false });

  const loadTraitements = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des traitements à administrer
      const mockTraitements = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        medicament: ['Paracétamol 500mg', 'Ibuprofène 400mg', 'Aspirine 100mg'][
          Math.floor(Math.random() * 3)
        ],
        dosage: ['1 comprimé', '2 comprimés', '1/2 comprimé'][Math.floor(Math.random() * 3)],
        frequence: ['3x/jour', '2x/jour', '1x/jour'][Math.floor(Math.random() * 3)],
        status: ['pending', 'administered', 'missed'][Math.floor(Math.random() * 3)],
        infirmier: `Inf. ${['Dupont', 'Martin', 'Bernard'][Math.floor(Math.random() * 3)]}`,
      }));

      let filtered = mockTraitements;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.patientName.toLowerCase().includes(searchLower) ||
            t.medicament.toLowerCase().includes(searchLower)
        );
      }
      if (statusFilter) {
        filtered = filtered.filter((t) => t.status === statusFilter);
      }

      setTraitements(filtered);
    } catch (error) {
      console.error('Error loading traitements:', error);
      showError('Erreur', 'Impossible de charger les traitements');
      setTraitements([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadTraitements();
  }, [page, rowsPerPage, search, statusFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  const handleAdminister = async (item) => {
    setAdministerDialog({ open: true, item, loading: true });
    try {
      // Simuler l'administration du traitement
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess('Succès', 'Traitement administré avec succès');
      setAdministerDialog({ open: false, item: null, loading: false });
      loadTraitements();
    } catch (error) {
      showError('Erreur', 'Impossible d\'administrer le traitement');
      setAdministerDialog({ open: false, item: null, loading: false });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'administered':
        return 'success';
      case 'missed':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'administered':
        return 'Administré';
      case 'missed':
        return 'Manqué';
      default:
        return 'En attente';
    }
  };

  return (
    <>
      <Helmet>
        <title> Administration des Traitements | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Administration des Traitements</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Administrer les traitements prescrits aux patients
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
              label="Statut"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 150 }}
              SelectProps={{ native: true }}
            >
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="administered">Administré</option>
              <option value="missed">Manqué</option>
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
                    <TableCell>Médicament</TableCell>
                    <TableCell>Dosage</TableCell>
                    <TableCell>Fréquence</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (traitements.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            Aucun traitement trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return traitements.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDate(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{item.medicament}</TableCell>
                        <TableCell>{item.dosage}</TableCell>
                        <TableCell>{item.frequence}</TableCell>
                        <TableCell>
                          <Chip label={getStatusLabel(item.status)} size="small" color={getStatusColor(item.status)} />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" size="small" onClick={() => handleViewDetails(item)}>
                              Détails
                            </Button>
                            {item.status === 'pending' && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAdminister(item)}
                                startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                              >
                                Administrer
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
        <DialogTitle>Détails du Traitement</DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2">Patient</Typography>
                <Typography variant="body2">{detailsDialog.item.patientName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Date</Typography>
                <Typography variant="body2">{fDate(detailsDialog.item.date)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Médicament</Typography>
                <Typography variant="body2">{detailsDialog.item.medicament}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Dosage</Typography>
                <Typography variant="body2">{detailsDialog.item.dosage}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Fréquence</Typography>
                <Typography variant="body2">{detailsDialog.item.frequence}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Infirmier</Typography>
                <Typography variant="body2">{detailsDialog.item.infirmier}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Statut</Typography>
                <Chip
                  label={getStatusLabel(detailsDialog.item.status)}
                  size="small"
                  color={getStatusColor(detailsDialog.item.status)}
                />
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
