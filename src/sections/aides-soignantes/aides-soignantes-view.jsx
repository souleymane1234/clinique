import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import AideSoignanteTachesView from './aide-soignante-taches/aide-soignante-taches-view';
import AideSoignanteSoinsBaseView from './aide-soignante-soins-base/aide-soignante-soins-base-view';
import AideSoignanteAssistanceView from './aide-soignante-assistance/aide-soignante-assistance-view';
import AideSoignanteNotesView from './aide-soignante-notes/aide-soignante-notes-view';
import AideSoignanteHistoriqueView from './aide-soignante-historique/aide-soignante-historique-view';

// ----------------------------------------------------------------------

export default function AidesSoignantesView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/aides-soignantes/taches')) {
      return <AideSoignanteTachesView />;
    }
    if (pathname.includes('/aides-soignantes/soins-base')) {
      return <AideSoignanteSoinsBaseView />;
    }
    if (pathname.includes('/aides-soignantes/assistance')) {
      return <AideSoignanteAssistanceView />;
    }
    if (pathname.includes('/aides-soignantes/notes')) {
      return <AideSoignanteNotesView />;
    }
    if (pathname.includes('/aides-soignantes/historique')) {
      return <AideSoignanteHistoriqueView />;
    }
    
    // Par défaut (pour /aides-soignantes), afficher la vue des tâches
    if (pathname === '/aides-soignantes' || pathname.startsWith('/aides-soignantes')) {
      return <AideSoignanteTachesView />;
    }
    
    return <AideSoignanteTachesView />;
  };

  return (
    <>
      <Helmet>
        <title> Aides-soignantes | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
