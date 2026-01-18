import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function HistoriqueEchangesView() {
  const { contextHolder, showError } = useNotification();
  const [echanges, setEchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadEchanges = useCallback(async () => {
    setLoading(true);
    try {
      const mockEchanges = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['notification', 'alerte', 'rappel', 'message'][Math.floor(Math.random() * 4)],
        expediteur: `User ${['Martin', 'Bernard', 'Dubois'][Math.floor(Math.random() * 3)]}`,
        destinataire: `User ${['Lefevre', 'Moreau', 'Petit'][Math.floor(Math.random() * 3)]}`,
        sujet: ['Réunion', 'Alerte médicale', 'Rappel patient', 'Message interne'][Math.floor(Math.random() * 4)],
        statut: ['sent', 'read', 'failed'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockEchanges;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((e) => e.sujet.toLowerCase().includes(searchLower) || e.expediteur.toLowerCase().includes(searchLower));
      }
      if (typeFilter) {
        filtered = filtered.filter((e) => e.type === typeFilter);
      }

      setEchanges(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger l\'historique');
      setEchanges([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadEchanges();
  }, [page, rowsPerPage, search, typeFilter]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'notification': return 'Notification';
      case 'alerte': return 'Alerte';
      case 'rappel': return 'Rappel';
      case 'message': return 'Message';
      default: return type;
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'read': return 'success';
      case 'sent': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'read': return 'Lu';
      case 'sent': return 'Envoyé';
      case 'failed': return 'Échec';
      default: return statut;
    }
  };

  return (
    <>
      <Helmet><title> Historique des Échanges | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Historique des Échanges</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter l&apos;historique complet des échanges et communications</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="notification">Notification</option><option value="alerte">Alerte</option><option value="rappel">Rappel</option><option value="message">Message</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Expéditeur</TableCell>
                    <TableCell>Destinataire</TableCell>
                    <TableCell>Sujet</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (echanges.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            Aucun échange trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return echanges.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>
                          <Chip label={getTypeLabel(item.type)} size="small" color="primary" />
                        </TableCell>
                        <TableCell>{item.expediteur}</TableCell>
                        <TableCell>{item.destinataire}</TableCell>
                        <TableCell>{item.sujet}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.statut)}
                            size="small"
                            color={getStatusColor(item.statut)}
                          />
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
