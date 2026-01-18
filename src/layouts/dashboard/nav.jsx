import React from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';

import { RouterLink } from 'src/routes/components';
import { useRouter, usePathname } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { apiUrlAsset } from 'src/constants/apiUrl';
import { useAdminStore } from 'src/store/useAdminStore';

import Iconify from 'src/components/iconify';

import Logo from 'src/assets/logo.jpg';
import Scrollbar from 'src/components/scrollbar';

import { NAV } from './config-layout';
import navConfig from './config-navigation';

// ----------------------------------------------------------------------
// Configuration des sous-menus
// ----------------------------------------------------------------------

const SUB_MENUS = {
  'Facturation': [
    { 
      title: 'Reçu', 
      path: '/facturation/factures', 
      icon: 'eva:file-text-fill', 
      restrictedRoles: ['COMMERCIAL'] 
    },
    { 
      title: 'Factures Proforma', 
      path: '/facturation/factures/categories', 
      icon: 'eva:layers-fill' 
    },
    { 
      title: 'Bons de sortie', 
      path: '/facturation/bons-de-sortie', 
      icon: 'eva:file-remove-fill', 
      restrictedRoles: ['COMMERCIAL'] 
    },
    { 
      title: 'Bilan financier', 
      path: '/facturation/bilan', 
      icon: 'eva:pie-chart-fill', 
      restrictedRoles: ['GERANT', 'COMMERCIAL'] 
    },
  ],
  'Statistiques': [
    { 
      title: 'Statistiques Globales', 
      path: '/statistics/global', 
      icon: 'eva:bar-chart-2-fill', 
      restrictedRoles: ['GERANT'] 
    },
    { 
      title: 'Statistiques Clients', 
      path: '/statistics/clients', 
      icon: 'eva:people-fill' 
    },
  ],
  'Écoles': [
    { 
      title: 'Liste des écoles', 
      path: '/admin/schools', 
      icon: 'eva:list-fill' 
    },
    { 
      title: 'Statistiques', 
      path: '/admin/schools/stats', 
      icon: 'eva:bar-chart-fill' 
    },
  ],
  'WebTV': [
    { 
      title: 'Tableau de bord', 
      path: '/admin/webtv', 
      icon: 'eva:dashboard-fill' 
    },
    { 
      title: 'Catégories', 
      path: '/admin/webtv/categories', 
      icon: 'eva:folder-fill' 
    },
    { 
      title: 'Vidéos', 
      path: '/admin/webtv/videos', 
      icon: 'eva:video-fill' 
    },
    { 
      title: 'Playlists', 
      path: '/admin/webtv/playlists', 
      icon: 'eva:list-fill' 
    },
    { 
      title: 'Commentaires', 
      path: '/admin/webtv/comments', 
      icon: 'eva:message-circle-fill' 
    },
    { 
      title: 'Likes', 
      path: '/admin/webtv/likes', 
      icon: 'eva:heart-fill' 
    },
  ],
  'Bourses et Études': [
    { 
      title: 'Bourses', 
      path: '/admin/scholarships', 
      icon: 'eva:bookmark-fill' 
    },
    { 
      title: 'Statistiques', 
      path: '/admin/scholarships/stats', 
      icon: 'eva:bar-chart-fill' 
    },
    { 
      title: 'Dossiers Étudiants', 
      path: '/admin/scholarships/student-files', 
      icon: 'eva:file-fill' 
    },
    { 
      title: 'Candidatures', 
      path: '/admin/scholarships/applications', 
      icon: 'eva:paper-plane-fill' 
    },
  ],
  'Études à l\'Étranger': [
    { 
      title: 'Partenaires', 
      path: '/admin/foreign-studies/partners', 
      icon: 'eva:people-fill' 
    },
    { 
      title: 'Statistiques Partenaires', 
      path: '/admin/foreign-studies/partners/stats', 
      icon: 'eva:bar-chart-fill' 
    },
    { 
      title: 'Dossiers Étudiants', 
      path: '/admin/foreign-studies/files', 
      icon: 'eva:file-fill' 
    },
    { 
      title: 'Statistiques Dossiers', 
      path: '/admin/foreign-studies/files/stats', 
      icon: 'eva:bar-chart-fill' 
    },
    { 
      title: 'Candidatures', 
      path: '/admin/foreign-studies/applications', 
      icon: 'eva:paper-plane-fill' 
    },
    { 
      title: 'Statistiques Candidatures', 
      path: '/admin/foreign-studies/applications/stats', 
      icon: 'eva:bar-chart-fill' 
    },
  ],
  'Orientation': [
    { 
      title: 'Questionnaires', 
      path: '/admin/orientation/questionnaires', 
      icon: 'eva:file-text-fill' 
    },
    { 
      title: 'Statistiques', 
      path: '/admin/orientation/stats', 
      icon: 'eva:bar-chart-fill' 
    },
  ],
  'Administration du site': [
    { 
      title: 'Slides', 
      path: '/admin/site/slides', 
      icon: 'eva:image-fill' 
    },
    { 
      title: 'Services', 
      path: '/admin/site/services', 
      icon: 'eva:settings-fill' 
    },
    { 
      title: 'Logos partenaires', 
      path: '/admin/site/partner-logos', 
      icon: 'eva:people-fill' 
    },
  ],
  'Administration & Paramétrage': [
    { 
      title: 'Utilisateurs', 
      path: '/admin/users', 
      icon: 'solar:users-group-rounded-bold' 
    },
    { 
      title: 'Rôles & Permissions', 
      path: '/admin/roles-permissions', 
      icon: 'solar:shield-user-bold' 
    },
    { 
      title: 'Services', 
      path: '/admin/site/services', 
      icon: 'solar:medical-kit-bold' 
    },
    { 
      title: 'Journal d\'activité', 
      path: '/admin/activity-log', 
      icon: 'solar:document-text-bold' 
    },
    { 
      title: 'Sauvegarde', 
      path: '/admin/backup-restore', 
      icon: 'solar:database-bold' 
    },
    { 
      title: 'Multi-Cliniques', 
      path: '/admin/multi-clinics', 
      icon: 'solar:buildings-2-bold' 
    },
  ],
  'Gestion des Patients': [
    { 
      title: 'Dossiers patients', 
      path: '/patients/dossiers', 
      icon: 'solar:user-id-bold' 
    },
    { 
      title: 'Rendez-vous', 
      path: '/patients/appointments', 
      icon: 'solar:calendar-bold' 
    },
    { 
      title: 'File d\'attente', 
      path: '/patients/queue', 
      icon: 'solar:list-check-bold' 
    },
  ],
  'Médecins': [
    { 
      title: 'Consultation des dossiers', 
      path: '/doctors/view-dossiers', 
      icon: 'solar:folder-2-bold' 
    },
    { 
      title: 'Création de consultations', 
      path: '/doctors/create-consultation', 
      icon: 'solar:document-add-bold' 
    },
    { 
      title: 'Diagnostic', 
      path: '/doctors/diagnostic', 
      icon: 'solar:clipboard-heart-bold' 
    },
    { 
      title: 'Prescriptions', 
      path: '/doctors/prescriptions', 
      icon: 'solar:document-medicine-bold' 
    },
    { 
      title: 'Ordonnances imprimables', 
      path: '/doctors/ordonnances', 
      icon: 'solar:printer-bold' 
    },
    { 
      title: 'Demandes d\'hospitalisation', 
      path: '/doctors/hospitalisation', 
      icon: 'solar:hospital-bold' 
    },
    { 
      title: 'Certificats médicaux', 
      path: '/doctors/certificats', 
      icon: 'solar:certificate-bold' 
    },
    { 
      title: 'Messagerie interne', 
      path: '/doctors/messagerie', 
      icon: 'solar:chat-round-bold' 
    },
  ],
  'Infirmiers': [
    { 
      title: 'Planning de soins', 
      path: '/nurses/planning', 
      icon: 'solar:calendar-bold' 
    },
    { 
      title: 'Administration des traitements', 
      path: '/nurses/traitements', 
      icon: 'solar:syringe-bold' 
    },
    { 
      title: 'Suivi des signes vitaux', 
      path: '/nurses/signes-vitaux', 
      icon: 'solar:heart-pulse-bold' 
    },
    { 
      title: 'Notes infirmières', 
      path: '/nurses/notes', 
      icon: 'solar:notes-medical-bold' 
    },
    { 
      title: 'Validation des soins', 
      path: '/nurses/validation', 
      icon: 'solar:check-circle-bold' 
    },
    { 
      title: 'Alertes et urgences', 
      path: '/nurses/alertes', 
      icon: 'solar:bell-bold' 
    },
  ],
  'Aides-soignantes': [
    { 
      title: 'Tâches assignées', 
      path: '/aides-soignantes/taches', 
      icon: 'solar:checklist-bold' 
    },
    { 
      title: 'Soins de base', 
      path: '/aides-soignantes/soins-base', 
      icon: 'solar:heart-pulse-bold' 
    },
    { 
      title: 'Assistance aux infirmiers', 
      path: '/aides-soignantes/assistance', 
      icon: 'solar:users-group-rounded-bold' 
    },
    { 
      title: 'Notes et observations', 
      path: '/aides-soignantes/notes', 
      icon: 'solar:notes-bold' 
    },
    { 
      title: 'Historique des interventions', 
      path: '/aides-soignantes/historique', 
      icon: 'solar:history-bold' 
    },
  ],
  'Laboratoire': [
    { 
      title: 'Réception des prescriptions', 
      path: '/laboratory/prescriptions', 
      icon: 'solar:document-medicine-bold' 
    },
    { 
      title: 'Gestion des analyses', 
      path: '/laboratory/analyses', 
      icon: 'solar:test-tube-bold' 
    },
    { 
      title: 'Saisie et validation des résultats', 
      path: '/laboratory/resultats', 
      icon: 'solar:clipboard-text-bold' 
    },
    { 
      title: 'Transmission automatique', 
      path: '/laboratory/transmission', 
      icon: 'solar:send-bold' 
    },
    { 
      title: 'Impression des résultats', 
      path: '/laboratory/impression', 
      icon: 'solar:printer-bold' 
    },
    { 
      title: 'Gestion des consommables', 
      path: '/laboratory/consommables', 
      icon: 'solar:box-bold' 
    },
    { 
      title: 'Statistiques', 
      path: '/laboratory/statistiques', 
      icon: 'solar:chart-bold' 
    },
  ],
  'Pharmacie': [
    { 
      title: 'Gestion des stocks', 
      path: '/pharmacy/stocks', 
      icon: 'solar:box-bold' 
    },
    { 
      title: 'Entrées / Sorties', 
      path: '/pharmacy/entrees-sorties', 
      icon: 'solar:double-alt-arrow-right-bold' 
    },
    { 
      title: 'Alertes de rupture et péremption', 
      path: '/pharmacy/alertes', 
      icon: 'solar:bell-bold' 
    },
    { 
      title: 'Dispensation des médicaments', 
      path: '/pharmacy/dispensation', 
      icon: 'solar:document-medicine-bold' 
    },
    { 
      title: 'Tarification', 
      path: '/pharmacy/tarification', 
      icon: 'solar:tag-price-bold' 
    },
    { 
      title: 'Gestion fournisseurs', 
      path: '/pharmacy/fournisseurs', 
      icon: 'solar:users-group-rounded-bold' 
    },
    { 
      title: 'Inventaire', 
      path: '/pharmacy/inventaire', 
      icon: 'solar:clipboard-list-bold' 
    },
  ],
  'Caisse / Facturation': [
    { 
      title: 'Création des factures', 
      path: '/caisse/factures', 
      icon: 'solar:document-add-bold' 
    },
    { 
      title: 'Facturation par service', 
      path: '/caisse/facturation-service', 
      icon: 'solar:bill-list-bold' 
    },
    { 
      title: 'Paiements', 
      path: '/caisse/paiements', 
      icon: 'solar:wallet-money-bold' 
    },
    { 
      title: 'Tickets et reçus', 
      path: '/caisse/tickets-recus', 
      icon: 'solar:receipt-bold' 
    },
    { 
      title: 'Gestion des impayés', 
      path: '/caisse/impayes', 
      icon: 'solar:file-text-bold' 
    },
    { 
      title: 'Clôture journalière', 
      path: '/caisse/cloture', 
      icon: 'solar:calendar-mark-bold' 
    },
    { 
      title: 'Historique des transactions', 
      path: '/caisse/historique', 
      icon: 'solar:history-bold' 
    },
  ],
  'Gestionnaire / Direction': [
    { 
      title: 'Tableau de bord global', 
      path: '/manager/dashboard', 
      icon: 'solar:graph-up-bold' 
    },
    { 
      title: 'Statistiques médicales et financières', 
      path: '/manager/statistiques', 
      icon: 'solar:chart-2-bold' 
    },
    { 
      title: 'Suivi des performances', 
      path: '/manager/performances', 
      icon: 'solar:target-bold' 
    },
    { 
      title: 'Rapports périodiques', 
      path: '/manager/rapports', 
      icon: 'solar:document-text-bold' 
    },
    { 
      title: 'Suivi des stocks', 
      path: '/manager/stocks', 
      icon: 'solar:box-bold' 
    },
    { 
      title: 'Audit et contrôle interne', 
      path: '/manager/audit', 
      icon: 'solar:shield-check-bold' 
    },
  ],
  'Rendez-vous & Planning': [
    { 
      title: 'Prise et gestion des rendez-vous', 
      path: '/appointments/gestion', 
      icon: 'solar:calendar-add-bold' 
    },
    { 
      title: 'Agenda médecins et infirmiers', 
      path: '/appointments/agenda', 
      icon: 'solar:calendar-bold' 
    },
    { 
      title: 'Notifications', 
      path: '/appointments/notifications', 
      icon: 'solar:bell-bold' 
    },
    { 
      title: 'Gestion des urgences', 
      path: '/appointments/urgences', 
      icon: 'solar:heart-pulse-bold' 
    },
  ],
  'Notifications & Communication': [
    { 
      title: 'Notifications internes', 
      path: '/notifications-communication/notifications-internes', 
      icon: 'solar:bell-bold' 
    },
    { 
      title: 'Alertes médicales', 
      path: '/notifications-communication/alertes-medicales', 
      icon: 'solar:alert-triangle-bold' 
    },
    { 
      title: 'Rappels patients', 
      path: '/notifications-communication/rappels', 
      icon: 'solar:clock-circle-bold' 
    },
    { 
      title: 'Messagerie interne', 
      path: '/notifications-communication/messagerie', 
      icon: 'solar:chat-round-bold' 
    },
    { 
      title: 'Historique des échanges', 
      path: '/notifications-communication/historique', 
      icon: 'solar:history-bold' 
    },
  ],
  'Documents & Impressions': [
    { 
      title: 'Ordonnances', 
      path: '/documents-impressions/ordonnances', 
      icon: 'solar:document-medicine-bold' 
    },
    { 
      title: 'Résultats d\'analyses', 
      path: '/documents-impressions/resultats-analyses', 
      icon: 'solar:clipboard-check-bold' 
    },
    { 
      title: 'Factures', 
      path: '/documents-impressions/factures', 
      icon: 'solar:bill-list-bold' 
    },
    { 
      title: 'Certificats médicaux', 
      path: '/documents-impressions/certificats', 
      icon: 'solar:certificate-bold' 
    },
    { 
      title: 'Rapports', 
      path: '/documents-impressions/rapports', 
      icon: 'solar:document-text-bold' 
    },
    { 
      title: 'Export PDF / Excel', 
      path: '/documents-impressions/export', 
      icon: 'solar:file-download-bold' 
    },
  ],
  'Sécurité & Conformité': [
    { 
      title: 'Authentification sécurisée', 
      path: '/securite-conformite/authentification', 
      icon: 'solar:shield-keyhole-bold' 
    },
    { 
      title: 'Gestion des accès par rôle', 
      path: '/securite-conformite/gestion-acces', 
      icon: 'solar:user-id-bold' 
    },
    { 
      title: 'Chiffrement des données', 
      path: '/securite-conformite/chiffrement', 
      icon: 'solar:lock-password-bold' 
    },
    { 
      title: 'Traçabilité des accès', 
      path: '/securite-conformite/traçabilite', 
      icon: 'solar:history-bold' 
    },
    { 
      title: 'Conformité réglementaire', 
      path: '/securite-conformite/conformite', 
      icon: 'solar:shield-check-bold' 
    },
  ],
  'Technique (Transversal)': [
    { 
      title: 'API REST / GraphQL', 
      path: '/technique/api', 
      icon: 'solar:code-bold' 
    },
    { 
      title: 'Application web et mobile', 
      path: '/technique/applications', 
      icon: 'solar:smartphone-bold' 
    },
    { 
      title: 'Sauvegardes automatiques', 
      path: '/technique/sauvegardes', 
      icon: 'solar:cloud-storage-bold' 
    },
    { 
      title: 'Multilingue', 
      path: '/technique/multilingue', 
      icon: 'solar:global-bold' 
    },
    { 
      title: 'Intégration SMS et paiements', 
      path: '/technique/integrations', 
      icon: 'solar:settings-bold' 
    },
  ],
};

