import { Navigate } from 'react-router-dom';

import { routesName } from 'src/constants/routes';
import { AdminStorage } from 'src/storages/admins_storage';

// ----------------------------------------------------------------------

export default function AppPage() {
  const admin = AdminStorage.getInfoAdmin();
  const rawRole = admin?.role ?? admin?.service;
  const roleStr = typeof rawRole === 'object' && rawRole !== null ? (rawRole.name || rawRole.slug || rawRole.label || '') : String(rawRole || '');
  const role = roleStr.trim().toUpperCase().replace(/\s+/g, '_');

  // Les médecins arrivent sur Mes consultations
  if (role === 'MEDECIN') {
    return <Navigate to={routesName.doctorsMyConsultations} replace />;
  }
  // Les infirmiers arrivent sur la gestion des patients (leurs patients affectés)
  if (role === 'INFIRMIER') {
    return <Navigate to={routesName.patientsAccueil} replace />;
  }
  // Les secrétaires arrivent sur l'accueil patient (accueil et création des patients)
  if (role === 'SECRÉTAIRE' || role === 'SECRETAIRE') {
    return <Navigate to={routesName.patientsAccueil} replace />;
  }
  // Laborantins / personnel labo : accès direct au module Laboratoire
  if (role === 'LABORANTIN' || role === 'LABORATOIRE') {
    return <Navigate to={routesName.laboratoryAnalyses} replace />;
  }
  return <Navigate to={routesName.adminUsers} replace />;
}
