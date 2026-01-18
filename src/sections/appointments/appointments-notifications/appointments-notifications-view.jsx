import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function AppointmentsNotificationsView() {
  const { contextHolder, showError } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const mockNotifications = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['rappel', 'annulation', 'confirmation', 'modification'][Math.floor(Math.random() * 4)],
        message: ['Rappel rendez-vous demain', 'Rendez-vous annulé', 'Rendez-vous confirmé', 'Rendez-vous modifié'][Math.floor(Math.random() * 4)],
        destinataire: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        statut: Math.random() > 0.3 ? 'sent' : 'pending',
        moyen: ['sms', 'email', 'app'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockNotifications;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((n) => n.message.toLowerCase().includes(searchLower) || n.destinataire.toLowerCase().includes(searchLower));
      }
      if (typeFilter) {
        filtered = filtered.filter((n) => n.type === typeFilter);
      }

      setNotifications(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadNotifications();
  }, [page, rowsPerPage, search, typeFilter]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'rappel': return 'Rappel';
      case 'annulation': return 'Annulation';
      case 'confirmation': return 'Confirmation';
      case 'modification': return 'Modification';
      default: return type;
    }
  };

  const getMoyenLabel = (moyen) => {
    switch (moyen) {
      case 'sms': return 'SMS';
      case 'email': return 'Email';
      case 'app': return 'Application';
      default: return moyen;
    }
  };

  return (
    <>
      <Helmet><title> Notifications | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Notifications</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les notifications de rendez-vous</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="rappel">Rappel</option><option value="annulation">Annulation</option><option value="confirmation">Confirmation</option><option value="modification">Modification</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Destinataire</TableCell><TableCell>Type</TableCell><TableCell>Message</TableCell><TableCell>Moyen</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (notifications.length === 0) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucune notification trouvée</TableCell></TableRow>; return notifications.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.destinataire}</TableCell><TableCell><Chip label={getTypeLabel(item.type)} size="small" color="primary" /></TableCell><TableCell>{item.message}</TableCell><TableCell>{getMoyenLabel(item.moyen)}</TableCell><TableCell><Chip label={item.statut === 'sent' ? 'Envoyée' : 'En attente'} size="small" color={item.statut === 'sent' ? 'success' : 'warning'} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
