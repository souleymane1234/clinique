import { Helmet } from 'react-helmet-async';

import FacturesByCategoryView from 'src/sections/facturation/factures-by-category-view';

// ----------------------------------------------------------------------

export default function FacturesByCategoryPage() {
  return (
    <>
      <Helmet>
        <title> Factures par Catégorie | AnnourTravel </title>
      </Helmet>

      <FacturesByCategoryView />
    </>
  );
}
