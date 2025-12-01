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

// Critical Administration pages
export const AdminCriticalView = lazy(() => import('src/sections/admin/critical/admin-critical-view'));

// Administration Admins pages
export const AdministrationAdminsView = lazy(() => import('src/sections/admin/administration-admins/administration-admins-view'));

// File Active pages
export const FileActiveView = lazy(() => import('src/sections/admin/file-active/file-active-view'));

// Configuration pages
export const ConfigurationView = lazy(() => import('src/sections/admin/configuration/configuration-view'));

// Reports pages
export const ReportsView = lazy(() => import('src/sections/admin/reports/reports-view'));

// Roles & Permissions pages
export const RolesPermissionsView = lazy(() => import('src/sections/admin/roles-permissions/roles-permissions-view'));

// Stations pages
export const StationsView = lazy(() => import('src/sections/admin/stations/stations-view'));
export const StationDetailsView = lazy(() => import('src/sections/admin/stations/station-details-view'));

// Users pages
export const UsersView = lazy(() => import('src/sections/admin/users/users-view'));
export const UserDetailsView = lazy(() => import('src/sections/admin/users/user-details-view'));

// Sessions pages
export const SessionsView = lazy(() => import('src/sections/admin/sessions/sessions-view'));
export const SessionDetailsView = lazy(() => import('src/sections/admin/sessions/session-details-view'));

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
        
        // Admin routes
        { path: routesName.admin, element: <AdminDashboardMainView /> },
        
        // Critical Administration routes (Super Admin only)
        { path: routesName.adminCritical, element: <AdminCriticalView /> },
        
        // Administration Admins routes (Super Admin only)
        { path: routesName.adminAdministrationAdmins, element: <AdministrationAdminsView /> },
        
        // File Active routes (Super Admin, Admin, Station, Pompiste)
        { path: routesName.adminFileActive, element: <FileActiveView /> },
        { path: routesName.adminFileActiveBySession, element: <FileActiveView /> },
        
        // Configuration routes (Super Admin only)
        { path: routesName.adminConfiguration, element: <ConfigurationView /> },
        
        // Reports routes (Super Admin only)
        { path: routesName.adminReports, element: <ReportsView /> },
        
        // Roles & Permissions routes (Super Admin only)
        { path: routesName.adminRolesPermissions, element: <RolesPermissionsView /> },
        
        // Stations routes (Super Admin, Admin, Station)
        { path: routesName.adminStations, element: <StationsView /> },
        { path: routesName.adminStationDetails, element: <StationDetailsView /> },
        
        // Users routes (Super Admin, Admin)
        { path: routesName.adminUsers, element: <UsersView /> },
        { path: routesName.adminUserDetails, element: <UserDetailsView /> },
        
        // Sessions routes (Super Admin, Admin, Station)
        { path: routesName.adminSessions, element: <SessionsView /> },
        { path: routesName.adminSessionDetails, element: <SessionDetailsView /> },
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
