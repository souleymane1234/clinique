import { Helmet } from 'react-helmet-async';

import { FileActiveView } from 'src/sections/admin/file-active';

// ----------------------------------------------------------------------

export default function FileActivePage() {
  return (
    <>
      <Helmet>
        <title>Gestion des Files Actives | AnnourTravel</title>
      </Helmet>

      <FileActiveView />
    </>
  );
}

