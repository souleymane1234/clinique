import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment, IconButton } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

export default function FacturesView() {
  const { contextHolder, showError } = useNotification();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadFactures = useCallback(async () => {
    setLoading(true);
    try {
      const mockFactures = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        numero: `FAC-${String(i + 1).padStart(6, '0')}`,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        montant: Math.floor(Math.random() * 50000) + 5000,
        statut: ['payee', 'impayee', 'partielle'][Math.floor(Math.random() * 3)],
      }));

      let filtered = mockFactures;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((f) => f.numero.toLowerCase().includes(searchLower) || f.patientName.toLowerCase().includes(searchLower));
      }
      if (statusFilter) {
        filtered = filtered.filter((f) => f.statut === statusFilter);
      }

      setFactures(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les factures');
      setFactures([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    loadFactures();
  }, [page, rowsPerPage, search, statusFilter]);

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'payee': return 'success';
      case 'impayee': return 'error';
      case 'partielle': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'payee': return 'Payée';
      case 'impayee': return 'Impayée';
      case 'partielle': return 'Partielle';
      default: return statut;
    }
  };

  const handlePrint = (item) => {
    window.print();
  };

  return (
    <>
      <Helmet><title> Factures | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Factures</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter et imprimer les factures</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Statut" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="payee">Payée</option><option value="impayee">Impayée</option><option value="partielle">Partielle</option>
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
                    <TableCell>Montant</TableCell>
                    <TableCell>Statut</TableCell>
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
                    if (factures.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            Aucune facture trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return factures.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{item.numero}</TableCell>
                        <TableCell>{fDate(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{fCurrency(item.montant)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.statut)}
                            size="small"
                            color={getStatusColor(item.statut)}
                          />
                        </TableCell>
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
