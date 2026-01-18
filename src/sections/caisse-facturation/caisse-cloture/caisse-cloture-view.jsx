import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Button, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment, Grid } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

export default function CaisseClotureView() {
  const { contextHolder, showError, showSuccess } = useNotification();
  const [clotures, setClotures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadClotures = useCallback(async () => {
    setLoading(true);
    try {
      const mockClotures = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        especes: (Math.random() * 1000 + 200).toFixed(2),
        mobileMoney: (Math.random() * 800 + 100).toFixed(2),
        carte: (Math.random() * 500 + 50).toFixed(2),
        total: (Math.random() * 2000 + 350).toFixed(2),
        status: Math.random() > 0.3 ? 'closed' : 'open',
        caissier: `Caissier ${['Martin', 'Bernard'][Math.floor(Math.random() * 2)]}`,
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        setClotures(mockClotures.filter((c) => c.date.includes(searchLower) || c.caissier.toLowerCase().includes(searchLower)));
      } else {
        setClotures(mockClotures);
      }
    } catch (error) {
      showError('Erreur', 'Impossible de charger les clôtures');
      setClotures([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadClotures();
  }, [page, rowsPerPage, search]);

  const handleClose = () => {
    showSuccess('Succès', 'Clôture journalière effectuée avec succès');
  };

  return (
    <>
      <Helmet><title> Clôture Journalière | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Clôture Journalière</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Effectuer la clôture journalière de la caisse</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="date" label="Date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="contained" fullWidth onClick={handleClose} startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}>Effectuer la clôture</Button>
            </Grid>
          </Grid>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Espèces (€)</TableCell><TableCell>Mobile Money (€)</TableCell><TableCell>Carte (€)</TableCell><TableCell>Total (€)</TableCell><TableCell>Caissier</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (clotures.length === 0) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Aucune clôture trouvée</TableCell></TableRow>; return clotures.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{fDate(item.date)}</TableCell><TableCell>{item.especes}</TableCell><TableCell>{item.mobileMoney}</TableCell><TableCell>{item.carte}</TableCell><TableCell>{item.total}</TableCell><TableCell>{item.caissier}</TableCell><TableCell><Chip label={item.status === 'closed' ? 'Clôturée' : 'Ouverte'} size="small" color={item.status === 'closed' ? 'success' : 'warning'} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
