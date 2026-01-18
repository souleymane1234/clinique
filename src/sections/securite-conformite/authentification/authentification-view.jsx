import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Card,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';

export default function AuthentificationView() {
  const { contextHolder, showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [passwordComplexity, setPasswordComplexity] = useState('high');
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState(15);

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccess('Succès', 'Paramètres d\'authentification mis à jour avec succès');
    } catch (error) {
      showError('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title> Authentification sécurisée | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Authentification sécurisée</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Configurer les paramètres d&apos;authentification et de sécurité</Typography></Box>
        <Alert severity="info">Les modifications des paramètres d&apos;authentification affectent tous les utilisateurs du système.</Alert>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <FormControlLabel control={<Switch checked={twoFactorAuth} onChange={(e) => setTwoFactorAuth(e.target.checked)} />} label="Authentification à deux facteurs (2FA)" />
            <FormControl fullWidth>
              <InputLabel>Complexité des mots de passe</InputLabel>
              <Select value={passwordComplexity} label="Complexité des mots de passe" onChange={(e) => setPasswordComplexity(e.target.value)}>
                <MenuItem value="low">Faible (8 caractères minimum)</MenuItem>
                <MenuItem value="medium">Moyenne (12 caractères, lettres et chiffres)</MenuItem>
                <MenuItem value="high">Élevée (16 caractères, majuscules, minuscules, chiffres, symboles)</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth type="number" label="Délai d&apos;expiration de session (minutes)" value={sessionTimeout} onChange={(e) => setSessionTimeout(parseInt(e.target.value, 10))} inputProps={{ min: 5, max: 1440 }} />
            <TextField fullWidth type="number" label="Nombre maximum de tentatives de connexion" value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(parseInt(e.target.value, 10))} inputProps={{ min: 3, max: 10 }} />
            <TextField fullWidth type="number" label="Durée de verrouillage après échecs (minutes)" value={lockoutDuration} onChange={(e) => setLockoutDuration(parseInt(e.target.value, 10))} inputProps={{ min: 1, max: 60 }} />
            <LoadingButton variant="contained" size="large" loading={loading} onClick={handleSave} startIcon={<Iconify icon="solar:diskette-bold" />}>Enregistrer les paramètres</LoadingButton>
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
