import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function PharmacyEntreesSortiesView() {
  const { contextHolder, showError } = useNotification();
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadMouvements = useCallback(async () => {
    setLoading(true);
    try {
      const mockMouvements = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        medicament: ['Paracétamol 500mg', 'Ibuprofène 400mg', 'Aspirine 100mg'][Math.floor(Math.random() * 3)],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: Math.random() > 0.5 ? 'entree' : 'sortie',
        quantite: Math.floor(Math.random() * 100) + 1,
        responsable: `Pharm. ${['Martin', 'Bernard'][Math.floor(Math.random() * 2)]}`,
      }));

      let filtered = mockMouvements;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((m) => m.medicament.toLowerCase().includes(searchLower));
      }
      if (typeFilter) {
        filtered = filtered.filter((m) => m.type === typeFilter);
      }

      setMouvements(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les mouvements');
      setMouvements([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadMouvements();
  }, [page, rowsPerPage, search, typeFilter]);

  return (
    <>
      <Helmet><title> Entrées / Sorties | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Entrées / Sorties</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Suivre les entrées et sorties de médicaments</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="entree">Entrée</option><option value="sortie">Sortie</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Médicament</TableCell><TableCell>Type</TableCell><TableCell>Quantité</TableCell><TableCell>Responsable</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (mouvements.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucun mouvement trouvé</TableCell></TableRow>; return mouvements.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.medicament}</TableCell><TableCell><Chip label={item.type === 'entree' ? 'Entrée' : 'Sortie'} size="small" color={item.type === 'entree' ? 'success' : 'warning'} /></TableCell><TableCell>{item.quantite}</TableCell><TableCell>{item.responsable}</TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
