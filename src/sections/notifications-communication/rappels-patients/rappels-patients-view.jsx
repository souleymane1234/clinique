import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

export default function RappelsPatientsView() {
  const { contextHolder, showError } = useNotification();
  const [rappels, setRappels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadRappels = useCallback(async () => {
    setLoading(true);
    try {
      const mockRappels = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        dateRappel: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['rendez-vous', 'medication', 'examen', 'suivi'][Math.floor(Math.random() * 4)],
        message: ['Rappel rendez-vous demain', 'Prendre médication', 'Examen à programmer', 'Suivi médical'][Math.floor(Math.random() * 4)],
        moyen: ['sms', 'email', 'app', 'telephone'][Math.floor(Math.random() * 4)],
        statut: ['pending', 'sent', 'confirmed'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockRappels;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((r) => r.patientName.toLowerCase().includes(searchLower) || r.message.toLowerCase().includes(searchLower));
      }
      if (statusFilter) {
        filtered = filtered.filter((r) => r.statut === statusFilter);
      }

      setRappels(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les rappels');
      setRappels([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadRappels();
  }, [page, rowsPerPage, search, statusFilter]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'rendez-vous': return 'Rendez-vous';
      case 'medication': return 'Médication';
      case 'examen': return 'Examen';
      case 'suivi': return 'Suivi';
      default: return type;
    }
  };

  const getMoyenLabel = (moyen) => {
    switch (moyen) {
      case 'sms': return 'SMS';
      case 'email': return 'Email';
      case 'app': return 'Application';
      case 'telephone': return 'Téléphone';
      default: return moyen;
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'confirmed': return 'success';
      case 'sent': return 'info';
      default: return 'warning';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'confirmed': return 'Confirmé';
      case 'sent': return 'Envoyé';
      default: return 'En attente';
    }
  };

  return (
    <>
      <Helmet><title> Rappels Patients | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Rappels Patients</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les rappels envoyés aux patients</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Statut" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="pending">En attente</option><option value="sent">Envoyé</option><option value="confirmed">Confirmé</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date rappel</TableCell><TableCell>Patient</TableCell><TableCell>Type</TableCell><TableCell>Message</TableCell><TableCell>Moyen</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (rappels.length === 0) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucun rappel trouvé</TableCell></TableRow>; return rappels.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover><TableCell>{fDateTime(item.dateRappel)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell><Chip label={getTypeLabel(item.type)} size="small" color="primary" /></TableCell><TableCell>{item.message}</TableCell><TableCell>{getMoyenLabel(item.moyen)}</TableCell><TableCell><Chip label={getStatusLabel(item.statut)} size="small" color={getStatusColor(item.statut)} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
