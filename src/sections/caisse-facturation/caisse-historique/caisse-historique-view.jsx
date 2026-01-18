import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function CaisseHistoriqueView() {
  const { contextHolder, showError } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const mockTransactions = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['facture', 'paiement', 'remboursement'][Math.floor(Math.random() * 3)],
        montant: (Math.random() * 500 + 50).toFixed(2),
        mode: ['especes', 'mobile_money', 'carte'][Math.floor(Math.random() * 3)],
        reference: `REF-${String(i + 1).padStart(6, '0')}`,
      }));

      let filtered = mockTransactions;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((t) => t.patientName.toLowerCase().includes(searchLower) || t.reference.toLowerCase().includes(searchLower));
      }
      if (typeFilter) {
        filtered = filtered.filter((t) => t.type === typeFilter);
      }

      setTransactions(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger l\'historique');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadTransactions();
  }, [page, rowsPerPage, search, typeFilter]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'facture': return 'Facture';
      case 'paiement': return 'Paiement';
      case 'remboursement': return 'Remboursement';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'facture': return 'primary';
      case 'paiement': return 'success';
      case 'remboursement': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <Helmet><title> Historique des Transactions | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Historique des Transactions</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter l&apos;historique complet des transactions</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="facture">Facture</option><option value="paiement">Paiement</option><option value="remboursement">Remboursement</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Type</TableCell><TableCell>Montant (€)</TableCell><TableCell>Mode</TableCell><TableCell>Référence</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (transactions.length === 0) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucune transaction trouvée</TableCell></TableRow>; return transactions.map((item, index) => { const modeLabel = (() => { if (item.mode === 'especes') return 'Espèces'; if (item.mode === 'mobile_money') return 'Mobile Money'; return 'Carte'; })(); return (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell><Chip label={getTypeLabel(item.type)} size="small" color={getTypeColor(item.type)} /></TableCell><TableCell>{item.montant}</TableCell><TableCell>{modeLabel}</TableCell><TableCell>{item.reference}</TableCell></TableRow>); }); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
