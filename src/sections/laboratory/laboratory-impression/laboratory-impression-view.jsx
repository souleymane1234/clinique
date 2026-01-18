import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Table, Stack, Button, IconButton, TableRow, TextField, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function LaboratoryImpressionView() {
  const { contextHolder, showSuccess } = useNotification();
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadResultats = useCallback(async () => {
    setLoading(true);
    try {
      const mockResultats = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        analyse: ['Hémogramme', 'Glycémie', 'Cholestérol'][Math.floor(Math.random() * 3)],
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        setResultats(mockResultats.filter((r) => r.patientName.toLowerCase().includes(searchLower)));
      } else {
        setResultats(mockResultats);
      }
    } catch (error) {
      setResultats([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadResultats();
  }, [page, rowsPerPage, search]);

  const handlePrint = (item) => {
    showSuccess('Succès', 'Résultat prêt pour l\'impression');
  };

  return (
    <>
      <Helmet><title> Impression des Résultats | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Impression des Résultats</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Imprimer les résultats d&apos;analyses validés</Typography></Box>
        <Card sx={{ p: 3 }}><TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} /></Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Analyse</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (resultats.length === 0) return <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>Aucun résultat trouvé</TableCell></TableRow>; return resultats.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.analyse}</TableCell><TableCell align="right"><IconButton color="primary" onClick={() => handlePrint(item)} title="Imprimer"><Iconify icon="solar:printer-bold" /></IconButton></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
