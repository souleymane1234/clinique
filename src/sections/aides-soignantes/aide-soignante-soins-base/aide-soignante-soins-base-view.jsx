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

export default function AideSoignanteSoinsBaseView() {
  const { contextHolder, showError } = useNotification();

  const [soins, setSoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadSoins = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des soins de base
      const mockSoins = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['toilette', 'repas', 'mobilisation', 'comfort'][Math.floor(Math.random() * 4)],
        description: [
          'Toilette complète',
          'Aide au repas',
          'Mobilisation et déplacement',
          'Soins de confort',
        ][Math.floor(Math.random() * 4)],
        aideSoignante: `AS ${['Martin', 'Bernard', 'Dubois'][Math.floor(Math.random() * 3)]}`,
      }));

      let filtered = mockSoins;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.patientName.toLowerCase().includes(searchLower) ||
            s.description.toLowerCase().includes(searchLower) ||
            s.aideSoignante.toLowerCase().includes(searchLower)
        );
      }
      if (typeFilter) {
        filtered = filtered.filter((s) => s.type === typeFilter);
      }

      setSoins(filtered);
    } catch (error) {
      console.error('Error loading soins:', error);
      showError('Erreur', 'Impossible de charger les soins de base');
      setSoins([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadSoins();
  }, [page, rowsPerPage, search, typeFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'toilette':
        return 'Toilette';
      case 'repas':
        return 'Repas';
      case 'mobilisation':
        return 'Mobilisation';
      case 'comfort':
        return 'Confort';
      default:
        return type;
    }
  };

  return (
    <>
      <Helmet>
        <title> Soins de Base | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Soins de Base</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gérer les soins de base effectués par les aides-soignantes
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
              <option value="toilette">Toilette</option>
              <option value="repas">Repas</option>
              <option value="mobilisation">Mobilisation</option>
              <option value="comfort">Confort</option>
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
                    if (soins.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            Aucun soin trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return soins.map((item, index) => (
                      <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>
                          <Chip label={getTypeLabel(item.type)} size="small" color="primary" />
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.aideSoignante}</TableCell>
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
                <Typography variant="subtitle2">Type</Typography>
                <Typography variant="body2">{getTypeLabel(detailsDialog.item.type)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Description</Typography>
                <Typography variant="body2">{detailsDialog.item.description}</Typography>
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
