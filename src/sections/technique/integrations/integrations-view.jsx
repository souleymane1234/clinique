import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Stack, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Alert, Grid, Divider } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';

export default function IntegrationsView() {
  const { contextHolder, showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [smsProvider, setSmsProvider] = useState('twilio');
  const [paymentProvider, setPaymentProvider] = useState('stripe');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [paymentApiKey, setPaymentApiKey] = useState('');

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccess('Succès', 'Paramètres d&apos;intégration mis à jour avec succès');
    } catch (error) {
      showError('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title> Intégration SMS et paiements | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Intégration SMS et paiements</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Configurer les intégrations SMS et paiements</Typography></Box>
        <Alert severity="info">Les intégrations permettent d&apos;envoyer des SMS et d&apos;accepter les paiements en ligne.</Alert>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Intégration SMS</Typography>
                  <Chip label={smsEnabled ? 'Active' : 'Inactive'} color={smsEnabled ? 'success' : 'default'} size="small" />
                </Stack>
                <Divider />
                <FormControlLabel control={<Switch checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} />} label="Activer l&apos;envoi de SMS" />
                <FormControl fullWidth>
                  <InputLabel>Fournisseur SMS</InputLabel>
                  <Select value={smsProvider} label="Fournisseur SMS" onChange={(e) => setSmsProvider(e.target.value)}>
                    <MenuItem value="twilio">Twilio</MenuItem>
                    <MenuItem value="nexmo">Nexmo</MenuItem>
                    <MenuItem value="africastalking">Africa&apos;s Talking</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth type="password" label="Clé API SMS" value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} placeholder="Saisir la clé API" />
              </Stack>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Intégration Paiements</Typography>
                  <Chip label={paymentEnabled ? 'Active' : 'Inactive'} color={paymentEnabled ? 'success' : 'default'} size="small" />
                </Stack>
                <Divider />
                <FormControlLabel control={<Switch checked={paymentEnabled} onChange={(e) => setPaymentEnabled(e.target.checked)} />} label="Activer les paiements en ligne" />
                <FormControl fullWidth>
                  <InputLabel>Fournisseur de paiement</InputLabel>
                  <Select value={paymentProvider} label="Fournisseur de paiement" onChange={(e) => setPaymentProvider(e.target.value)}>
                    <MenuItem value="stripe">Stripe</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="momo">Mobile Money</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth type="password" label="Clé API Paiement" value={paymentApiKey} onChange={(e) => setPaymentApiKey(e.target.value)} placeholder="Saisir la clé API" />
              </Stack>
            </Card>
          </Grid>
        </Grid>
        
        <Card sx={{ p: 3 }}>
          <LoadingButton variant="contained" size="large" loading={loading} onClick={handleSave} startIcon={<Iconify icon="solar:diskette-bold" />}>Enregistrer les paramètres</LoadingButton>
        </Card>
      </Stack>
    </>
  );
}
