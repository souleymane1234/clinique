import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Button,
  Avatar,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  IconButton,
  TableContainer,
  TablePagination,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  active: 'success',
  suspended: 'error',
};

const CLIENT_STATUS_COLORS = {
  lead: 'info',
  prospect: 'warning',
  client: 'success',
  archived: 'default',
};

export default function CommercialDetailsView() {
  const { id: commercialId } = useParams();
  const router = useRouter();
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [commercial, setCommercial] = useState(null);
  const [clients, setClients] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadCommercialData = useCallback(async () => {
    setLoading(true);
    try {
      const [commercialResult, clientsResult] = await Promise.all([
        ConsumApi.getUserById(commercialId),
        ConsumApi.getClientsAssignedToUser(commercialId),
      ]);

      const processedCommercial = showApiResponse(commercialResult, {
        successTitle: 'Commercial chargé',
        errorTitle: 'Erreur de chargement',
      });

      if (processedCommercial.success) {
        setCommercial(processedCommercial.data);
      }

      const processedClients = showApiResponse(clientsResult, {
        successTitle: 'Clients chargés',
        errorTitle: 'Erreur de chargement',
      });

      if (processedClients.success) {
        setClients(Array.isArray(processedClients.data) ? processedClients.data : []);
      }
    } catch (error) {
      console.error('Error loading commercial data:', error);
      showError('Erreur', 'Impossible de charger les données du commercial');
    } finally {
      setLoading(false);
    }
  }, [commercialId]);

  useEffect(() => {
    loadCommercialData();
  }, [loadCommercialData]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getInitials = (firstname, lastname) => {
    const first = firstname ? firstname.charAt(0).toUpperCase() : '';
    const last = lastname ? lastname.charAt(0).toUpperCase() : '';
    return `${first}${last}` || '?';
  };

  const getFullName = (commercialItem) => {
    if (!commercialItem) return 'Commercial';
    const firstname = commercialItem.firstname || commercialItem.firstName || '';
    const lastname = commercialItem.lastname || commercialItem.lastName || '';
    const fullName = `${firstname} ${lastname}`.trim();
    return fullName || commercialItem.email || 'Commercial';
  };

  // Pagination
  const paginatedClients = clients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Container>
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Chargement...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!commercial) {
    return (
      <Container>
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Commercial non trouvé
          </Typography>
          <Button sx={{ mt: 2 }} onClick={() => router.push(routesName.commerciaux)}>
            Retour à la liste
          </Button>
        </Box>
      </Container>
    );
  }

  const fullName = getFullName(commercial);
  const initials = getInitials(commercial.firstname || commercial.firstName, commercial.lastname || commercial.lastName);

  return (
    <>
      {contextHolder}
      <Container>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <IconButton onClick={() => router.push(routesName.commerciaux)}>
            <Iconify icon="eva:arrow-back-fill" />
          </IconButton>
          <Box>
            <Typography variant="h4">Détails du Commercial</Typography>
            <Typography variant="body2" color="text.secondary">
              Informations complètes et clients assignés
            </Typography>
          </Box>
        </Stack>

        {/* Informations du commercial */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={3} mb={3}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5">{fullName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {commercial.email}
              </Typography>
            </Box>
            <Chip
              label={commercial.status === 'suspended' ? 'Suspendu' : 'Actif'}
              color={STATUS_COLORS[commercial.status] || 'default'}
              size="medium"
            />
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Prénom
                  </Typography>
                  <Typography variant="body1">{commercial.firstname || commercial.firstName || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Nom
                  </Typography>
                  <Typography variant="body1">{commercial.lastname || commercial.lastName || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{commercial.email || '-'}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Téléphone
                  </Typography>
                  <Typography variant="body1">
                    {commercial.telephone || commercial.phoneNumber || commercial.phone || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Service
                  </Typography>
                  <Typography variant="body1">{commercial.service || 'commercial'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date de création
                  </Typography>
                  <Typography variant="body1">
                    {commercial.createdAt ? fDate(commercial.createdAt) : '-'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Card>

        {/* Tableau des clients assignés */}
        <Card>
          <Box sx={{ p: 3, pb: 0 }}>
            <Typography variant="h6" gutterBottom>
              Clients assignés ({clients.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Liste de tous les clients assignés à ce commercial
            </Typography>
          </Box>

          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client</TableCell>
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
                          Aucun client assigné
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && paginatedClients.length > 0 && paginatedClients.map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{client.nom || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{client.numero || '-'}</Typography>
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
                            color={CLIENT_STATUS_COLORS[client.status] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {client.createdAt ? fDate(client.createdAt) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => router.push(routesName.clientDetails.replace(':id', client.id))}
                          >
                            <Iconify icon="eva:eye-fill" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          {clients.length > 0 && (
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
          )}
        </Card>
      </Container>
    </>
  );
}















