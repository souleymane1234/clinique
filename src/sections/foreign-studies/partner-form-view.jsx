import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Card, Stack,
  Button,
  Container,
  TextField,
  Typography,
  Breadcrumbs
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';


// ----------------------------------------------------------------------

export default function PartnerFormView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showApiResponse, contextHolder } = useNotification();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    website: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchPartner();
    }
  }, [id]);

  const fetchPartner = async () => {
    try {
      setLoading(true);
      const result = await ConsumApi.getForeignStudiesPartnerById(id);

      if (result.success) {
        const partner = result.data;
        setFormData({
          name: partner.name || '',
          country: partner.country || '',
          website: partner.website || '',
        });
      } else {
        showApiResponse(result, {
          errorTitle: 'Erreur de chargement',
          successTitle: 'Chargement réussi',
        });
        navigate(routesName.adminForeignStudiesPartners);
      }
    } catch (error) {
      showApiResponse(
        { success: false, message: 'Erreur lors du chargement du partenaire' },
        {
          errorTitle: 'Erreur de chargement',
        }
      );
      navigate(routesName.adminForeignStudiesPartners);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Le pays est requis';
    }

    if (formData.website && formData.website.trim()) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(formData.website)) {
        newErrors.website = 'URL invalide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      let result;

      if (isEdit) {
        result = await ConsumApi.updateForeignStudiesPartner(id, formData);
      } else {
        result = await ConsumApi.createForeignStudiesPartner(formData);
      }

      showApiResponse(result, {
        successTitle: isEdit ? 'Partenaire modifié' : 'Partenaire créé',
        errorTitle: 'Erreur',
      });

      if (result.success) {
        navigate(routesName.adminForeignStudiesPartners);
      }
    } catch (error) {
      showApiResponse(
        {
          success: false,
          message: isEdit
            ? 'Erreur lors de la modification du partenaire'
            : 'Erreur lors de la création du partenaire',
        },
        {
          errorTitle: 'Erreur',
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title>
          {isEdit ? 'Modifier le partenaire' : 'Nouveau partenaire'} | AnnourTravel
        </title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <div>
            <Typography variant="h4" gutterBottom>
              {isEdit ? 'Modifier le partenaire' : 'Nouveau partenaire'}
            </Typography>
            <Breadcrumbs>
              <Button
                variant="text"
                onClick={() => navigate(routesName.adminForeignStudiesPartners)}
              >
                Partenaires
              </Button>
              <Typography variant="body2" color="text.secondary">
                {isEdit ? 'Modifier' : 'Créer'}
              </Typography>
            </Breadcrumbs>
          </div>
        </Stack>

        <Card sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Nom du partenaire"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
              />

              <TextField
                fullWidth
                label="Pays"
                value={formData.country}
                onChange={handleChange('country')}
                error={!!errors.country}
                helperText={errors.country}
                required
              />

              <TextField
                fullWidth
                label="Site web"
                value={formData.website}
                onChange={handleChange('website')}
                error={!!errors.website}
                helperText={errors.website || 'URL du site web (optionnel)'}
                placeholder="https://example.com"
              />

              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(routesName.adminForeignStudiesPartners)}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {isEdit ? 'Modifier' : 'Créer'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Card>
      </Container>
    </>
  );
}

