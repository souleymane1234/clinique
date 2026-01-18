import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import ManagerDashboardView from './manager-dashboard/manager-dashboard-view';
import ManagerStatistiquesView from './manager-statistiques/manager-statistiques-view';
import ManagerPerformancesView from './manager-performances/manager-performances-view';
import ManagerRapportsView from './manager-rapports/manager-rapports-view';
import ManagerStocksView from './manager-stocks/manager-stocks-view';
import ManagerAuditView from './manager-audit/manager-audit-view';

// ----------------------------------------------------------------------

export default function ManagerView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    // Vérifier les routes les plus spécifiques en premier
    if (pathname.includes('/manager/dashboard')) {
      return <ManagerDashboardView />;
    }
    if (pathname.includes('/manager/statistiques')) {
      return <ManagerStatistiquesView />;
    }
    if (pathname.includes('/manager/performances')) {
      return <ManagerPerformancesView />;
    }
    if (pathname.includes('/manager/rapports')) {
      return <ManagerRapportsView />;
    }
    if (pathname.includes('/manager/stocks')) {
      return <ManagerStocksView />;
    }
    if (pathname.includes('/manager/audit')) {
      return <ManagerAuditView />;
    }
    
    // Par défaut (pour /manager), afficher le tableau de bord
    if (pathname === '/manager' || pathname.startsWith('/manager')) {
      return <ManagerDashboardView />;
    }
    
    return <ManagerDashboardView />;
  };

  return (
    <>
      <Helmet>
        <title> Gestionnaire / Direction | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
