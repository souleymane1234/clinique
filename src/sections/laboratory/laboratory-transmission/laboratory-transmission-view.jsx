import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function LaboratoryTransmissionView() {
  const { contextHolder } = useNotification();
  const [transmissions, setTransmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadTransmissions = useCallback(async () => {
    setLoading(true);
    try {
      const mockTransmissions = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        analyse: ['Hémogramme', 'Glycémie'][Math.floor(Math.random() * 2)],
        destinataire: `Dr. ${['Martin', 'Dubois'][Math.floor(Math.random() * 2)]}`,
        status: Math.random() > 0.3 ? 'transmitted' : 'failed',
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        setTransmissions(mockTransmissions.filter((t) => t.patientName.toLowerCase().includes(searchLower)));
      } else {
        setTransmissions(mockTransmissions);
      }
    } catch (error) {
      setTransmissions([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadTransmissions();
  }, [page, rowsPerPage, search]);

  return (
    <>
      <Helmet><title> Transmission Automatique | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Transmission Automatique</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Historique des transmissions automatiques de résultats</Typography></Box>
        <Card sx={{ p: 3 }}>
          <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Analyse</TableCell><TableCell>Destinataire</TableCell><TableCell>Statut</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (transmissions.length === 0) return <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucune transmission trouvée</TableCell></TableRow>; return transmissions.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.analyse}</TableCell><TableCell>{item.destinataire}</TableCell><TableCell><Chip label={item.status === 'transmitted' ? 'Transmis' : 'Échec'} size="small" color={item.status === 'transmitted' ? 'success' : 'error'} /></TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
