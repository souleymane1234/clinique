import { Helmet } from 'react-helmet-async';

import { Container } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

// Import des vues
import UsersView from '../users/users-view';
import RolesPermissionsView from '../roles-permissions/roles-permissions-view';
import ConfigurationView from '../configuration/configuration-view';
import ActivityLogView from '../activity-log/activity-log-view';
import BackupRestoreView from '../backup-restore/backup-restore-view';
import MultiClinicsView from '../multi-clinics/multi-clinics-view';
import ServicesListView from '../../site-admin/services-list-view';

// ----------------------------------------------------------------------

export default function AdministrationView() {
  const pathname = usePathname();

  // Déterminer quelle vue afficher selon la route
  const renderContent = () => {
    if (pathname.includes('/users')) {
      return <UsersView />;
    }
    if (pathname.includes('/roles-permissions')) {
      return <RolesPermissionsView />;
    }
    if (pathname.includes('/configuration')) {
      return <ConfigurationView />;
    }
    if (pathname.includes('/site/services')) {
      return <ServicesListView />;
    }
    if (pathname.includes('/activity-log')) {
      return <ActivityLogView />;
    }
    if (pathname.includes('/backup-restore')) {
      return <BackupRestoreView />;
    }
    if (pathname.includes('/multi-clinics')) {
      return <MultiClinicsView />;
    }
    
    // Par défaut, afficher la vue des utilisateurs
    return <UsersView />;
  };

  return (
    <>
      <Helmet>
        <title> Administration &amp; Paramétrage | Clinique </title>
      </Helmet>

      <Container maxWidth="xl">
        {renderContent()}
      </Container>
    </>
  );
}
