import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function PharmacyFournisseursView() {
  const { contextHolder, showError } = useNotification();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadFournisseurs = useCallback(async () => {
    setLoading(true);
    try {
      const mockFournisseurs = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        nom: [`Fournisseur ${i + 1}`, 'Pharma Plus', 'MediSupply', 'HealthCare Dist'][Math.floor(Math.random() * 4)],
        contact: `contact${i + 1}@example.com`,
        telephone: `+33 ${Math.floor(Math.random() * 90000000) + 10000000}`,
        adresse: `Rue ${i + 1}, Ville ${i + 1}`,
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        setFournisseurs(mockFournisseurs.filter((f) => f.nom.toLowerCase().includes(searchLower)));
      } else {
        setFournisseurs(mockFournisseurs);
      }
    } catch (error) {
      showError('Erreur', 'Impossible de charger les fournisseurs');
      setFournisseurs([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadFournisseurs();
  }, [page, rowsPerPage, search]);

  return (
    <>
      <Helmet><title> Gestion Fournisseurs | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Gestion Fournisseurs</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les fournisseurs de médicaments</Typography></Box>
        <Card sx={{ p: 3 }}><TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} /></Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Nom</TableCell><TableCell>Contact</TableCell><TableCell>Téléphone</TableCell><TableCell>Adresse</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (fournisseurs.length === 0) return <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>Aucun fournisseur trouvé</TableCell></TableRow>; return fournisseurs.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{item.nom}</TableCell><TableCell>{item.contact}</TableCell><TableCell>{item.telephone}</TableCell><TableCell>{item.adresse}</TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
