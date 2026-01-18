import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function LaboratoryConsommablesView() {
  const { contextHolder, showError } = useNotification();
  const [consommables, setConsommables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const loadConsommables = useCallback(async () => {
    setLoading(true);
    try {
      const mockConsommables = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        nom: ['Tubes héparinés', 'Tubes EDTA', 'Réactifs glycémie', 'Gants stériles'][Math.floor(Math.random() * 4)],
        quantite: Math.floor(Math.random() * 500),
        seuil: 50,
        unite: 'unités',
        stockStatus: Math.random() > 0.5 ? 'sufficient' : 'low',
      }));

      let filtered = mockConsommables;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((c) => c.nom.toLowerCase().includes(searchLower));
      }
      if (stockFilter) {
        filtered = filtered.filter((c) => c.stockStatus === stockFilter);
      }

      setConsommables(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les consommables');
      setConsommables([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, stockFilter]);

  useEffect(() => {
    loadConsommables();
  }, [page, rowsPerPage, search, stockFilter]);

  const getStockColor = (status) => (status === 'sufficient' ? 'success' : 'error');
  const getStockLabel = (status) => (status === 'sufficient' ? 'Stock suffisant' : 'Stock faible');

  return (
    <>
      <Helmet><title> Gestion des Consommables | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Gestion des Consommables</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les consommables du laboratoire</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Stock" value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="sufficient">Suffisant</option><option value="low">Faible</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Consommable</TableCell><TableCell>Quantité</TableCell><TableCell>Seuil</TableCell><TableCell>Unité</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (consommables.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucun consommable trouvé</TableCell></TableRow>; return consommables.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{item.nom}</TableCell><TableCell>{item.quantite}</TableCell><TableCell>{item.seuil}</TableCell><TableCell>{item.unite}</TableCell><TableCell><Chip label={getStockLabel(item.stockStatus)} size="small" color={getStockColor(item.stockStatus)} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
