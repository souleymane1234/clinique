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
import Logo from 'src/assets/logo-removebg-preview-3.png';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import { NAV } from './config-layout';
import navConfig from './config-navigation';
// ----------------------------------------------------------------------

export default function Nav({ openNav, onCloseNav }) {
  // const pathname = usePathname();
  const { admin, refreshAdmin } = useAdminStore();
  
  // Rafraîchir les données admin depuis localStorage si nécessaire
  React.useEffect(() => {
    if (!admin) {
      refreshAdmin();
    }
  }, [admin, refreshAdmin]);

  const upLg = useResponsive('up', 'lg');

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
        <Typography variant="subtitle2">{admin?.nom_complet || admin?.email}</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {admin?.role}
        </Typography>
      </Box>
    </Box>
  );

  const renderMenu = (
    <Stack component="nav" spacing={0.5} sx={{ px: 2 }}>
      {navConfig
        .filter((item) => item.title !== 'Tableau de bord') // Exclure le tableau de bord
        .map((item) => {
        // Si l'item n'a pas de protection, on l'affiche pour tous
        if (!item.protected) {
          return <NavItem key={item.title} item={item} />;
        }
        // Si l'item est protégé, on vérifie si le rôle de l'admin est inclus
        if (admin) {
          // Récupérer le rôle depuis admin.role ou admin.service
          const roleSource = admin.role || admin.service || '';
          if (!roleSource) return null;
          
          // Normaliser le rôle pour la comparaison (enlever les espaces, mettre en majuscules)
          let adminRole = String(roleSource).trim().toUpperCase();
          
          // Gérer les cas spéciaux de normalisation
          // "Administrateur site web" -> "ADMIN_SITE_WEB"
          if (adminRole.includes('ADMINISTRATEUR') && adminRole.includes('SITE') && adminRole.includes('WEB')) {
            adminRole = 'ADMIN_SITE_WEB';
          }
          // Remplacer les espaces et underscores pour normaliser
          adminRole = adminRole.replace(/\s+/g, '_');
          
          const protectedRoles = item.protected.map(role => {
            let normalized = String(role).trim().toUpperCase();
            // Gérer les cas spéciaux
            if (normalized.includes('ADMINISTRATEUR') && normalized.includes('SITE') && normalized.includes('WEB')) {
              normalized = 'ADMIN_SITE_WEB';
            }
            return normalized.replace(/\s+/g, '_');
          });
          
          // Debug: Afficher les informations pour l'item "Actions Critiques"
          if (item.title === 'Actions Critiques') {
            console.log('🔍 Debug Actions Critiques:', {
              itemTitle: item.title,
              adminRole,
              protectedRoles,
              match: protectedRoles.includes(adminRole),
              adminData: admin,
            });
          }
          
          // Vérifier si le rôle de l'admin correspond à un des rôles autorisés
          if (protectedRoles.includes(adminRole)) {
          return <NavItem key={item.title} item={item} />;
          }
        }
        return null;
      })}
      <Logout />
    </Stack>
  );

  // const renderUpgrade = (
  //   <Box sx={{ px: 2.5, pb: 3, mt: 10 }}>
  //     <Stack alignItems="center" spacing={3} sx={{ pt: 5, borderRadius: 2, position: 'relative' }}>
  //       <Box
  //         component="img"
  //         src="/assets/illustrations/illustration_avatar.png"
  //         sx={{ width: 100, position: 'absolute', top: -50 }}
  //       />

  //       <Box sx={{ textAlign: 'center' }}>
  //         <Typography variant="h6">Un problème ?</Typography>

  //         <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
  //           Contactez le support technique
  //         </Typography>
  //       </Box>

  //       <Button
  //         href="https://wa.me/+2250564250219"
  //         target="_blank"
  //         variant="contained"
  //         color="inherit"
  //       >
  //         BoozTech
  //       </Button>
  //     </Stack>
  //   </Box>
  // );

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
      <Stack alignItems="center" justifyContent="center" direction="row" sx={{ width: '100%' }}>
        <img alt="Logo" src={Logo} style={{ width: '30%', margin: 5 }} />
      </Stack>

      {renderAccount}

      {renderMenu}

      <Box sx={{ flexGrow: 1 }} />

      {/* {renderUpgrade} */}
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

