import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment, Avatar } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function NotificationsInternesView() {
  const { contextHolder, showError } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const mockNotifications = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        expediteur: `User ${['Martin', 'Bernard', 'Dubois'][Math.floor(Math.random() * 3)]}`,
        destinataire: `User ${['Lefevre', 'Moreau'][Math.floor(Math.random() * 2)]}`,
        sujet: ['Réunion urgente', 'Mise à jour système', 'Alerte stock', 'Rapport mensuel'][Math.floor(Math.random() * 4)],
        contenu: 'Contenu de la notification interne',
        statut: Math.random() > 0.3 ? 'read' : 'unread',
        priorite: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockNotifications;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((n) => n.sujet.toLowerCase().includes(searchLower) || n.expediteur.toLowerCase().includes(searchLower));
      }
      if (readFilter !== '') {
        filtered = filtered.filter((n) => n.statut === (readFilter === 'read' ? 'read' : 'unread'));
      }

      setNotifications(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, readFilter]);

  useEffect(() => {
    loadNotifications();
  }, [page, rowsPerPage, search, readFilter]);

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };

  return (
    <>
      <Helmet><title> Notifications Internes | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Notifications Internes</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter les notifications internes du personnel</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Statut" value={readFilter} onChange={(e) => { setReadFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="read">Lu</option><option value="unread">Non lu</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Expéditeur</TableCell><TableCell>Destinataire</TableCell><TableCell>Sujet</TableCell><TableCell>Priorité</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (notifications.length === 0) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucune notification trouvée</TableCell></TableRow>; return notifications.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover sx={item.statut === 'unread' ? { bgcolor: 'action.hover' } : {}}><TableCell>{fDateTime(item.date)}</TableCell><TableCell><Stack direction="row" alignItems="center" spacing={1}><Avatar sx={{ width: 24, height: 24 }}>{item.expediteur.charAt(0)}</Avatar><Typography variant="body2">{item.expediteur}</Typography></Stack></TableCell><TableCell>{item.destinataire}</TableCell><TableCell>{item.sujet}</TableCell><TableCell><Chip label={item.priorite} size="small" color={getPrioriteColor(item.priorite)} /></TableCell><TableCell><Chip label={item.statut === 'read' ? 'Lu' : 'Non lu'} size="small" color={item.statut === 'read' ? 'default' : 'primary'} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
