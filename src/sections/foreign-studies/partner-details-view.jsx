import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Divider,
  Container,
  Typography,
  Breadcrumbs,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function PartnerDetailsView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showApiResponse } = useNotification();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    fetchPartner();
  }, [id]);

  const fetchPartner = async () => {
    try {
      setLoading(true);
      const result = await ConsumApi.getForeignStudiesPartnerById(id);

      if (result.success) {
        setPartner(result.data);
      } else {
        showApiResponse(result, {
          errorTitle: 'Erreur de chargement',
        });
        navigate(routesName.adminForeignStudiesPartners);
      }
    } catch (error) {
      showApiResponse(
        { success: false, message: 'Erreur lors du chargement du partenaire' },
        {
          errorTitle: 'Erreur',
        }
      );
      navigate(routesName.adminForeignStudiesPartners);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Chargement...</Typography>
      </Container>
    );
  }

  if (!partner) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title> Détails du partenaire | AnnourTravel</title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <div>
            <Typography variant="h4" gutterBottom>
              {partner.name}
            </Typography>
            <Breadcrumbs>
              <Button
                variant="text"
                onClick={() => navigate(routesName.adminForeignStudiesPartners)}
              >
                Partenaires
              </Button>
              <Typography variant="body2" color="text.secondary">
                Détails
              </Typography>
            </Breadcrumbs>
          </div>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:edit-fill" />}
            onClick={() => navigate(`${routesName.adminForeignStudiesPartnerEdit.replace(':id', id)}`)}
          >
            Modifier
          </Button>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informations du partenaire
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nom
                  </Typography>
                  <Typography variant="body1">{partner.name}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pays
                  </Typography>
                  <Typography variant="body1">{partner.country}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Site web
                  </Typography>
                  {partner.website ? (
                    <a href={partner.website} target="_blank" rel="noopener noreferrer">
                      {partner.website}
                    </a>
                  ) : (
                    <Typography variant="body1">-</Typography>
                  )}
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nombre de candidatures
                  </Typography>
                  <Typography variant="h4">{partner.applicationsCount || 0}</Typography>
                </Box>
              </Stack>

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 3 }}
                onClick={() => navigate(`${routesName.adminForeignStudiesApplications}?partnerId=${id}`)}
              >
                Voir les candidatures
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

