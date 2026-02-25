// const base_url = import.meta.env.VITE_BASE_URL || 'https://api.centremedical.preventic-afric.com/api';
const base_url = 'http://localhost:3000/api';
const base_url_asset = import.meta.env.VITE_BASE_URL_ASSET;

export const apiUrl = {
  // Authentication
  authentication: `${base_url}/auth/login`,
  register: `${base_url}/auth/register`,
  getCurrentUser: `${base_url}/auth`,
  resetPassword: `${base_url}/reset-passord`,

  // Users (Legacy - /users)
  users: `${base_url}/users`,
  getUserById: (userId) => `${base_url}/users/${userId}`,
  updateUser: (id) => `${base_url}/users/${id}`,
  deleteUser: (id) => `${base_url}/users/${id}`,
  suspendUser: (id) => `${base_url}/users/${id}/suspend`,
  changeUserPassword: (id) => `${base_url}/users/${id}/change-password`,

  // User (New API - /user)
  user: `${base_url}/user`,
  userById: (id) => `${base_url}/user/${id}`,
  updateUserNew: (id) => `${base_url}/user/${id}`,
  deleteUserNew: (id) => `${base_url}/user/${id}`,
  toggleUserLock: (id) => `${base_url}/user/${id}/toggle-lock`,
  changeUserPasswordNew: (id) => `${base_url}/user/${id}/password`,

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
  // Appointments (nouvelle API)
  appointments: `${base_url}/appointments`,
  appointmentById: (id) => `${base_url}/appointments/${id}`,
  appointmentsPaginated: `${base_url}/appointments/paginated`,
  appointmentsByMedecin: (medecinId) => `${base_url}/appointments/medecin/${medecinId}`,
  confirmAppointment: (id) => `${base_url}/appointments/${id}/confirmer`,
  cancelAppointment: (id) => `${base_url}/appointments/${id}/annuler`,
  
  // Laboratory
  laboratoryAnalyses: `${base_url}/laboratory/analyses`,
  laboratoryAnalysisById: (id) => `${base_url}/laboratory/analyses/${id}`,
  laboratoryAnalysesPaginated: `${base_url}/laboratory/analyses/paginated`,
  laboratoryAnalysesStatistics: `${base_url}/laboratory/analyses/statistics`,
  laboratoryAnalysisComplete: (id) => `${base_url}/laboratory/analyses/${id}/complete`,
  laboratoryAnalysisResults: (id) => `${base_url}/laboratory/analyses/${id}/results`,
  addLaboratoryAnalysisResult: (id) => `${base_url}/laboratory/analyses/${id}/results`,
  laboratoryAnalysisReceive: (id) => `${base_url}/laboratory/analyses/${id}/receptionner`,
  laboratoryAnalysisPerform: (id) => `${base_url}/laboratory/analyses/${id}/realiser`,
  laboratoryAnalysisValidate: (id) => `${base_url}/laboratory/analyses/${id}/valider`,
  // Laboratory Results
  laboratoryResultById: (id) => `${base_url}/laboratory/results/${id}`,
  // Laboratory Consommables
  laboratoryConsommables: `${base_url}/laboratory/consommables`,
  laboratoryConsommableById: (id) => `${base_url}/laboratory/consommables/${id}`,
  laboratoryConsommablesPaginated: `${base_url}/laboratory/consommables/paginated`,
  laboratoryConsommablesRupture: `${base_url}/laboratory/consommables/rupture`,
  laboratoryConsommablesPerimes: `${base_url}/laboratory/consommables/perimes`,
  laboratoryConsommablesMouvements: `${base_url}/laboratory/consommables/mouvements`,
  
  // Patients
  patients: `${base_url}/patient`,
  patientById: (id) => `${base_url}/patient/${id}`,
  updatePatient: (id) => `${base_url}/patient/${id}`,
  deletePatient: (id) => `${base_url}/patient/${id}`,
  // Patient helpers
  patientsPaginated: `${base_url}/patient/paginated`,
  patientByNumber: (numero) => `${base_url}/patient/${numero}`,
  
  // Antécédents (new endpoints)
  antecedents: `${base_url}/antecedent`,
  antecedentById: (id) => `${base_url}/antecedent/${id}`,
  updateAntecedent: (id) => `${base_url}/antecedent/${id}`,
  deleteAntecedent: (id) => `${base_url}/antecedent/${id}`,
  antecedentsPaginated: `${base_url}/antecedent/paginated`,
  patientAntecedents: (patientId) => `${base_url}/antecedent/patient/${patientId}`,
  
  // Deprecated (kept for backward compatibility)
  patientAntecedents_old: `${base_url}/antecedent`,
  addPatientAntecedent: `${base_url}/antecedent`,
  deletePatientAntecedent: (id) => `${base_url}/antecedent/${id}`,
  
  // Allergies (new endpoints)
  allergies: `${base_url}/allergy`,
  allergyById: (id) => `${base_url}/allergy/${id}`,
  updateAllergy: (id) => `${base_url}/allergy/${id}`,
  deleteAllergy: (id) => `${base_url}/allergy/${id}`,
  allergiesPaginated: `${base_url}/allergy/paginated`,
  patientAllergies: (patientId) => `${base_url}/allergy/patient/${patientId}`,
  
  // Deprecated (kept for backward compatibility)
  patientAllergies_old: `${base_url}/allergie`,
  addPatientAllergy: `${base_url}/allergie`,
  deletePatientAllergy: (id) => `${base_url}/allergie/${id}`,
  
  // Documents
  patientDocuments: `${base_url}/documents`,
  uploadPatientDocument: `${base_url}/documents/upload`,
  deletePatientDocument: (id) => `${base_url}/documents/${id}`,
  
  // Consultations
  consultations: `${base_url}/consultations`,
  consultationById: (id) => `${base_url}/consultations/${id}`,
  consultationComplete: (id) => `${base_url}/consultations/${id}/complete`,
  updateConsultation: (id) => `${base_url}/consultations/${id}`,
  deleteConsultation: (id) => `${base_url}/consultations/${id}`,
  consultationStatus: (id) => `${base_url}/consultations/${id}/status`,
  consultationsPaginated: `${base_url}/consultations/paginated`,
  // Prescriptions
  consultationPrescriptions: (id) => `${base_url}/consultations/${id}/prescriptions`,
  consultationPrescriptionsPaginated: (id) => `${base_url}/consultations/${id}/prescriptions/paginated`,
  addConsultationPrescription: (id) => `${base_url}/consultations/${id}/prescriptions`,
  deletePrescription: (prescriptionId) => `${base_url}/consultations/prescriptions/${prescriptionId}`,
  // Certificats
  consultationCertificats: (id) => `${base_url}/consultations/${id}/certificats`,
  consultationCertificatsPaginated: (id) => `${base_url}/consultations/${id}/certificats/paginated`,
  addConsultationCertificat: (id) => `${base_url}/consultations/${id}/certificats`,
  // Legacy (pour compatibilité)
  patientConsultations: `${base_url}/consultation`,
  
  // Historique Médical
  patientMedicalHistory: `${base_url}/medical-history`,
  
  // File d'attente
  patientQueue: `${base_url}/queue`,
  updatePatientTriage: (id) => `${base_url}/queue/${id}`,
  removeFromQueue: (id) => `${base_url}/queue/${id}`,
  
  // Site Administration - Slides
  slides: `${base_url}/slides`,
  siteAdminSlides: `${base_url}/site-admin/slides`,
  siteAdminSlideById: (id) => `${base_url}/site-admin/slides/${id}`,
  siteAdminSlideUploadImage: `${base_url}/site-admin/slides/upload-image`,
  siteAdminSlideToggleActive: (id) => `${base_url}/site-admin/slides/${id}/toggle-active`,
  
  // Site Administration - Services
  siteAdminServices: `${base_url}/site-admin/services`,
  siteAdminServiceById: (id) => `${base_url}/site-admin/services/${id}`,
  siteAdminServiceUploadImage: `${base_url}/site-admin/services/upload-image`,
  siteAdminServiceToggleActive: (id) => `${base_url}/site-admin/services/${id}/toggle-active`,
  
  // Site Administration - Partner Logos
  siteAdminPartnerLogos: `${base_url}/site-admin/partner-logos`,
  siteAdminPartnerLogoById: (id) => `${base_url}/site-admin/partner-logos/${id}`,
  siteAdminPartnerLogoUpload: `${base_url}/site-admin/partner-logos/upload-logo`,
  siteAdminPartnerLogoToggleActive: (id) => `${base_url}/site-admin/partner-logos/${id}/toggle-active`,
  
  // Roles & Permissions
  rolesPermissionsMatrix: `${base_url}/roles-permissions/matrix`,
  rolesUsers: `${base_url}/roles-permissions/users`,
  updateUserRole: (userId) => `${base_url}/roles-permissions/users/${userId}/role`,
  resetUserPassword: (userId) => `${base_url}/roles-permissions/users/${userId}/reset-password`,
  disconnectUser: (userId) => `${base_url}/roles-permissions/users/${userId}/disconnect`,
  addRolePermission: (role) => `${base_url}/roles-permissions/roles/${role}/permissions`,
  removeRolePermission: (role, permission) => `${base_url}/roles-permissions/roles/${role}/permissions/${permission}`,
  
  // Modules de permissions
  permissionModules: `${base_url}/module-permission`,
  permissionModulesPaginated: `${base_url}/module-permission/paginated`,
  permissionModuleById: (id) => `${base_url}/module-permission/${id}`,
  
  // Permissions
  permissions: `${base_url}/permission`,
  permissionsPaginated: `${base_url}/permission/paginated`,
  permissionsByModule: (moduleId) => `${base_url}/module-permission/${moduleId}/permissions`,
  permissionsByModulePaginated: (moduleId) => `${base_url}/permission/module/${moduleId}/paginated`,
  permissionById: (id) => `${base_url}/permission/${id}`,
  
  // Rôles
  role: `${base_url}/role`,
  roleById: (id) => `${base_url}/role/${id}`,
  rolePaginated: `${base_url}/role/paginated`,
  roleGlobalPermissions: (uuid) => `${base_url}/role/${uuid}/global-permissions`,
  roleTogglePermissionStatus: (uuid) => `${base_url}/role/permissions/${uuid}/toggle`,
  roleGeneratePermissions: (uuid) => `${base_url}/role/${uuid}/generate-permissions`,
  
  // Assignation rôles aux modules
  assignRoleToModule: (moduleId, roleId) => `${base_url}/module-permission/${moduleId}/roles/${roleId}`,
  removeRoleFromModule: (moduleId, roleId) => `${base_url}/module-permission/${moduleId}/roles/${roleId}`,
  moduleRoles: (moduleId) => `${base_url}/module-permission/${moduleId}/roles`,
  
  // Médecins
  medecins: `${base_url}/medecin`,
  medecinById: (id) => `${base_url}/medecin/${id}`,
  updateMedecin: (id) => `${base_url}/medecin/${id}`,
  deleteMedecin: (id) => `${base_url}/medecin/${id}`,
  medecinsPaginated: `${base_url}/medecin/paginated`,

  // Infirmiers
  infirmiers: `${base_url}/infirmier`,
  infirmierById: (id) => `${base_url}/infirmier/${id}`,
  updateInfirmier: (id) => `${base_url}/infirmier/${id}`,
  deleteInfirmier: (id) => `${base_url}/infirmier/${id}`,

  // Secrétaires
  secretaires: `${base_url}/secretaire`,
  secretaireById: (id) => `${base_url}/secretaire/${id}`,
  updateSecretaire: (id) => `${base_url}/secretaire/${id}`,
  deleteSecretaire: (id) => `${base_url}/secretaire/${id}`,
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
