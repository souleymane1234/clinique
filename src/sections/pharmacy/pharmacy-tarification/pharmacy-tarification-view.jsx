import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import { Box, Card, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function PharmacyTarificationView() {
  const { contextHolder, showError } = useNotification();
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadTarifs = useCallback(async () => {
    setLoading(true);
    try {
      const mockTarifs = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        medicament: ['Paracétamol 500mg', 'Ibuprofène 400mg', 'Aspirine 100mg', 'Amoxicilline 250mg'][Math.floor(Math.random() * 4)],
        prixAchat: (Math.random() * 50 + 5).toFixed(2),
        prixVente: (Math.random() * 100 + 10).toFixed(2),
        marge: ((Math.random() * 50 + 20)).toFixed(2),
        unite: 'unités',
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        setTarifs(mockTarifs.filter((t) => t.medicament.toLowerCase().includes(searchLower)));
      } else {
        setTarifs(mockTarifs);
      }
    } catch (error) {
      showError('Erreur', 'Impossible de charger les tarifs');
      setTarifs([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadTarifs();
  }, [page, rowsPerPage, search]);

  return (
    <>
      <Helmet><title> Tarification | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Tarification</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les prix d&apos;achat et de vente des médicaments</Typography></Box>
        <Card sx={{ p: 3 }}><TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} /></Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Médicament</TableCell>
                    <TableCell>Prix d&apos;achat (€)</TableCell>
                    <TableCell>Prix de vente (€)</TableCell>
                    <TableCell>Marge (%)</TableCell>
                    <TableCell>Unité</TableCell>
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
                    if (tarifs.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            Aucun tarif trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return tarifs.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{item.medicament}</TableCell>
                        <TableCell>{item.prixAchat}</TableCell>
                        <TableCell>{item.prixVente}</TableCell>
                        <TableCell>{item.marge}</TableCell>
                        <TableCell>{item.unite}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
