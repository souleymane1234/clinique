import { Helmet } from 'react-helmet-async';

import { VotingView } from 'src/sections/voting/view';

// ----------------------------------------------------------------------

export default function VotingPage() {
  return (
    <>
      <Helmet>
        <title> Clients | PREVENTIC </title>
      </Helmet>

      <VotingView />
    </>
  );
}