// ----------------------------------------------------------------------

// Fonction pour obtenir les éléments de sous-menu selon le titre
function getSubMenuItems(title) {
  const subMenus = {
    'Facturation': [
      { title: 'Factures', path: '/facturation/factures', icon: 'eva:file-text-fill' },
      { title: 'Factures Proforma', path: '/facturation/factures/categories', icon: 'eva:layers-fill' },
      { title: 'Bons de sortie', path: '/facturation/bons-de-sortie', icon: 'eva:file-remove-fill' },
      { title: 'Bilan financier', path: '/facturation/bilan', icon: 'eva:pie-chart-fill' },
    ],
    'Statistiques': [
      { title: 'Statistiques Globales', path: '/statistics/global', icon: 'eva:bar-chart-2-fill' },
      { title: 'Statistiques Clients', path: '/statistics/clients', icon: 'eva:people-fill' },
    ],
    'Écoles': [
      { title: 'Liste des écoles', path: '/admin/schools', icon: 'eva:list-fill' },
      { title: 'Statistiques', path: '/admin/schools/stats', icon: 'eva:bar-chart-fill' },
    ],
    'WebTV': [
      { title: 'Tableau de bord', path: '/admin/webtv', icon: 'eva:dashboard-fill' },
      { title: 'Catégories', path: '/admin/webtv/categories', icon: 'eva:folder-fill' },
      { title: 'Vidéos', path: '/admin/webtv/videos', icon: 'eva:video-fill' },
      { title: 'Playlists', path: '/admin/webtv/playlists', icon: 'eva:list-fill' },
      { title: 'Commentaires', path: '/admin/webtv/comments', icon: 'eva:message-circle-fill' },
      { title: 'Likes', path: '/admin/webtv/likes', icon: 'eva:heart-fill' },
    ],
    'Bourses et Études': [
      { title: 'Bourses', path: '/admin/scholarships', icon: 'eva:bookmark-fill' },
      { title: 'Statistiques', path: '/admin/scholarships/stats', icon: 'eva:bar-chart-fill' },
      { title: 'Dossiers Étudiants', path: '/admin/scholarships/student-files', icon: 'eva:file-fill' },
      { title: 'Candidatures', path: '/admin/scholarships/applications', icon: 'eva:paper-plane-fill' },
    ],
    'Études à l\'Étranger': [
      { title: 'Partenaires', path: '/admin/foreign-studies/partners', icon: 'eva:people-fill' },
      { title: 'Statistiques Partenaires', path: '/admin/foreign-studies/partners/stats', icon: 'eva:bar-chart-fill' },
      { title: 'Dossiers Étudiants', path: '/admin/foreign-studies/files', icon: 'eva:file-fill' },
      { title: 'Statistiques Dossiers', path: '/admin/foreign-studies/files/stats', icon: 'eva:bar-chart-fill' },
      { title: 'Candidatures', path: '/admin/foreign-studies/applications', icon: 'eva:paper-plane-fill' },
      { title: 'Statistiques Candidatures', path: '/admin/foreign-studies/applications/stats', icon: 'eva:bar-chart-fill' },
    ],
    'Orientation': [
      { title: 'Questionnaires', path: '/admin/orientation/questionnaires', icon: 'eva:file-text-fill' },
      { title: 'Statistiques', path: '/admin/orientation/stats', icon: 'eva:bar-chart-fill' },
    ],
    'Administration du site': [
      { title: 'Slides', path: '/admin/site/slides', icon: 'eva:image-fill' },
      { title: 'Services', path: '/admin/site/services', icon: 'eva:settings-fill' },
      { title: 'Logos partenaires', path: '/admin/site/partner-logos', icon: 'eva:people-fill' },
    ],
  };
  
  return subMenus[title] || [];
}

