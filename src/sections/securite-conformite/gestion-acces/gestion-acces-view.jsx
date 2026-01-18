import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  IconButton,
  InputAdornment,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function GestionAccesView() {
  const { contextHolder, showError } = useNotification();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const mockRoles = [
        { id: 1, nom: 'ADMIN', description: 'Administrateur système', permissions: 50, utilisateurs: 3 },
        { id: 2, nom: 'MEDECIN', description: 'Médecin', permissions: 35, utilisateurs: 12 },
        { id: 3, nom: 'INFIRMIER', description: 'Infirmier', permissions: 28, utilisateurs: 25 },
        { id: 4, nom: 'SECRETAIRE', description: 'Secrétaire médicale', permissions: 20, utilisateurs: 8 },
        { id: 5, nom: 'PHARMACIE', description: 'Pharmacien', permissions: 18, utilisateurs: 4 },
        { id: 6, nom: 'LABORATOIRE', description: 'Laborantin', permissions: 15, utilisateurs: 6 },
      ];

      let filtered = mockRoles;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((r) => r.nom.toLowerCase().includes(searchLower) || r.description.toLowerCase().includes(searchLower));
      }

      setRoles(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les rôles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [search, showError]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleEdit = (role) => {
    // TODO: Ouvrir un dialogue pour éditer les permissions
  };

  return (
    <>
      <Helmet><title> Gestion des accès par rôle | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Gestion des accès par rôle</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Configurer les permissions et accès par rôle d&apos;utilisateur</Typography></Box>
        <Card sx={{ p: 3 }}>
          <TextField fullWidth placeholder="Rechercher un rôle..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Utilisateurs</TableCell>
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
                    if (roles.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            Aucun rôle trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return roles.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} hover>
                        <TableCell><Chip label={item.nom} color="primary" size="small" /></TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.permissions}</TableCell>
                        <TableCell>{item.utilisateurs}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Modifier les permissions">
                            <IconButton color="primary" onClick={() => handleEdit(item)}>
                              <Iconify icon="solar:pen-bold" />
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
