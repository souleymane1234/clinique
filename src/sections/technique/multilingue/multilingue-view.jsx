import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  TextField,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  TablePagination,
  InputAdornment,
  Switch,
} from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function MultilingueView() {
  const { contextHolder, showSuccess, showError } = useNotification();
  const [langues, setLangues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadLangues = useCallback(async () => {
    setLoading(true);
    try {
      const mockLangues = [
        { id: 1, code: 'fr', nom: 'Français', active: true, completion: 100 },
        { id: 2, code: 'en', nom: 'Anglais', active: true, completion: 95 },
        { id: 3, code: 'es', nom: 'Espagnol', active: false, completion: 60 },
        { id: 4, code: 'de', nom: 'Allemand', active: false, completion: 45 },
      ];

      let filtered = mockLangues;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((l) => l.nom.toLowerCase().includes(searchLower) || l.code.toLowerCase().includes(searchLower));
      }

      setLangues(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les langues');
      setLangues([]);
    } finally {
      setLoading(false);
    }
  }, [search, showError]);

  useEffect(() => {
    loadLangues();
  }, [loadLangues]);

  const handleToggleLangue = async (langueId) => {
    setLangues((prev) => prev.map((l) => (l.id === langueId ? { ...l, active: !l.active } : l)));
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      showSuccess('Succès', 'Langue mise à jour avec succès');
    } catch (error) {
      showError('Erreur', 'Impossible de mettre à jour la langue');
    }
  };

  return (
    <>
      <Helmet><title> Multilingue | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Multilingue</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les langues disponibles dans l&apos;application</Typography></Box>
        <Card sx={{ p: 3 }}>
          <TextField fullWidth placeholder="Rechercher une langue..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Langue</TableCell>
                    <TableCell>Complétion</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (langues.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            Aucune langue trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return langues.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell><Chip label={item.code.toUpperCase()} size="small" color="primary" /></TableCell>
                        <TableCell>{item.nom}</TableCell>
                        <TableCell><Typography variant="body2">{item.completion}%</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={item.active ? 'Active' : 'Inactive'}
                            size="small"
                            color={item.active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Switch checked={item.active} onChange={() => handleToggleLangue(item.id)} />
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
