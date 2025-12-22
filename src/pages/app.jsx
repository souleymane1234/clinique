import { Navigate } from 'react-router-dom';

import { routesName } from 'src/constants/routes';
import { useAdminStore } from 'src/store/useAdminStore';
import navConfig from 'src/layouts/dashboard/config-navigation';

// ----------------------------------------------------------------------

// Fonction pour normaliser le rôle
const normalizeRole = (roleSource) => {
  if (!roleSource) return '';
  let adminRole = String(roleSource).trim().toUpperCase();
  
  // Gérer les cas spéciaux de normalisation
  if (adminRole.includes('ADMINISTRATEUR') && adminRole.includes('SITE') && adminRole.includes('WEB')) {
    adminRole = 'ADMIN_SITE_WEB';
  }
  return adminRole.replace(/\s+/g, '_');
};

// Fonction pour obtenir le premier onglet accessible selon le rôle
const getFirstAccessibleRoute = (admin) => {
  if (!admin) return routesName.clients;
  
  const roleSource = admin.role || admin.service || '';
  const adminRole = normalizeRole(roleSource);
  
  // Parcourir la configuration de navigation (en excluant le tableau de bord)
  const accessibleItems = navConfig
    .filter((item) => item.title !== 'Tableau de bord')
    .filter((item) => {
      if (!item.protected) return true;
      
      const protectedRoles = item.protected.map(role => {
        let normalized = String(role).trim().toUpperCase();
        if (normalized.includes('ADMINISTRATEUR') && normalized.includes('SITE') && normalized.includes('WEB')) {
          normalized = 'ADMIN_SITE_WEB';
        }
        return normalized.replace(/\s+/g, '_');
      });
      
      return protectedRoles.includes(adminRole);
    });
  
  // Retourner le premier onglet accessible
  if (accessibleItems.length > 0) {
    return accessibleItems[0].path;
  }
  
  // Par défaut, retourner la page clients
  return routesName.clients;
};

export default function AppPage() {
  const { admin } = useAdminStore();
  
  // Vérifier le rôle de l'utilisateur et rediriger vers le bon dashboard
  if (admin?.role) {
    const role = String(admin.role).trim().toUpperCase();
    
    // Si c'est un commercial, rediriger vers le dashboard commercial
    if (role === 'COMMERCIAL') {
      return <Navigate to={routesName.commercialDashboard} replace />;
    }
  }
  
  // Rediriger vers le premier onglet accessible (sans le tableau de bord)
  const firstRoute = getFirstAccessibleRoute(admin);
  return <Navigate to={firstRoute} replace />;
}
