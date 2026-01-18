import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import ApiView from './api/api-view';
import ApplicationsView from './applications/applications-view';
import IntegrationsView from './integrations/integrations-view';
import MultilingueView from './multilingue/multilingue-view';
import SauvegardesView from './sauvegardes/sauvegardes-view';

// ----------------------------------------------------------------------

export default function TechniqueView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/technique/api')) {
      return <ApiView />;
    }
    if (pathname.includes('/technique/applications')) {
      return <ApplicationsView />;
    }
    if (pathname.includes('/technique/sauvegardes')) {
      return <SauvegardesView />;
    }
    if (pathname.includes('/technique/multilingue')) {
      return <MultilingueView />;
    }
    if (pathname.includes('/technique/integrations')) {
      return <IntegrationsView />;
    }
    
    // Par défaut (pour /technique), afficher la vue API
    if (pathname === '/technique' || pathname.startsWith('/technique')) {
      return <ApiView />;
    }
    
    return <ApiView />;
  };

  return (
    <>
      <Helmet>
        <title> Technique (Transversal) | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