// ----------------------------------------------------------------------
// Fonctions utilitaires
// ----------------------------------------------------------------------

/**
 * Normalise le rôle pour la comparaison
 */
function normalizeRole(role) {
  if (!role) return '';
  
  const normalized = String(role).trim().toUpperCase();
  
  // Gérer les cas spéciaux
  if (normalized.includes('ADMINISTRATEUR') && normalized.includes('SITE') && normalized.includes('WEB')) {
    return 'ADMIN_SITE_WEB';
  }
  
  return normalized.replace(/\s+/g, '_');
}

/**
 * Récupère les sous-menus filtrés par rôle
 */
function getSubMenuItems(title, adminRole = null) {
  const items = SUB_MENUS[title] || [];
  
  if (!adminRole || items.length === 0) {
    return items;
  }
  
  const normalizedAdminRole = normalizeRole(adminRole);
  
  return items.filter(item => {
    if (!item.restrictedRoles) return true;
    
    const normalizedRestrictedRoles = item.restrictedRoles.map(normalizeRole);
    return !normalizedRestrictedRoles.includes(normalizedAdminRole);
  });
}

/**
 * Vérifie si un item de navigation doit être affiché
 */
function shouldShowNavItem(item, admin) {
  // Si l'item n'est pas protégé, l'afficher
  if (!item.protected) return true;
  
  // Si pas d'admin, ne pas afficher les items protégés
  if (!admin) return false;
  
  const roleSource = admin.role || admin.service || '';
  if (!roleSource) return false;
  
  const adminRole = normalizeRole(roleSource);
  const protectedRoles = item.protected.map(normalizeRole);
  
  return protectedRoles.includes(adminRole);
}

