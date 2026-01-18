import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function ManagerStocksView() {
  const { contextHolder, showError } = useNotification();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const loadStocks = useCallback(async () => {
    setLoading(true);
    try {
      const mockStocks = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        service: ['Pharmacie', 'Laboratoire', 'Bloc opératoire'][Math.floor(Math.random() * 3)],
        produit: ['Paracétamol 500mg', 'Tubes héparinés', 'Gants stériles'][Math.floor(Math.random() * 3)],
        quantite: Math.floor(Math.random() * 500),
        seuil: 50,
        statut: Math.random() > 0.3 ? 'sufficient' : 'low',
      }));

      let filtered = mockStocks;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((s) => s.produit.toLowerCase().includes(searchLower));
      }
      if (serviceFilter) {
        filtered = filtered.filter((s) => s.service === serviceFilter);
      }

      setStocks(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les stocks');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, serviceFilter]);

  useEffect(() => {
    loadStocks();
  }, [page, rowsPerPage, search, serviceFilter]);

  const getStockColor = (status) => (status === 'sufficient' ? 'success' : 'error');
  const getStockLabel = (status) => (status === 'sufficient' ? 'Stock suffisant' : 'Stock faible');

  return (
    <>
      <Helmet><title> Suivi des Stocks | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Suivi des Stocks</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter les stocks de tous les services</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Service" value={serviceFilter} onChange={(e) => { setServiceFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="Pharmacie">Pharmacie</option><option value="Laboratoire">Laboratoire</option><option value="Bloc opératoire">Bloc opératoire</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Service</TableCell><TableCell>Produit</TableCell><TableCell>Quantité</TableCell><TableCell>Seuil</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (stocks.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucun stock trouvé</TableCell></TableRow>; return stocks.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{item.service}</TableCell><TableCell>{item.produit}</TableCell><TableCell>{item.quantite}</TableCell><TableCell>{item.seuil}</TableCell><TableCell><Chip label={getStockLabel(item.statut)} size="small" color={getStockColor(item.statut)} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
