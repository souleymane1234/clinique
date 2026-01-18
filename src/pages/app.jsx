import { Navigate } from 'react-router-dom';

import { routesName } from 'src/constants/routes';

// ----------------------------------------------------------------------

export default function AppPage() {
  // Rediriger directement vers Administration & Paramétrage
  return <Navigate to={routesName.adminUsers} replace />;
}