/**
 * Vérifie si une route est active
 */
function isRouteActive(pathname, itemPath, allPaths = []) {
  // Correspondance exacte
  if (pathname === itemPath) return true;
  
  // Si le pathname commence par le chemin de l'item
  if (pathname.startsWith(`${itemPath}/`)) {
    // Vérifier qu'il n'y a pas un autre chemin plus spécifique
    const hasMoreSpecific = allPaths.some(otherPath => {
      if (otherPath === itemPath) return false;
      return pathname === otherPath || pathname.startsWith(`${otherPath}/`);
    });
    
    return !hasMoreSpecific;
  }
  
  return false;
}

// ----------------------------------------------------------------------
// Composant NavSubItem
// ----------------------------------------------------------------------

function NavSubItem({ item, parentTitle }) {
  const pathname = usePathname();
  const allSubMenuItems = getSubMenuItems(parentTitle);
  const allPaths = allSubMenuItems.map(subItem => subItem.path);
  
  const active = isRouteActive(pathname, item.path, allPaths);

  return (
    <ListItemButton
      component={RouterLink}
      href={item.path}
      sx={{
        minHeight: 36,
        borderRadius: 0.75,
        typography: 'body2',
        color: 'text.secondary',
        textTransform: 'capitalize',
        fontWeight: 'fontWeightMedium',
        pl: 3,
        ...(active && {
          color: 'primary.main',
          fontWeight: 'fontWeightSemiBold',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
          },
        }),
      }}
    >
      <Box component="span" sx={{ width: 20, height: 20, mr: 1.5 }}>
        <Iconify icon={item.icon} />
      </Box>
      <Box component="span">{item.title}</Box>
    </ListItemButton>
  );
}

