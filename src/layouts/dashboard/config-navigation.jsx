import { routesName } from 'src/constants/routes';

import SvgColor from 'src/components/svg-color';
// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const navConfig = [
  {
    title: 'Tableau de bord',
    path: routesName.admin,
    childrenPath: [routesName.admin],
    icon: icon('ic_analytics'),
    protected: ['ADMIN', 'COMPTABLE', 'GERANT'], // Administrateur, Comptable, Gérant
  },
  {
    title: 'Dashboard',
    path: routesName.commercialDashboard,
    childrenPath: [routesName.commercialDashboard],
    icon: icon('ic_analytics'),
    protected: ['COMMERCIAL'], // Commercial uniquement
  },
  {
    title: 'Statistiques',
    path: routesName.statisticsGlobal,
    childrenPath: [
      routesName.statisticsGlobal,
      routesName.statisticsClients,
    ],
    icon: icon('ic_analytics'),
    protected: ['ADMIN', 'COMPTABLE', 'GERANT'], // Administrateur, Comptable, Gérant
  },
  {
    title: 'Clients',
    path: routesName.clients,
    childrenPath: [routesName.clients, routesName.clientDetails, routesName.unassignedClients],
    icon: icon('ic_user'),
    protected: ['ADMIN', 'COMMERCIAL', 'GERANT'], // Administrateur, Commercial, Gérant
  },
  {
    title: 'Facturation',
    path: routesName.factures,
    childrenPath: [
      routesName.factures,
      routesName.factureDetails,
      routesName.createFactureProforma,
      routesName.facturesByCategory,
      routesName.bonsDeSortie,
      routesName.bonDeSortieDetails,
      routesName.bilanFinancier,
      routesName.bilanMensuel,
      routesName.bilanAnnuel,
    ],
    icon: icon('ic_blog'),
    protected: ['ADMIN', 'COMPTABLE', 'GERANT', 'COMMERCIAL'], // Administrateur, Comptable, Gérant, Commercial
  },
  {
    title: 'Utilisateurs',
    path: routesName.commerciaux,
    childrenPath: [routesName.commerciaux, routesName.createCommercial, routesName.commercialDetails],
    icon: icon('ic_user'),
    protected: ['ADMIN'], // Administrateur uniquement
  },
  {
    title: 'Administration du site',
    path: routesName.siteAdminSlides,
    childrenPath: [
      routesName.siteAdminSlides,
      routesName.siteAdminServices,
      routesName.siteAdminPartnerLogos,
    ],
    icon: icon('ic_blog'),
    protected: ['ADMIN', 'ADMIN_SITE_WEB'], // Administrateur et Administrateur site web
  },
];

export default navConfig;
