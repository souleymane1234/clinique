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

export default function AideSoignanteTachesView() {
  const { contextHolder, showError, showSuccess } = useNotification();

  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });
  const [completeDialog, setCompleteDialog] = useState({ open: false, item: null, loading: false });

  const loadTaches = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des tâches assignées
      const mockTaches = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        heure: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        tache: ['Toilette', 'Repas', 'Déplacement', 'Changement de lit', 'Accompagnement'][
          Math.floor(Math.random() * 5)
        ],
        status: ['assigned', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
        aideSoignante: `AS ${['Martin', 'Bernard', 'Dubois'][Math.floor(Math.random() * 3)]}`,
        priorite: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockTaches;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.patientName.toLowerCase().includes(searchLower) ||
            t.tache.toLowerCase().includes(searchLower) ||
            t.aideSoignante.toLowerCase().includes(searchLower)
        );
      }
      if (statusFilter) {
        filtered = filtered.filter((t) => t.status === statusFilter);
      }

      setTaches(filtered);
    } catch (error) {
      console.error('Error loading taches:', error);
      showError('Erreur', 'Impossible de charger les tâches assignées');
      setTaches([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadTaches();
  }, [page, rowsPerPage, search, statusFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  const handleComplete = async (item) => {
    setCompleteDialog({ open: true, item, loading: true });
    try {
      // Simuler la complétion de la tâche
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess('Succès', 'Tâche complétée avec succès');
      setCompleteDialog({ open: false, item: null, loading: false });
      loadTaches();
    } catch (error) {
      showError('Erreur', 'Impossible de compléter la tâche');
      setCompleteDialog({ open: false, item: null, loading: false });
    }
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
        return 'Assignée';
    }
  };

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPrioriteLabel = (priorite) => {
    switch (priorite) {
      case 'high':
        return 'Haute';
      case 'medium':
        return 'Moyenne';
      default:
        return 'Basse';
    }
  };

  return (
    <>
      <Helmet>
        <title> Tâches Assignées | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Tâches Assignées</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Consulter et gérer les tâches assignées aux aides-soignantes
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
              <option value="assigned">Assignée</option>
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
                    <TableCell>Heure</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Tâche</TableCell>
                    <TableCell>Priorité</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Assignée à</TableCell>
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
                    if (taches.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            Aucune tâche trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return taches.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDate(item.date)}</TableCell>
                        <TableCell>{item.heure}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{item.tache}</TableCell>
                        <TableCell>
                          <Chip
                            label={getPrioriteLabel(item.priorite)}
                            size="small"
                            color={getPrioriteColor(item.priorite)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.status)}
                            size="small"
                            color={getStatusColor(item.status)}
                          />
                        </TableCell>
                        <TableCell>{item.aideSoignante}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" size="small" onClick={() => handleViewDetails(item)}>
                              Détails
                            </Button>
                            {item.status !== 'completed' && (
                              <Button
                                variant="contained"
                                size="small"
                                color="success"
                                onClick={() => handleComplete(item)}
                                startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                              >
                                Compléter
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
        <DialogTitle>Détails de la Tâche</DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2">Patient</Typography>
                <Typography variant="body2">{detailsDialog.item.patientName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Date et Heure</Typography>
                <Typography variant="body2">
                  {fDate(detailsDialog.item.date)} à {detailsDialog.item.heure}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Tâche</Typography>
                <Typography variant="body2">{detailsDialog.item.tache}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Priorité</Typography>
                <Chip
                  label={getPrioriteLabel(detailsDialog.item.priorite)}
                  size="small"
                  color={getPrioriteColor(detailsDialog.item.priorite)}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2">Statut</Typography>
                <Chip
                  label={getStatusLabel(detailsDialog.item.status)}
                  size="small"
                  color={getStatusColor(detailsDialog.item.status)}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2">Assignée à</Typography>
                <Typography variant="body2">{detailsDialog.item.aideSoignante}</Typography>
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
