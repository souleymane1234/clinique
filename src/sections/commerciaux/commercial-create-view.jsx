import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

// ----------------------------------------------------------------------

export default function CommercialCreateView() {
  const router = useRouter();
  const { contextHolder, showError, showSuccess, showApiResponse } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    telephone: '',
    role: 'COMMERCIAL', // Rôle interne, sera converti en service pour l'API
  });

  const handleInputChange = (field) => (event) => {
    const {value} = event.target;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.firstname || !formData.lastname || !formData.role) {
      showError('Erreur de validation', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password.length < 6) {
      showError('Erreur de validation', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const result = await ConsumApi.createCommercial(formData);
      const processed = showApiResponse(result, {
        successTitle: 'Commercial créé',
        errorTitle: 'Erreur de création',
      });

      if (processed.success) {
        showSuccess('Succès', 'Commercial créé avec succès');
        // Réinitialiser le formulaire
        setFormData({
          email: '',
          password: '',
          firstname: '',
          lastname: '',
          telephone: '',
          role: 'COMMERCIAL',
        });
        // Rediriger vers la liste des commerciaux
        setTimeout(() => {
          router.push(routesName.commerciaux);
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating commercial:', error);
      showError('Erreur', 'Erreur lors de la création du commercial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Créer un Utilisateur</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Créez un nouveau utilisateur avec un rôle spécifique
        </Typography>
      </Box>

      <Card sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Prénom"
                value={formData.firstname}
                onChange={handleInputChange('firstname')}
                required
              />
              <TextField
                fullWidth
                label="Nom"
                value={formData.lastname}
                onChange={handleInputChange('lastname')}
                required
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
                type="email"
              />
              <TextField
                fullWidth
                label="Numéro de téléphone"
                value={formData.telephone}
                onChange={handleInputChange('telephone')}
                placeholder="+221771234567"
              />
            </Stack>

            <TextField
              fullWidth
              label="Mot de passe"
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              type="password"
              helperText="Le mot de passe doit contenir au moins 6 caractères"
            />

            <FormControl fullWidth required>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={formData.role}
                label="Rôle"
                onChange={handleInputChange('role')}
              >
                <MenuItem value="ADMIN">Administrateur (accès à tout)</MenuItem>
                <MenuItem value="COMMERCIAL">Commercial (clients et analytiques clients)</MenuItem>
                <MenuItem value="COMPTABLE">Comptable (facturation et analytiques)</MenuItem>
                <MenuItem value="ADMIN_SITE_WEB">Administrateur site web (administration site uniquement)</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => router.back()} disabled={loading}>
                Annuler
              </Button>
              <LoadingButton type="submit" variant="contained" loading={loading}>
                Créer l&apos;utilisateur
              </LoadingButton>
            </Stack>
          </Stack>
        </Box>
      </Card>
    </>
  );
}

