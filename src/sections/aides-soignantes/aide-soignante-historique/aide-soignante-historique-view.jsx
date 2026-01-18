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

export default function AideSoignanteHistoriqueView() {
  const { contextHolder, showError } = useNotification();

  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadHistorique = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement de l'historique des interventions
      const mockHistorique = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['tache', 'soin', 'assistance', 'note'][Math.floor(Math.random() * 4)],
        intervention: [
          'Toilette complète',
          'Aide au repas',
          'Mobilisation patient',
          'Préparation matériel',
          'Observation comportementale',
          'Assistance infirmier',
          'Changement de lit',
          'Accompagnement',
        ][Math.floor(Math.random() * 8)],
        aideSoignante: `AS ${['Martin', 'Bernard', 'Dubois', 'Lefevre'][Math.floor(Math.random() * 4)]}`,
        status: ['completed', 'cancelled'][Math.floor(Math.random() * 2)],
      }));

      let filtered = mockHistorique;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (h) =>
            h.patientName.toLowerCase().includes(searchLower) ||
            h.intervention.toLowerCase().includes(searchLower) ||
            h.aideSoignante.toLowerCase().includes(searchLower)
        );
      }
      if (typeFilter) {
        filtered = filtered.filter((h) => h.type === typeFilter);
      }

      setHistorique(filtered);
    } catch (error) {
      console.error('Error loading historique:', error);
      showError('Erreur', 'Impossible de charger l\'historique');
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadHistorique();
  }, [page, rowsPerPage, search, typeFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'tache':
        return 'Tâche';
      case 'soin':
        return 'Soin';
      case 'assistance':
        return 'Assistance';
      case 'note':
        return 'Note';
      default:
        return type;
    }
  };

  const getStatusColor = (status) => (status === 'completed' ? 'success' : 'error');

  const getStatusLabel = (status) => (status === 'completed' ? 'Terminée' : 'Annulée');

  return (
    <>
      <Helmet>
        <title> Historique des Interventions | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Historique des Interventions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Consulter l&apos;historique complet des interventions des aides-soignantes
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
              <option value="tache">Tâche</option>
              <option value="soin">Soin</option>
              <option value="assistance">Assistance</option>
              <option value="note">Note</option>
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
                    <TableCell>Intervention</TableCell>
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
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (historique.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            Aucune intervention trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return historique.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>
                          <Chip label={getTypeLabel(item.type)} size="small" color="primary" />
                        </TableCell>
                        <TableCell>{item.intervention}</TableCell>
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
        <DialogTitle>Détails de l&apos;Intervention</DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2">Patient</Typography>
                <Typography variant="body2">{detailsDialog.item.patientName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Date et Heure</Typography>
                <Typography variant="body2">{fDateTime(detailsDialog.item.date)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Type</Typography>
                <Typography variant="body2">{getTypeLabel(detailsDialog.item.type)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Intervention</Typography>
                <Typography variant="body2">{detailsDialog.item.intervention}</Typography>
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
