import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Table, Stack, TableRow, TextField, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function LaboratoryStatistiquesView() {
  const { contextHolder } = useNotification();
  const [statistiques, setStatistiques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadStatistiques = useCallback(async () => {
    setLoading(true);
    try {
      const mockStats = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        analyse: ['Hémogramme', 'Glycémie', 'Cholestérol', 'Créatinine', 'TSH'][Math.floor(Math.random() * 5)],
        nombre: Math.floor(Math.random() * 200) + 50,
        periode: 'Dernier mois',
        taux: `${(Math.random() * 100).toFixed(1)}%`,
      }));
      setStatistiques(mockStats);
    } catch (error) {
      setStatistiques([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    loadStatistiques();
  }, [page, rowsPerPage]);

  return (
    <>
      <Helmet><title> Statistiques | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Statistiques</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Statistiques des analyses effectuées</Typography></Box>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Analyse</TableCell><TableCell>Nombre</TableCell><TableCell>Période</TableCell><TableCell>Taux de réalisation</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (statistiques.length === 0) return <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>Aucune statistique trouvée</TableCell></TableRow>; return statistiques.map((item, index) => (<TableRow key={`${item.id}-${index}`} hover><TableCell>{item.analyse}</TableCell><TableCell>{item.nombre}</TableCell><TableCell>{item.periode}</TableCell><TableCell>{item.taux}</TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
