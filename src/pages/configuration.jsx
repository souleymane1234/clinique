import { Helmet } from 'react-helmet-async';

import ConfigurationView from 'src/sections/admin/configuration/configuration-view';

// ----------------------------------------------------------------------

export default function ConfigurationPage() {
  return (
    <>
      <Helmet>
        <title> Configuration Système | AnnourTravel </title>
      </Helmet>

      <ConfigurationView />
    </>
  );
}

