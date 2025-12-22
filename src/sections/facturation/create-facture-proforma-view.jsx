import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Stack,
  Button,
  Select,
  Divider,
  MenuItem,
  TextField,
  Container,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function CreateFactureProformaView() {
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    sessionId: '',
    montantTotal: '',
    dateEcheance: '',
    clientAddress: '',
    items: [{ description: '', quantity: 1, unitPrice: '' }],
  });

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
    loadClients();
  }, [loadClients]);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: '' }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        items: newItems,
      });
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculer le montant total automatiquement
    let montantTotal = 0;
    newItems.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      montantTotal += quantity * unitPrice;
    });
    
    setFormData({
      ...formData,
      items: newItems,
      montantTotal: montantTotal.toString(),
    });
  };

  const handleSubmit = async () => {
    if (!formData.clientId) {
      showError('Erreur', 'Le client est obligatoire');
      return;
    }

    if (!formData.items || formData.items.length === 0) {
      showError('Erreur', 'Au moins un article est requis');
      return;
    }

    // Vérifier que tous les articles ont une description
    const hasEmptyItems = formData.items.some(
      (item) => !item.description || !item.unitPrice || !item.quantity
    );
    if (hasEmptyItems) {
      showError('Erreur', 'Tous les articles doivent avoir une description, une quantité et un prix unitaire');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        montantTotal: parseFloat(formData.montantTotal) || 0,
        items: formData.items.map((item) => ({
          ...item,
          quantity: parseInt(item.quantity, 10),
          unitPrice: parseFloat(item.unitPrice),
        })),
      };

      const result = await ConsumApi.createFactureProforma(submitData);
      const processed = showApiResponse(result, {
        successTitle: 'Facture proforma créée',
        errorTitle: 'Erreur de création',
      });

      if (processed.success) {
        showSuccess('Succès', 'Facture proforma créée avec succès');
        
        // Ouvrir automatiquement le PDF de la facture proforma créée
        const factureId = result.data?.id;
        if (factureId) {
          try {
            // Attendre un court délai pour que les données soient disponibles
            setTimeout(async () => {
              await ConsumApi.openFacturePdfInNewTab(factureId);
            }, 500);
          } catch (pdfError) {
            console.error('Error opening PDF:', pdfError);
            // Ne pas bloquer si l'ouverture échoue
          }
        }
        
        // Réinitialiser le formulaire
        setFormData({
          clientId: '',
          sessionId: '',
          montantTotal: '',
          dateEcheance: '',
          clientAddress: '',
          items: [{ description: '', quantity: 1, unitPrice: '' }],
        });
        
        // Optionnel: rediriger vers la liste des factures par catégorie
        // router.push(routesName.facturesByCategory);
      }
    } catch (error) {
      console.error('Error creating facture proforma:', error);
      showError('Erreur', 'Impossible de créer la facture proforma');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Créer Facture Proforma | Annour Travel </title>
      </Helmet>

      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Créer une Facture Proforma</Typography>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={() => router.back()}
          >
            Retour
          </Button>
        </Stack>

        <Card sx={{ p: 4 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Client *</InputLabel>
              <Select
                value={formData.clientId}
                label="Client *"
                onChange={(e) => handleChange('clientId', e.target.value)}
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
              value={formData.sessionId}
              onChange={(e) => handleChange('sessionId', e.target.value)}
              helperText="ID de la session client si applicable"
            />

            <TextField
              label="Date d'échéance"
              fullWidth
              type="date"
              value={formData.dateEcheance}
              onChange={(e) => handleChange('dateEcheance', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Adresse du client"
              fullWidth
              multiline
              rows={2}
              value={formData.clientAddress}
              onChange={(e) => handleChange('clientAddress', e.target.value)}
              placeholder="Adresse complète du client"
            />

            <Divider />

            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Articles</Typography>
                <Button size="small" onClick={addItem} startIcon={<Iconify icon="mingcute:add-line" />}>
                  Ajouter un article
                </Button>
              </Stack>

              {formData.items.map((item, index) => (
                <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      label="Description *"
                      fullWidth
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Description de l'article"
                    />
                    <TextField
                      label="Quantité *"
                      type="number"
                      sx={{ width: 120 }}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      inputProps={{ min: 1 }}
                    />
                    <TextField
                      label="Prix unitaire (FCFA) *"
                      type="number"
                      sx={{ width: 180 }}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 'bold' }}>
                      Total: {(parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)} FCFA
                    </Typography>
                    {formData.items.length > 1 && (
                      <IconButton onClick={() => removeItem(index)} color="error">
                        <Iconify icon="mingcute:delete-line" />
                      </IconButton>
                    )}
                  </Stack>
                </Card>
              ))}

              <Card variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'action.hover' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">Montant Total</Typography>
                  <Typography variant="h5" color="primary.main">
                    {calculateTotal().toLocaleString('fr-FR')} FCFA
                  </Typography>
                </Stack>
              </Card>
            </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
              <Button variant="outlined" onClick={() => router.back()}>
                Annuler
              </Button>
              <LoadingButton variant="contained" onClick={handleSubmit} loading={loading}>
                Créer la Facture Proforma
              </LoadingButton>
            </Stack>
          </Stack>
        </Card>
      </Container>
    </>
  );
}
