import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import CaisseFacturesView from './caisse-factures/caisse-factures-view';
import CaisseFacturationServiceView from './caisse-facturation-service/caisse-facturation-service-view';
import CaissePaiementsView from './caisse-paiements/caisse-paiements-view';
import CaisseTicketsRecusView from './caisse-tickets-recus/caisse-tickets-recus-view';
import CaisseImpayesView from './caisse-impayes/caisse-impayes-view';
import CaisseClotureView from './caisse-cloture/caisse-cloture-view';
import CaisseHistoriqueView from './caisse-historique/caisse-historique-view';

// ----------------------------------------------------------------------

export default function CaisseFacturationView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/caisse/factures')) {
      return <CaisseFacturesView />;
    }
    if (pathname.includes('/caisse/facturation-service')) {
      return <CaisseFacturationServiceView />;
    }
    if (pathname.includes('/caisse/paiements')) {
      return <CaissePaiementsView />;
    }
    if (pathname.includes('/caisse/tickets-recus')) {
      return <CaisseTicketsRecusView />;
    }
    if (pathname.includes('/caisse/impayes')) {
      return <CaisseImpayesView />;
    }
    if (pathname.includes('/caisse/cloture')) {
      return <CaisseClotureView />;
    }
    if (pathname.includes('/caisse/historique')) {
      return <CaisseHistoriqueView />;
    }
    
    // Par défaut (pour /caisse), afficher la vue des factures
    if (pathname === '/caisse' || pathname.startsWith('/caisse')) {
      return <CaisseFacturesView />;
    }
    
    return <CaisseFacturesView />;
  };

  return (
    <>
      <Helmet>
        <title> Caisse / Facturation | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
