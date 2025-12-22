import { Helmet } from 'react-helmet-async';

import { AdminCriticalView } from 'src/sections/admin/critical';

// ----------------------------------------------------------------------

export default function AdminCriticalPage() {
  return (
    <>
      <Helmet>
        <title>Actions Critiques | AnnourTravel</title>
      </Helmet>

      <AdminCriticalView />
    </>
  );
}

