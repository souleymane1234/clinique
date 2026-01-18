import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import AuthentificationView from './authentification/authentification-view';
import GestionAccesView from './gestion-acces/gestion-acces-view';
import ChiffrementView from './chiffrement/chiffrement-view';
import TraçabiliteView from './traçabilite/traçabilite-view';
import ConformiteView from './conformite/conformite-view';

// ----------------------------------------------------------------------

export default function SecuriteConformiteView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/securite-conformite/authentification')) {
      return <AuthentificationView />;
    }
    if (pathname.includes('/securite-conformite/gestion-acces')) {
      return <GestionAccesView />;
    }
    if (pathname.includes('/securite-conformite/chiffrement')) {
      return <ChiffrementView />;
    }
    if (pathname.includes('/securite-conformite/traçabilite')) {
      return <TraçabiliteView />;
    }
    if (pathname.includes('/securite-conformite/conformite')) {
      return <ConformiteView />;
    }
    
    // Par défaut (pour /securite-conformite), afficher la vue d'authentification
    if (pathname === '/securite-conformite' || pathname.startsWith('/securite-conformite')) {
      return <AuthentificationView />;
    }
    
    return <AuthentificationView />;
  };

  return (
    <>
      <Helmet>
        <title> Sécurité & Conformité | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
