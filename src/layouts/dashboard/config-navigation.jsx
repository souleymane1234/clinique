import { routesName } from 'src/constants/routes';

import SvgColor from 'src/components/svg-color';
// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const navConfig = [
  {
    title: 'Administration & Paramétrage',
    path: routesName.adminUsers,
    childrenPath: [
      routesName.adminUsers,
      routesName.adminRolesPermissions,
      routesName.siteAdminServices,
      routesName.adminActivityLog,
      routesName.adminBackupRestore,
      routesName.adminMultiClinics,
    ],
    icon: icon('ic_lock'),
    protected: ['ADMIN'], // Administrateur uniquement
  },
  {
    title: 'Gestion des Patients',
    path: routesName.patients,
    childrenPath: [
      routesName.patients,
      routesName.patientsDossiers,
      routesName.patientsHistory,
      routesName.patientsAntecedents,
      routesName.patientsDocuments,
      routesName.patientsConsultations,
      routesName.patientsAppointments,
      routesName.patientsQueue,
      // Les routes patientsHistory, patientsAntecedents, patientsDocuments, patientsConsultations
      // sont accessibles uniquement depuis la vue de détails d'un patient
    ],
    icon: icon('ic_user'),
    protected: ['ADMIN', 'MEDECIN', 'INFIRMIER'], // Administrateur, Médecin, Infirmier
  },
  {
    title: 'Médecins',
    path: routesName.doctorsViewDossiers, // Default sub-route for doctors
    childrenPath: [
      routesName.doctors,
      routesName.doctorsViewDossiers,
      routesName.doctorsCreateConsultation,
      routesName.doctorsDiagnostic,
      routesName.doctorsPrescriptions,
      routesName.doctorsOrdonnances,
      routesName.doctorsHospitalisation,
      routesName.doctorsCertificats,
      routesName.doctorsMessagerie,
    ],
    icon: icon('ic_lock'), // You may want to use a medical icon
    protected: ['ADMIN', 'MEDECIN'], // Administrateur, Médecin
  },
  {
    title: 'Infirmiers',
    path: routesName.nursesPlanning, // Default sub-route for nurses
    childrenPath: [
      routesName.nurses,
      routesName.nursesPlanning,
      routesName.nursesTraitements,
      routesName.nursesSignesVitaux,
      routesName.nursesNotes,
      routesName.nursesValidation,
      routesName.nursesAlertes,
    ],
    icon: icon('ic_user'), // You may want to use a medical icon
    protected: ['ADMIN', 'INFIRMIER'], // Administrateur, Infirmier
  },
  {
    title: 'Aides-soignantes',
    path: routesName.aidesSoignantesTaches, // Default sub-route for aides-soignantes
    childrenPath: [
      routesName.aidesSoignantes,
      routesName.aidesSoignantesTaches,
      routesName.aidesSoignantesSoinsBase,
      routesName.aidesSoignantesAssistance,
      routesName.aidesSoignantesNotes,
      routesName.aidesSoignantesHistorique,
    ],
    icon: icon('ic_user'), // You may want to use a medical icon
    protected: ['ADMIN', 'INFIRMIER', 'AIDE_SOIGNANTE'], // Administrateur, Infirmier, Aide-soignante
  },
  {
    title: 'Laboratoire',
    path: routesName.laboratoryPrescriptions, // Default sub-route for laboratory
    childrenPath: [
      routesName.laboratory,
      routesName.laboratoryPrescriptions,
      routesName.laboratoryAnalyses,
      routesName.laboratoryResultats,
      routesName.laboratoryTransmission,
      routesName.laboratoryImpression,
      routesName.laboratoryConsommables,
      routesName.laboratoryStatistiques,
    ],
    icon: icon('ic_lock'), // You may want to use a medical icon
    protected: ['ADMIN', 'LABORATOIRE', 'MEDECIN'], // Administrateur, Laboratoire, Médecin
  },
  {
    title: 'Pharmacie',
    path: routesName.pharmacyStocks, // Default sub-route for pharmacy
    childrenPath: [
      routesName.pharmacy,
      routesName.pharmacyStocks,
      routesName.pharmacyEntreesSorties,
      routesName.pharmacyAlertes,
      routesName.pharmacyDispensation,
      routesName.pharmacyTarification,
      routesName.pharmacyFournisseurs,
      routesName.pharmacyInventaire,
    ],
    icon: icon('ic_lock'), // You may want to use a medical icon
    protected: ['ADMIN', 'PHARMACIE', 'MEDECIN'], // Administrateur, Pharmacie, Médecin
  },
  {
    title: 'Caisse / Facturation',
    path: routesName.caisseFactures, // Default sub-route for caisse
    childrenPath: [
      routesName.caisse,
      routesName.caisseFactures,
      routesName.caisseFacturationService,
      routesName.caissePaiements,
      routesName.caisseTicketsRecus,
      routesName.caisseImpayes,
      routesName.caisseCloture,
      routesName.caisseHistorique,
    ],
    icon: icon('ic_lock'), // You may want to use a medical icon
    protected: ['ADMIN', 'CAISSE', 'COMPTABILITE'], // Administrateur, Caisse, Comptabilité
  },
  {
    title: 'Gestionnaire / Direction',
    path: routesName.managerDashboard, // Default sub-route for manager
    childrenPath: [
      routesName.manager,
      routesName.managerDashboard,
      routesName.managerStatistiques,
      routesName.managerPerformances,
      routesName.managerRapports,
      routesName.managerStocks,
      routesName.managerAudit,
    ],
    icon: icon('ic_lock'), // You may want to use a medical icon
    protected: ['ADMIN', 'GESTIONNAIRE', 'DIRECTION'], // Administrateur, Gestionnaire, Direction
  },
  {
    title: 'Rendez-vous & Planning',
    path: routesName.appointmentsGestion, // Default sub-route for appointments
    childrenPath: [
      routesName.appointments,
      routesName.appointmentsGestion,
      routesName.appointmentsAgenda,
      routesName.appointmentsNotifications,
      routesName.appointmentsUrgences,
    ],
    icon: icon('ic_user'), // You may want to use a medical icon
    protected: ['ADMIN', 'MEDECIN', 'INFIRMIER', 'SECRETAIRE'], // Administrateur, Médecin, Infirmier, Secrétaire
  },
  {
    title: 'Notifications & Communication',
    path: routesName.notificationsInternes, // Default sub-route for notifications-communication
    childrenPath: [
      routesName.notificationsCommunication,
      routesName.notificationsInternes,
      routesName.notificationsAlertesMedicales,
      routesName.notificationsRappels,
      routesName.notificationsMessagerie,
      routesName.notificationsHistorique,
    ],
    icon: icon('ic_user'), // You may want to use a medical icon
    protected: ['ADMIN', 'MEDECIN', 'INFIRMIER', 'SECRETAIRE'], // Tous les utilisateurs peuvent accéder
  },
  {
    title: 'Documents & Impressions',
    path: routesName.documentsOrdonnances, // Default sub-route for documents-impressions
    childrenPath: [
      routesName.documentsImpressions,
      routesName.documentsOrdonnances,
      routesName.documentsResultatsAnalyses,
      routesName.documentsFactures,
      routesName.documentsCertificats,
      routesName.documentsRapports,
      routesName.documentsExport,
    ],
    icon: icon('ic_lock'), // You may want to use a document icon
    protected: ['ADMIN', 'MEDECIN', 'INFIRMIER', 'SECRETAIRE', 'PHARMACIE', 'LABORATOIRE'], // Plusieurs rôles peuvent accéder
  },
  {
    title: 'Sécurité & Conformité',
    path: routesName.securiteAuthentification, // Default sub-route for securite-conformite
    childrenPath: [
      routesName.securiteConformite,
      routesName.securiteAuthentification,
      routesName.securiteGestionAcces,
      routesName.securiteChiffrement,
      routesName.securiteTraçabilite,
      routesName.securiteConformiteReglementaire,
    ],
    icon: icon('ic_lock'), // Lock icon for security
    protected: ['ADMIN'], // Seuls les administrateurs peuvent accéder
  },
  {
    title: 'Technique (Transversal)',
    path: routesName.techniqueApi, // Default sub-route for technique
    childrenPath: [
      routesName.technique,
      routesName.techniqueApi,
      routesName.techniqueApplications,
      routesName.techniqueSauvegardes,
      routesName.techniqueMultilingue,
      routesName.techniqueIntegrations,
    ],
    icon: icon('ic_lock'), // You may want to use a technical icon
    protected: ['ADMIN'], // Seuls les administrateurs peuvent accéder
  },
];

export default navConfig;
