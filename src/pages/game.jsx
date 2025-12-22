import { Helmet } from 'react-helmet-async';

import { GameView } from 'src/sections/game/view';

// ----------------------------------------------------------------------

export default function BlogPage() {
  return (
    <>
      <Helmet>
        <title> Jeux | AnnourTravel </title>
      </Helmet>

      <GameView />
    </>
  );
}
