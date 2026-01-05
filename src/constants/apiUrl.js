// const base_url = import.meta.env.VITE_BASE_URL;
// const base_url = 'https://api.annour-travel.com';
const base_url = 'http://localhost:3010';
const base_url_asset = import.meta.env.VITE_BASE_URL_ASSET;

export const apiUrl = {
  // Authentication
  authentication: `${base_url}/auth/login`,
  register: `${base_url}/auth/register`,
  getCurrentUser: `${base_url}/auth`,
  resetPassword: `${base_url}/reset-passord`,

  // Users
  users: `${base_url}/users`,
  getUserById: (userId) => `${base_url}/users/${userId}`,
  updateUser: (id) => `${base_url}/users/${id}`,
  deleteUser: (id) => `${base_url}/users/${id}`,
  suspendUser: (id) => `${base_url}/users/${id}/suspend`,
  changeUserPassword: (id) => `${base_url}/users/${id}/change-password`,

  // Clients
  clients: `${base_url}/clients`,
  clientsUnassigned: `${base_url}/clients/unassigned`,
  clientsWithCommercial: `${base_url}/clients/withcommercial`,
  clientsCountByStatus: `${base_url}/clients/count-by-status`,
  clientCheckByNumber: (numero) => `${base_url}/clients/check/${numero}`,
  clientsAssignedToUser: (userId) => `${base_url}/clients/assigned/${userId}`,
  clientById: (id) => `${base_url}/clients/${id}`,
  updateClient: (id) => `${base_url}/clients/${id}`,
  deleteClient: (id) => `${base_url}/clients/${id}`,
  clientSummary: (id) => `${base_url}/clients/${id}/summary`,
  clientAssign: (id) => `${base_url}/clients/${id}/assign`,
  clientStatus: (id) => `${base_url}/clients/${id}/status`,
  clientSessions: (id) => `${base_url}/clients/${id}/sessions`,
  clientActiveSession: (id) => `${base_url}/clients/${id}/active-session`,
  clientOpenSession: (id) => `${base_url}/clients/${id}/sessions`,
  sessionById: (sessionId) => `${base_url}/clients/sessions/${sessionId}`,
  sessionClose: (sessionId) => `${base_url}/clients/sessions/${sessionId}/close`,
  sessionConclusions: (sessionId) => `${base_url}/clients/sessions/${sessionId}/conclusions`,
  // Client Documents
  clientDocuments: (id) => `${base_url}/clients/${id}/documents`,
  clientDocumentUpload: (id) => `${base_url}/clients/${id}/documents/upload`,
  clientDocumentUploadMultiple: (id) => `${base_url}/clients/${id}/documents/upload-multiple`,
  clientDocumentDelete: (documentId) => `${base_url}/clients/documents/${documentId}`,

  // Facturation
  factures: `${base_url}/facturation/factures`,
  factureById: (id) => `${base_url}/facturation/factures/${id}`,
  clientFactures: (clientId) => `${base_url}/facturation/clients/${clientId}/factures`,
  facturePaiements: (id) => `${base_url}/facturation/factures/${id}/paiements`,
  facturePdf: (id) => `${base_url}/facturation/factures/${id}/pdf`,
  factureGeneratePdf: (id) => `${base_url}/facturation/factures/${id}/generate-pdf`,
  paiements: `${base_url}/facturation/paiements`,
  
  // Finance - Bons de sortie
  bonsDeSortie: `${base_url}/finance/bons-de-sortie`,
  bonDeSortieById: (id) => `${base_url}/finance/bons-de-sortie/${id}`,
  bonDeSortieStatus: (id) => `${base_url}/finance/bons-de-sortie/${id}/status`,
  bilanMensuel: `${base_url}/finance/bilan/mensuel`,
  bilanAnnuel: `${base_url}/finance/bilan/annuel`,
  // Notifications
  notifications: (userId) => `${base_url}/notifications/${userId}`,
  notificationRead: (id) => `${base_url}/notifications/${id}/read`,
  notificationsReadAll: (userId) => `${base_url}/notifications/users/${userId}/read-all`,
  // Statistics
  statisticsGlobal: `${base_url}/statistics/global`,
  statisticsClients: `${base_url}/statistics/clients`,
  statisticsFacturation: `${base_url}/statistics/facturation`,
  
  // Rendez-vous
  rendezVousDuJour: (userId) => `${base_url}/rendez-vous/du-jour/${userId}`,
  rendezVous: `${base_url}/rendez-vous`,
  rendezVousById: (id) => `${base_url}/rendez-vous/${id}`,
  reprogrammerRendezVous: (id) => `${base_url}/rendez-vous/${id}/reprogrammer`,
  prendreRendezVous: (id) => `${base_url}/rendez-vous/${id}/prendre`,
  
  // Site Administration - Slides
  slides: `${base_url}/api/slides`,
  siteAdminSlides: `${base_url}/api/site-admin/slides`,
  siteAdminSlideById: (id) => `${base_url}/api/site-admin/slides/${id}`,
  siteAdminSlideUploadImage: `${base_url}/api/site-admin/slides/upload-image`,
  siteAdminSlideToggleActive: (id) => `${base_url}/api/site-admin/slides/${id}/toggle-active`,
  
  // Site Administration - Services
  siteAdminServices: `${base_url}/api/site-admin/services`,
  siteAdminServiceById: (id) => `${base_url}/api/site-admin/services/${id}`,
  siteAdminServiceUploadImage: `${base_url}/api/site-admin/services/upload-image`,
  siteAdminServiceToggleActive: (id) => `${base_url}/api/site-admin/services/${id}/toggle-active`,
  
  // Site Administration - Partner Logos
  siteAdminPartnerLogos: `${base_url}/api/site-admin/partner-logos`,
  siteAdminPartnerLogoById: (id) => `${base_url}/api/site-admin/partner-logos/${id}`,
  siteAdminPartnerLogoUpload: `${base_url}/api/site-admin/partner-logos/upload-logo`,
  siteAdminPartnerLogoToggleActive: (id) => `${base_url}/api/site-admin/partner-logos/${id}/toggle-active`,
};

export const apiUrlAsset = {
  cv: `${base_url_asset}/resumes`,
  logo: `${base_url_asset}/logos`,
  coverFormation: `${base_url_asset}/formations`,
  candidate: `${base_url_asset}/candidates`,
  avatars: `${base_url_asset}/avatars`,
  games: `${base_url_asset}/games`,
  categories: `${base_url_asset}/categories`,
  competitions: `${base_url_asset}/competitions`,
  events: `${base_url_asset}/events`,
  actualites: `${base_url_asset}/actualites`,
};

export const apiUrlConsulteRessource = {
  viewJob: (_id) => `${base_url}/job/${_id}?overview=admin`,
};
