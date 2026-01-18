import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import OrdonnancesView from './ordonnances/ordonnances-view';
import ResultatsAnalysesView from './resultats-analyses/resultats-analyses-view';
import FacturesView from './factures/factures-view';
import CertificatsView from './certificats/certificats-view';
import RapportsView from './rapports/rapports-view';
import ExportView from './export/export-view';

// ----------------------------------------------------------------------

export default function DocumentsImpressionsView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/documents-impressions/ordonnances')) {
      return <OrdonnancesView />;
    }
    if (pathname.includes('/documents-impressions/resultats-analyses')) {
      return <ResultatsAnalysesView />;
    }
    if (pathname.includes('/documents-impressions/factures')) {
      return <FacturesView />;
    }
    if (pathname.includes('/documents-impressions/certificats')) {
      return <CertificatsView />;
    }
    if (pathname.includes('/documents-impressions/rapports')) {
      return <RapportsView />;
    }
    if (pathname.includes('/documents-impressions/export')) {
      return <ExportView />;
    }
    
    // Par défaut (pour /documents-impressions), afficher la vue des ordonnances
    if (pathname === '/documents-impressions' || pathname.startsWith('/documents-impressions')) {
      return <OrdonnancesView />;
    }
    
    return <OrdonnancesView />;
  };

  return (
    <>
      <Helmet>
        <title> Documents & Impressions | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
