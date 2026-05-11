/**
 * Clés centralisées pour React Query (invalidation cohérente après mutations).
 */
export const QUERY_KEYS = {
  consultations: {
    doctorMyListRoot: ['consultations', 'doctor-my-consultations'],
    accueilAll: ['consultations', 'accueil-all'],
  },
  patients: {
    accueilAll: ['patients', 'accueil-all'],
  },
  billing: {
    invoicesOpen: ['billing', 'invoices-open'],
  },
  insuranceTypes: {
    active: ['insurance-types', 'active'],
  },
  laboratory: {
    analysesPaginated: ['laboratory', 'analyses-paginated'],
    prescriptionsPaginated: ['laboratory', 'prescriptions-paginated'],
    resultatsPaginated: ['laboratory', 'resultats-paginated'],
    consommables: ['laboratory', 'consommables'],
    impression: ['laboratory', 'impression'],
    transmission: ['laboratory', 'transmission'],
    statistics: ['laboratory', 'statistics'],
  },
};
