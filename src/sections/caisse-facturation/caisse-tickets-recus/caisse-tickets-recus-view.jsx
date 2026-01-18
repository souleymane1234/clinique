import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Table, Stack, Button, IconButton, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function CaisseTicketsRecusView() {
  const { contextHolder, showSuccess } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const mockTickets = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        numero: `TKT-${String(i + 1).padStart(6, '0')}`,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        montant: (Math.random() * 500 + 50).toFixed(2),
        type: Math.random() > 0.5 ? 'ticket' : 'recu',
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        setTickets(mockTickets.filter((t) => t.patientName.toLowerCase().includes(searchLower) || t.numero.toLowerCase().includes(searchLower)));
      } else {
        setTickets(mockTickets);
      }
    } catch (error) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadTickets();
  }, [page, rowsPerPage, search]);

  const handlePrint = (item) => {
    showSuccess('Succès', `${item.type === 'ticket' ? 'Ticket' : 'Reçu'} prêt pour l'impression`);
  };

  return (
    <>
      <Helmet><title> Tickets et Reçus | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Tickets et Reçus</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les tickets et reçus de paiement</Typography></Box>
        <Card sx={{ p: 3 }}><TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} /></Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Numéro</TableCell><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Montant (€)</TableCell><TableCell>Type</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (tickets.length === 0) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucun ticket/reçu trouvé</TableCell></TableRow>; return tickets.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{item.numero}</TableCell><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.montant}</TableCell><TableCell>{item.type === 'ticket' ? 'Ticket' : 'Reçu'}</TableCell><TableCell align="right"><IconButton color="primary" onClick={() => handlePrint(item)} title="Imprimer"><Iconify icon="solar:printer-bold" /></IconButton></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
