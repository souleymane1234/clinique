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

export default function FileDetailsView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showApiResponse } = useNotification();

  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchFile();
  }, [id]);

  const fetchFile = async () => {
    try {
      setLoading(true);
      const result = await ConsumApi.getForeignStudiesFileById(id);

      if (result.success) {
        setFile(result.data);
      } else {
        showApiResponse(result, {
          errorTitle: 'Erreur de chargement',
        });
        navigate(routesName.adminForeignStudiesFiles);
      }
    } catch (error) {
      showApiResponse(
        { success: false, message: 'Erreur lors du chargement du dossier' },
        {
          errorTitle: 'Erreur',
        }
      );
      navigate(routesName.adminForeignStudiesFiles);
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

  if (!file) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title> Détails du dossier | AnnourTravel</title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <div>
            <Typography variant="h4" gutterBottom>
              Détails du dossier
            </Typography>
            <Breadcrumbs>
              <Button
                variant="text"
                onClick={() => navigate(routesName.adminForeignStudiesFiles)}
              >
                Dossiers
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
                Informations du dossier
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pays de destination
                  </Typography>
                  <Typography variant="body1">{file.targetCountry}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Statut
                  </Typography>
                  <Typography variant="body1">{file.status}</Typography>
                </Box>

                {file.student && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Étudiant
                    </Typography>
                    <Typography variant="body1">{file.student.email}</Typography>
                  </Box>
                )}
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
                  <Typography variant="h4">{file.applicationsCount || 0}</Typography>
                </Box>
              </Stack>

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 3 }}
                onClick={() => navigate(`${routesName.adminForeignStudiesApplications}?fileId=${id}`)}
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

