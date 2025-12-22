import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Alert,
  alpha,
  Button,
  Dialog,
  Select,
  Divider,
  TableRow,
  MenuItem,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  LinearProgress,
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

const PAYMENT_METHOD_COLORS = {
  cash: 'success',
  bank_transfer: 'info',
  mobile_money: 'warning',
  check: 'default',
};

export default function FactureDetailsView() {
  const { id: factureId } = useParams();
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [loading, setLoading] = useState(true);
  const [facture, setFacture] = useState(null);
  const [paiements, setPaiements] = useState([]);

  // Dialogs
  const [paiementDialog, setPaiementDialog] = useState({
    open: false,
    loading: false,
    montant: '',
    method: 'cash',
    reference: '',
  });

  const loadFactureData = async () => {
    setLoading(true);
    try {
      const [factureResult, paiementsResult] = await Promise.all([
        ConsumApi.getFactureById(factureId),
        ConsumApi.getFacturePaiements(factureId),
      ]);

      if (factureResult.success) {
        setFacture(factureResult.data);
      }

      if (paiementsResult.success) {
        setPaiements(Array.isArray(paiementsResult.data) ? paiementsResult.data : []);
      }
    } catch (error) {
      console.error('Error loading facture data:', error);
      showError('Erreur', 'Impossible de charger les données de la facture');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (factureId) {
      loadFactureData();
    }
  }, [factureId]);

  const handleCreatePaiement = async () => {
    if (!paiementDialog.montant || parseFloat(paiementDialog.montant) <= 0) {
      showError('Erreur', 'Le montant doit être supérieur à 0');
      return;
    }
  
    setPaiementDialog({ ...paiementDialog, loading: true });
    try {
      const result = await ConsumApi.createPaiement({
        factureId,
        montant: parseFloat(paiementDialog.montant),
        method: paiementDialog.method,
        reference: paiementDialog.reference,
      });
  
      const processed = showApiResponse(result, {
        successTitle: 'Paiement enregistré',
        errorTitle: 'Erreur',
      });
  
      if (processed.success) {
        showSuccess('Succès', 'Paiement enregistré avec succès');
        
        // Fermer la modal UNE SEULE FOIS
        setPaiementDialog({ 
          open: false, 
          loading: false, 
          montant: '', 
          method: 'cash', 
          reference: '' 
        });
        
        // Recharger les données de la facture pour mettre à jour l'affichage
        await loadFactureData();
      } else {
        // En cas d'erreur, arrêter le loading mais garder la modal ouverte
        setPaiementDialog({ ...paiementDialog, loading: false });
      }
    } catch (error) {
      console.error('Error creating paiement:', error);
      showError('Erreur', 'Impossible d\'enregistrer le paiement');
      // En cas d'erreur, arrêter le loading mais garder la modal ouverte
      setPaiementDialog({ ...paiementDialog, loading: false });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const result = await ConsumApi.downloadFacturePdf(factureId);
      if (result.success) {
        showSuccess('Succès', 'PDF téléchargé avec succès');
      } else {
        showError('Erreur', result.message || 'Impossible de télécharger le PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showError('Erreur', 'Impossible de télécharger le PDF');
    }
  };

  const handleGeneratePdf = async () => {
    try {
      const result = await ConsumApi.generateFacturePdf(factureId);
      
      if (result.success) {
        showSuccess('Succès', 'PDF généré avec succès');
        await loadFactureData();
      } else {
        showError('Erreur', result.message || 'Impossible de générer le PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError('Erreur', 'Impossible de générer le PDF');
    }
  };

  const statusText = {
    pending: 'En attente',
    partial: 'Partiel',
    paid: 'Payé',
    overdue: 'En retard',
  };

  const paymentMethodText = {
    cash: 'Espèces',
    bank_transfer: 'Virement bancaire',
    mobile_money: 'Mobile Money',
    check: 'Chèque',
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Stack spacing={2} alignItems="center">
            <LinearProgress sx={{ width: 200 }} />
            <Typography>Chargement...</Typography>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (!facture) {
    return (
      <Box sx={{ width: '100%', px: 3 }}>
        <Alert severity="error">Facture non trouvée</Alert>
      </Box>
    );
  }

  const progressPercentage =
    facture.montantTotal > 0 ? ((facture.montantPaye || 0) / facture.montantTotal) * 100 : 0;

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Facture {facture.numeroFacture} | Annour Travel </title>
      </Helmet>

      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4, lg: 5 }, py: 3 }}>
        {/* Header */}
        <Card sx={{ mb: 4, p: { xs: 2, sm: 3, md: 4 }, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) }}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={3}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <IconButton onClick={() => router.back()} sx={{ bgcolor: 'background.paper' }}>
                <Iconify icon="eva:arrow-ios-back-fill" />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={1}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    Facture {facture.numeroFacture || `#${facture.id.slice(0, 8)}`}
                  </Typography>
                  <Chip
                    label={statusText[facture.status] || facture.status}
                    color={FACTURE_STATUS_COLORS[facture.status] || 'default'}
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {facture.dateFacture ? fDate(facture.dateFacture) : '-'}
                  </Typography>
                  {facture.dateEcheance && (
                    <Typography variant="body2" color="text.secondary">
                      Échéance: {fDate(facture.dateEcheance)}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ width: { xs: '100%', sm: 'auto' } }}
                startIcon={<Iconify icon="solar:download-bold" />}
                onClick={handleDownloadPdf}
              >
                Télécharger PDF
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{ width: { xs: '100%', sm: 'auto' } }}
                startIcon={<Iconify icon="solar:file-text-bold" />}
                onClick={handleGeneratePdf}
              >
                Régénérer PDF
              </Button>
              {facture.status !== 'paid' && (
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() =>
                    setPaiementDialog({ open: true, loading: false, montant: '', method: 'cash', reference: '' })
                  }
                >
                  Enregistrer un paiement
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>

        <Grid container spacing={4}>
          {/* Informations Client */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <Iconify icon="solar:user-bold" width={24} sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Informations Client</Typography>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Nom complet
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                    {facture.clientName || facture.client?.nom || '-'}
                  </Typography>
                </Box>
                {facture.client?.email && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1">{facture.client.email}</Typography>
                  </Box>
                )}
                {facture.clientAddress && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Adresse
                    </Typography>
                    <Typography variant="body1">{facture.clientAddress}</Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>

          {/* Montants - Vue améliorée */}
          <Grid item xs={12} lg={8}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card
                  sx={{
                    p: { xs: 2.5, sm: 3, md: 4 },
                    textAlign: 'center',
                    bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                    border: 1,
                    borderColor: 'divider',
                    height: '100%',
                  }}
                >
                  <Iconify icon="solar:bill-list-bold" width={40} sx={{ color: 'info.main', mb: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Montant Total
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {fNumber(facture.montantTotal || 0)} FCFA
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card
                  sx={{
                    p: { xs: 2.5, sm: 3, md: 4 },
                    textAlign: 'center',
                    bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                    border: 1,
                    borderColor: 'divider',
                    height: '100%',
                  }}
                >
                  <Iconify icon="solar:check-circle-bold" width={40} sx={{ color: 'success.main', mb: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Montant Payé
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {fNumber(facture.montantPaye || 0)} FCFA
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card
                  sx={{
                    p: { xs: 2.5, sm: 3, md: 4 },
                    textAlign: 'center',
                    bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                    border: 1,
                    borderColor: 'divider',
                    height: '100%',
                  }}
                >
                  <Iconify icon="solar:clock-circle-bold" width={40} sx={{ color: 'warning.main', mb: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Montant Restant
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {fNumber(facture.montantRestant || 0)} FCFA
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Barre de progression */}
            {facture.montantTotal > 0 && (
              <Card sx={{ mt: 3, p: { xs: 2.5, sm: 3, md: 4 } }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Progression du paiement
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {progressPercentage.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                      height: 12,
                      borderRadius: 1.5,
                      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 1.5,
                      },
                    }}
                  />
                </Stack>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Items de la facture - Pleine largeur en haut */}
        {facture.items && facture.items.length > 0 && (
          <Card sx={{ mt: 4 }}>
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <Iconify icon="solar:list-bold" width={28} sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Articles ({facture.items.length})
                </Typography>
              </Stack>
              <Divider />
            </Box>
            <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 2, sm: 3, md: 4 } }}>
              <Scrollbar>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2 }}>
                          Description
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2 }}>
                          Quantité
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2 }}>
                          Prix unitaire
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2 }}>
                          Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {facture.items.map((item, index) => (
                        <TableRow key={index} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {item.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2.5 }}>
                            <Chip label={item.quantity || 1} size="medium" variant="outlined" />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2.5 }}>
                            <Typography variant="body1">{fNumber(item.unitPrice || 0)} FCFA</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2.5 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {fNumber((item.quantity || 1) * (item.unitPrice || 0))} FCFA
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 700, pt: 3, pb: 2 }}>
                          <Typography variant="h6">Total</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, pt: 3, pb: 2 }}>
                          <Typography variant="h5" color="primary.main">
                            {fNumber(facture.montantTotal || 0)} FCFA
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Scrollbar>
            </Box>
          </Card>
        )}

        {/* Historique des paiements - Pleine largeur en bas */}
        <Card sx={{ mt: 4 }}>
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              mb={3}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:wallet-money-bold" width={28} sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Historique des Paiements ({paiements.length})
                </Typography>
              </Stack>
              {facture.status !== 'paid' && (
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() =>
                    setPaiementDialog({ open: true, loading: false, montant: '', method: 'cash', reference: '' })
                  }
                >
                  Ajouter un paiement
                </Button>
              )}
            </Stack>
            <Divider />
          </Box>
          {paiements.length === 0 ? (
            <Box sx={{ p: { xs: 4, sm: 6, md: 8 }, textAlign: 'center' }}>
              <Iconify icon="solar:wallet-money-bold" width={80} sx={{ color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Aucun paiement enregistré
              </Typography>
              {facture.status !== 'paid' && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() =>
                    setPaiementDialog({ open: true, loading: false, montant: '', method: 'cash', reference: '' })
                  }
                  sx={{ mt: 3 }}
                >
                  Enregistrer le premier paiement
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 2, sm: 3, md: 4 } }}>
              <Scrollbar>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2 }}>Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2 }}>
                          Montant
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2 }}>Méthode</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2 }}>Référence</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2 }}>Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paiements.map((paiement) => (
                        <TableRow key={paiement.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell sx={{ py: 2.5 }}>
                            <Stack>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {paiement.createdAt ? fDate(paiement.createdAt) : '-'}
                              </Typography>
                              {paiement.createdAt && (
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(paiement.createdAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2.5 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {fNumber(paiement.montant || 0)} FCFA
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Chip
                              label={paymentMethodText[paiement.method] || paiement.method || 'Espèces'}
                              color={PAYMENT_METHOD_COLORS[paiement.method] || 'default'}
                              size="medium"
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography variant="body1">{paiement.reference || '-'}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Chip
                              label={paiement.status === 'completed' ? 'Complété' : paiement.status || 'Complété'}
                              color={paiement.status === 'completed' ? 'success' : 'default'}
                              size="medium"
                              icon={<Iconify icon="solar:check-circle-bold" width={18} />}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={1} sx={{ fontWeight: 700, pt: 3, pb: 2 }}>
                          <Typography variant="h6">Total payé</Typography>
                        </TableCell>
                        <TableCell align="right" colSpan={4} sx={{ fontWeight: 700, pt: 3, pb: 2 }}>
                          <Typography variant="h5" color="success.main">
                            {fNumber(facture.montantPaye || 0)} FCFA
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Scrollbar>
            </Box>
          )}
        </Card>

        {/* Dialog enregistrer paiement */}
        <Dialog
          open={paiementDialog.open}
          onClose={() => setPaiementDialog({ open: false, loading: false, montant: '', method: 'cash', reference: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:wallet-money-bold" width={24} sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Enregistrer un paiement</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" />}>
                <Typography variant="body2">
                  Montant restant à payer: <strong>{fNumber(facture?.montantRestant || 0)} FCFA</strong>
                </Typography>
              </Alert>
              <TextField
                label="Montant *"
                fullWidth
                type="number"
                value={paiementDialog.montant}
                onChange={(e) => setPaiementDialog({ ...paiementDialog, montant: e.target.value })}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">FCFA</Typography>,
                }}
                helperText={`Maximum: ${fNumber(facture?.montantRestant || 0)} FCFA`}
              />
              <FormControl fullWidth>
                <InputLabel>Méthode de paiement *</InputLabel>
                <Select
                  value={paiementDialog.method}
                  label="Méthode de paiement *"
                  onChange={(e) => setPaiementDialog({ ...paiementDialog, method: e.target.value })}
                >
                  <MenuItem value="cash">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:wallet-money-bold" width={20} />
                      <Typography>Espèces</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="bank_transfer">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:card-bold" width={20} />
                      <Typography>Virement bancaire</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="mobile_money">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:smartphone-bold" width={20} />
                      <Typography>Mobile Money</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="check">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:document-bold" width={20} />
                      <Typography>Chèque</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Référence (optionnel)"
                fullWidth
                value={paiementDialog.reference}
                onChange={(e) => setPaiementDialog({ ...paiementDialog, reference: e.target.value })}
                placeholder="Numéro de transaction, référence de chèque, etc."
                helperText="Référence du paiement pour traçabilité"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => setPaiementDialog({ open: false, loading: false, montant: '', method: 'cash', reference: '' })}
            >
              Annuler
            </Button>
            <LoadingButton
              variant="contained"
              onClick={handleCreatePaiement}
              loading={paiementDialog.loading}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Enregistrer
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}

