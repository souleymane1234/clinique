import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

export default function PharmacyInventaireView() {
  const { contextHolder, showError } = useNotification();
  const [inventaire, setInventaire] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadInventaire = useCallback(async () => {
    setLoading(true);
    try {
      const mockInventaire = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        medicament: ['Paracétamol 500mg', 'Ibuprofène 400mg', 'Aspirine 100mg', 'Amoxicilline 250mg'][Math.floor(Math.random() * 4)],
        quantiteReelle: Math.floor(Math.random() * 500),
        quantiteTheorique: Math.floor(Math.random() * 500),
        ecart: Math.floor(Math.random() * 50) - 25,
        dateInventaire: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        setInventaire(mockInventaire.filter((inv) => inv.medicament.toLowerCase().includes(searchLower)));
      } else {
        setInventaire(mockInventaire);
      }
    } catch (error) {
      showError('Erreur', 'Impossible de charger l\'inventaire');
      setInventaire([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadInventaire();
  }, [page, rowsPerPage, search]);

  return (
    <>
      <Helmet><title> Inventaire | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Inventaire</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les inventaires de la pharmacie</Typography></Box>
        <Card sx={{ p: 3 }}><TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} /></Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Médicament</TableCell><TableCell>Quantité réelle</TableCell><TableCell>Quantité théorique</TableCell><TableCell>Écart</TableCell><TableCell>Date inventaire</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (inventaire.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucun inventaire trouvé</TableCell></TableRow>; return inventaire.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{item.medicament}</TableCell><TableCell>{item.quantiteReelle}</TableCell><TableCell>{item.quantiteTheorique}</TableCell><TableCell>{item.ecart}</TableCell><TableCell>{fDate(item.dateInventaire)}</TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
