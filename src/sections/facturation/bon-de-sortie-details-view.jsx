import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Button,
  Dialog,
  Select,
  Divider,
  MenuItem,
  Container,
  Typography,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';
import { fNumber } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

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

export default function BonDeSortieDetailsView() {
  const { id } = useParams();
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [bon, setBon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    loading: false,
    status: '',
  });

  const loadBon = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const result = await ConsumApi.getBonDeSortieById(id);
      if (result.success) {
        setBon(result.data);
      } else {
        showError('Erreur', 'Impossible de charger le bon de sortie');
        router.back();
      }
    } catch (error) {
      console.error('Error loading bon de sortie:', error);
      showError('Erreur', 'Impossible de charger le bon de sortie');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadBon();
  }, [loadBon]);

  const openStatusDialog = () => {
    setStatusDialog({
      open: true,
      loading: false,
      status: bon?.status || '',
    });
  };

  const closeStatusDialog = () => {
    setStatusDialog({
      open: false,
      loading: false,
      status: '',
    });
  };

  const handleUpdateStatus = async () => {
    if (!statusDialog.status) {
      showError('Erreur', 'Veuillez sélectionner un statut');
      return;
    }

    setStatusDialog({ ...statusDialog, loading: true });
    try {
      const result = await ConsumApi.updateBonDeSortieStatus(id, statusDialog.status);
      const processed = showApiResponse(result, {
        successTitle: 'Statut mis à jour',
        errorTitle: 'Erreur de mise à jour',
      });

      if (processed.success) {
        showSuccess('Succès', 'Statut mis à jour avec succès');
        closeStatusDialog();
        loadBon();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setStatusDialog({ ...statusDialog, loading: false });
    }
  };

  const handleDelete = async () => {
    if (bon?.status === 'completed') {
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
        router.push('/facturation/bons-de-sortie');
      }
    } catch (error) {
      console.error('Error deleting bon de sortie:', error);
      showError('Erreur', 'Impossible de supprimer le bon de sortie');
    }
  };

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

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography>Chargement...</Typography>
        </Box>
      </Container>
    );
  }

  if (!bon) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Bon de sortie {bon.numeroBon} | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => router.back()}
            >
              Retour
            </Button>
            <Typography variant="h4">Bon de sortie {bon.numeroBon}</Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={openStatusDialog} startIcon={<Iconify icon="solar:pen-bold" />}>
              Modifier le statut
            </Button>
            {bon.status !== 'completed' && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleDelete}
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              >
                Supprimer
              </Button>
            )}
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Détails du bon de sortie
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Numéro
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {bon.numeroBon}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Montant
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {fNumber(bon.montant || 0)} FCFA
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">{bon.description}</Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Catégorie
                    </Typography>
                    <Typography variant="body1">{getCategoryLabel(bon.categorie)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Méthode de paiement
                    </Typography>
                    <Typography variant="body1">{getMethodeLabel(bon.methode)}</Typography>
                  </Grid>
                </Grid>

                {bon.reference && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Référence
                    </Typography>
                    <Typography variant="body1">{bon.reference}</Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informations
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Statut
                  </Typography>
                  <Chip
                    label={getStatusLabel(bon.status)}
                    color={BON_STATUS_COLORS[bon.status] || 'default'}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Date du bon
                  </Typography>
                  <Typography variant="body1">{bon.dateBon ? fDate(bon.dateBon) : '-'}</Typography>
                </Box>

                {bon.dateApprobation && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Date d&apos;approbation
                    </Typography>
                    <Typography variant="body1">{fDate(bon.dateApprobation)}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Créé le
                  </Typography>
                  <Typography variant="body1">{bon.createdAt ? fDate(bon.createdAt) : '-'}</Typography>
                </Box>

                {bon.createdBy && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Créé par
                    </Typography>
                    <Typography variant="body1">
                      {`${bon.createdBy.firstname || ''} ${bon.createdBy.lastname || ''}`.trim() ||
                        bon.createdBy.email ||
                        '-'}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>
        </Grid>

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

