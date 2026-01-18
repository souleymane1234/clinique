import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function ManagerAuditView() {
  const { contextHolder, showError } = useNotification();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadAudits = useCallback(async () => {
    setLoading(true);
    try {
      const mockAudits = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        action: ['Modification dossier', 'Suppression facture', 'Accès système', 'Modification stock'][Math.floor(Math.random() * 4)],
        utilisateur: `User ${['Martin', 'Bernard', 'Dubois'][Math.floor(Math.random() * 3)]}`,
        module: ['Patients', 'Caisse', 'Pharmacie', 'Laboratoire'][Math.floor(Math.random() * 4)],
        status: ['success', 'warning', 'error'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockAudits;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((a) => a.action.toLowerCase().includes(searchLower) || a.utilisateur.toLowerCase().includes(searchLower));
      }
      if (statusFilter) {
        filtered = filtered.filter((a) => a.status === statusFilter);
      }

      setAudits(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les audits');
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadAudits();
  }, [page, rowsPerPage, search, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'success': return 'Réussi';
      case 'warning': return 'Attention';
      case 'error': return 'Erreur';
      default: return status;
    }
  };

  return (
    <>
      <Helmet><title> Audit et Contrôle Interne | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Audit et Contrôle Interne</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter les logs d&apos;audit et contrôles internes</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Statut" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="success">Réussi</option><option value="warning">Attention</option><option value="error">Erreur</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Action</TableCell><TableCell>Utilisateur</TableCell><TableCell>Module</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (audits.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucun audit trouvé</TableCell></TableRow>; return audits.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.action}</TableCell><TableCell>{item.utilisateur}</TableCell><TableCell><Chip label={item.module} size="small" color="primary" /></TableCell><TableCell><Chip label={getStatusLabel(item.status)} size="small" color={getStatusColor(item.status)} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
