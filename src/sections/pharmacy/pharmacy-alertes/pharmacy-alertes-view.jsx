import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Alert, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

export default function PharmacyAlertesView() {
  const { contextHolder, showError } = useNotification();
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadAlertes = useCallback(async () => {
    setLoading(true);
    try {
      const mockAlertes = Array.from({ length: 20 }, (_, i) => {
        const types = ['rupture', 'peremption'];
        const type = types[Math.floor(Math.random() * types.length)];
        return {
          id: i + 1,
          medicament: ['Paracétamol 500mg', 'Ibuprofène 400mg', 'Aspirine 100mg'][Math.floor(Math.random() * 3)],
          dateExpiration: type === 'peremption' ? new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : null,
          quantite: type === 'rupture' ? 0 : Math.floor(Math.random() * 50),
          type,
          severity: type === 'rupture' ? 'critical' : 'warning',
        };
      });

      let filtered = mockAlertes;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((a) => a.medicament.toLowerCase().includes(searchLower));
      }
      if (typeFilter) {
        filtered = filtered.filter((a) => a.type === typeFilter);
      }

      setAlertes(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les alertes');
      setAlertes([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadAlertes();
  }, [page, rowsPerPage, search, typeFilter]);

  const getSeverityColor = (severity) => (severity === 'critical' ? 'error' : 'warning');
  const getTypeLabel = (type) => (type === 'rupture' ? 'Rupture de stock' : 'Péremption proche');

  return (
    <>
      <Helmet><title> Alertes de Rupture et Péremption | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Alertes de Rupture et Péremption</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter les alertes de rupture de stock et péremption</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Toutes</option><option value="rupture">Rupture</option><option value="peremption">Péremption</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Médicament</TableCell><TableCell>Type d&apos;alerte</TableCell><TableCell>Quantité</TableCell><TableCell>Date expiration</TableCell><TableCell>Gravité</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (alertes.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucune alerte trouvée</TableCell></TableRow>; return alertes.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover sx={item.severity === 'critical' ? { bgcolor: 'error.lighter' } : {}}><TableCell>{item.medicament}</TableCell><TableCell>{getTypeLabel(item.type)}</TableCell><TableCell>{item.quantite}</TableCell><TableCell>{item.dateExpiration ? fDate(item.dateExpiration) : 'N/A'}</TableCell><TableCell><Chip label={item.severity === 'critical' ? 'Critique' : 'Attention'} size="small" color={getSeverityColor(item.severity)} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
