import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Table,
  Stack,
  Button,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  TablePagination,
  InputAdornment,
  IconButton,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function DoctorOrdonnancesView() {
  const { contextHolder, showSuccess, showError } = useNotification();

  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadOrdonnances = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des ordonnances
      const mockOrdonnances = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        medicaments: ['Paracétamol 500mg', 'Ibuprofène 400mg'],
      }));

      let filtered = mockOrdonnances;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((o) => o.patientName.toLowerCase().includes(searchLower));
      }

      setOrdonnances(filtered);
    } catch (error) {
      console.error('Error loading ordonnances:', error);
      showError('Erreur', 'Impossible de charger les ordonnances');
      setOrdonnances([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadOrdonnances();
  }, [page, rowsPerPage, search]);

  const handlePrint = (ordonnance) => {
    // Simuler l'impression
    showSuccess('Succès', 'Ordonnance prête pour l\'impression');
  };

  return (
    <>
      <Helmet>
        <title> Ordonnances Imprimables | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Ordonnances Imprimables</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gérer et imprimer les ordonnances médicales
          </Typography>
        </Box>

        {/* Search */}
        <Card sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher une ordonnance..."
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
                    <TableCell>Médicaments</TableCell>
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
                    if (ordonnances.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            Aucune ordonnance trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return ordonnances.map((ordonnance, index) => (
                      <TableRow key={`${ordonnance.patientId}-${ordonnance.id}-${index}`} hover>
                        <TableCell>{fDateTime(ordonnance.date)}</TableCell>
                        <TableCell>{ordonnance.patientName}</TableCell>
                        <TableCell>{ordonnance.medicaments.join(', ')}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handlePrint(ordonnance)}
                            title="Imprimer"
                          >
                            <Iconify icon="solar:printer-bold" />
                          </IconButton>
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
    </>
  );
}
