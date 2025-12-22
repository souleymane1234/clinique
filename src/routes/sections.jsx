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
