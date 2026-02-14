import { Helmet } from 'react-helmet-async';

import { JobOfferView } from 'src/sections/job-offer/view';

// ----------------------------------------------------------------------

export default function JobOfferPage() {
  return (
    <>
      <Helmet>
        <title> Partenaires | PREVENTIC </title>
      </Helmet>

      <JobOfferView />
    </>
  );
}