NavSubItem.propTypes = {
  item: PropTypes.object.isRequired,
  parentTitle: PropTypes.string.isRequired,
};

// ----------------------------------------------------------------------
// Composant NavItem
// ----------------------------------------------------------------------

function NavItem({ item }) {
  const pathname = usePathname();
  const { admin } = useAdminStore();
  const { childrenPath = [] } = item;

  const adminRole = admin ? (admin.role || admin.service || '') : null;
  const subMenuItems = getSubMenuItems(item.title, adminRole);
  const hasSubMenu = subMenuItems.length > 0;

  // État d'ouverture du menu
  const [open, setOpen] = React.useState(() => {
    if (!hasSubMenu) return false;
    return subMenuItems.some(subItem => 
      pathname === subItem.path || pathname.startsWith(`${subItem.path}/`)
    );
  });

  // Mettre à jour l'état si la route change
  React.useEffect(() => {
    if (hasSubMenu) {
      const hasActive = subMenuItems.some(subItem => 
        pathname === subItem.path || pathname.startsWith(`${subItem.path}/`)
      );
      if (hasActive && !open) {
        setOpen(true);
      }
    }
  }, [pathname, subMenuItems, hasSubMenu, open]);

  // Vérifier si l'item est actif
  const active = childrenPath.some(childPath => {
    if (pathname === childPath) return true;
    
    if (pathname.startsWith(`${childPath}/`)) {
      const isSpecificRoute = navConfig
        .filter(config => config.title !== item.title)
        .some(config => 
          config.childrenPath.some(route => 
            pathname === route || pathname.startsWith(`${route}/`)
          )
        );
      
      return !isSpecificRoute;
    }
    
    return false;
  });

  // Gestionnaire de clic
  const handleClick = () => {
    setOpen(prev => !prev);
  };

  // Si l'item a un sous-menu
  if (hasSubMenu) {
    return (
      <Box>
        <Box
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          sx={{
            minHeight: 44,
            borderRadius: 0.75,
            typography: 'body2',
            color: 'text.secondary',
            textTransform: 'capitalize',
            fontWeight: 'fontWeightMedium',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1,
            userSelect: 'none',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            },
            '&:active': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
            },
            ...(active && {
              color: 'primary.main',
              fontWeight: 'fontWeightSemiBold',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            }),
          }}
        >
          <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
            {item.icon}
          </Box>
          <Box component="span" sx={{ flexGrow: 1 }}>
            {item.title}
          </Box>
          <Iconify
            icon={open ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
            sx={{ width: 16, height: 16, ml: 1 }}
          />
        </Box>
        
        {open && (
          <Stack component="nav" spacing={0.5} sx={{ mt: 0.5 }}>
            {subMenuItems.map((subItem) => (
              <NavSubItem 
                key={subItem.path} 
                item={subItem} 
                parentTitle={item.title} 
              />
            ))}
          </Stack>
        )}
      </Box>
    );
  }

  // Sinon, afficher un item simple
  return (
    <ListItemButton
      component={RouterLink}
      href={item.path}
      sx={{
        minHeight: 44,
        borderRadius: 0.75,
        typography: 'body2',
        color: 'text.secondary',
        textTransform: 'capitalize',
        fontWeight: 'fontWeightMedium',
        ...(active && {
          color: 'primary.main',
          fontWeight: 'fontWeightSemiBold',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
          },
        }),
      }}
    >
      <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
        {item.icon}
      </Box>
      <Box component="span">{item.title}</Box>
    </ListItemButton>
  );
}

