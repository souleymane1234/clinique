import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function ManagerPerformancesView() {
  const { contextHolder, showError } = useNotification();
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadPerformances = useCallback(async () => {
    setLoading(true);
    try {
      const mockPerformances = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        service: ['Consultation', 'Urgences', 'Laboratoire', 'Pharmacie'][Math.floor(Math.random() * 4)],
        indicateur: ['Taux de satisfaction', 'Temps d\'attente', 'Nombre de patients', 'Efficacité'][Math.floor(Math.random() * 4)],
        valeur: (Math.random() * 100).toFixed(1),
        unite: '%',
        objectif: '90%',
        statut: Math.random() > 0.5 ? 'attaint' : 'non_attaint',
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        setPerformances(mockPerformances.filter((p) => p.service.toLowerCase().includes(searchLower) || p.indicateur.toLowerCase().includes(searchLower)));
      } else {
        setPerformances(mockPerformances);
      }
    } catch (error) {
      showError('Erreur', 'Impossible de charger les performances');
      setPerformances([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadPerformances();
  }, [page, rowsPerPage, search]);

  return (
    <>
      <Helmet><title> Suivi des Performances | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Suivi des Performances</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Suivre les indicateurs de performance des services</Typography></Box>
        <Card sx={{ p: 3 }}><TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} /></Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Service</TableCell><TableCell>Indicateur</TableCell><TableCell>Valeur</TableCell><TableCell>Objectif</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (performances.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucune performance trouvée</TableCell></TableRow>; return performances.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{item.service}</TableCell><TableCell>{item.indicateur}</TableCell><TableCell>{item.valeur} {item.unite}</TableCell><TableCell>{item.objectif}</TableCell><TableCell><Chip label={item.statut === 'attaint' ? 'Atteint' : 'Non atteint'} size="small" color={item.statut === 'attaint' ? 'success' : 'warning'} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
