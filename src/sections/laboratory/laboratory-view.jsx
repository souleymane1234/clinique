import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import LaboratoryPrescriptionsView from './laboratory-prescriptions/laboratory-prescriptions-view';
import LaboratoryAnalysesView from './laboratory-analyses/laboratory-analyses-view';
import LaboratoryResultatsView from './laboratory-resultats/laboratory-resultats-view';
import LaboratoryTransmissionView from './laboratory-transmission/laboratory-transmission-view';
import LaboratoryImpressionView from './laboratory-impression/laboratory-impression-view';
import LaboratoryConsommablesView from './laboratory-consommables/laboratory-consommables-view';
import LaboratoryStatistiquesView from './laboratory-statistiques/laboratory-statistiques-view';

// ----------------------------------------------------------------------

export default function LaboratoryView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/laboratory/prescriptions')) {
      return <LaboratoryPrescriptionsView />;
    }
    if (pathname.includes('/laboratory/analyses')) {
      return <LaboratoryAnalysesView />;
    }
    if (pathname.includes('/laboratory/resultats')) {
      return <LaboratoryResultatsView />;
    }
    if (pathname.includes('/laboratory/transmission')) {
      return <LaboratoryTransmissionView />;
    }
    if (pathname.includes('/laboratory/impression')) {
      return <LaboratoryImpressionView />;
    }
    if (pathname.includes('/laboratory/consommables')) {
      return <LaboratoryConsommablesView />;
    }
    if (pathname.includes('/laboratory/statistiques')) {
      return <LaboratoryStatistiquesView />;
    }
    
    // Par défaut (pour /laboratory), afficher la vue des prescriptions
    if (pathname === '/laboratory' || pathname.startsWith('/laboratory')) {
      return <LaboratoryPrescriptionsView />;
    }
    
    return <LaboratoryPrescriptionsView />;
  };

  return (
    <>
      <Helmet>
        <title> Laboratoire | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
