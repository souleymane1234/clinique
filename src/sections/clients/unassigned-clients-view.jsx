import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  Button,
  Dialog,
  Select,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  lead: 'info',
  prospect: 'warning',
  client: 'success',
  archived: 'default',
};

export default function UnassignedClientsView() {
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [commerciaux, setCommerciaux] = useState([]);
  const [loadingCommerciaux, setLoadingCommerciaux] = useState(false);

  // Dialog pour assigner un client
  const [assignDialog, setAssignDialog] = useState({
    open: false,
    loading: false,
    client: null,
    commercialId: '',
  });

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getUnassignedClients();
      const processed = showApiResponse(result, {
        successTitle: 'Clients chargés',
        errorTitle: 'Erreur de chargement',
      });

      if (processed.success) {
        setClients(Array.isArray(processed.data) ? processed.data : []);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error loading unassigned clients:', error);
      showError('Erreur', 'Impossible de charger les clients non assignés');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCommerciaux = useCallback(async () => {
    setLoadingCommerciaux(true);
    try {
      // Obtenir tous les utilisateurs et filtrer par service "Commercial"
      const result = await ConsumApi.getUsers();
      if (result.success && Array.isArray(result.data)) {
        // Filtrer commerciaux + admins (rôle ou service)
        const commerciauxList = result.data
          .filter((user) => {
            const service = (user.service || '').trim().toLowerCase();
            const role = (user.role || '').trim().toUpperCase();
            return (
              service === 'commercial' ||
              service === 'commerciale' ||
              service.includes('commercial') ||
              service.includes('admin') ||
              role.startsWith('ADMIN') ||
              role === 'SUPERADMIN'
            );
          })
          .map((commercial) => {
            const firstName = commercial.firstname || commercial.firstName || '';
            const lastName = commercial.lastname || commercial.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();

            return {
              id: commercial.id,
              name: fullName || commercial.email || commercial.id,
              email: commercial.email || null,
              firstname: firstName,
              lastname: lastName,
            };
          });
        setCommerciaux(commerciauxList);
      } else {
        setCommerciaux([]);
      }
    } catch (error) {
      console.error('Error loading commerciaux:', error);
      setCommerciaux([]);
    } finally {
      setLoadingCommerciaux(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
    loadCommerciaux();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAssignDialog = (client) => {
    setAssignDialog({
      open: true,
      loading: false,
      client,
      commercialId: '',
    });
  };

  const handleCloseAssignDialog = () => {
    setAssignDialog({
      open: false,
      loading: false,
      client: null,
      commercialId: '',
    });
  };

  const handleAssignClient = async () => {
    if (!assignDialog.commercialId.trim()) {
      showError('Erreur', 'Veuillez sélectionner un commercial');
      return;
    }

    if (!assignDialog.client) {
      showError('Erreur', 'Client introuvable');
      return;
    }

    setAssignDialog({ ...assignDialog, loading: true });
    try {
      const result = await ConsumApi.assignClient(assignDialog.client.id, assignDialog.commercialId);
      const processed = showApiResponse(result, {
        successTitle: 'Client assigné',
        errorTitle: 'Erreur',
      });

      if (processed.success) {
        showSuccess('Succès', 'Client assigné avec succès');
        handleCloseAssignDialog();
        loadClients(); // Recharger la liste des clients non assignés
      } else {
        setAssignDialog({ ...assignDialog, loading: false });
      }
    } catch (error) {
      console.error('Error assigning client:', error);
      showError('Erreur', 'Impossible d\'assigner le client');
      setAssignDialog({ ...assignDialog, loading: false });
    }
  };

  // Pagination
  const paginatedClients = clients.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Clients non assignés | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Box>
            <Typography variant="h4">Clients non assignés</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Liste des clients qui ne sont pas encore assignés à un commercial
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={() => router.push('/clients')}
          >
            Retour aux clients
          </Button>
        </Stack>

        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date de création</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && paginatedClients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Iconify icon="solar:user-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          Aucun client non assigné trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && paginatedClients.length > 0 && paginatedClients.map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{client.nom}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{client.numero}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{client.email || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{client.service || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={client.status || 'lead'}
                            color={STATUS_COLORS[client.status] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {client.createdAt ? fDate(client.createdAt) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Iconify icon="eva:person-add-fill" />}
                            onClick={() => handleOpenAssignDialog(client)}
                          >
                            Assigner
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePagination
            page={page}
            component="div"
            count={clients.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </Card>

        {/* Dialog pour assigner un client */}
        <Dialog open={assignDialog.open} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Assigner le client {assignDialog.client?.nom}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Commercial *</InputLabel>
                <Select
                  value={assignDialog.commercialId}
                  label="Commercial *"
                  onChange={(e) =>
                    setAssignDialog({
                      ...assignDialog,
                      commercialId: e.target.value,
                    })
                  }
                  disabled={loadingCommerciaux}
                >
                  {commerciaux.length === 0 ? (
                    <MenuItem disabled>
                      {loadingCommerciaux ? 'Chargement...' : 'Aucun commercial disponible'}
                    </MenuItem>
                  ) : (
                    commerciaux.map((commercial) => (
                      <MenuItem key={commercial.id} value={commercial.id}>
                        {commercial.name}
                        {commercial.email && (
                          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                            ({commercial.email})
                          </Typography>
                        )}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              {assignDialog.client && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Informations du client:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nom:</strong> {assignDialog.client.nom}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Numéro:</strong> {assignDialog.client.numero}
                  </Typography>
                  {assignDialog.client.email && (
                    <Typography variant="body2">
                      <strong>Email:</strong> {assignDialog.client.email}
                    </Typography>
                  )}
                  {assignDialog.client.service && (
                    <Typography variant="body2">
                      <strong>Service:</strong> {assignDialog.client.service}
                    </Typography>
                  )}
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssignDialog} disabled={assignDialog.loading}>
              Annuler
            </Button>
            <LoadingButton
              onClick={handleAssignClient}
              variant="contained"
              loading={assignDialog.loading}
              disabled={!assignDialog.commercialId}
            >
              Assigner
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

