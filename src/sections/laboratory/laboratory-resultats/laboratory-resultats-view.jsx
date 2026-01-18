import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TableRow, TextField, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function LaboratoryResultatsView() {
  const { contextHolder, showError, showSuccess } = useNotification();
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadResultats = useCallback(async () => {
    setLoading(true);
    try {
      const mockResultats = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        analyse: ['Hémogramme', 'Glycémie', 'Cholestérol'][Math.floor(Math.random() * 3)],
        resultat: 'Résultat normal',
        status: ['pending', 'validated', 'rejected'][Math.floor(Math.random() * 3)],
        technician: `Tech. ${['Martin', 'Bernard'][Math.floor(Math.random() * 2)]}`,
      }));

      let filtered = mockResultats;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((r) => r.patientName.toLowerCase().includes(searchLower) || r.analyse.toLowerCase().includes(searchLower));
      }
      if (statusFilter) {
        filtered = filtered.filter((r) => r.status === statusFilter);
      }

      setResultats(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les résultats');
      setResultats([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadResultats();
  }, [page, rowsPerPage, search, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'validated': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'validated': return 'Validé';
      case 'rejected': return 'Rejeté';
      default: return 'En attente';
    }
  };

  return (
    <>
      <Helmet><title> Saisie et Validation des Résultats | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Saisie et Validation des Résultats</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Saisir et valider les résultats d&apos;analyses</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Statut" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="pending">En attente</option><option value="validated">Validé</option><option value="rejected">Rejeté</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Analyse</TableCell><TableCell>Résultat</TableCell><TableCell>Technicien</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {(() => { if (loading) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (resultats.length === 0) return <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Aucun résultat trouvé</TableCell></TableRow>; return resultats.map((item, index) => (
                    <TableRow key={`${item.patientId}-${item.id}-${index}`} hover>
                      <TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.analyse}</TableCell><TableCell>{item.resultat}</TableCell><TableCell>{item.technician}</TableCell><TableCell><Chip label={getStatusLabel(item.status)} size="small" color={getStatusColor(item.status)} /></TableCell><TableCell align="right"><Button variant="outlined" size="small" onClick={() => setDetailsDialog({ open: true, item })}>Voir détails</Button></TableCell>
                    </TableRow>
                  )); })()}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
      <Dialog open={detailsDialog.open} onClose={() => setDetailsDialog({ open: false, item: null })} maxWidth="md" fullWidth>
        <DialogTitle>Détails du Résultat</DialogTitle>
        <DialogContent>{detailsDialog.item && <Stack spacing={2} sx={{ mt: 1 }}><Box><Typography variant="subtitle2">Patient</Typography><Typography variant="body2">{detailsDialog.item.patientName}</Typography></Box><Box><Typography variant="subtitle2">Analyse</Typography><Typography variant="body2">{detailsDialog.item.analyse}</Typography></Box><Box><Typography variant="subtitle2">Résultat</Typography><Typography variant="body2">{detailsDialog.item.resultat}</Typography></Box></Stack>}</DialogContent>
        <DialogActions><Button onClick={() => setDetailsDialog({ open: false, item: null })}>Fermer</Button></DialogActions>
      </Dialog>
    </>
  );
}
