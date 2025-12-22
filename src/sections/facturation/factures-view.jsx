import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
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
  Divider,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  IconButton,
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
import { fNumber } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const FACTURE_STATUS_COLORS = {
  pending: 'warning',
  partial: 'info',
  paid: 'success',
  overdue: 'error',
};

const STATUS_TEXT = {
  pending: 'En attente',
  partial: 'Partiel',
  paid: 'Payé',
  overdue: 'En retard',
};

export default function FacturesView() {
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get('clientId');
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState(clientIdFromUrl || '');

  // Dialogs
  const [createDialog, setCreateDialog] = useState({
    open: false,
    loading: false,
    formData: {
      clientId: '',
      sessionId: '',
      montantTotal: '',
      dateEcheance: '',
      clientAddress: '',
      items: [{ description: '', quantity: 1, unitPrice: '' }],
    },
  });

  const loadFactures = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      // Si un client est sélectionné, charger ses factures
      if (clientFilter) {
        result = await ConsumApi.getClientFactures(clientFilter);
      } else {
        result = await ConsumApi.getFactures();
      }

      if (result.success) {
        let facturesData = Array.isArray(result.data) ? result.data : [];
        
        // ⚠️ EXCLURE les factures proforma de la liste principale des factures
        facturesData = facturesData.filter((f) => f.type !== 'proforma');
        
        // Filtrer par statut si nécessaire
        if (statusFilter) {
          facturesData = facturesData.filter((f) => f.status === statusFilter);
        }
        
        setFactures(facturesData);
      } else {
        setFactures([]);
      }
    } catch (error) {
      console.error('Error loading factures:', error);
      setFactures([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, clientFilter]);

  const loadClients = useCallback(async () => {
    try {
      const result = await ConsumApi.getClients();
      if (result.success) {
        setClients(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }, []);

  useEffect(() => {
    loadFactures();
    loadClients();
  }, [loadFactures, loadClients]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openCreateDialog = () => {
    setCreateDialog({
      open: true,
      loading: false,
      formData: {
        clientId: '',
        sessionId: '',
        montantTotal: '',
        dateEcheance: '',
        clientAddress: '',
        items: [{ description: '', quantity: 1, unitPrice: '' }],
      },
    });
  };

  const closeCreateDialog = () => {
    setCreateDialog({
      open: false,
      loading: false,
      formData: {
        clientId: '',
        sessionId: '',
        montantTotal: '',
        dateEcheance: '',
        clientAddress: '',
        items: [{ description: '', quantity: 1, unitPrice: '' }],
      },
    });
  };

  const handleCreateFacture = async () => {
    if (!createDialog.formData.clientId || !createDialog.formData.montantTotal) {
      showError('Erreur', 'Le client et le montant total sont obligatoires');
      return;
    }

    setCreateDialog({ ...createDialog, loading: true });
    try {
      const formData = {
        ...createDialog.formData,
        montantTotal: parseFloat(createDialog.formData.montantTotal),
        items: createDialog.formData.items.map((item) => ({
          ...item,
          quantity: parseInt(item.quantity, 10),
          unitPrice: parseFloat(item.unitPrice),
        })),
      };

      const result = await ConsumApi.createFacture(formData);
      const processed = showApiResponse(result, {
        successTitle: 'Facture créée',
        errorTitle: 'Erreur de création',
      });

      if (processed.success) {
        showSuccess('Succès', 'Facture créée avec succès');
        closeCreateDialog();
        loadFactures();
      }
    } catch (error) {
      console.error('Error creating facture:', error);
      showError('Erreur', 'Impossible de créer la facture');
    } finally {
      setCreateDialog({ ...createDialog, loading: false });
    }
  };

  const addItem = () => {
    setCreateDialog({
      ...createDialog,
      formData: {
        ...createDialog.formData,
        items: [...createDialog.formData.items, { description: '', quantity: 1, unitPrice: '' }],
      },
    });
  };

  const removeItem = (index) => {
    const newItems = createDialog.formData.items.filter((_, i) => i !== index);
    setCreateDialog({
      ...createDialog,
      formData: {
        ...createDialog.formData,
        items: newItems,
      },
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...createDialog.formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setCreateDialog({
      ...createDialog,
      formData: {
        ...createDialog.formData,
        items: newItems,
      },
    });
  };

  const getTotalAmount = () => factures.reduce((sum, f) => sum + (f.montantTotal || 0), 0);

  const getPaidAmount = () => factures.reduce((sum, f) => sum + (f.montantPaye || 0), 0);

  const getRemainingAmount = () => factures.reduce((sum, f) => sum + (f.montantRestant || 0), 0);

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Factures | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Factures</Typography>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreateDialog}
          >
            Nouvelle Facture
          </Button>
        </Stack>

        {/* Statistiques */}
        <Stack direction="row" spacing={2} mb={3}>
          <Card sx={{ p: 2, minWidth: 150 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Facturé
            </Typography>
            <Typography variant="h4">{fNumber(getTotalAmount())} FCFA</Typography>
          </Card>
          <Card sx={{ p: 2, minWidth: 150 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Payé
            </Typography>
            <Typography variant="h4" color="success.main">
              {fNumber(getPaidAmount())} FCFA
            </Typography>
          </Card>
          <Card sx={{ p: 2, minWidth: 150 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Restant
            </Typography>
            <Typography variant="h4" color="warning.main">
              {fNumber(getRemainingAmount())} FCFA
            </Typography>
          </Card>
          <Card sx={{ p: 2, minWidth: 150 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Factures
            </Typography>
            <Typography variant="h4">{factures.length}</Typography>
          </Card>
        </Stack>

        {/* Filtres */}
        <Card sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} p={2}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Client</InputLabel>
              <Select
                value={clientFilter}
                label="Client"
                onChange={(e) => {
                  setClientFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Tous les clients</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.nom} - {client.numero}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="partial">Partiel</MenuItem>
                <MenuItem value="paid">Payé</MenuItem>
                <MenuItem value="overdue">En retard</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Table */}
        <Card>
          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Montant Total</TableCell>
                    <TableCell>Montant Payé</TableCell>
                    <TableCell>Restant</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date Facture</TableCell>
                    <TableCell>Date Échéance</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && factures.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Aucune facture trouvée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && factures.length > 0 && factures
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((facture) => (
                        <TableRow key={facture.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{facture.numeroFacture}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{facture.clientName || facture.client?.nom || '-'}</Typography>
                            {facture.client?.email && (
                              <Typography variant="caption" color="text.secondary">
                                {facture.client.email}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{fNumber(facture.montantTotal || 0)} FCFA</TableCell>
                          <TableCell>{fNumber(facture.montantPaye || 0)} FCFA</TableCell>
                          <TableCell>{fNumber(facture.montantRestant || 0)} FCFA</TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_TEXT[facture.status] || facture.status || 'En attente'}
                              color={FACTURE_STATUS_COLORS[facture.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{facture.dateFacture ? fDate(facture.dateFacture) : '-'}</TableCell>
                          <TableCell>{facture.dateEcheance ? fDate(facture.dateEcheance) : '-'}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={() => {
                                router.push(`/facturation/factures/${facture.id}`);
                              }}
                            >
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            page={page}
            component="div"
            count={factures.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>

        {/* Dialog de création */}
        <Dialog open={createDialog.open} onClose={closeCreateDialog} maxWidth="md" fullWidth>
          <DialogTitle>Nouvelle Facture</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Client *</InputLabel>
                <Select
                  value={createDialog.formData.clientId}
                  label="Client *"
                  onChange={(e) =>
                    setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, clientId: e.target.value },
                    })
                  }
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.nom} - {client.numero}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Session ID (optionnel)"
                fullWidth
                value={createDialog.formData.sessionId}
                onChange={(e) =>
                  setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, sessionId: e.target.value },
                  })
                }
              />
              <TextField
                label="Montant Total *"
                fullWidth
                type="number"
                value={createDialog.formData.montantTotal}
                onChange={(e) =>
                  setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, montantTotal: e.target.value },
                  })
                }
              />
              <TextField
                label="Date d'échéance"
                fullWidth
                type="date"
                value={createDialog.formData.dateEcheance}
                onChange={(e) =>
                  setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, dateEcheance: e.target.value },
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Adresse du client"
                fullWidth
                multiline
                rows={2}
                value={createDialog.formData.clientAddress}
                onChange={(e) =>
                  setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, clientAddress: e.target.value },
                  })
                }
              />
              <Divider />
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Articles</Typography>
                  <Button size="small" onClick={addItem} startIcon={<Iconify icon="mingcute:add-line" />}>
                    Ajouter
                  </Button>
                </Stack>
                {createDialog.formData.items.map((item, index) => (
                  <Stack key={index} direction="row" spacing={2} mb={2}>
                    <TextField
                      label="Description"
                      fullWidth
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                    <TextField
                      label="Quantité"
                      type="number"
                      sx={{ width: 120 }}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                    <TextField
                      label="Prix unitaire"
                      type="number"
                      sx={{ width: 150 }}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    />
                    {createDialog.formData.items.length > 1 && (
                      <IconButton onClick={() => removeItem(index)} color="error">
                        <Iconify icon="mingcute:delete-line" />
                      </IconButton>
                    )}
                  </Stack>
                ))}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreateDialog}>Annuler</Button>
            <LoadingButton variant="contained" onClick={handleCreateFacture} loading={createDialog.loading}>
              Créer
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

