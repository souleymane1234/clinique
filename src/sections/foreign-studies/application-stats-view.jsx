import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Container,
  Typography,
  Breadcrumbs,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ApplicationStatsView() {
  const navigate = useNavigate();
  const { showApiResponse } = useNotification();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const result = await ConsumApi.getForeignStudiesApplicationsStats();

      if (result.success) {
        setStats(result.data);
      } else {
        showApiResponse(result, {
          errorTitle: 'Erreur de chargement',
        });
      }
    } catch (error) {
      showApiResponse(
        { success: false, message: 'Erreur lors du chargement des statistiques' },
        {
          errorTitle: 'Erreur',
        }
      );
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

  if (!stats) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title> Statistiques des candidatures | AnnourTravel</title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <div>
            <Typography variant="h4" gutterBottom>
              Statistiques des candidatures
            </Typography>
            <Breadcrumbs>
              <Button
                variant="text"
                onClick={() => navigate(routesName.adminForeignStudiesApplications)}
              >
                Candidatures
              </Button>
              <Typography variant="body2" color="text.secondary">
                Statistiques
              </Typography>
            </Breadcrumbs>
          </div>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  }}
                >
                  <Iconify icon="eva:people-fill" width={32} height={32} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total candidatures
                  </Typography>
                  <Typography variant="h4">{stats.total || 0}</Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

