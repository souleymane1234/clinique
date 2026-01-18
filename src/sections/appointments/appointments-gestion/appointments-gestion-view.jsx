import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TableRow, TextField, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

export default function AppointmentsGestionView() {
  const { contextHolder, showError, showSuccess } = useNotification();
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });

  const loadRendezVous = useCallback(async () => {
    setLoading(true);
    try {
      const mockRendezVous = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        heure: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        medecin: `Dr. ${['Martin', 'Dubois', 'Bernard'][Math.floor(Math.random() * 3)]}`,
        raison: ['Consultation', 'Suivi', 'Contrôle', 'Urgence'][Math.floor(Math.random() * 4)],
        status: ['scheduled', 'confirmed', 'cancelled', 'completed'][Math.floor(Math.random() * 4)],
      }));

      let filtered = mockRendezVous;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((rv) => rv.patientName.toLowerCase().includes(searchLower) || rv.medecin.toLowerCase().includes(searchLower));
      }
      if (statusFilter) {
        filtered = filtered.filter((rv) => rv.status === statusFilter);
      }

      setRendezVous(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les rendez-vous');
      setRendezVous([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadRendezVous();
  }, [page, rowsPerPage, search, statusFilter]);

  const handleCreate = () => {
    setCreateDialog({ open: true, loading: false });
  };

  const handleConfirmCreate = async () => {
    setCreateDialog({ open: true, loading: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess('Succès', 'Rendez-vous créé avec succès');
      setCreateDialog({ open: false, loading: false });
      loadRendezVous();
    } catch (error) {
      showError('Erreur', 'Impossible de créer le rendez-vous');
      setCreateDialog({ open: false, loading: false });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'confirmed': return 'info';
      case 'cancelled': return 'error';
      default: return 'warning';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'confirmed': return 'Confirmé';
      case 'cancelled': return 'Annulé';
      default: return 'Programmé';
    }
  };

  return (
    <>
      <Helmet><title> Prise et Gestion des Rendez-vous | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Prise et Gestion des Rendez-vous</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Créer et gérer les rendez-vous des patients</Typography></Box>
        <Card sx={{ p: 2 }}><Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={handleCreate}>Nouveau Rendez-vous</Button></Card>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Statut" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="scheduled">Programmé</option><option value="confirmed">Confirmé</option><option value="cancelled">Annulé</option><option value="completed">Terminé</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Heure</TableCell><TableCell>Patient</TableCell><TableCell>Médecin</TableCell><TableCell>Raison</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (rendezVous.length === 0) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Aucun rendez-vous trouvé</TableCell></TableRow>; return rendezVous.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover><TableCell>{fDate(item.date)}</TableCell><TableCell>{item.heure}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.medecin}</TableCell><TableCell>{item.raison}</TableCell><TableCell><Chip label={getStatusLabel(item.status)} size="small" color={getStatusColor(item.status)} /></TableCell><TableCell align="right"><Button variant="outlined" size="small">Voir</Button></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau Rendez-vous</DialogTitle>
        <DialogContent><Typography variant="body2" sx={{ mt: 2 }}>Formulaire de création de rendez-vous</Typography></DialogContent>
        <DialogActions><Button onClick={() => setCreateDialog({ open: false, loading: false })}>Annuler</Button><LoadingButton variant="contained" loading={createDialog.loading} onClick={handleConfirmCreate}>Créer</LoadingButton></DialogActions>
      </Dialog>
    </>
  );
}
