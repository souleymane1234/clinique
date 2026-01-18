import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import Iconify from 'src/components/iconify';
import { fDateTime } from 'src/utils/format-time';
import Scrollbar from 'src/components/scrollbar';

export default function TraçabiliteView() {
  const { contextHolder, showError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const actions = ['connexion', 'deconnexion', 'lecture', 'modification', 'suppression', 'export'];
      const mockLogs = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        utilisateur: `User ${Math.floor(Math.random() * 20) + 1}`,
        role: ['ADMIN', 'MEDECIN', 'INFIRMIER', 'SECRETAIRE'][Math.floor(Math.random() * 4)],
        action: actions[Math.floor(Math.random() * actions.length)],
        ressource: ['Dossier patient', 'Consultation', 'Facture', 'Prescription', 'Résultat analyse'][Math.floor(Math.random() * 5)],
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        statut: Math.random() > 0.1 ? 'reussi' : 'echec',
      }));

      let filtered = mockLogs;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((l) => l.utilisateur.toLowerCase().includes(searchLower) || l.ressource.toLowerCase().includes(searchLower) || l.ip.includes(search));
      }
      if (actionFilter) {
        filtered = filtered.filter((l) => l.action === actionFilter);
      }

      setLogs(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, showError]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionLabel = (action) => {
    switch (action) {
      case 'connexion': return 'Connexion';
      case 'deconnexion': return 'Déconnexion';
      case 'lecture': return 'Lecture';
      case 'modification': return 'Modification';
      case 'suppression': return 'Suppression';
      case 'export': return 'Export';
      default: return action;
    }
  };

  const getStatusColor = (statut) => (statut === 'reussi' ? 'success' : 'error');

  return (
    <>
      <Helmet><title> Traçabilité des accès | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Traçabilité des accès</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter l&apos;historique des accès et actions utilisateurs</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Action</InputLabel>
              <Select value={actionFilter} label="Action" onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="connexion">Connexion</MenuItem>
                <MenuItem value="deconnexion">Déconnexion</MenuItem>
                <MenuItem value="lecture">Lecture</MenuItem>
                <MenuItem value="modification">Modification</MenuItem>
                <MenuItem value="suppression">Suppression</MenuItem>
                <MenuItem value="export">Export</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date/Heure</TableCell>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Ressource</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Statut</TableCell>
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
                    if (logs.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            Aucun log trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return logs.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.utilisateur}</TableCell>
                        <TableCell><Chip label={item.role} size="small" color="primary" /></TableCell>
                        <TableCell>{getActionLabel(item.action)}</TableCell>
                        <TableCell>{item.ressource}</TableCell>
                        <TableCell>{item.ip}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.statut === 'reussi' ? 'Réussi' : 'Échec'}
                            size="small"
                            color={getStatusColor(item.statut)}
                          />
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
