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

export default function NurseSignesVitauxView() {
  const { contextHolder, showError } = useNotification();

  const [signesVitaux, setSignesVitaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadSignesVitaux = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des signes vitaux
      const mockSignesVitaux = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        temperature: (36.5 + Math.random() * 2).toFixed(1),
        pouls: Math.floor(60 + Math.random() * 60),
        tension: `${Math.floor(100 + Math.random() * 40)}/${Math.floor(60 + Math.random() * 20)}`,
        saturation: Math.floor(95 + Math.random() * 5),
        respiration: Math.floor(12 + Math.random() * 8),
        infirmier: `Inf. ${['Dupont', 'Martin', 'Bernard'][Math.floor(Math.random() * 3)]}`,
      }));

      let filtered = mockSignesVitaux;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.patientName.toLowerCase().includes(searchLower) ||
            s.infirmier.toLowerCase().includes(searchLower)
        );
      }

      setSignesVitaux(filtered);
    } catch (error) {
      console.error('Error loading signes vitaux:', error);
      showError('Erreur', 'Impossible de charger les signes vitaux');
      setSignesVitaux([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadSignesVitaux();
  }, [page, rowsPerPage, search]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  return (
    <>
      <Helmet>
        <title> Suivi des Signes Vitaux | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Suivi des Signes Vitaux</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Enregistrer et suivre les signes vitaux des patients
          </Typography>
        </Box>

        {/* Search */}
        <Card sx={{ p: 3 }}>
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
                    <TableCell>Température (°C)</TableCell>
                    <TableCell>Pouls (bpm)</TableCell>
                    <TableCell>Tension (mmHg)</TableCell>
                    <TableCell>Sat. O2 (%)</TableCell>
                    <TableCell>Respiration (min)</TableCell>
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
                    if (signesVitaux.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            Aucun signe vital trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return signesVitaux.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{item.temperature}</TableCell>
                        <TableCell>{item.pouls}</TableCell>
                        <TableCell>{item.tension}</TableCell>
                        <TableCell>{item.saturation}</TableCell>
                        <TableCell>{item.respiration}</TableCell>
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
        <DialogTitle>Détails des Signes Vitaux</DialogTitle>
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
                <Typography variant="subtitle2">Température</Typography>
                <Typography variant="body2">{detailsDialog.item.temperature} °C</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Pouls</Typography>
                <Typography variant="body2">{detailsDialog.item.pouls} bpm</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Tension artérielle</Typography>
                <Typography variant="body2">{detailsDialog.item.tension} mmHg</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Saturation en O2</Typography>
                <Typography variant="body2">{detailsDialog.item.saturation} %</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Respiration</Typography>
                <Typography variant="body2">{detailsDialog.item.respiration} /min</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Infirmier</Typography>
                <Typography variant="body2">{detailsDialog.item.infirmier}</Typography>
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
