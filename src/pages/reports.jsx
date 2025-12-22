import { Helmet } from 'react-helmet-async';

import ReportsView from 'src/sections/admin/reports/reports-view';

// ----------------------------------------------------------------------

export default function ReportsPage() {
  return (
    <>
      <Helmet>
        <title> Rapports & Statistiques | AnnourTravel </title>
      </Helmet>

      <ReportsView />
    </>
  );
}

