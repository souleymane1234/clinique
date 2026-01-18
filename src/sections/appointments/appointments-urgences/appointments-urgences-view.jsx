import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Button, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function AppointmentsUrgencesView() {
  const { contextHolder, showError } = useNotification();
  const [urgences, setUrgences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const loadUrgences = useCallback(async () => {
    setLoading(true);
    try {
      const mockUrgences = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        priorite: ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)],
        symptomes: ['Douleur thoracique', 'Difficulté respiratoire', 'Traumatisme', 'Fièvre élevée'][Math.floor(Math.random() * 4)],
        medecin: `Dr. ${['Martin', 'Dubois'][Math.floor(Math.random() * 2)]}`,
        status: ['pending', 'in_progress', 'treated'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockUrgences;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((u) => u.patientName.toLowerCase().includes(searchLower) || u.symptomes.toLowerCase().includes(searchLower));
      }
      if (priorityFilter) {
        filtered = filtered.filter((u) => u.priorite === priorityFilter);
      }

      setUrgences(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les urgences');
      setUrgences([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, priorityFilter]);

  useEffect(() => {
    loadUrgences();
  }, [page, rowsPerPage, search, priorityFilter]);

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      default: return 'info';
    }
  };

  const getPriorityLabel = (priorite) => {
    switch (priorite) {
      case 'critical': return 'Critique';
      case 'high': return 'Haute';
      default: return 'Moyenne';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'treated': return 'success';
      case 'in_progress': return 'warning';
      default: return 'info';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'treated': return 'Traité';
      case 'in_progress': return 'En cours';
      default: return 'En attente';
    }
  };

  return (
    <>
      <Helmet><title> Gestion des Urgences | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Gestion des Urgences</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les rendez-vous d&apos;urgence</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Priorité" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Toutes</option><option value="critical">Critique</option><option value="high">Haute</option><option value="medium">Moyenne</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Symptômes</TableCell><TableCell>Priorité</TableCell><TableCell>Médecin</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (urgences.length === 0) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Aucune urgence trouvée</TableCell></TableRow>; return urgences.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover sx={item.priorite === 'critical' ? { bgcolor: 'error.lighter' } : {}}><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.symptomes}</TableCell><TableCell><Chip label={getPriorityLabel(item.priorite)} size="small" color={getPriorityColor(item.priorite)} /></TableCell><TableCell>{item.medecin}</TableCell><TableCell><Chip label={getStatusLabel(item.status)} size="small" color={getStatusColor(item.status)} /></TableCell><TableCell align="right"><Button variant="outlined" size="small">Traiter</Button></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
