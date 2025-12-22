import { Helmet } from 'react-helmet-async';

import { CreateActualityView } from 'src/sections/game/view';

// ----------------------------------------------------------------------

export default function CreateActualityPage() {
  return (
    <>
      <Helmet>
        <title> Création Formation | AnnourTravel </title>
      </Helmet>

      <CreateActualityView />
    </>
  );
}
