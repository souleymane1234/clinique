import { Helmet } from 'react-helmet-async';

import { ResetPasswordView } from 'src/sections/login';

// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title> Mot de passe Oublié | AnnourTravel </title>
      </Helmet>

      <ResetPasswordView />
    </>
  );
}
