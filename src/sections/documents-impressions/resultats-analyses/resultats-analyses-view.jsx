import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment, IconButton } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

export default function ResultatsAnalysesView() {
  const { contextHolder, showError } = useNotification();
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadResultats = useCallback(async () => {
    setLoading(true);
    try {
      const mockResultats = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        numero: `RES-${String(i + 1).padStart(6, '0')}`,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        type: ['sang', 'urine', 'imagerie', 'bacteriologie'][Math.floor(Math.random() * 4)],
        statut: ['valide', 'en-attente', 'annule'][Math.floor(Math.random() * 3)],
        laborantin: `Lab. ${['Martin', 'Dubois'][Math.floor(Math.random() * 2)]}`,
      }));

      let filtered = mockResultats;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((r) => r.numero.toLowerCase().includes(searchLower) || r.patientName.toLowerCase().includes(searchLower));
      }
      if (typeFilter) {
        filtered = filtered.filter((r) => r.type === typeFilter);
      }

      setResultats(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les résultats');
      setResultats([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadResultats();
  }, [page, rowsPerPage, search, typeFilter]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'sang': return 'Analyse de sang';
      case 'urine': return 'Analyse d\'urine';
      case 'imagerie': return 'Imagerie';
      case 'bacteriologie': return 'Bactériologie';
      default: return type;
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'valide': return 'success';
      case 'en-attente': return 'warning';
      case 'annule': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'valide': return 'Validé';
      case 'en-attente': return 'En attente';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  const handlePrint = (item) => {
    window.print();
  };

  return (
    <>
      <Helmet><title> Résultats d&apos;analyses | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Résultats d&apos;analyses</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter et imprimer les résultats d&apos;analyses</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 200 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="sang">Analyse de sang</option><option value="urine">Analyse d&apos;urine</option><option value="imagerie">Imagerie</option><option value="bacteriologie">Bactériologie</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Laborantin</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (resultats.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            Aucun résultat trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return resultats.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{item.numero}</TableCell>
                        <TableCell>{fDate(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{getTypeLabel(item.type)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.statut)}
                            size="small"
                            color={getStatusColor(item.statut)}
                          />
                        </TableCell>
                        <TableCell>{item.laborantin}</TableCell>
                        <TableCell align="right">
                          <IconButton color="primary" onClick={() => handlePrint(item)}>
                            <Iconify icon="solar:printer-bold" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
