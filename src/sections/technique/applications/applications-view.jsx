import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

export default function ApplicationsView() {
  const { contextHolder, showError } = useNotification();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const mockApplications = [
        { id: 1, nom: 'Application Web', type: 'Web', version: '1.2.0', statut: 'actif', derniereMaj: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 2, nom: 'Application Mobile iOS', type: 'iOS', version: '1.1.5', statut: 'actif', derniereMaj: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 3, nom: 'Application Mobile Android', type: 'Android', version: '1.1.5', statut: 'actif', derniereMaj: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 4, nom: 'API Gateway', type: 'API', version: '2.0.1', statut: 'actif', derniereMaj: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      let filtered = mockApplications;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((a) => a.nom.toLowerCase().includes(searchLower) || a.type.toLowerCase().includes(searchLower));
      }

      setApplications(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [search, showError]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const getStatusColor = (statut) => (statut === 'actif' ? 'success' : 'default');

  return (
    <>
      <Helmet><title> Application web et mobile | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Application web et mobile</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les applications web et mobiles</Typography></Box>
        <Card sx={{ p: 3 }}>
          <TextField fullWidth placeholder="Rechercher une application..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Application</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Dernière mise à jour</TableCell>
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
                    if (applications.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            Aucune application trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return applications.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{item.nom}</TableCell>
                        <TableCell><Chip label={item.type} size="small" color="primary" /></TableCell>
                        <TableCell>{item.version}</TableCell>
                        <TableCell><Chip label={item.statut} size="small" color={getStatusColor(item.statut)} /></TableCell>
                        <TableCell>{fDate(item.derniereMaj)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Voir les détails">
                            <IconButton color="primary">
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </Tooltip>
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
