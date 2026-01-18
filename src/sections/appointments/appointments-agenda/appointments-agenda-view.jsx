import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

export default function AppointmentsAgendaView() {
  const { contextHolder, showError } = useNotification();
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [personnelFilter, setPersonnelFilter] = useState('');

  const loadAgenda = useCallback(async () => {
    setLoading(true);
    try {
      const mockAgenda = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        heure: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        personnel: Math.random() > 0.5 ? `Dr. ${['Martin', 'Dubois'][Math.floor(Math.random() * 2)]}` : `Inf. ${['Dupont', 'Bernard'][Math.floor(Math.random() * 2)]}`,
        type: Math.random() > 0.5 ? 'medecin' : 'infirmier',
        patient: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        activite: ['Consultation', 'Soin', 'Visite', 'Suivi'][Math.floor(Math.random() * 4)],
      }));

      let filtered = mockAgenda;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((a) => a.personnel.toLowerCase().includes(searchLower) || a.patient.toLowerCase().includes(searchLower));
      }
      if (personnelFilter) {
        filtered = filtered.filter((a) => a.type === personnelFilter);
      }

      setAgenda(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger l\'agenda');
      setAgenda([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, personnelFilter]);

  useEffect(() => {
    loadAgenda();
  }, [page, rowsPerPage, search, personnelFilter]);

  return (
    <>
      <Helmet><title> Agenda Médecins et Infirmiers | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Agenda Médecins et Infirmiers</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter les agendas des médecins et infirmiers</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Personnel" value={personnelFilter} onChange={(e) => { setPersonnelFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="medecin">Médecin</option><option value="infirmier">Infirmier</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Heure</TableCell><TableCell>Personnel</TableCell><TableCell>Patient</TableCell><TableCell>Activité</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (agenda.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucun élément trouvé</TableCell></TableRow>; return agenda.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{fDate(item.date)}</TableCell><TableCell>{item.heure}</TableCell><TableCell><Chip label={item.type === 'medecin' ? 'Médecin' : 'Infirmier'} size="small" color={item.type === 'medecin' ? 'primary' : 'info'} /> {item.personnel}</TableCell><TableCell>{item.patient}</TableCell><TableCell>{item.activite}</TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
