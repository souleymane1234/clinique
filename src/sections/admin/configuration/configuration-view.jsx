import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { TabList, TabPanel, TabContext, LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Grid,
  Stack,
  Alert,
  Button,
  Switch,
  Divider,
  TextField,
  Container,
  Typography,
  FormControlLabel,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ConfigurationView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();
  
  const [currentTab, setCurrentTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Configurations génériques
  const [configs, setConfigs] = useState({});
  const [newConfigKey, setNewConfigKey] = useState('');
  const [newConfigValue, setNewConfigValue] = useState('');
  const [newConfigDescription, setNewConfigDescription] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState({
    pushEnabled: false,
    emailEnabled: false,
    smsEnabled: false,
  });

  // Passages Limits
  const [passagesLimits, setPassagesLimits] = useState({
    dailyLimit: null,
    weeklyLimit: null,
  });

  // QR Code Validity
  const [qrCodeValidity, setQrCodeValidity] = useState({
    validityMinutes: 15,
  });

  // Station Radius
  const [stationRadius, setStationRadius] = useState({
    minRadiusKm: null,
    maxRadiusKm: null,
  });

  // Charger toutes les configurations au montage
  useEffect(() => {
    loadAllConfigurations();
  }, []);

  const loadAllConfigurations = async () => {
    setLoadingConfig(true);
    try {
      const result = await ConsumApi.getAdministrationConfig();
      const processed = showApiResponse(result, {
        successTitle: 'Configurations chargées',
        errorTitle: 'Erreur de chargement',
      });

      if (processed.success && processed.data) {
        // Organiser les configurations
        const configData = processed.data;
        
        // Extraire les configurations de notifications si elles existent
        if (configData.notifications) {
          setNotifications({
            pushEnabled: configData.notifications.pushEnabled ?? false,
            emailEnabled: configData.notifications.emailEnabled ?? false,
            smsEnabled: configData.notifications.smsEnabled ?? false,
          });
        }

        // Extraire les limites de passages
        if (configData.passages) {
          setPassagesLimits({
            dailyLimit: configData.passages.dailyLimit ?? null,
            weeklyLimit: configData.passages.weeklyLimit ?? null,
          });
        }

        // Extraire la validité QR Code
        if (configData.qrCode) {
          setQrCodeValidity({
            validityMinutes: configData.qrCode.validityMinutes ?? 15,
          });
        }

        // Extraire les rayons des stations
        if (configData.stationRadius) {
          setStationRadius({
            minRadiusKm: configData.stationRadius.minRadiusKm ?? null,
            maxRadiusKm: configData.stationRadius.maxRadiusKm ?? null,
          });
        }

        // Stocker les autres configurations génériques
        setConfigs(configData);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      showError('Erreur', 'Impossible de charger les configurations');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.updateAdministrationConfigNotifications(notifications);
      const processed = showApiResponse(result, {
        successTitle: 'Configuration mise à jour',
        errorTitle: 'Erreur de mise à jour',
      });
      if (processed.success) {
        showSuccess('Succès', 'Configuration des notifications mise à jour avec succès');
      }
    } catch (error) {
      console.error('Error updating notifications config:', error);
      showError('Erreur', 'Impossible de mettre à jour la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassagesLimits = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.updateAdministrationConfigPassagesLimits(passagesLimits);
      const processed = showApiResponse(result, {
        successTitle: 'Configuration mise à jour',
        errorTitle: 'Erreur de mise à jour',
      });
      if (processed.success) {
        showSuccess('Succès', 'Limites de passages mises à jour avec succès');
      }
    } catch (error) {
      console.error('Error updating passages limits:', error);
      showError('Erreur', 'Impossible de mettre à jour la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQRCodeValidity = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.updateAdministrationConfigQRCodeValidity(qrCodeValidity);
      const processed = showApiResponse(result, {
        successTitle: 'Configuration mise à jour',
        errorTitle: 'Erreur de mise à jour',
      });
      if (processed.success) {
        showSuccess('Succès', 'Durée de validité du QR Code mise à jour avec succès');
      }
    } catch (error) {
      console.error('Error updating QR code validity:', error);
      showError('Erreur', 'Impossible de mettre à jour la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStationRadius = async () => {
    if (stationRadius.minRadiusKm && stationRadius.maxRadiusKm && stationRadius.minRadiusKm >= stationRadius.maxRadiusKm) {
      showError('Erreur', 'Le rayon minimum doit être inférieur au rayon maximum');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.updateAdministrationConfigStationRadius(stationRadius);
      const processed = showApiResponse(result, {
        successTitle: 'Configuration mise à jour',
        errorTitle: 'Erreur de mise à jour',
      });
      if (processed.success) {
        showSuccess('Succès', 'Rayons des stations mis à jour avec succès');
      }
    } catch (error) {
      console.error('Error updating station radius:', error);
      showError('Erreur', 'Impossible de mettre à jour la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGenericConfig = async (key, value, description = null) => {
    setLoading(true);
    try {
      const result = await ConsumApi.updateAdministrationConfig(key, value, description);
      const processed = showApiResponse(result, {
        successTitle: 'Configuration mise à jour',
        errorTitle: 'Erreur de mise à jour',
      });
      if (processed.success) {
        showSuccess('Succès', 'Configuration mise à jour avec succès');
        loadAllConfigurations();
      }
    } catch (error) {
      console.error('Error updating generic config:', error);
      showError('Erreur', 'Impossible de mettre à jour la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGenericConfig = async () => {
    if (!newConfigKey || !newConfigValue) {
      showError('Erreur', 'Veuillez remplir la clé et la valeur');
      return;
    }

    await handleUpdateGenericConfig(newConfigKey, newConfigValue, newConfigDescription || null);
    setNewConfigKey('');
    setNewConfigValue('');
    setNewConfigDescription('');
  };

  const renderNotificationsSection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Configurez les canaux de notification disponibles pour les utilisateurs.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Notifications</Typography>
          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={notifications.pushEnabled}
                onChange={(e) => setNotifications({ ...notifications, pushEnabled: e.target.checked })}
              />
            }
            label="Notifications Push activées"
          />

          <FormControlLabel
            control={
              <Switch
                checked={notifications.emailEnabled}
                onChange={(e) => setNotifications({ ...notifications, emailEnabled: e.target.checked })}
              />
            }
            label="Notifications Email activées"
          />

          <FormControlLabel
            control={
              <Switch
                checked={notifications.smsEnabled}
                onChange={(e) => setNotifications({ ...notifications, smsEnabled: e.target.checked })}
              />
            }
            label="Notifications SMS activées"
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <LoadingButton
              variant="contained"
              onClick={handleUpdateNotifications}
              loading={loading}
              startIcon={<Iconify icon="eva:save-outline" />}
            >
              Enregistrer
            </LoadingButton>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );

  const renderPassagesLimitsSection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Définissez les limites de passages par jour et par semaine. La limite hebdomadaire utilise une fenêtre glissante de 7 jours.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Limites de Passages</Typography>
          <Divider />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Limite quotidienne"
                type="number"
                value={passagesLimits.dailyLimit || ''}
                onChange={(e) => setPassagesLimits({ ...passagesLimits, dailyLimit: e.target.value ? parseInt(e.target.value, 10) : null })}
                helperText="Nombre maximum de passages par jour"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Limite hebdomadaire"
                type="number"
                value={passagesLimits.weeklyLimit || ''}
                onChange={(e) => setPassagesLimits({ ...passagesLimits, weeklyLimit: e.target.value ? parseInt(e.target.value, 10) : null })}
                helperText="Nombre maximum de passages par semaine (fenêtre glissante)"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <LoadingButton
              variant="contained"
              onClick={handleUpdatePassagesLimits}
              loading={loading}
              startIcon={<Iconify icon="eva:save-outline" />}
            >
              Enregistrer
            </LoadingButton>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );

  const renderQRCodeValiditySection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Définissez la durée de validité d&apos;un QR Code en minutes après sa génération.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Validité QR Code</Typography>
          <Divider />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Durée de validité (minutes)"
                type="number"
                value={qrCodeValidity.validityMinutes || ''}
                onChange={(e) => setQrCodeValidity({ validityMinutes: e.target.value ? parseInt(e.target.value, 10) : 15 })}
                helperText="Temps en minutes après lequel le QR Code expire"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <LoadingButton
              variant="contained"
              onClick={handleUpdateQRCodeValidity}
              loading={loading}
              startIcon={<Iconify icon="eva:save-outline" />}
            >
              Enregistrer
            </LoadingButton>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );

  const renderStationRadiusSection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Définissez le rayon minimum et maximum pour la détection des stations. Le rayon minimum doit être inférieur au rayon maximum.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Rayon des Stations</Typography>
          <Divider />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rayon minimum (km)"
                type="number"
                value={stationRadius.minRadiusKm || ''}
                onChange={(e) => setStationRadius({ ...stationRadius, minRadiusKm: e.target.value ? parseFloat(e.target.value) : null })}
                helperText="Rayon minimum en kilomètres"
                InputProps={{ inputProps: { min: 0, step: 0.1 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rayon maximum (km)"
                type="number"
                value={stationRadius.maxRadiusKm || ''}
                onChange={(e) => setStationRadius({ ...stationRadius, maxRadiusKm: e.target.value ? parseFloat(e.target.value) : null })}
                helperText="Rayon maximum en kilomètres"
                InputProps={{ inputProps: { min: 0, step: 0.1 } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <LoadingButton
              variant="contained"
              onClick={handleUpdateStationRadius}
              loading={loading}
              startIcon={<Iconify icon="eva:save-outline" />}
            >
              Enregistrer
            </LoadingButton>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );

  const renderGenericConfigSection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Gérez les configurations génériques du système. Vous pouvez créer de nouvelles configurations ou modifier les existantes.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Nouvelle Configuration</Typography>
          <Divider />

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Clé"
                value={newConfigKey}
                onChange={(e) => setNewConfigKey(e.target.value)}
                placeholder="ex: app_version"
                helperText="Nom unique de la configuration"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Valeur"
                value={newConfigValue}
                onChange={(e) => setNewConfigValue(e.target.value)}
                placeholder="ex: 1.0.0"
                helperText="Valeur de la configuration"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Description (optionnel)"
                value={newConfigDescription}
                onChange={(e) => setNewConfigDescription(e.target.value)}
                placeholder="Description de la configuration"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LoadingButton
              variant="contained"
              onClick={handleCreateGenericConfig}
              loading={loading}
              startIcon={<Iconify icon="eva:plus-outline" />}
            >
              Créer
            </LoadingButton>
          </Box>
        </Stack>
      </Card>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Configurations Existantes</Typography>
          <Divider />

          {(() => {
            if (loadingConfig) {
              return <Typography>Chargement...</Typography>;
            }
            if (Object.keys(configs).length === 0) {
              return <Typography color="text.secondary">Aucune configuration trouvée</Typography>;
            }
            return (
              <Stack spacing={2}>
              {Object.entries(configs)
                .filter(([key]) => !['notifications', 'passages', 'qrCode', 'stationRadius'].includes(key))
                .map(([key, value]) => (
                  <Card key={key} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{key}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const newValue = prompt(`Nouvelle valeur pour "${key}":`, typeof value === 'object' ? JSON.stringify(value) : String(value));
                          if (newValue !== null) {
                            handleUpdateGenericConfig(key, newValue);
                          }
                        }}
                      >
                        Modifier
                      </Button>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            );
          })()}
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <>
      <Helmet>
        <title> Configuration Système | AnnourTravel </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Paramétrages Globaux</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gérez les configurations système de l&apos;application
            </Typography>
          </Box>

          <Card>
            <TabContext value={currentTab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                  onChange={(event, newValue) => setCurrentTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab
                    label="Notifications"
                    value="notifications"
                    icon={<Iconify icon="solar:bell-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Limites Passages"
                    value="passages"
                    icon={<Iconify icon="solar:users-group-rounded-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Validité QR Code"
                    value="qr-code"
                    icon={<Iconify icon="solar:qr-code-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Rayon Stations"
                    value="station-radius"
                    icon={<Iconify icon="solar:map-point-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Configurations Génériques"
                    value="generic"
                    icon={<Iconify icon="solar:settings-bold" />}
                    iconPosition="start"
                  />
                </TabList>
              </Box>

              <Box sx={{ p: 3 }}>
                <TabPanel value="notifications" sx={{ p: 0 }}>
                  {renderNotificationsSection()}
                </TabPanel>
                <TabPanel value="passages" sx={{ p: 0 }}>
                  {renderPassagesLimitsSection()}
                </TabPanel>
                <TabPanel value="qr-code" sx={{ p: 0 }}>
                  {renderQRCodeValiditySection()}
                </TabPanel>
                <TabPanel value="station-radius" sx={{ p: 0 }}>
                  {renderStationRadiusSection()}
                </TabPanel>
                <TabPanel value="generic" sx={{ p: 0 }}>
                  {renderGenericConfigSection()}
                </TabPanel>
              </Box>
            </TabContext>
          </Card>
        </Stack>
      </Container>
    </>
  );
}

