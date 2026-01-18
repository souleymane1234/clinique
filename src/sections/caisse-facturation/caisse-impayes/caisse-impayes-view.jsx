import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function CaisseImpayesView() {
  const { contextHolder, showError } = useNotification();
  const [impayes, setImpayes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadImpayes = useCallback(async () => {
    setLoading(true);
    try {
      const mockImpayes = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        factureId: `FACT-${String(i + 1).padStart(6, '0')}`,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        montantTotal: (Math.random() * 500 + 100).toFixed(2),
        montantPaye: (Math.random() * 200).toFixed(2),
        montantRestant: (Math.random() * 400 + 50).toFixed(2),
        joursRetard: Math.floor(Math.random() * 60),
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        setImpayes(mockImpayes.filter((imp) => imp.patientName.toLowerCase().includes(searchLower) || imp.factureId.toLowerCase().includes(searchLower)));
      } else {
        setImpayes(mockImpayes);
      }
    } catch (error) {
      showError('Erreur', 'Impossible de charger les impayés');
      setImpayes([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadImpayes();
  }, [page, rowsPerPage, search]);

  return (
    <>
      <Helmet><title> Gestion des Impayés | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Gestion des Impayés</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Suivre et gérer les factures impayées</Typography></Box>
        <Card sx={{ p: 3 }}><TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} /></Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Facture</TableCell><TableCell>Patient</TableCell><TableCell>Date</TableCell><TableCell>Montant total (€)</TableCell><TableCell>Montant payé (€)</TableCell><TableCell>Reste (€)</TableCell><TableCell>Jours retard</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (impayes.length === 0) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Aucun impayé trouvé</TableCell></TableRow>; return impayes.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover><TableCell>{item.factureId}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.montantTotal}</TableCell><TableCell>{item.montantPaye}</TableCell><TableCell><Typography color="error">{item.montantRestant}</Typography></TableCell><TableCell><Chip label={`${item.joursRetard} jours`} size="small" color={item.joursRetard > 30 ? 'error' : 'warning'} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
