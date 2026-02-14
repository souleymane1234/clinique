import { Helmet } from 'react-helmet-async';

import CreateFactureProformaView from 'src/sections/facturation/create-facture-proforma-view';

// ----------------------------------------------------------------------

export default function CreateFactureProformaPage() {
  return (
    <>
      <Helmet>
        <title> Créer Facture Proforma | PREVENTIC </title>
      </Helmet>

      <CreateFactureProformaView />
    </>
  );
}
