import { Navigate } from 'react-router-dom';

import { routesName } from 'src/constants/routes';
import { AdminStorage } from 'src/storages/admins_storage';

// ----------------------------------------------------------------------

export default function AppPage() {
  const admin = AdminStorage.getInfoAdmin();
  const role = ((admin?.role ?? admin?.service) ?? '').toString().toUpperCase().trim();

  // Les médecins arrivent sur Mes consultations, les autres sur Administration
  if (role === 'MEDECIN') {
    return <Navigate to={routesName.doctorsMyConsultations} replace />;
  }
  return <Navigate to={routesName.adminUsers} replace />;
}
