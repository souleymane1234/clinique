import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Stack, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Alert, Grid, Divider } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';

export default function ApiView() {
  const { contextHolder, showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [apiType, setApiType] = useState('rest');
  const [apiEnabled, setApiEnabled] = useState(true);
  const [graphqlEnabled, setGraphqlEnabled] = useState(true);
  const [rateLimit, setRateLimit] = useState(1000);
  const [timeout, setTimeout] = useState(30);

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccess('Succès', 'Paramètres API mis à jour avec succès');
    } catch (error) {
      showError('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title> API REST / GraphQL | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">API REST / GraphQL</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Configuration et gestion des APIs REST et GraphQL</Typography></Box>
        <Alert severity="info">Les APIs permettent l&apos;intégration avec des systèmes externes et des applications tierces.</Alert>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <FormControlLabel control={<Switch checked={apiEnabled} onChange={(e) => setApiEnabled(e.target.checked)} />} label="Activer l&apos;API REST" />
            <FormControlLabel control={<Switch checked={graphqlEnabled} onChange={(e) => setGraphqlEnabled(e.target.checked)} />} label="Activer l&apos;API GraphQL" />
            <FormControl fullWidth>
              <InputLabel>Type d&apos;API par défaut</InputLabel>
              <Select value={apiType} label="Type d'API par défaut" onChange={(e) => setApiType(e.target.value)}>
                <MenuItem value="rest">REST</MenuItem>
                <MenuItem value="graphql">GraphQL</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth type="number" label="Limite de requêtes par heure" value={rateLimit} onChange={(e) => setRateLimit(parseInt(e.target.value, 10))} inputProps={{ min: 100, max: 10000 }} />
            <TextField fullWidth type="number" label="Timeout des requêtes (secondes)" value={timeout} onChange={(e) => setTimeout(parseInt(e.target.value, 10))} inputProps={{ min: 5, max: 300 }} />
            <LoadingButton variant="contained" size="large" loading={loading} onClick={handleSave} startIcon={<Iconify icon="solar:diskette-bold" />}>Enregistrer les paramètres</LoadingButton>
          </Stack>
        </Card>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Iconify icon="solar:code-bold" width={40} sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2">API REST</Typography>
                    <Chip label={apiEnabled ? 'Active' : 'Inactive'} color={apiEnabled ? 'success' : 'default'} size="small" />
                  </Box>
                </Stack>
                <Divider />
                <Typography variant="body2" color="text.secondary">Endpoint: /api/v1</Typography>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Iconify icon="solar:code-2-bold" width={40} sx={{ color: 'info.main' }} />
                  <Box>
                    <Typography variant="subtitle2">API GraphQL</Typography>
                    <Chip label={graphqlEnabled ? 'Active' : 'Inactive'} color={graphqlEnabled ? 'success' : 'default'} size="small" />
                  </Box>
                </Stack>
                <Divider />
                <Typography variant="body2" color="text.secondary">Endpoint: /graphql</Typography>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}
