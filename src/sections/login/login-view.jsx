import { useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { bgGradient } from 'src/theme/css';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// Logo importé depuis le dossier public
const Logo = '/assets/logo.jpg';

// ----------------------------------------------------------------------

export default function LoginView() {
  const theme = useTheme();
  const router = useRouter();
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [showPassword, setShowPassword] = useState(false);
  const [isVerify, changeIsVerify] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation des champs
    if (!email || email.indexOf('@') === -1) {
      showError('Email invalide', 'Veuillez entrer une adresse email valide');
      return;
    }

    if (!password || password.length < 5) {
      showError('Mot de passe invalide', 'Le mot de passe doit contenir au moins 5 caractères');
      return;
    }

    changeIsVerify(true);
    try {
      const response = await ConsumApi.login({ email, password });

      // Traiter la réponse et afficher la notification
      const result = showApiResponse(response, {
        successTitle: 'Connexion réussie',
        errorTitle: 'Erreur de connexion',
      });

      if (result.success && result.data) {
        // Récupérer les données utilisateur
        console.log('Utilisateur connecté:', result.data);

        // Rediriger vers le tableau de bord après un court délai
        setTimeout(() => {
          router.push('/');
        }, 500);
      }
    } catch (error) {
      console.error('Login error:', error);
      showError(
        'Erreur de connexion',
        error?.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.'
      );
    } finally {
      changeIsVerify(false);
    }
  };

  const renderForm = (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          value={email}
          onChange={(event) => {
            setEmail(event.target.value.trim());
          }}
          name="email"
          type="email"
          label="Email address"
          required
          autoComplete="email"
          disabled={isVerify}
        />

        <TextField
          name="password"
          label="Mot de passe"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value.trim());
          }}
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="current-password"
          disabled={isVerify}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => setShowPassword(!showPassword)} 
                  edge="end"
                  disabled={isVerify}
                >
                  <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ my: 3 }}>
        <Link href="/reset-password" variant="subtitle2" underline="hover">
          Mot de passe oublié ?
        </Link>
      </Stack>

      <LoadingButton
        fullWidth
        loading={isVerify}
        size="large"
        type="submit"
        variant="contained"
        color="inherit"
        disabled={isVerify}
      >
        Connexion
      </LoadingButton>
    </form>
  );

  return (
    <Box
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.background.default, 0.9),
          imgUrl: '/assets/background/overlay_4.jpg',
        }),
        height: 1,
      }}
    >
      {contextHolder}
      <Stack alignItems="center" justifyContent="center" sx={{ height: 1 }}>
        <Card
          sx={{
            p: 5,
            width: 1,
            maxWidth: 520,
          }}
        >
          <Stack alignItems="center" justifyContent="center">
            <Typography variant="h4">Administration</Typography>

            <img alt="Logo AlloEcole" src={Logo} style={{ width: '40%', margin: 5 }} />
          </Stack>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              BIENVENUE
            </Typography>
          </Divider>

          {renderForm}
        </Card>
      </Stack>
    </Box>
  );
}
