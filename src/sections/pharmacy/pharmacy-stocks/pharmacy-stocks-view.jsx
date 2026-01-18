import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TableRow, TextField, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

export default function PharmacyStocksView() {
  const { contextHolder, showError } = useNotification();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadStocks = useCallback(async () => {
    setLoading(true);
    try {
      const mockStocks = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        medicament: ['Paracétamol 500mg', 'Ibuprofène 400mg', 'Aspirine 100mg', 'Amoxicilline 250mg'][Math.floor(Math.random() * 4)],
        quantite: Math.floor(Math.random() * 500),
        seuil: 50,
        unite: 'unités',
        dateExpiration: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        stockStatus: Math.random() > 0.3 ? 'sufficient' : 'low',
      }));

      let filtered = mockStocks;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((s) => s.medicament.toLowerCase().includes(searchLower));
      }
      if (stockFilter) {
        filtered = filtered.filter((s) => s.stockStatus === stockFilter);
      }

      setStocks(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les stocks');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, stockFilter]);

  useEffect(() => {
    loadStocks();
  }, [page, rowsPerPage, search, stockFilter]);

  const getStockColor = (status) => (status === 'sufficient' ? 'success' : 'error');
  const getStockLabel = (status) => (status === 'sufficient' ? 'Stock suffisant' : 'Stock faible');

  return (
    <>
      <Helmet><title> Gestion des Stocks | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Gestion des Stocks</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les stocks de médicaments en pharmacie</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Stock" value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="sufficient">Suffisant</option><option value="low">Faible</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Médicament</TableCell>
                    <TableCell>Quantité</TableCell>
                    <TableCell>Seuil</TableCell>
                    <TableCell>Unité</TableCell>
                    <TableCell>Date expiration</TableCell>
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
                    if (stocks.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            Aucun stock trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return stocks.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{item.medicament}</TableCell>
                        <TableCell>{item.quantite}</TableCell>
                        <TableCell>{item.seuil}</TableCell>
                        <TableCell>{item.unite}</TableCell>
                        <TableCell>{fDate(item.dateExpiration)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStockLabel(item.stockStatus)}
                            size="small"
                            color={getStockColor(item.stockStatus)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setDetailsDialog({ open: true, item })}
                          >
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
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
      <Dialog open={detailsDialog.open} onClose={() => setDetailsDialog({ open: false, item: null })} maxWidth="md" fullWidth>
        <DialogTitle>Détails du Stock</DialogTitle>
        <DialogContent>{detailsDialog.item && <Stack spacing={2} sx={{ mt: 1 }}><Box><Typography variant="subtitle2">Médicament</Typography><Typography variant="body2">{detailsDialog.item.medicament}</Typography></Box><Box><Typography variant="subtitle2">Quantité</Typography><Typography variant="body2">{detailsDialog.item.quantite} {detailsDialog.item.unite}</Typography></Box><Box><Typography variant="subtitle2">Date expiration</Typography><Typography variant="body2">{fDate(detailsDialog.item.dateExpiration)}</Typography></Box></Stack>}</DialogContent>
        <DialogActions><Button onClick={() => setDetailsDialog({ open: false, item: null })}>Fermer</Button></DialogActions>
      </Dialog>
    </>
  );
}
