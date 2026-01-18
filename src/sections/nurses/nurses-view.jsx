import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import NursePlanningView from './nurse-planning/nurse-planning-view';
import NurseTraitementsView from './nurse-traitements/nurse-traitements-view';
import NurseSignesVitauxView from './nurse-signes-vitaux/nurse-signes-vitaux-view';
import NurseNotesView from './nurse-notes/nurse-notes-view';
import NurseValidationView from './nurse-validation/nurse-validation-view';
import NurseAlertesView from './nurse-alertes/nurse-alertes-view';

// ----------------------------------------------------------------------

export default function NursesView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/nurses/planning')) {
      return <NursePlanningView />;
    }
    if (pathname.includes('/nurses/traitements')) {
      return <NurseTraitementsView />;
    }
    if (pathname.includes('/nurses/signes-vitaux')) {
      return <NurseSignesVitauxView />;
    }
    if (pathname.includes('/nurses/notes')) {
      return <NurseNotesView />;
    }
    if (pathname.includes('/nurses/validation')) {
      return <NurseValidationView />;
    }
    if (pathname.includes('/nurses/alertes')) {
      return <NurseAlertesView />;
    }
    
    // Par défaut (pour /nurses), afficher la vue du planning
    if (pathname === '/nurses' || pathname.startsWith('/nurses')) {
      return <NursePlanningView />;
    }
    
    return <NursePlanningView />;
  };

  return (
    <>
      <Helmet>
        <title> Infirmiers | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
