import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Card,
  Chip,
  Table,
  Stack,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  TablePagination,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function SauvegardesView() {
  const { contextHolder, showSuccess, showError } = useNotification();
  const [sauvegardes, setSauvegardes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');

  const loadSauvegardes = useCallback(async () => {
    setLoading(true);
    try {
      const mockSauvegardes = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['automatique', 'manuelle'][Math.floor(Math.random() * 2)],
        taille: `${(Math.random() * 5 + 1).toFixed(2)} GB`,
        statut: Math.random() > 0.1 ? 'reussi' : 'echec',
      }));

      setSauvegardes(mockSauvegardes);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les sauvegardes');
      setSauvegardes([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadSauvegardes();
  }, [loadSauvegardes]);

  const getStatusColor = (statut) => (statut === 'reussi' ? 'success' : 'error');

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccess('Succès', 'Paramètres de sauvegarde mis à jour avec succès');
    } catch (error) {
      showError('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title> Sauvegardes automatiques | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Sauvegardes automatiques</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Gérer les sauvegardes automatiques et manuelles</Typography></Box>
        <Alert severity="info">Les sauvegardes automatiques sont essentielles pour la sécurité des données.</Alert>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <FormControlLabel control={<Switch checked={autoBackup} onChange={(e) => setAutoBackup(e.target.checked)} />} label="Activer les sauvegardes automatiques" />
            <FormControl fullWidth>
              <InputLabel>Fréquence des sauvegardes</InputLabel>
              <Select value={backupFrequency} label="Fréquence des sauvegardes" onChange={(e) => setBackupFrequency(e.target.value)}>
                <MenuItem value="hourly">Chaque heure</MenuItem>
                <MenuItem value="daily">Quotidienne</MenuItem>
                <MenuItem value="weekly">Hebdomadaire</MenuItem>
                <MenuItem value="monthly">Mensuelle</MenuItem>
              </Select>
            </FormControl>
            <LoadingButton variant="contained" size="large" loading={loading} onClick={handleSaveSettings} startIcon={<Iconify icon="solar:diskette-bold" />}>Enregistrer les paramètres</LoadingButton>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date/Heure</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Taille</TableCell>
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
                    if (sauvegardes.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            Aucune sauvegarde trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return sauvegardes.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell><Chip label={item.type} size="small" color="primary" /></TableCell>
                        <TableCell>{item.taille}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.statut === 'reussi' ? 'Réussi' : 'Échec'}
                            size="small"
                            color={getStatusColor(item.statut)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton color="primary">
                            <Iconify icon="solar:download-bold" />
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
