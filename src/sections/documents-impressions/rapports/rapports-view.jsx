import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment, IconButton } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

export default function RapportsView() {
  const { contextHolder, showError } = useNotification();
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
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        numero: `RAP-${String(i + 1).padStart(6, '0')}`,
        type: ['mensuel', 'annuel', 'activite', 'statistiques'][Math.floor(Math.random() * 4)],
        titre: ['Rapport mensuel', 'Rapport annuel', 'Rapport d\'activité', 'Rapport statistiques'][Math.floor(Math.random() * 4)],
        auteur: `User ${['Martin', 'Dubois', 'Bernard'][Math.floor(Math.random() * 3)]}`,
      }));

      let filtered = mockRapports;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((r) => r.numero.toLowerCase().includes(searchLower) || r.titre.toLowerCase().includes(searchLower));
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

  const getTypeLabel = (type) => {
    switch (type) {
      case 'mensuel': return 'Mensuel';
      case 'annuel': return 'Annuel';
      case 'activite': return 'Activité';
      case 'statistiques': return 'Statistiques';
      default: return type;
    }
  };

  const handlePrint = (item) => {
    window.print();
  };

  return (
    <>
      <Helmet><title> Rapports | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Rapports</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter et imprimer les rapports</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 200 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="mensuel">Mensuel</option><option value="annuel">Annuel</option><option value="activite">Activité</option><option value="statistiques">Statistiques</option>
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
                    <TableCell>Titre</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Auteur</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (rapports.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            Aucun rapport trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return rapports.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{item.numero}</TableCell>
                        <TableCell>{fDate(item.date)}</TableCell>
                        <TableCell>{item.titre}</TableCell>
                        <TableCell>
                          <Chip label={getTypeLabel(item.type)} size="small" color="primary" />
                        </TableCell>
                        <TableCell>{item.auteur}</TableCell>
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
