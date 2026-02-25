import { Navigate } from 'react-router-dom';

import { routesName } from 'src/constants/routes';
import { AdminStorage } from 'src/storages/admins_storage';

// ----------------------------------------------------------------------

export default function AppPage() {
  const admin = AdminStorage.getInfoAdmin();
  const role = ((admin?.role ?? admin?.service) ?? '').toString().toUpperCase().trim();

  // Les médecins arrivent sur Mes consultations
  if (role === 'MEDECIN') {
    return <Navigate to={routesName.doctorsMyConsultations} replace />;
  }
  // Les infirmiers arrivent sur la gestion des patients (leurs patients affectés)
  if (role === 'INFIRMIER') {
    return <Navigate to={routesName.patientsAccueil} replace />;
  }
  // Les secrétaires arrivent sur l'accueil patient (accueil et création des patients)
  if (role === 'SECRETAIRE') {
    return <Navigate to={routesName.patientsAccueil} replace />;
  }
  return <Navigate to={routesName.adminUsers} replace />;
}
