import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function CaissePaiementsView() {
  const { contextHolder, showError } = useNotification();
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  const loadPaiements = useCallback(async () => {
    setLoading(true);
    try {
      const mockPaiements = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        montant: (Math.random() * 500 + 50).toFixed(2),
        mode: ['especes', 'mobile_money', 'carte'][Math.floor(Math.random() * 3)],
        factureId: `FACT-${String(i + 1).padStart(6, '0')}`,
      }));

      let filtered = mockPaiements;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((p) => p.patientName.toLowerCase().includes(searchLower) || p.factureId.toLowerCase().includes(searchLower));
      }
      if (modeFilter) {
        filtered = filtered.filter((p) => p.mode === modeFilter);
      }

      setPaiements(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les paiements');
      setPaiements([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, modeFilter]);

  useEffect(() => {
    loadPaiements();
  }, [page, rowsPerPage, search, modeFilter]);

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'especes': return 'Espèces';
      case 'mobile_money': return 'Mobile Money';
      case 'carte': return 'Carte';
      default: return mode;
    }
  };

  return (
    <>
      <Helmet><title> Paiements | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Paiements</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les paiements (espèces, mobile money, carte)</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Mode" value={modeFilter} onChange={(e) => { setModeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="especes">Espèces</option><option value="mobile_money">Mobile Money</option><option value="carte">Carte</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Facture</TableCell><TableCell>Montant (€)</TableCell><TableCell>Mode de paiement</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (paiements.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucun paiement trouvé</TableCell></TableRow>; return paiements.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.factureId}</TableCell><TableCell>{item.montant}</TableCell><TableCell><Chip label={getModeLabel(item.mode)} size="small" color="primary" /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
