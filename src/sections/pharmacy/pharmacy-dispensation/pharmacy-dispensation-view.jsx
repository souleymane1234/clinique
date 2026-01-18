import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function PharmacyDispensationView() {
  const { contextHolder, showError } = useNotification();
  const [dispensations, setDispensations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadDispensations = useCallback(async () => {
    setLoading(true);
    try {
      const mockDispensations = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        medicament: ['Paracétamol 500mg', 'Ibuprofène 400mg', 'Aspirine 100mg'][Math.floor(Math.random() * 3)],
        quantite: Math.floor(Math.random() * 10) + 1,
        medecin: `Dr. ${['Martin', 'Dubois'][Math.floor(Math.random() * 2)]}`,
        status: ['pending', 'dispensed', 'cancelled'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockDispensations;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((d) => d.patientName.toLowerCase().includes(searchLower) || d.medicament.toLowerCase().includes(searchLower));
      }
      if (statusFilter) {
        filtered = filtered.filter((d) => d.status === statusFilter);
      }

      setDispensations(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les dispensations');
      setDispensations([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadDispensations();
  }, [page, rowsPerPage, search, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'dispensed': return 'success';
      case 'cancelled': return 'error';
      default: return 'warning';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'dispensed': return 'Dispensé';
      case 'cancelled': return 'Annulé';
      default: return 'En attente';
    }
  };

  return (
    <>
      <Helmet><title> Dispensation des Médicaments | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Dispensation des Médicaments</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer la dispensation des médicaments aux patients</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Statut" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="pending">En attente</option><option value="dispensed">Dispensé</option><option value="cancelled">Annulé</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Médicament</TableCell><TableCell>Quantité</TableCell><TableCell>Médecin</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (dispensations.length === 0) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucune dispensation trouvée</TableCell></TableRow>; return dispensations.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.medicament}</TableCell><TableCell>{item.quantite}</TableCell><TableCell>{item.medecin}</TableCell><TableCell><Chip label={getStatusLabel(item.status)} size="small" color={getStatusColor(item.status)} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
