import PropTypes from 'prop-types';
import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import { routesName } from 'src/constants/routes';
import DashboardLayout from 'src/layouts/dashboard';
import { AdminStorage } from 'src/storages/admins_storage';

export const IndexPage = lazy(() => import('src/pages/app'));
export const LoginPage = lazy(() => import('src/pages/login'));
export const ResetPassWordPage = lazy(() => import('src/pages/reset-password'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

// Admin pages
export const AdminDashboardMainView = lazy(() => import('src/sections/admin/admin-dashboard-main-view'));

// Clients pages
export const ClientsView = lazy(() => import('src/sections/clients/clients-view'));
export const ClientDetailsView = lazy(() => import('src/sections/clients/client-details-view'));
export const UnassignedClientsView = lazy(() => import('src/sections/clients/unassigned-clients-view'));

// Facturation pages
export const FacturationMainView = lazy(() => import('src/sections/facturation/facturation-main-view'));
export const FacturesView = lazy(() => import('src/sections/facturation/factures-view'));
export const FactureDetailsView = lazy(() => import('src/sections/facturation/facture-details-view'));
export const CreateFactureProformaPage = lazy(() => import('src/pages/create-facture-proforma'));
export const FacturesByCategoryPage = lazy(() => import('src/pages/factures-by-category'));
export const BonsDeSortieView = lazy(() => import('src/sections/facturation/bons-de-sortie-view'));
export const BonDeSortieDetailsView = lazy(() => import('src/sections/facturation/bon-de-sortie-details-view'));
export const BilanFinancierView = lazy(() => import('src/sections/facturation/bilan-financier-view'));

// Commerciaux pages
export const CommerciauxView = lazy(() => import('src/sections/commerciaux/commerciaux-view'));
export const CommercialDetailsView = lazy(() => import('src/sections/commerciaux/commercial-details-view'));
export const CreateCommercialPage = lazy(() => import('src/pages/create-commercial'));
export const CommercialDashboardView = lazy(() => import('src/sections/commerciaux/commercial-dashboard-view'));

// Statistics pages
export const StatisticsGlobalPage = lazy(() => import('src/pages/statistics-global'));
export const StatisticsClientsPage = lazy(() => import('src/pages/statistics-clients'));
export const StatisticsFacturationPage = lazy(() => import('src/pages/statistics-facturation'));

// Site Administration pages
export const SlidesListView = lazy(() => import('src/sections/site-admin/slides-list-view'));
export const ServicesListView = lazy(() => import('src/sections/site-admin/services-list-view'));
export const PartnerLogosListView = lazy(() => import('src/sections/site-admin/partner-logos-list-view'));

// Administration & Paramétrage (Module 4.1)
export const AdministrationView = lazy(() => import('src/sections/admin/administration/administration-view'));
export const UsersView = lazy(() => import('src/sections/admin/users/users-view'));
export const RolesPermissionsView = lazy(() => import('src/sections/admin/roles-permissions/roles-permissions-view'));
export const ConfigurationView = lazy(() => import('src/sections/admin/configuration/configuration-view'));
export const ActivityLogView = lazy(() => import('src/sections/admin/activity-log/activity-log-view'));
export const BackupRestoreView = lazy(() => import('src/sections/admin/backup-restore/backup-restore-view'));
export const MultiClinicsView = lazy(() => import('src/sections/admin/multi-clinics/multi-clinics-view'));

// Gestion des Patients (Module 4.2)
export const PatientsView = lazy(() => import('src/sections/patients/patients-view'));
export const PatientDetailsView = lazy(() => import('src/sections/patients/patient-details/patient-details-view'));

// Médecins (Module 4.3)
export const DoctorsView = lazy(() => import('src/sections/doctors/doctors-view'));
export const DoctorConsultationDetailsView = lazy(() => import('src/sections/doctors/doctor-consultation-details/doctor-consultation-details-view'));

// Infirmiers (Module 4.4)
export const NursesView = lazy(() => import('src/sections/nurses/nurses-view'));

// Aides-soignantes (Module 4.5)
export const AidesSoignantesView = lazy(() => import('src/sections/aides-soignantes/aides-soignantes-view'));

// Laboratoire (Module 4.6)
export const LaboratoryView = lazy(() => import('src/sections/laboratory/laboratory-view'));

// Pharmacie (Module 4.7)
export const PharmacyView = lazy(() => import('src/sections/pharmacy/pharmacy-view'));

// Caisse / Facturation (Module 4.8)
export const CaisseFacturationView = lazy(() => import('src/sections/caisse-facturation/caisse-facturation-view'));

// Gestionnaire / Direction (Module 4.9)
export const ManagerView = lazy(() => import('src/sections/manager/manager-view'));

// Rendez-vous & Planning (Module 4.10)
export const AppointmentsView = lazy(() => import('src/sections/appointments/appointments-view'));

// Notifications & Communication (Module 4.11)
export const NotificationsCommunicationView = lazy(() => import('src/sections/notifications-communication/notifications-communication-view'));

// Documents & Impressions (Module 4.12)
export const DocumentsImpressionsView = lazy(() => import('src/sections/documents-impressions/documents-impressions-view'));

// Sécurité & Conformité (Module 4.13)
export const SecuriteConformiteView = lazy(() => import('src/sections/securite-conformite/securite-conformite-view'));

// Technique (Transversal) (Module 4.14)
export const TechniqueView = lazy(() => import('src/sections/technique/technique-view'));

// ----------------------------------------------------------------------

export default function Router() {
  const routes = useRoutes([
    {
      element: (
        <ProtectRoute>
          <DashboardLayout>
            <Suspense>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </ProtectRoute>
      ),
      children: [
        { element: <IndexPage />, index: true },
        
        // Admin routes - Tableau de bord uniquement
        { path: routesName.admin, element: <AdminDashboardMainView /> },
        
        // Clients routes
        { path: routesName.clients, element: <ClientsView /> },
        { path: routesName.clientDetails, element: <ClientDetailsView /> },
        { path: routesName.unassignedClients, element: <UnassignedClientsView /> },
        
        // Facturation routes
        { path: routesName.factures, element: <FacturationMainView /> },
        { path: routesName.factureDetails, element: <FactureDetailsView /> },
        { path: routesName.createFactureProforma, element: <CreateFactureProformaPage /> },
        { path: routesName.facturesByCategory, element: <FacturesByCategoryPage /> },
        { path: routesName.bonsDeSortie, element: <FacturationMainView /> },
        { path: routesName.bonDeSortieDetails, element: <BonDeSortieDetailsView /> },
        { path: routesName.bilanFinancier, element: <BilanFinancierView /> },
        
        // Commerciaux routes
        { path: routesName.commerciaux, element: <CommerciauxView /> },
        { path: routesName.commercialDetails, element: <CommercialDetailsView /> },
        { path: routesName.createCommercial, element: <CreateCommercialPage /> },
        { path: routesName.commercialDashboard, element: <CommercialDashboardView /> },
        
        // Statistics routes
        { path: routesName.statisticsGlobal, element: <StatisticsGlobalPage /> },
        { path: routesName.statisticsClients, element: <StatisticsClientsPage /> },
        { path: routesName.statisticsFacturation, element: <StatisticsFacturationPage /> },
        
        // Site Administration routes
        { path: routesName.siteAdminSlides, element: <SlidesListView /> },
        { path: routesName.siteAdminServices, element: <ServicesListView /> },
        { path: routesName.siteAdminPartnerLogos, element: <PartnerLogosListView /> },
        
        // Administration & Paramétrage (Module 4.1)
        { path: routesName.adminUsers, element: <AdministrationView /> },
        { path: routesName.adminRolesPermissions, element: <AdministrationView /> },
        { path: routesName.adminConfiguration, element: <AdministrationView /> },
        { path: routesName.adminActivityLog, element: <AdministrationView /> },
        { path: routesName.adminBackupRestore, element: <AdministrationView /> },
        { path: routesName.adminMultiClinics, element: <AdministrationView /> },
        
        // Gestion des Patients (Module 4.2)
        { path: routesName.patientDetails, element: <PatientDetailsView /> },
        { path: routesName.patients, element: <PatientsView /> },
        { path: routesName.patientsDossiers, element: <PatientsView /> },
        { path: routesName.patientsHistory, element: <PatientsView /> },
        { path: routesName.patientsAntecedents, element: <PatientsView /> },
        { path: routesName.patientsDocuments, element: <PatientsView /> },
        { path: routesName.patientsConsultations, element: <PatientsView /> },
        { path: routesName.patientsAppointments, element: <PatientsView /> },
        { path: routesName.patientsQueue, element: <PatientsView /> },
        
        // Médecins (Module 4.3)
        { path: routesName.doctorsConsultationDetails, element: <DoctorConsultationDetailsView /> },
        { path: routesName.doctors, element: <DoctorsView /> },
        { path: routesName.doctorsViewDossiers, element: <DoctorsView /> },
        { path: routesName.doctorsCreateConsultation, element: <DoctorsView /> },
        { path: routesName.doctorsDiagnostic, element: <DoctorsView /> },
        { path: routesName.doctorsPrescriptions, element: <DoctorsView /> },
        { path: routesName.doctorsOrdonnances, element: <DoctorsView /> },
        { path: routesName.doctorsHospitalisation, element: <DoctorsView /> },
        { path: routesName.doctorsCertificats, element: <DoctorsView /> },
        { path: routesName.doctorsMessagerie, element: <DoctorsView /> },
        
        // Infirmiers (Module 4.4)
        { path: routesName.nurses, element: <NursesView /> },
        { path: routesName.nursesPlanning, element: <NursesView /> },
        { path: routesName.nursesTraitements, element: <NursesView /> },
        { path: routesName.nursesSignesVitaux, element: <NursesView /> },
        { path: routesName.nursesNotes, element: <NursesView /> },
        { path: routesName.nursesValidation, element: <NursesView /> },
        { path: routesName.nursesAlertes, element: <NursesView /> },
        
        // Aides-soignantes (Module 4.5)
        { path: routesName.aidesSoignantes, element: <AidesSoignantesView /> },
        { path: routesName.aidesSoignantesTaches, element: <AidesSoignantesView /> },
        { path: routesName.aidesSoignantesSoinsBase, element: <AidesSoignantesView /> },
        { path: routesName.aidesSoignantesAssistance, element: <AidesSoignantesView /> },
        { path: routesName.aidesSoignantesNotes, element: <AidesSoignantesView /> },
        { path: routesName.aidesSoignantesHistorique, element: <AidesSoignantesView /> },
        
        // Laboratoire (Module 4.6)
        { path: routesName.laboratory, element: <LaboratoryView /> },
        { path: routesName.laboratoryPrescriptions, element: <LaboratoryView /> },
        { path: routesName.laboratoryAnalyses, element: <LaboratoryView /> },
        { path: routesName.laboratoryResultats, element: <LaboratoryView /> },
        { path: routesName.laboratoryTransmission, element: <LaboratoryView /> },
        { path: routesName.laboratoryImpression, element: <LaboratoryView /> },
        { path: routesName.laboratoryConsommables, element: <LaboratoryView /> },
        { path: routesName.laboratoryStatistiques, element: <LaboratoryView /> },
        
        // Pharmacie (Module 4.7)
        { path: routesName.pharmacy, element: <PharmacyView /> },
        { path: routesName.pharmacyStocks, element: <PharmacyView /> },
        { path: routesName.pharmacyEntreesSorties, element: <PharmacyView /> },
        { path: routesName.pharmacyAlertes, element: <PharmacyView /> },
        { path: routesName.pharmacyDispensation, element: <PharmacyView /> },
        { path: routesName.pharmacyTarification, element: <PharmacyView /> },
        { path: routesName.pharmacyFournisseurs, element: <PharmacyView /> },
        { path: routesName.pharmacyInventaire, element: <PharmacyView /> },
        
        // Caisse / Facturation (Module 4.8)
        { path: routesName.caisse, element: <CaisseFacturationView /> },
        { path: routesName.caisseFactures, element: <CaisseFacturationView /> },
        { path: routesName.caisseFacturationService, element: <CaisseFacturationView /> },
        { path: routesName.caissePaiements, element: <CaisseFacturationView /> },
        { path: routesName.caisseTicketsRecus, element: <CaisseFacturationView /> },
        { path: routesName.caisseImpayes, element: <CaisseFacturationView /> },
        { path: routesName.caisseCloture, element: <CaisseFacturationView /> },
        { path: routesName.caisseHistorique, element: <CaisseFacturationView /> },
        
        // Gestionnaire / Direction (Module 4.9)
        { path: routesName.manager, element: <ManagerView /> },
        { path: routesName.managerDashboard, element: <ManagerView /> },
        { path: routesName.managerStatistiques, element: <ManagerView /> },
        { path: routesName.managerPerformances, element: <ManagerView /> },
        { path: routesName.managerRapports, element: <ManagerView /> },
        { path: routesName.managerStocks, element: <ManagerView /> },
        { path: routesName.managerAudit, element: <ManagerView /> },
        
        // Rendez-vous & Planning (Module 4.10)
        { path: routesName.appointments, element: <AppointmentsView /> },
        { path: routesName.appointmentsGestion, element: <AppointmentsView /> },
        { path: routesName.appointmentsAgenda, element: <AppointmentsView /> },
        { path: routesName.appointmentsNotifications, element: <AppointmentsView /> },
        { path: routesName.appointmentsUrgences, element: <AppointmentsView /> },

        // Notifications & Communication (Module 4.11)
        { path: routesName.notificationsCommunication, element: <NotificationsCommunicationView /> },
        { path: routesName.notificationsInternes, element: <NotificationsCommunicationView /> },
        { path: routesName.notificationsAlertesMedicales, element: <NotificationsCommunicationView /> },
        { path: routesName.notificationsRappels, element: <NotificationsCommunicationView /> },
        { path: routesName.notificationsMessagerie, element: <NotificationsCommunicationView /> },
        { path: routesName.notificationsHistorique, element: <NotificationsCommunicationView /> },

        // Documents & Impressions (Module 4.12)
        { path: routesName.documentsImpressions, element: <DocumentsImpressionsView /> },
        { path: routesName.documentsOrdonnances, element: <DocumentsImpressionsView /> },
        { path: routesName.documentsResultatsAnalyses, element: <DocumentsImpressionsView /> },
        { path: routesName.documentsFactures, element: <DocumentsImpressionsView /> },
        { path: routesName.documentsCertificats, element: <DocumentsImpressionsView /> },
        { path: routesName.documentsRapports, element: <DocumentsImpressionsView /> },
        { path: routesName.documentsExport, element: <DocumentsImpressionsView /> },

        // Sécurité & Conformité (Module 4.13)
        { path: routesName.securiteConformite, element: <SecuriteConformiteView /> },
        { path: routesName.securiteAuthentification, element: <SecuriteConformiteView /> },
        { path: routesName.securiteGestionAcces, element: <SecuriteConformiteView /> },
        { path: routesName.securiteChiffrement, element: <SecuriteConformiteView /> },
        { path: routesName.securiteTraçabilite, element: <SecuriteConformiteView /> },
        { path: routesName.securiteConformiteReglementaire, element: <SecuriteConformiteView /> },

        // Technique (Transversal) (Module 4.14)
        { path: routesName.technique, element: <TechniqueView /> },
        { path: routesName.techniqueApi, element: <TechniqueView /> },
        { path: routesName.techniqueApplications, element: <TechniqueView /> },
        { path: routesName.techniqueSauvegardes, element: <TechniqueView /> },
        { path: routesName.techniqueMultilingue, element: <TechniqueView /> },
        { path: routesName.techniqueIntegrations, element: <TechniqueView /> },
      ],
    },
    {
      path: 'login',
      element: <LoginPage />,
    },
    {
      path: 'reset-password',
      element: <ResetPassWordPage />,
    },
    {
      path: '404',
      element: <Page404 />,
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);

  return routes;
}

const ProtectRoute = ({ children }) => {
  const isVerify = AdminStorage.verifyAdminLogged();
  console.log('Admin logged in:', isVerify); // Debug log
  if (isVerify) {
    return children;
  }
  return <Navigate to="/login" replace />;
};

ProtectRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
