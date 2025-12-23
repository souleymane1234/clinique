import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

// ----------------------------------------------------------------------

const SERVICES = [
  { value: 'Administrateur', label: 'Administrateur' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Comptable', label: 'Comptable' },
  { value: 'Administrateur site web', label: 'Administrateur Site Web' },
];

export default function UserCreateView() {
  const router = useRouter();
  const { contextHolder, showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    telephone: '',
    service: 'Commercial', // Valeur par défaut
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field) => (event) => {
    const {value} = event.target;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.firstname || formData.firstname.trim().length < 2) {
      newErrors.firstname = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!formData.lastname || formData.lastname.trim().length < 2) {
      newErrors.lastname = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.telephone || formData.telephone.trim().length < 8) {
      newErrors.telephone = 'Le numéro de téléphone est requis (minimum 8 caractères)';
    }

    if (!formData.service) {
      newErrors.service = 'Le service est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      showError('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Création utilisateur - Données:', formData);

      const result = await ConsumApi.createUser(formData);

      console.log('📥 Résultat création utilisateur:', result);

      if (result.success) {
        showSuccess('Succès', 'Utilisateur créé avec succès');
        // Rediriger vers la liste des utilisateurs après un court délai
        setTimeout(() => {
          router.push('/admin/users');
        }, 1000);
      } else if (result.status === 400) {
        // Gérer les erreurs spécifiques
          const errorMessage = result.message || 'Données invalides ou email déjà utilisé';
          showError('Erreur de validation', errorMessage);
        } else if (result.status === 404) {
          showError('Endpoint non disponible', 'L\'endpoint /auth/register n\'est pas disponible. Vérifiez que le serveur backend est démarré.');
        } else {
          showError('Erreur', result.message || 'Erreur lors de la création de l\'utilisateur');
      }
    } catch (error) {
      console.error('❌ Exception lors de la création:', error);
      showError('Erreur', error.message || 'Une erreur inattendue est survenue');
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
          Créez un nouvel utilisateur pour la plateforme
        </Typography>
      </Box>

      <Card sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            {/* Prénom et Nom */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                id="firstname"
                name="firstname"
                label="Prénom"
                value={formData.firstname}
                onChange={handleInputChange('firstname')}
                error={!!errors.firstname}
                helperText={errors.firstname}
                required
                autoComplete="given-name"
              />
              <TextField
                fullWidth
                id="lastname"
                name="lastname"
                label="Nom"
                value={formData.lastname}
                onChange={handleInputChange('lastname')}
                error={!!errors.lastname}
                helperText={errors.lastname}
                required
                autoComplete="family-name"
              />
            </Stack>

            {/* Email et Mot de passe */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Mot de passe"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                required
                autoComplete="new-password"
              />
            </Stack>

            {/* Téléphone et Service */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                id="telephone"
                name="telephone"
                label="Numéro de téléphone"
                value={formData.telephone}
                onChange={handleInputChange('telephone')}
                error={!!errors.telephone}
                helperText={errors.telephone || 'Format: +221771234567'}
                placeholder="+221771234567"
                required
                autoComplete="tel"
              />
              <FormControl fullWidth required error={!!errors.service}>
                <InputLabel id="service-label">Service</InputLabel>
                <Select
                  id="service"
                  name="service"
                  labelId="service-label"
                  value={formData.service}
                  label="Service"
                  onChange={handleInputChange('service')}
                >
                  {SERVICES.map((service) => (
                    <MenuItem key={service.value} value={service.value}>
                      {service.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.service && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.service}
                  </Typography>
                )}
              </FormControl>
            </Stack>

            {/* Boutons d'action */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
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
