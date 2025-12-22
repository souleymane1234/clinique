import { Helmet } from 'react-helmet-async';

import { AdministrationAdminsView } from 'src/sections/admin/administration-admins';

// ----------------------------------------------------------------------

export default function AdministrationAdminsPage() {
  return (
    <>
      <Helmet>
        <title>Gestion des Administrateurs | AnnourTravel</title>
      </Helmet>

      <AdministrationAdminsView />
    </>
  );
}

