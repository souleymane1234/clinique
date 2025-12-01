import { Navigate } from 'react-router-dom';

import { routesName } from 'src/constants/routes';
import { useAdminStore } from 'src/store/useAdminStore';
import navConfig from 'src/layouts/dashboard/config-navigation';

// ----------------------------------------------------------------------

export default function AppPage() {
  const { admin } = useAdminStore();

  // Trouver la première page disponible dans la navigation selon le rôle
  const getFirstAvailablePage = () => {
    if (!admin || !admin.role) {
      return routesName.admin; // Par défaut, le dashboard admin
    }

    // Filtrer les items de navigation selon le rôle de l'admin
    const availableItems = navConfig.filter((item) => {
      // Si l'item n'a pas de protection, il est accessible à tous
      if (!item.protected) {
        return true;
      }
      // Si l'item est protégé, vérifier si le rôle de l'admin est inclus
      return item.protected.includes(admin.role);
    });

    // Retourner le chemin du premier item disponible
    if (availableItems.length > 0) {
      return availableItems[0].path;
    }

    // Fallback selon le rôle
    if (admin.role === 'SUPERADMIN' || admin.role === 'ADMIN') {
      return routesName.admin;
    }
    if (admin.role === 'STATION') {
      return routesName.admin; // Peut être changé pour un dashboard spécifique station
    }

    // Fallback par défaut
    return routesName.admin;
  };

  const firstPage = getFirstAvailablePage();

  // Rediriger automatiquement vers la première page
  return <Navigate to={firstPage} replace />;
}
