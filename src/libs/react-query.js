import { QueryClient } from '@tanstack/react-query';

/**
 * Client React Query par défaut : les données GET restent « fraîches » plusieurs minutes
 * pour éviter un rechargement serveur à chaque retour sur une page (navigation SPA).
 * Les mutations doivent appeler invalidateQueries sur les clés concernées.
 */
export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 min sans refetch automatique au remontage du composant
        gcTime: 60 * 60 * 1000, // 1 h en cache mémoire après démontage
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
