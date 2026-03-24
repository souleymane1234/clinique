import { AdminStorage } from 'src/storages/admins_storage';

/**
 * Nom affichable du personnel connecté (réception labo, validation, mouvements stock).
 */
export function getCurrentStaffDisplayName() {
  const admin = AdminStorage.getInfoAdmin() || {};
  if (admin.firstName || admin.lastName) {
    return `${admin.firstName || ''} ${admin.lastName || ''}`.trim();
  }
  if (admin.first_name || admin.last_name) {
    return `${admin.first_name || ''} ${admin.last_name || ''}`.trim();
  }
  if (admin.email) {
    return admin.email;
  }
  const r = admin.role;
  if (typeof r === 'object' && r !== null && (r.name || r.slug)) {
    return String(r.name || r.slug);
  }
  return 'Utilisateur connecté';
}
