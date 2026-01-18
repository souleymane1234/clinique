import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
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

export default function AideSoignanteNotesView() {
  const { contextHolder, showError } = useNotification();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des notes et observations
      const mockNotes = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['observation', 'comportement', 'alimentation', 'mobilite'][Math.floor(Math.random() * 4)],
        titre: [
          'Observation comportementale',
          'Observation alimentaire',
          'Observation mobilité',
          'Observation générale',
        ][Math.floor(Math.random() * 4)],
        contenu: `Observation détaillée concernant le patient. Points importants à noter pour le suivi.`,
        aideSoignante: `AS ${['Martin', 'Bernard', 'Dubois'][Math.floor(Math.random() * 3)]}`,
      }));

      let filtered = mockNotes;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (n) =>
            n.patientName.toLowerCase().includes(searchLower) ||
            n.titre.toLowerCase().includes(searchLower) ||
            n.contenu.toLowerCase().includes(searchLower) ||
            n.aideSoignante.toLowerCase().includes(searchLower)
        );
      }

      setNotes(filtered);
    } catch (error) {
      console.error('Error loading notes:', error);
      showError('Erreur', 'Impossible de charger les notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadNotes();
  }, [page, rowsPerPage, search]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'observation':
        return 'Observation';
      case 'comportement':
        return 'Comportement';
      case 'alimentation':
        return 'Alimentation';
      case 'mobilite':
        return 'Mobilité';
      default:
        return type;
    }
  };

  return (
    <>
      <Helmet>
        <title> Notes et Observations | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Notes et Observations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Consulter et gérer les notes et observations des aides-soignantes
          </Typography>
        </Box>

        {/* Search */}
        <Card sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher une note..."
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
                    <TableCell>Type</TableCell>
                    <TableCell>Titre</TableCell>
                    <TableCell>Aide-soignante</TableCell>
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
                    if (notes.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            Aucune note trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return notes.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{getTypeLabel(item.type)}</TableCell>
                        <TableCell>{item.titre}</TableCell>
                        <TableCell>{item.aideSoignante}</TableCell>
                        <TableCell align="right">
                          <Button variant="outlined" size="small" onClick={() => handleViewDetails(item)}>
                            Lire
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
        <DialogTitle>{detailsDialog.item?.titre}</DialogTitle>
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
                <Typography variant="subtitle2">Titre</Typography>
                <Typography variant="body2">{detailsDialog.item.titre}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Contenu</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {detailsDialog.item.contenu}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Aide-soignante</Typography>
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
