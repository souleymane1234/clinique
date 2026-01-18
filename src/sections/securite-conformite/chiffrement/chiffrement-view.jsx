import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Stack, Typography, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Alert, Grid } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';

export default function ChiffrementView() {
  const { contextHolder, showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [algorithm, setAlgorithm] = useState('AES-256');
  const [encryptDatabase, setEncryptDatabase] = useState(true);
  const [encryptBackups, setEncryptBackups] = useState(true);
  const [encryptTransmission, setEncryptTransmission] = useState(true);

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccess('Succès', 'Paramètres de chiffrement mis à jour avec succès');
    } catch (error) {
      showError('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title> Chiffrement des données | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Chiffrement des données</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Configurer le chiffrement des données sensibles</Typography></Box>
        <Alert severity="warning">Le chiffrement est activé par défaut pour garantir la sécurité des données médicales.</Alert>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <FormControlLabel control={<Switch checked={encryptionEnabled} onChange={(e) => setEncryptionEnabled(e.target.checked)} />} label="Activer le chiffrement des données" />
            {encryptionEnabled && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Algorithme de chiffrement</InputLabel>
                  <Select value={algorithm} label="Algorithme de chiffrement" onChange={(e) => setAlgorithm(e.target.value)}>
                    <MenuItem value="AES-256">AES-256 (Recommandé)</MenuItem>
                    <MenuItem value="AES-128">AES-128</MenuItem>
                    <MenuItem value="RSA-2048">RSA-2048</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel control={<Switch checked={encryptDatabase} onChange={(e) => setEncryptDatabase(e.target.checked)} />} label="Chiffrer la base de données" />
                <FormControlLabel control={<Switch checked={encryptBackups} onChange={(e) => setEncryptBackups(e.target.checked)} />} label="Chiffrer les sauvegardes" />
                <FormControlLabel control={<Switch checked={encryptTransmission} onChange={(e) => setEncryptTransmission(e.target.checked)} />} label="Chiffrer les transmissions (HTTPS/TLS)" />
              </>
            )}
            <LoadingButton variant="contained" size="large" loading={loading} onClick={handleSave} startIcon={<Iconify icon="solar:diskette-bold" />}>Enregistrer les paramètres</LoadingButton>
          </Stack>
        </Card>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Iconify icon="solar:shield-check-bold" width={40} sx={{ color: 'success.main' }} />
                <Box>
                  <Typography variant="subtitle2">État du chiffrement</Typography>
                  <Chip label={encryptionEnabled ? 'Actif' : 'Inactif'} color={encryptionEnabled ? 'success' : 'default'} size="small" />
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Iconify icon="solar:key-bold" width={40} sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2">Algorithme</Typography>
                  <Typography variant="body2" color="text.secondary">{algorithm}</Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}
