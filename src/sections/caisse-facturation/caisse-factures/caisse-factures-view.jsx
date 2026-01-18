import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Button, TableRow, TextField, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function CaisseFacturesView() {
  const { contextHolder, showError } = useNotification();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadFactures = useCallback(async () => {
    setLoading(true);
    try {
      const mockFactures = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        numero: `FACT-${String(i + 1).padStart(6, '0')}`,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        montant: (Math.random() * 500 + 50).toFixed(2),
        status: ['pending', 'paid', 'partial', 'unpaid'][Math.floor(Math.random() * 4)],
      }));

      let filtered = mockFactures;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((f) => f.patientName.toLowerCase().includes(searchLower) || f.numero.toLowerCase().includes(searchLower));
      }
      if (statusFilter) {
        filtered = filtered.filter((f) => f.status === statusFilter);
      }

      setFactures(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les factures');
      setFactures([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadFactures();
  }, [page, rowsPerPage, search, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'unpaid': return 'error';
      default: return 'info';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'partial': return 'Partielle';
      case 'unpaid': return 'Impayée';
      default: return 'En attente';
    }
  };

  return (
    <>
      <Helmet><title> Création des Factures | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Création des Factures</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Créer et gérer les factures des patients</Typography></Box>
        <Card sx={{ p: 2 }}><Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />}>Nouvelle Facture</Button></Card>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Statut" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="pending">En attente</option><option value="paid">Payée</option><option value="partial">Partielle</option><option value="unpaid">Impayée</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Numéro</TableCell><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Montant (€)</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (factures.length === 0) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucune facture trouvée</TableCell></TableRow>; return factures.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{item.numero}</TableCell><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.montant}</TableCell><TableCell><Chip label={getStatusLabel(item.status)} size="small" color={getStatusColor(item.status)} /></TableCell><TableCell align="right"><Button variant="outlined" size="small">Voir</Button></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
