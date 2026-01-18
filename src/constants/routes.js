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
  
  // Administration - Activity Log
  adminActivityLog: '/admin/activity-log',
  
  // Administration - Backup & Restore
  adminBackupRestore: '/admin/backup-restore',
  
  // Administration - Multi-Clinics
  adminMultiClinics: '/admin/multi-clinics',
  
  // Administration - Users Management
  adminUsers: '/admin/users',
  
  // Stations Management
  adminStations: '/admin/stations',
  adminStationDetails: '/admin/stations/:id',
  
  // Sessions Management
  adminSessions: '/admin/sessions',
  adminSessionDetails: '/admin/sessions/:id',
  
  // Users Management
  users: '/users',
  userDetails: '/users/:id',
  
  // Patients Management
  patients: '/patients',
  patientDetails: '/patients/:id',
  patientsDossiers: '/patients/dossiers',
  patientsHistory: '/patients/history',
  patientsAntecedents: '/patients/antecedents',
  patientsDocuments: '/patients/documents',
  patientsConsultations: '/patients/consultations',
  patientsAppointments: '/patients/appointments',
  patientsQueue: '/patients/queue',
  
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
  
  // Médecins Management (Module 4.3)
  doctors: '/doctors',
  doctorsViewDossiers: '/doctors/view-dossiers',
  doctorsCreateConsultation: '/doctors/create-consultation',
  doctorsConsultationDetails: '/doctors/consultations/:id',
  doctorsDiagnostic: '/doctors/diagnostic',
  doctorsPrescriptions: '/doctors/prescriptions',
  doctorsOrdonnances: '/doctors/ordonnances',
  doctorsHospitalisation: '/doctors/hospitalisation',
  doctorsCertificats: '/doctors/certificats',
  doctorsMessagerie: '/doctors/messagerie',
  
  // Infirmiers Management (Module 4.4)
  nurses: '/nurses',
  nursesPlanning: '/nurses/planning',
  nursesTraitements: '/nurses/traitements',
  nursesSignesVitaux: '/nurses/signes-vitaux',
  nursesNotes: '/nurses/notes',
  nursesValidation: '/nurses/validation',
  nursesAlertes: '/nurses/alertes',
  
  // Aides-soignantes Management (Module 4.5)
  aidesSoignantes: '/aides-soignantes',
  aidesSoignantesTaches: '/aides-soignantes/taches',
  aidesSoignantesSoinsBase: '/aides-soignantes/soins-base',
  aidesSoignantesAssistance: '/aides-soignantes/assistance',
  aidesSoignantesNotes: '/aides-soignantes/notes',
  aidesSoignantesHistorique: '/aides-soignantes/historique',
  
  // Laboratoire Management (Module 4.6)
  laboratory: '/laboratory',
  laboratoryPrescriptions: '/laboratory/prescriptions',
  laboratoryAnalyses: '/laboratory/analyses',
  laboratoryResultats: '/laboratory/resultats',
  laboratoryTransmission: '/laboratory/transmission',
  laboratoryImpression: '/laboratory/impression',
  laboratoryConsommables: '/laboratory/consommables',
  laboratoryStatistiques: '/laboratory/statistiques',
  
  // Pharmacie Management (Module 4.7)
  pharmacy: '/pharmacy',
  pharmacyStocks: '/pharmacy/stocks',
  pharmacyEntreesSorties: '/pharmacy/entrees-sorties',
  pharmacyAlertes: '/pharmacy/alertes',
  pharmacyDispensation: '/pharmacy/dispensation',
  pharmacyTarification: '/pharmacy/tarification',
  pharmacyFournisseurs: '/pharmacy/fournisseurs',
  pharmacyInventaire: '/pharmacy/inventaire',
  
  // Caisse / Facturation Management (Module 4.8)
  caisse: '/caisse',
  caisseFactures: '/caisse/factures',
  caisseFacturationService: '/caisse/facturation-service',
  caissePaiements: '/caisse/paiements',
  caisseTicketsRecus: '/caisse/tickets-recus',
  caisseImpayes: '/caisse/impayes',
  caisseCloture: '/caisse/cloture',
  caisseHistorique: '/caisse/historique',
  
  // Gestionnaire / Direction Management (Module 4.9)
  manager: '/manager',
  managerDashboard: '/manager/dashboard',
  managerStatistiques: '/manager/statistiques',
  managerPerformances: '/manager/performances',
  managerRapports: '/manager/rapports',
  managerStocks: '/manager/stocks',
  managerAudit: '/manager/audit',
  
  // Rendez-vous & Planning Management (Module 4.10)
  appointments: '/appointments',
  appointmentsGestion: '/appointments/gestion',
  appointmentsAgenda: '/appointments/agenda',
  appointmentsNotifications: '/appointments/notifications',
  appointmentsUrgences: '/appointments/urgences',
  
  // Notifications & Communication Management (Module 4.11)
  notificationsCommunication: '/notifications-communication',
  notificationsInternes: '/notifications-communication/notifications-internes',
  notificationsAlertesMedicales: '/notifications-communication/alertes-medicales',
  notificationsRappels: '/notifications-communication/rappels',
  notificationsMessagerie: '/notifications-communication/messagerie',
  notificationsHistorique: '/notifications-communication/historique',
  
  // Documents & Impressions Management (Module 4.12)
  documentsImpressions: '/documents-impressions',
  documentsOrdonnances: '/documents-impressions/ordonnances',
  documentsResultatsAnalyses: '/documents-impressions/resultats-analyses',
  documentsFactures: '/documents-impressions/factures',
  documentsCertificats: '/documents-impressions/certificats',
  documentsRapports: '/documents-impressions/rapports',
  documentsExport: '/documents-impressions/export',
  
  // Sécurité & Conformité Management (Module 4.13)
  securiteConformite: '/securite-conformite',
  securiteAuthentification: '/securite-conformite/authentification',
  securiteGestionAcces: '/securite-conformite/gestion-acces',
  securiteChiffrement: '/securite-conformite/chiffrement',
  securiteTraçabilite: '/securite-conformite/traçabilite',
  securiteConformiteReglementaire: '/securite-conformite/conformite',
  
  // Technique (Transversal) Management (Module 4.14)
  technique: '/technique',
  techniqueApi: '/technique/api',
  techniqueApplications: '/technique/applications',
  techniqueSauvegardes: '/technique/sauvegardes',
  techniqueMultilingue: '/technique/multilingue',
  techniqueIntegrations: '/technique/integrations',
};
