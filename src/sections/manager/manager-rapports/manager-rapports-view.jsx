import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Button, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

export default function ManagerRapportsView() {
  const { contextHolder, showError, showSuccess } = useNotification();
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadRapports = useCallback(async () => {
    setLoading(true);
    try {
      const mockRapports = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        titre: ['Rapport mensuel', 'Rapport trimestriel', 'Rapport annuel', 'Rapport financier'][Math.floor(Math.random() * 4)],
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['mensuel', 'trimestriel', 'annuel', 'special'][Math.floor(Math.random() * 4)],
        statut: Math.random() > 0.3 ? 'generated' : 'pending',
      }));

      let filtered = mockRapports;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((r) => r.titre.toLowerCase().includes(searchLower));
      }
      if (typeFilter) {
        filtered = filtered.filter((r) => r.type === typeFilter);
      }

      setRapports(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les rapports');
      setRapports([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadRapports();
  }, [page, rowsPerPage, search, typeFilter]);

  const handleGenerate = () => {
    showSuccess('Succès', 'Rapport généré avec succès');
  };

  return (
    <>
      <Helmet><title> Rapports Périodiques | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Rapports Périodiques</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Générer et consulter les rapports périodiques</Typography></Box>
        <Card sx={{ p: 2 }}><Button variant="contained" onClick={handleGenerate} startIcon={<Iconify icon="eva:download-fill" />}>Générer un rapport</Button></Card>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="mensuel">Mensuel</option><option value="trimestriel">Trimestriel</option><option value="annuel">Annuel</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Titre</TableCell><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (rapports.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucun rapport trouvé</TableCell></TableRow>; return rapports.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{item.titre}</TableCell><TableCell>{fDate(item.date)}</TableCell><TableCell><Chip label={item.type} size="small" color="primary" /></TableCell><TableCell><Chip label={item.statut === 'generated' ? 'Généré' : 'En attente'} size="small" color={item.statut === 'generated' ? 'success' : 'warning'} /></TableCell><TableCell align="right"><Button variant="outlined" size="small">Télécharger</Button></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
