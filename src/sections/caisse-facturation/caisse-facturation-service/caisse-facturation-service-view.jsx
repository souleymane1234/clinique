import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function CaisseFacturationServiceView() {
  const { contextHolder, showError } = useNotification();
  const [facturations, setFacturations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const loadFacturations = useCallback(async () => {
    setLoading(true);
    try {
      const mockFacturations = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        service: ['Consultation', 'Examen', 'Traitement', 'Hospitalisation'][Math.floor(Math.random() * 4)],
        montant: (Math.random() * 500 + 50).toFixed(2),
        status: ['pending', 'paid'][Math.floor(Math.random() * 2)],
      }));

      let filtered = mockFacturations;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((f) => f.patientName.toLowerCase().includes(searchLower) || f.service.toLowerCase().includes(searchLower));
      }
      if (serviceFilter) {
        filtered = filtered.filter((f) => f.service === serviceFilter);
      }

      setFacturations(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les facturations');
      setFacturations([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, serviceFilter]);

  useEffect(() => {
    loadFacturations();
  }, [page, rowsPerPage, search, serviceFilter]);

  return (
    <>
      <Helmet><title> Facturation par Service | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Facturation par Service</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer la facturation par service médical</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Service" value={serviceFilter} onChange={(e) => { setServiceFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="Consultation">Consultation</option><option value="Examen">Examen</option><option value="Traitement">Traitement</option><option value="Hospitalisation">Hospitalisation</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Service</TableCell><TableCell>Montant (€)</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (facturations.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucune facturation trouvée</TableCell></TableRow>; return facturations.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.service}</TableCell><TableCell>{item.montant}</TableCell><TableCell><Chip label={item.status === 'paid' ? 'Payé' : 'En attente'} size="small" color={item.status === 'paid' ? 'success' : 'warning'} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
