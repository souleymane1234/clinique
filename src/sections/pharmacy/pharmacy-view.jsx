import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import PharmacyStocksView from './pharmacy-stocks/pharmacy-stocks-view';
import PharmacyEntreesSortiesView from './pharmacy-entrees-sorties/pharmacy-entrees-sorties-view';
import PharmacyAlertesView from './pharmacy-alertes/pharmacy-alertes-view';
import PharmacyDispensationView from './pharmacy-dispensation/pharmacy-dispensation-view';
import PharmacyTarificationView from './pharmacy-tarification/pharmacy-tarification-view';
import PharmacyFournisseursView from './pharmacy-fournisseurs/pharmacy-fournisseurs-view';
import PharmacyInventaireView from './pharmacy-inventaire/pharmacy-inventaire-view';

// ----------------------------------------------------------------------

export default function PharmacyView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/pharmacy/stocks')) {
      return <PharmacyStocksView />;
    }
    if (pathname.includes('/pharmacy/entrees-sorties')) {
      return <PharmacyEntreesSortiesView />;
    }
    if (pathname.includes('/pharmacy/alertes')) {
      return <PharmacyAlertesView />;
    }
    if (pathname.includes('/pharmacy/dispensation')) {
      return <PharmacyDispensationView />;
    }
    if (pathname.includes('/pharmacy/tarification')) {
      return <PharmacyTarificationView />;
    }
    if (pathname.includes('/pharmacy/fournisseurs')) {
      return <PharmacyFournisseursView />;
    }
    if (pathname.includes('/pharmacy/inventaire')) {
      return <PharmacyInventaireView />;
    }
    
    // Par défaut (pour /pharmacy), afficher la vue des stocks
    if (pathname === '/pharmacy' || pathname.startsWith('/pharmacy')) {
      return <PharmacyStocksView />;
    }
    
    return <PharmacyStocksView />;
  };

  return (
    <>
      <Helmet>
        <title> Pharmacie | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
