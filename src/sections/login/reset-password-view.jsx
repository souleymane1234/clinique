import { notification } from 'antd';
import { useState, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MuiAlert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';

import { bgGradient } from 'src/theme/css';
import ConsumApi from 'src/services_workers/consum_api';
// import { localStorageKey } from 'src/constants/localStorageKey';

import Logo from 'src/assets/logo.jpeg';
// ----------------------------------------------------------------------

const Alert = forwardRef((props, ref) => (
  <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
));

export default function ResetPasswordView() {
  const theme = useTheme();

  const router = useRouter();

  const [notificationSys, contextHolderNotification] = notification.useNotification();
  const [isVerify, changeIsVerify] = useState(false);
  const [email, setEmail] = useState('');
  const [stateAuthentication, setStateAuthentication] = useState('');
  const [authenticationMessage, setAuthenticationMessage] = useState('');

  const [openAlert, setOpenAlert] = useState(false);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenAlert(false);
  };

  const handleClick = async () => {
    if (email.indexOf('@') !== -1) {
      changeIsVerify(true);
      const loggedInfo = await ConsumApi.resetPassword({ email });
      changeIsVerify(false);
      if (loggedInfo.success) {
        notificationSys.info({
          message: 'Mot de passe réinitialisé avec succès',
          placement: 'topRight',
        });
        router.push('/login');
      } else {
        setStateAuthentication('error');
        setAuthenticationMessage(loggedInfo.error);
        setOpenAlert(true);
      }
    } else {
      setStateAuthentication('error');
      setAuthenticationMessage('Email ou mot de passe incorrecte');
      setOpenAlert(true);
    }
  };

  const renderForm = (
    <>
      {contextHolderNotification}
      <Stack spacing={3}>
        {contextHolderNotification}
        <TextField
          value={email}
          onChange={(event) => {
            setEmail(event.target.value.trim());
          }}
          name="email"
          type="email"
          label="Email address"
        />
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ my: 3 }}>
        <Link href="/login" variant="subtitle2" underline="hover">
          Revenir à la page de connexion ?
        </Link>
      </Stack>

      <LoadingButton
        fullWidth
        loading={isVerify}
        size="large"
        type="submit"
        variant="contained"
        color="inherit"
        onClick={handleClick}
      >
        Réinitialiser
      </LoadingButton>
    </>
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

            <img alt="Logo" src={Logo} style={{ width: '40%', margin: 5 }} />
          </Stack>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              MOT DE PASSE OUBLIÉ
            </Typography>
          </Divider>

          {renderForm}
        </Card>
      </Stack>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={openAlert}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity={stateAuthentication} sx={{ width: '100%' }}>
          {authenticationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
