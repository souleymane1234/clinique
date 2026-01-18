import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function ManagerStatistiquesView() {
  const { contextHolder, showError } = useNotification();
  const [statistiques, setStatistiques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState('');

  const loadStatistiques = useCallback(async () => {
    setLoading(true);
    try {
      const mockStats = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        type: ['medical', 'financier'][Math.floor(Math.random() * 2)],
        libelle: ['Consultations', 'Hospitalisations', 'Recettes', 'Dépenses', 'Patients actifs'][Math.floor(Math.random() * 5)],
        valeur: (Math.random() * 10000).toFixed(2),
        periode: 'Dernier mois',
        evolution: Math.random() > 0.5 ? 'up' : 'down',
      }));

      let filtered = mockStats;
      if (typeFilter) {
        filtered = filtered.filter((s) => s.type === typeFilter);
      }

      setStatistiques(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les statistiques');
      setStatistiques([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, typeFilter]);

  useEffect(() => {
    loadStatistiques();
  }, [page, rowsPerPage, typeFilter]);

  const getTypeLabel = (type) => (type === 'medical' ? 'Médical' : 'Financier');
  const getTypeColor = (type) => (type === 'medical' ? 'primary' : 'success');

  return (
    <>
      <Helmet><title> Statistiques Médicales et Financières | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Statistiques Médicales et Financières</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter les statistiques médicales et financières</Typography></Box>
        <Card sx={{ p: 3 }}>
          <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
            <option value="">Tous</option><option value="medical">Médical</option><option value="financier">Financier</option>
          </TextField>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Type</TableCell><TableCell>Libellé</TableCell><TableCell>Valeur</TableCell><TableCell>Période</TableCell><TableCell>Évolution</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (statistiques.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucune statistique trouvée</TableCell></TableRow>; return statistiques.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell><Chip label={getTypeLabel(item.type)} size="small" color={getTypeColor(item.type)} /></TableCell><TableCell>{item.libelle}</TableCell><TableCell>{item.valeur}</TableCell><TableCell>{item.periode}</TableCell><TableCell><Chip label={item.evolution === 'up' ? '↑' : '↓'} size="small" color={item.evolution === 'up' ? 'success' : 'error'} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
