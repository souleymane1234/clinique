import { QUERY_KEYS } from 'src/constants/query-keys';

/** Invalide les tableaux laboratoire basés sur la liste paginée d’analyses (cohérence entre onglets). */
export async function invalidateLaboratoryAnalysisLists(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.laboratory.analysesPaginated }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.laboratory.prescriptionsPaginated }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.laboratory.resultatsPaginated }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.laboratory.statistics }),
  ]);
}
