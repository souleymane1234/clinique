import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TableRow, TextField, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment, Avatar } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function MessagerieView() {
  const { contextHolder, showError } = useNotification();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const mockMessages = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        expediteur: `User ${['Martin', 'Bernard', 'Dubois'][Math.floor(Math.random() * 3)]}`,
        destinataire: `User ${['Lefevre', 'Moreau'][Math.floor(Math.random() * 2)]}`,
        sujet: `Message ${i + 1}`,
        contenu: `Contenu du message ${i + 1}`,
        statut: Math.random() > 0.3 ? 'read' : 'unread',
      }));

      let filtered = mockMessages;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((m) => m.sujet.toLowerCase().includes(searchLower) || m.expediteur.toLowerCase().includes(searchLower));
      }
      if (readFilter !== '') {
        filtered = filtered.filter((m) => m.statut === (readFilter === 'read' ? 'read' : 'unread'));
      }

      setMessages(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, readFilter]);

  useEffect(() => {
    loadMessages();
  }, [page, rowsPerPage, search, readFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
    // Marquer comme lu
    setMessages((prev) => prev.map((m) => (m.id === item.id ? { ...m, statut: 'read' } : m)));
  };

  return (
    <>
      <Helmet><title> Messagerie Interne | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Messagerie Interne</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Communication interne entre les membres du personnel</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Statut" value={readFilter} onChange={(e) => { setReadFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="read">Lu</option><option value="unread">Non lu</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Expéditeur</TableCell><TableCell>Destinataire</TableCell><TableCell>Sujet</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (messages.length === 0) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucun message trouvé</TableCell></TableRow>; return messages.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover sx={item.statut === 'unread' ? { bgcolor: 'action.hover' } : {}}><TableCell>{fDateTime(item.date)}</TableCell><TableCell><Stack direction="row" alignItems="center" spacing={1}><Avatar sx={{ width: 24, height: 24 }}>{item.expediteur.charAt(0)}</Avatar><Typography variant="body2">{item.expediteur}</Typography></Stack></TableCell><TableCell>{item.destinataire}</TableCell><TableCell>{item.sujet}</TableCell><TableCell><Chip label={item.statut === 'read' ? 'Lu' : 'Non lu'} size="small" color={item.statut === 'read' ? 'default' : 'primary'} /></TableCell><TableCell align="right"><Button variant="outlined" size="small" onClick={() => handleViewDetails(item)}>Lire</Button></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
      <Dialog open={detailsDialog.open} onClose={() => setDetailsDialog({ open: false, item: null })} maxWidth="md" fullWidth>
        <DialogTitle>{detailsDialog.item?.sujet}</DialogTitle>
        <DialogContent>{detailsDialog.item && <Stack spacing={2} sx={{ mt: 1 }}><Box><Typography variant="subtitle2">De</Typography><Typography variant="body2">{detailsDialog.item.expediteur}</Typography></Box><Box><Typography variant="subtitle2">À</Typography><Typography variant="body2">{detailsDialog.item.destinataire}</Typography></Box><Box><Typography variant="subtitle2">Date</Typography><Typography variant="body2">{fDateTime(detailsDialog.item.date)}</Typography></Box><Box><Typography variant="subtitle2">Contenu</Typography><Typography variant="body2">{detailsDialog.item.contenu}</Typography></Box></Stack>}</DialogContent>
        <DialogActions><Button onClick={() => setDetailsDialog({ open: false, item: null })}>Fermer</Button></DialogActions>
      </Dialog>
    </>
  );
}
