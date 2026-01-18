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

export default function AideSoignanteAssistanceView() {
  const { contextHolder, showError } = useNotification();

  const [assistances, setAssistances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadAssistances = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des assistances aux infirmiers
      const mockAssistances = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['preparation', 'support', 'materiel', 'accompagnement'][Math.floor(Math.random() * 4)],
        description: [
          'Préparation du matériel',
          'Support pendant soin',
          'Apport de matériel',
          'Accompagnement patient',
        ][Math.floor(Math.random() * 4)],
        infirmier: `Inf. ${['Dupont', 'Martin', 'Bernard'][Math.floor(Math.random() * 3)]}`,
        aideSoignante: `AS ${['Martin', 'Bernard', 'Dubois'][Math.floor(Math.random() * 3)]}`,
        status: ['requested', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockAssistances;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.patientName.toLowerCase().includes(searchLower) ||
            a.description.toLowerCase().includes(searchLower) ||
            a.infirmier.toLowerCase().includes(searchLower) ||
            a.aideSoignante.toLowerCase().includes(searchLower)
        );
      }
      if (statusFilter) {
        filtered = filtered.filter((a) => a.status === statusFilter);
      }

      setAssistances(filtered);
    } catch (error) {
      console.error('Error loading assistances:', error);
      showError('Erreur', 'Impossible de charger les assistances');
      setAssistances([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadAssistances();
  }, [page, rowsPerPage, search, statusFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'in_progress':
        return 'En cours';
      default:
        return 'Demandée';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'preparation':
        return 'Préparation';
      case 'support':
        return 'Support';
      case 'materiel':
        return 'Matériel';
      case 'accompagnement':
        return 'Accompagnement';
      default:
        return type;
    }
  };

  return (
    <>
      <Helmet>
        <title> Assistance aux Infirmiers | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Assistance aux Infirmiers</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gérer les assistances fournies aux infirmiers
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
              <option value="requested">Demandée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
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
                    <TableCell>Infirmier</TableCell>
                    <TableCell>Aide-soignante</TableCell>
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
                    if (assistances.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            Aucune assistance trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return assistances.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>
                          <Chip label={getTypeLabel(item.type)} size="small" color="primary" />
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.infirmier}</TableCell>
                        <TableCell>{item.aideSoignante}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.status)}
                            size="small"
                            color={getStatusColor(item.status)}
                          />
                        </TableCell>
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
        <DialogTitle>Détails de l&apos;Assistance</DialogTitle>
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
                <Typography variant="body2">{getTypeLabel(detailsDialog.item.type)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Description</Typography>
                <Typography variant="body2">{detailsDialog.item.description}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Infirmier</Typography>
                <Typography variant="body2">{detailsDialog.item.infirmier}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Aide-soignante</Typography>
                <Typography variant="body2">{detailsDialog.item.aideSoignante}</Typography>
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
