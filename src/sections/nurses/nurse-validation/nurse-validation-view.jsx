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

export default function NurseValidationView() {
  const { contextHolder, showError, showSuccess } = useNotification();

  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });
  const [validateDialog, setValidateDialog] = useState({ open: false, item: null, loading: false });

  const loadValidations = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des soins à valider
      const mockValidations = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        soin: ['Injection', 'Pansement', 'Prise de tension', 'Administration médication'][
          Math.floor(Math.random() * 4)
        ],
        status: ['pending', 'validated', 'rejected'][Math.floor(Math.random() * 3)],
        infirmier: `Inf. ${['Dupont', 'Martin', 'Bernard'][Math.floor(Math.random() * 3)]}`,
        observateur: `Inf. ${['Lefevre', 'Moreau', 'Petit'][Math.floor(Math.random() * 3)]}`,
      }));

      let filtered = mockValidations;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.patientName.toLowerCase().includes(searchLower) ||
            v.soin.toLowerCase().includes(searchLower) ||
            v.infirmier.toLowerCase().includes(searchLower)
        );
      }
      if (statusFilter) {
        filtered = filtered.filter((v) => v.status === statusFilter);
      }

      setValidations(filtered);
    } catch (error) {
      console.error('Error loading validations:', error);
      showError('Erreur', 'Impossible de charger les validations');
      setValidations([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadValidations();
  }, [page, rowsPerPage, search, statusFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  const handleValidate = async (item) => {
    setValidateDialog({ open: true, item, loading: true });
    try {
      // Simuler la validation du soin
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess('Succès', 'Soin validé avec succès');
      setValidateDialog({ open: false, item: null, loading: false });
      loadValidations();
    } catch (error) {
      showError('Erreur', 'Impossible de valider le soin');
      setValidateDialog({ open: false, item: null, loading: false });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'validated':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'validated':
        return 'Validé';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'En attente';
    }
  };

  return (
    <>
      <Helmet>
        <title> Validation des Soins | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Validation des Soins</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Valider les soins effectués par les infirmiers
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
              <option value="validated">Validé</option>
              <option value="rejected">Rejeté</option>
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
                    <TableCell>Soin</TableCell>
                    <TableCell>Infirmier</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (validations.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            Aucune validation trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return validations.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{item.soin}</TableCell>
                        <TableCell>{item.infirmier}</TableCell>
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
                                color="success"
                                onClick={() => handleValidate(item)}
                                startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                              >
                                Valider
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
        <DialogTitle>Détails du Soin</DialogTitle>
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
                <Typography variant="subtitle2">Soin</Typography>
                <Typography variant="body2">{detailsDialog.item.soin}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Infirmier</Typography>
                <Typography variant="body2">{detailsDialog.item.infirmier}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Observateur</Typography>
                <Typography variant="body2">{detailsDialog.item.observateur}</Typography>
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
