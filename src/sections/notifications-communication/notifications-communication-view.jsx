import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import NotificationsInternesView from './notifications-internes/notifications-internes-view';
import AlertesMedicalesView from './alertes-medicales/alertes-medicales-view';
import RappelsPatientsView from './rappels-patients/rappels-patients-view';
import MessagerieView from './messagerie/messagerie-view';
import HistoriqueEchangesView from './historique-echanges/historique-echanges-view';

// ----------------------------------------------------------------------

export default function NotificationsCommunicationView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/notifications-communication/notifications-internes')) {
      return <NotificationsInternesView />;
    }
    if (pathname.includes('/notifications-communication/alertes-medicales')) {
      return <AlertesMedicalesView />;
    }
    if (pathname.includes('/notifications-communication/rappels')) {
      return <RappelsPatientsView />;
    }
    if (pathname.includes('/notifications-communication/messagerie')) {
      return <MessagerieView />;
    }
    if (pathname.includes('/notifications-communication/historique')) {
      return <HistoriqueEchangesView />;
    }
    
    // Par défaut (pour /notifications-communication), afficher la vue des notifications internes
    if (pathname === '/notifications-communication' || pathname.startsWith('/notifications-communication')) {
      return <NotificationsInternesView />;
    }
    
    return <NotificationsInternesView />;
  };

  return (
    <>
      <Helmet>
        <title> Notifications & Communication | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
