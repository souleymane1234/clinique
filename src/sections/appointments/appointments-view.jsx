import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import AppointmentsGestionView from './appointments-gestion/appointments-gestion-view';
import AppointmentsAgendaView from './appointments-agenda/appointments-agenda-view';
import AppointmentsNotificationsView from './appointments-notifications/appointments-notifications-view';
import AppointmentsUrgencesView from './appointments-urgences/appointments-urgences-view';

// ----------------------------------------------------------------------

export default function AppointmentsView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/appointments/gestion')) {
      return <AppointmentsGestionView />;
    }
    if (pathname.includes('/appointments/agenda')) {
      return <AppointmentsAgendaView />;
    }
    if (pathname.includes('/appointments/notifications')) {
      return <AppointmentsNotificationsView />;
    }
    if (pathname.includes('/appointments/urgences')) {
      return <AppointmentsUrgencesView />;
    }
    
    // Par défaut (pour /appointments), afficher la vue de gestion
    if (pathname === '/appointments' || pathname.startsWith('/appointments')) {
      return <AppointmentsGestionView />;
    }
    
    return <AppointmentsGestionView />;
  };

  return (
    <>
      <Helmet>
        <title> Rendez-vous & Planning | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
