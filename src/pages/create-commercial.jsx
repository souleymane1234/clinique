import { Helmet } from 'react-helmet-async';

import { CommercialCreateView } from 'src/sections/commerciaux';

// ----------------------------------------------------------------------

export default function CreateCommercialPage() {
  return (
    <>
      <Helmet>
        <title> Créer un Commercial | PREVENTIC </title>
      </Helmet>

      <CommercialCreateView />
    </>
  );
}

