import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { alpha, useTheme } from '@mui/material/styles';
import {
    Box,
    Card,
    Stack,
    Button,
    Container,
    Typography,
    LinearProgress,
} from '@mui/material';

import { RouterLink } from 'src/routes/components';

import { useNotification } from 'src/hooks/useNotification';

import { fNumber } from 'src/utils/format-number';

// Note: ecoleRoutes has been removed as part of the cleanup
// This file is deprecated and not used in routes
// import { ecoleRoutes } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const StatCard = ({ title, value, icon, color = 'primary', href }) => {
  const theme = useTheme();

  const content = (
    <Card
      sx={{
        p: 3,
        height: '100%',
        transition: 'all 0.3s ease',
        cursor: href ? 'pointer' : 'default',
        '&:hover': href
          ? {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            }
          : {},
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            bgcolor: alpha(theme.palette[color].main, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={32} sx={{ color: theme.palette[color].main }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {fNumber(value)}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {title}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );

  if (href) {
    return (
      <Box
        component={RouterLink}
        to={href}
        sx={{
          textDecoration: 'none',
          display: 'block',
          color: 'inherit',
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string,
  href: PropTypes.string,
};

// ----------------------------------------------------------------------

export default function EcoleDashboardView() {
  const { contextHolder, showApiResponse } = useNotification();

  const [stats, setStats] = useState({
    formations: 0,
    filieres: 0,
    programmes: 0,
    services: 0,
    amenities: 0,
    strengths: 0,
    statistics: 0,
    media: 0,
    directorWords: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [
        formationsResult,
        filieresResult,
        programmesResult,
        servicesResult,
        amenitiesResult,
        strengthsResult,
        statisticsResult,
        mediaResult,
        directorWordsResult,
      ] = await Promise.allSettled([
        ConsumApi.getEcoleFormations(),
        ConsumApi.getEcoleFilieres(),
        ConsumApi.getEcolePrograms(),
        ConsumApi.getEcoleServices(),
        ConsumApi.getEcoleAmenities(),
        ConsumApi.getEcoleStrengths(),
        ConsumApi.getEcoleStatistics(),
        ConsumApi.getEcoleMedia(),
        ConsumApi.getEcoleDirectorWords(),
      ]);

      const newStats = { ...stats };

      if (formationsResult.status === 'fulfilled' && formationsResult.value.success) {
        newStats.formations = formationsResult.value.data?.length || 0;
      }
      if (filieresResult.status === 'fulfilled' && filieresResult.value.success) {
        newStats.filieres = filieresResult.value.data?.length || 0;
      }
      if (programmesResult.status === 'fulfilled' && programmesResult.value.success) {
        newStats.programmes = programmesResult.value.data?.length || 0;
      }
      if (servicesResult.status === 'fulfilled' && servicesResult.value.success) {
        newStats.services = servicesResult.value.data?.length || 0;
      }
      if (amenitiesResult.status === 'fulfilled' && amenitiesResult.value.success) {
        newStats.amenities = amenitiesResult.value.data?.length || 0;
      }
      if (strengthsResult.status === 'fulfilled' && strengthsResult.value.success) {
        newStats.strengths = strengthsResult.value.data?.length || 0;
      }
      if (statisticsResult.status === 'fulfilled' && statisticsResult.value.success) {
        newStats.statistics = statisticsResult.value.data?.length || 0;
      }
      if (mediaResult.status === 'fulfilled' && mediaResult.value.success) {
        newStats.media = mediaResult.value.data?.length || 0;
      }
      if (directorWordsResult.status === 'fulfilled' && directorWordsResult.value.success) {
        newStats.directorWords = directorWordsResult.value.data?.length || 0;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      showApiResponse({ success: false, message: 'Erreur lors du chargement des statistiques' }, { errorTitle: 'Erreur' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box sx={{ py: 5 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Tableau de bord | AnnourTravel </title>
      </Helmet>
      <Container>
        <Stack spacing={4} sx={{ mb: 5 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Tableau de bord
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Vue d&apos;ensemble de votre école
            </Typography>
          </Box>

          {/* Statistiques Cards */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
            }}
          >
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)', lg: '1 1 calc(25% - 18px)' } }}>
              <StatCard
                title="Formations"
                value={stats.formations}
                icon="solar:document-bold"
                color="primary"
                href={undefined}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)', lg: '1 1 calc(25% - 18px)' } }}>
              <StatCard
                title="Filières"
                value={stats.filieres}
                icon="solar:book-bookmark-bold"
                color="info"
                href={undefined}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)', lg: '1 1 calc(25% - 18px)' } }}>
              <StatCard
                title="Programmes"
                value={stats.programmes}
                icon="solar:notebook-bold"
                color="success"
                href={undefined}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)', lg: '1 1 calc(25% - 18px)' } }}>
              <StatCard
                title="Services"
                value={stats.services}
                icon="solar:settings-bold"
                color="warning"
                href={undefined}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)', lg: '1 1 calc(25% - 18px)' } }}>
              <StatCard
                title="Équipements"
                value={stats.amenities}
                icon="solar:home-bold"
                color="secondary"
                href={undefined}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)', lg: '1 1 calc(25% - 18px)' } }}>
              <StatCard
                title="Points forts"
                value={stats.strengths}
                icon="solar:star-bold"
                color="error"
                href={undefined}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)', lg: '1 1 calc(25% - 18px)' } }}>
              <StatCard
                title="Statistiques"
                value={stats.statistics}
                icon="solar:chart-bold"
                color="primary"
                href={undefined}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)', lg: '1 1 calc(25% - 18px)' } }}>
              <StatCard
                title="Médias"
                value={stats.media}
                icon="solar:gallery-bold"
                color="info"
                href={undefined}
              />
            </Box>
          </Box>

          {/* Actions rapides */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
            }}
          >
            <Card
              sx={{
                p: 3,
                flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' },
              }}
            >
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Gestion du profil
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Gérez les informations de votre école
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  <Button
                    component={RouterLink}
                    to={undefined}
                    variant="contained"
                    size="large"
                    startIcon={<Iconify icon="solar:user-bold" />}
                    fullWidth
                  >
                    Modifier mon profil
                  </Button>
                  <Button
                    component={RouterLink}
                    to={undefined}
                    variant="outlined"
                    size="large"
                    startIcon={<Iconify icon="solar:chat-round-bold" />}
                    fullWidth
                  >
                    Mots du directeur
                  </Button>
                </Stack>
              </Stack>
            </Card>

            <Card
              sx={{
                p: 3,
                flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' },
              }}
            >
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Actions rapides
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Créez rapidement de nouveaux contenus
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  <Button
                    component={RouterLink}
                    to={undefined}
                    variant="contained"
                    size="large"
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                    fullWidth
                  >
                    Ajouter une formation
                  </Button>
                  <Button
                    component={RouterLink}
                    to={undefined}
                    variant="outlined"
                    size="large"
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                    fullWidth
                  >
                    Ajouter un programme
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Box>
        </Stack>
      </Container>
    </>
  );
}

