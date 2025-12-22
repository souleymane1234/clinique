import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Card,
  Chip,
  Table,
  Stack,
  Button,
  Dialog,
  Select,
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

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';
import { fNumber } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const BON_STATUS_COLORS = {
  pending: 'warning',
  approved: 'info',
  rejected: 'error',
  completed: 'success',
};

const CATEGORIES = [
  { value: 'frais_generaux', label: 'Frais généraux' },
  { value: 'salaires', label: 'Salaires' },
  { value: 'fournitures', label: 'Fournitures' },
  { value: 'transport', label: 'Transport' },
  { value: 'communication', label: 'Communication' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'location', label: 'Location' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'autre', label: 'Autre' },
];

const METHODES = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'other', label: 'Autre' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'completed', label: 'Complété' },
];

export default function BonsDeSortieView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [bonsDeSortie, setBonsDeSortie] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');

  // Dialogs
  const [createDialog, setCreateDialog] = useState({
    open: false,
    loading: false,
    formData: {
      montant: '',
      description: '',
      categorie: '',
      methode: 'cash',
      reference: '',
      dateBon: '',
    },
  });

  const [statusDialog, setStatusDialog] = useState({
    open: false,
    loading: false,
    bonId: null,
    status: '',
  });

  const loadBonsDeSortie = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getBonsDeSortie();

      if (result.success) {
        let bonsData = Array.isArray(result.data) ? result.data : [];

        // Filtrer par statut si nécessaire
        if (statusFilter) {
          bonsData = bonsData.filter((b) => b.status === statusFilter);
        }

        // Filtrer par catégorie si nécessaire
        if (categorieFilter) {
          bonsData = bonsData.filter((b) => b.categorie === categorieFilter);
        }

        setBonsDeSortie(bonsData);
      } else {
        setBonsDeSortie([]);
      }
    } catch (error) {
      console.error('Error loading bons de sortie:', error);
      setBonsDeSortie([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categorieFilter]);

  useEffect(() => {
    loadBonsDeSortie();
  }, [loadBonsDeSortie]);

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
        montant: '',
        description: '',
        categorie: '',
        methode: 'cash',
        reference: '',
        dateBon: new Date().toISOString().split('T')[0],
      },
    });
  };

  const closeCreateDialog = () => {
    setCreateDialog({
      open: false,
      loading: false,
      formData: {
        montant: '',
        description: '',
        categorie: '',
        methode: 'cash',
        reference: '',
        dateBon: '',
      },
    });
  };

  const handleCreateBon = async () => {
    if (!createDialog.formData.montant || !createDialog.formData.description || !createDialog.formData.categorie) {
      showError('Erreur', 'Le montant, la description et la catégorie sont obligatoires');
      return;
    }
  
    setCreateDialog(prev => ({ ...prev, loading: true }));
    try {
      const formData = {
        ...createDialog.formData,
        montant: parseFloat(createDialog.formData.montant),
        dateBon: createDialog.formData.dateBon
          ? new Date(createDialog.formData.dateBon).toISOString()
          : new Date().toISOString(),
      };
  
      const result = await ConsumApi.createBonDeSortie(formData);
      const processed = showApiResponse(result, {
        successTitle: 'Bon de sortie créé',
        errorTitle: 'Erreur de création',
      });
  
      if (processed.success && result.data?.id) {
        // Approuver automatiquement le bon de sortie après sa création
        const approveResult = await ConsumApi.updateBonDeSortieStatus(result.data.id, 'approved');
        if (approveResult.success) {
          showSuccess('Succès', 'Bon de sortie créé et approuvé avec succès');
          
          // Ouvrir automatiquement le PDF du bon de sortie créé
          try {
            // Attendre un court délai pour que les données soient disponibles
            setTimeout(async () => {
              await ConsumApi.openBonDeSortiePdfInNewTab(result.data.id);
            }, 500);
          } catch (pdfError) {
            console.error('Error opening PDF:', pdfError);
            // Ne pas bloquer si l'ouverture échoue
          }
        } else {
          showSuccess('Succès', 'Bon de sortie créé avec succès');
        }
        closeCreateDialog();
        loadBonsDeSortie();
      } else {
        setCreateDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error creating bon de sortie:', error);
      showError('Erreur', 'Impossible de créer le bon de sortie');
      setCreateDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const openStatusDialog = (bonId, currentStatus) => {
    setStatusDialog({
      open: true,
      loading: false,
      bonId,
      status: currentStatus,
    });
  };

  const closeStatusDialog = () => {
    setStatusDialog({
      open: false,
      loading: false,
      bonId: null,
      status: '',
    });
  };

  const handleUpdateStatus = async () => {
    if (!statusDialog.bonId || !statusDialog.status) {
      showError('Erreur', 'Veuillez sélectionner un statut');
      return;
    }

    setStatusDialog({ ...statusDialog, loading: true });
    try {
      const result = await ConsumApi.updateBonDeSortieStatus(statusDialog.bonId, statusDialog.status);
      const processed = showApiResponse(result, {
        successTitle: 'Statut mis à jour',
        errorTitle: 'Erreur de mise à jour',
      });

      if (processed.success) {
        showSuccess('Succès', 'Statut mis à jour avec succès');
        closeStatusDialog();
        loadBonsDeSortie();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setStatusDialog({ ...statusDialog, loading: false });
    }
  };

  const handleDelete = async (id, status) => {
    if (status === 'completed') {
      showError('Erreur', 'Impossible de supprimer un bon de sortie complété');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bon de sortie ?')) {
      return;
    }

    try {
      const result = await ConsumApi.deleteBonDeSortie(id);
      const processed = showApiResponse(result, {
        successTitle: 'Bon de sortie supprimé',
        errorTitle: 'Erreur de suppression',
      });

      if (processed.success) {
        showSuccess('Succès', 'Bon de sortie supprimé avec succès');
        loadBonsDeSortie();
      }
    } catch (error) {
      console.error('Error deleting bon de sortie:', error);
      showError('Erreur', 'Impossible de supprimer le bon de sortie');
    }
  };

  const getTotalAmount = () => bonsDeSortie.reduce((sum, b) => sum + (b.montant || 0), 0);

  const getCategoryLabel = (categorie) => {
    const category = CATEGORIES.find((c) => c.value === categorie);
    return category ? category.label : categorie;
  };

  const getMethodeLabel = (methode) => {
    const method = METHODES.find((m) => m.value === methode);
    return method ? method.label : methode;
  };

  const getStatusLabel = (status) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Bons de sortie | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Bons de sortie</Typography>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreateDialog}
          >
            Nouveau Bon de sortie
          </Button>
        </Stack>

        {/* Statistiques */}
        <Stack direction="row" spacing={2} mb={3}>
          <Card sx={{ p: 2, minWidth: 150 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Dépenses
            </Typography>
            <Typography variant="h4">{fNumber(getTotalAmount())} FCFA</Typography>
          </Card>
          <Card sx={{ p: 2, minWidth: 150 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Bons
            </Typography>
            <Typography variant="h4">{bonsDeSortie.length}</Typography>
          </Card>
        </Stack>

        {/* Filtres */}
        <Card sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} p={2}>
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
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={categorieFilter}
                label="Catégorie"
                onChange={(e) => {
                  setCategorieFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Toutes les catégories</MenuItem>
                {CATEGORIES.map((categorie) => (
                  <MenuItem key={categorie.value} value={categorie.value}>
                    {categorie.label}
                  </MenuItem>
                ))}
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
                    <TableCell>Montant</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Catégorie</TableCell>
                    <TableCell>Méthode</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Créé par</TableCell>
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
                  {!loading && bonsDeSortie.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Aucun bon de sortie trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && bonsDeSortie.length > 0 && bonsDeSortie
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((bon) => (
                        <TableRow key={bon.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{bon.numeroBon}</Typography>
                          </TableCell>
                          <TableCell>{fNumber(bon.montant || 0)} FCFA</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300 }}>
                              {bon.description}
                            </Typography>
                          </TableCell>
                          <TableCell>{getCategoryLabel(bon.categorie)}</TableCell>
                          <TableCell>{getMethodeLabel(bon.methode)}</TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(bon.status)}
                              color={BON_STATUS_COLORS[bon.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{bon.dateBon ? fDate(bon.dateBon) : '-'}</TableCell>
                          <TableCell>
                            {bon.createdBy
                              ? `${bon.createdBy.firstname || ''} ${bon.createdBy.lastname || ''}`.trim() ||
                                bon.createdBy.email ||
                                '-'
                              : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {bon.status !== 'approved' && (
                                <IconButton
                                  size="small"
                                  onClick={() => openStatusDialog(bon.id, bon.status)}
                                  color="info"
                                >
                                  <Iconify icon="solar:pen-bold" />
                                </IconButton>
                              )}
                              {bon.status !== 'completed' && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(bon.id, bon.status)}
                                  color="error"
                                >
                                  <Iconify icon="solar:trash-bin-trash-bold" />
                                </IconButton>
                              )}
                            </Stack>
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
            count={bonsDeSortie.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>

        {/* Dialog de création */}
        <Dialog open={createDialog.open} onClose={closeCreateDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Nouveau Bon de sortie</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Montant *"
                fullWidth
                type="number"
                value={createDialog.formData.montant}
                onChange={(e) =>
                  setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, montant: e.target.value },
                  })
                }
              />
              <TextField
                label="Description *"
                fullWidth
                multiline
                rows={3}
                value={createDialog.formData.description}
                onChange={(e) =>
                  setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, description: e.target.value },
                  })
                }
              />
              <FormControl fullWidth>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={createDialog.formData.categorie}
                  label="Catégorie *"
                  onChange={(e) =>
                    setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, categorie: e.target.value },
                    })
                  }
                >
                  {CATEGORIES.map((categorie) => (
                    <MenuItem key={categorie.value} value={categorie.value}>
                      {categorie.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Méthode de paiement</InputLabel>
                <Select
                  value={createDialog.formData.methode}
                  label="Méthode de paiement"
                  onChange={(e) =>
                    setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, methode: e.target.value },
                    })
                  }
                >
                  {METHODES.map((methode) => (
                    <MenuItem key={methode.value} value={methode.value}>
                      {methode.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Référence"
                fullWidth
                value={createDialog.formData.reference}
                onChange={(e) =>
                  setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, reference: e.target.value },
                  })
                }
              />
              <TextField
                label="Date du bon"
                fullWidth
                type="date"
                value={createDialog.formData.dateBon}
                onChange={(e) =>
                  setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, dateBon: e.target.value },
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreateDialog}>Annuler</Button>
            <LoadingButton variant="contained" onClick={handleCreateBon} loading={createDialog.loading}>
              Créer
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog de mise à jour du statut */}
        <Dialog open={statusDialog.open} onClose={closeStatusDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Mettre à jour le statut</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={statusDialog.status}
                  label="Statut"
                  onChange={(e) =>
                    setStatusDialog({
                      ...statusDialog,
                      status: e.target.value,
                    })
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeStatusDialog}>Annuler</Button>
            <LoadingButton variant="contained" onClick={handleUpdateStatus} loading={statusDialog.loading}>
              Mettre à jour
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