NavItem.propTypes = {
  item: PropTypes.object.isRequired,
};

// ----------------------------------------------------------------------
// Composant Logout
// ----------------------------------------------------------------------

function Logout() {
  const router = useRouter();
  
  const handleLogout = () => {
    localStorage.clear();
    router.back();
  };

  return (
    <ListItemButton
      onClick={handleLogout}
      sx={{
        minHeight: 44,
        borderRadius: 0.75,
        typography: 'body2',
        color: 'text.secondary',
        textTransform: 'capitalize',
        fontWeight: 'fontWeightMedium',
        '&:hover': {
          bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
          color: 'error.main',
        },
      }}
    >
      <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
        <Iconify icon="solar:logout-2-bold-duotone" />
      </Box>
      <Box component="span">Déconnexion</Box>
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------
// Composant principal Nav
// ----------------------------------------------------------------------

export default function Nav({ openNav, onCloseNav }) {
  const { admin, refreshAdmin } = useAdminStore();
  const upLg = useResponsive('up', 'lg');

  // Rafraîchir les données admin depuis localStorage si nécessaire
  React.useEffect(() => {
    if (!admin) {
      refreshAdmin();
    }
  }, [admin, refreshAdmin]);

  // Rendu du compte utilisateur
  const renderAccount = (
    <Box
      sx={{
        my: 3,
        mx: 2.5,
        py: 2,
        px: 2.5,
        display: 'flex',
        borderRadius: 1.5,
        alignItems: 'center',
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
      }}
    >
      <Avatar
        src={admin?.logo ? `${apiUrlAsset.avatars}/${admin.logo}` : undefined}
        alt={admin?.email}
      >
        {!admin?.logo && admin?.email?.charAt(0).toUpperCase()}
      </Avatar>

      <Box sx={{ ml: 2 }}>
        <Typography variant="subtitle2">
          {admin?.nom_complet || admin?.email}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {admin?.role}
        </Typography>
      </Box>
    </Box>
  );

  // Rendu du menu
  const renderMenu = (
    <Stack component="nav" spacing={0.5} sx={{ px: 2 }}>
      {navConfig
        .filter((item) => item.title !== 'Tableau de bord')
        .filter((item) => shouldShowNavItem(item, admin))
        .map((item) => (
          <NavItem key={item.title} item={item} />
        ))}
      <Logout />
    </Stack>
  );

  // Rendu du contenu
  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Stack 
        alignItems="center" 
        justifyContent="center" 
        direction="row" 
        sx={{ width: '100%' }}
      >
        <img alt="Logo" src={Logo} style={{ width: '30%', margin: 5 }} />
      </Stack>

      {renderAccount}
      {renderMenu}

      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.WIDTH },
      }}
    >
      {upLg ? (
        <Box
          sx={{
            height: 1,
            position: 'fixed',
            width: NAV.WIDTH,
            borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          {renderContent}
        </Box>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          PaperProps={{
            sx: {
              width: NAV.WIDTH,
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}

Nav.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
};