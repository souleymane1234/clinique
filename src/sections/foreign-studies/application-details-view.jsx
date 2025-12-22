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


// ----------------------------------------------------------------------

export default function ApplicationDetailsView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showApiResponse } = useNotification();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const result = await ConsumApi.getForeignStudiesApplicationById(id);

      if (result.success) {
        setApplication(result.data);
      } else {
        showApiResponse(result, {
          errorTitle: 'Erreur de chargement',
        });
        navigate(routesName.adminForeignStudiesApplications);
      }
    } catch (error) {
      showApiResponse(
        { success: false, message: 'Erreur lors du chargement de la candidature' },
        {
          errorTitle: 'Erreur',
        }
      );
      navigate(routesName.adminForeignStudiesApplications);
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

  if (!application) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title> Détails de la candidature | AnnourTravel</title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <div>
            <Typography variant="h4" gutterBottom>
              Détails de la candidature
            </Typography>
            <Breadcrumbs>
              <Button
                variant="text"
                onClick={() => navigate(routesName.adminForeignStudiesApplications)}
              >
                Candidatures
              </Button>
              <Typography variant="body2" color="text.secondary">
                Détails
              </Typography>
            </Breadcrumbs>
          </div>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informations de la candidature
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Statut
                  </Typography>
                  <Typography variant="body1">{application.status}</Typography>
                </Box>

                {application.student && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Étudiant
                    </Typography>
                    <Typography variant="body1">{application.student.email}</Typography>
                  </Box>
                )}

                {application.partner && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Partenaire
                    </Typography>
                    <Typography variant="body1">{application.partner.name}</Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

