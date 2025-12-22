export const routesName = {
  dashboard: '/',
  login: '/login',
  404: '/404',

  // Admin routes
  admin: '/admin',
  
  // Super Admin Critical Actions
  adminCritical: '/admin/critical',
  
  // Super Admin - Administration Admins
  adminAdministrationAdmins: '/admin/administration/admins',
  
  // File Active Management
  adminFileActive: '/admin/file-active',
  adminFileActiveBySession: '/admin/file-active/session/:sessionId',
  
  // Administration - Global Configuration
  adminConfiguration: '/admin/configuration',
  
  // Administration - Reports & Statistics
  adminReports: '/admin/reports',
  
  // Administration - Roles & Permissions
  adminRolesPermissions: '/admin/roles-permissions',
  
  // Stations Management
  adminStations: '/admin/stations',
  adminStationDetails: '/admin/stations/:id',
  
  // Sessions Management
  adminSessions: '/admin/sessions',
  adminSessionDetails: '/admin/sessions/:id',
  
  // Users Management
  users: '/users',
  userDetails: '/users/:id',
  
  // Clients Management
  clients: '/clients',
  clientDetails: '/clients/:id',
  unassignedClients: '/clients/unassigned',
  
  // Commerciaux Management
  commerciaux: '/commerciaux',
  createCommercial: '/commerciaux/create',
  commercialDetails: '/commerciaux/:id',
  
  // Facturation
  factures: '/facturation/factures',
  factureDetails: '/facturation/factures/:id',
  createFactureProforma: '/facturation/factures-proforma/create',
  facturesByCategory: '/facturation/factures/categories',
  bonsDeSortie: '/facturation/bons-de-sortie',
  bonDeSortieDetails: '/facturation/bons-de-sortie/:id',
  bilanFinancier: '/facturation/bilan',
  bilanMensuel: '/facturation/bilan/mensuel',
  bilanAnnuel: '/facturation/bilan/annuel',
  
  // Statistics
  statisticsGlobal: '/statistics/global',
  statisticsClients: '/statistics/clients',
  statisticsFacturation: '/statistics/facturation',
  
  // Commercial Dashboard
  commercialDashboard: '/commercial/dashboard',
  
  // Site Administration
  siteAdminSlides: '/admin/site/slides',
  siteAdminServices: '/admin/site/services',
  siteAdminPartnerLogos: '/admin/site/partner-logos',
};