// Composant pour les éléments de sous-menu
function NavSubItem({ item, parentTitle }) {
  const pathname = usePathname();
  
  // Obtenir tous les sous-menus du parent pour éviter les conflits
  const allSubMenuItems = getSubMenuItems(parentTitle);
  
  // Activation précise : correspond exactement ou est un sous-chemin valide
  const active = (() => {
    // Correspondance exacte
    if (pathname === item.path) return true;
    
    // Si le pathname commence par le chemin de l'item
    if (pathname.startsWith(`${item.path}/`)) {
      // Vérifier que ce n'est pas un autre chemin de sous-menu plus spécifique
      // Par exemple, si on est sur /admin/scholarships/stats/something
      // et que l'item est /admin/scholarships, on ne veut pas l'activer
      const isMoreSpecificPath = allSubMenuItems.some(otherItem => {
        if (otherItem.path === item.path) return false; // Ignorer l'item lui-même
        // Vérifier si un autre sous-menu correspond mieux au pathname
        return pathname === otherItem.path || pathname.startsWith(`${otherItem.path}/`);
      });
      
      return !isMoreSpecificPath;
    }
    
    return false;
  })();

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

function NavItem({ item }) {
  const pathname = usePathname();
  const { childrenPath = [] } = item;

  // Vérifier si le pathname actuel correspond à l'un des chemins enfants
  const active = childrenPath.some(childPath => {
    // Pour les routes exactes
    if (pathname === childPath) return true;
    
    // Pour les routes avec des sous-chemins, mais seulement si c'est vraiment un sous-chemin
    // Par exemple, /admin/schools/edit est OK, mais /admin/schools/stats ne doit pas activer "Écoles"
    if (pathname.startsWith(`${childPath}/`)) {
      // Vérifier que ce n'est pas une route spécifique d'un autre onglet
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

  // Si l'item a des sous-menus définis, afficher directement les sous-menus avec tabulation
  const subMenuItems = getSubMenuItems(item.title);
  if (subMenuItems.length > 0 && childrenPath.length > 1) {
    return (
      <Box>
        <Box
          sx={{
            minHeight: 44,
            borderRadius: 0.75,
            typography: 'body2',
            color: 'text.secondary',
            textTransform: 'capitalize',
            fontWeight: 'fontWeightMedium',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1,
            ...(active && {
              color: 'primary.main',
              fontWeight: 'fontWeightSemiBold',
            }),
          }}
        >
          <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
            {item.icon}
          </Box>
          <Box component="span" sx={{ flexGrow: 1 }}>{item.title}</Box>
        </Box>
        
        <Stack component="nav" spacing={0.5} sx={{ pl: 3 }}>
            {getSubMenuItems(item.title).map((subItem) => (
              <NavSubItem key={subItem.path} item={subItem} parentTitle={item.title} />
            ))}
          </Stack>
      </Box>
    );
  }

  // Sinon, afficher un élément simple
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

function Logout() {
  const router = useRouter();
  return (
    <ListItemButton
      component={RouterLink}
      onClick={() => {
        localStorage.clear();
        router.back();
      }}
      sx={{
        minHeight: 44,
        borderRadius: 0.75,
        typography: 'body2',
        color: 'text.secondary',
        textTransform: 'capitalize',
        fontWeight: 'fontWeightMedium',
      }}
    >
      <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
        <Iconify icon="solar:logout-2-bold-duotone" />
      </Box>

      <Box component="span">Deconnexion</Box>
    </ListItemButton>
  );
}

NavItem.propTypes = {
  item: PropTypes.object,
};

NavSubItem.propTypes = {
  item: PropTypes.object,
  parentTitle: PropTypes.string,
};
