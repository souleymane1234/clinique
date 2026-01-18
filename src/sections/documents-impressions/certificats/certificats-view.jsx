import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment, IconButton } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

export default function CertificatsView() {
  const { contextHolder, showError } = useNotification();
  const [certificats, setCertificats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadCertificats = useCallback(async () => {
    setLoading(true);
    try {
      const mockCertificats = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        numero: `CERT-${String(i + 1).padStart(6, '0')}`,
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        type: ['arret-travail', 'visite-medicale', 'aptitude', 'deces'][Math.floor(Math.random() * 4)],
        medecin: `Dr. ${['Martin', 'Dubois', 'Bernard'][Math.floor(Math.random() * 3)]}`,
      }));

      let filtered = mockCertificats;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((c) => c.numero.toLowerCase().includes(searchLower) || c.patientName.toLowerCase().includes(searchLower));
      }
      if (typeFilter) {
        filtered = filtered.filter((c) => c.type === typeFilter);
      }

      setCertificats(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les certificats');
      setCertificats([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadCertificats();
  }, [page, rowsPerPage, search, typeFilter]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'arret-travail': return 'Arrêt de travail';
      case 'visite-medicale': return 'Visite médicale';
      case 'aptitude': return 'Certificat d\'aptitude';
      case 'deces': return 'Certificat de décès';
      default: return type;
    }
  };

  const handlePrint = (item) => {
    window.print();
  };

  return (
    <>
      <Helmet><title> Certificats médicaux | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Certificats médicaux</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer et imprimer les certificats médicaux</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 200 }} SelectProps={{ native: true }}>
              <option value="">Tous</option><option value="arret-travail">Arrêt de travail</option><option value="visite-medicale">Visite médicale</option><option value="aptitude">Certificat d&apos;aptitude</option><option value="deces">Certificat de décès</option>
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
                    <TableCell>Médecin</TableCell>
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
                    if (certificats.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            Aucun certificat trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return certificats.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{item.numero}</TableCell>
                        <TableCell>{fDate(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{getTypeLabel(item.type)}</TableCell>
                        <TableCell>{item.medecin}</TableCell>
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
