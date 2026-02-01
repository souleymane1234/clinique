import axios from 'axios';

import { AdminStorage } from 'src/storages/admins_storage';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

class ApiClient {
  static async request(method, url, data = null, requiresAuth = true) {
    try {
      const config = {};

      const token = AdminStorage.getTokenAdmin();
      if (token) {
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        config.headers = { Authorization: authToken };
      }
      let response;
      if (method === 'GET' || method === 'DELETE') {
        response = await api[method.toLowerCase()](url, config);
      } else {
        response = await api[method.toLowerCase()](url, data, config);
      }
      console.log('=== API CLIENT DEBUG ===');
      console.log('URL:', url);
      console.log('Response status:', response.status);
      console.log('Response data (raw):', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data is array:', Array.isArray(response.data));
      console.log('Response data keys:', response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A');

      if (response.status >= 200 && response.status < 400) {
        // Handle 204 No Content (successful deletion)
        if (response.status === 204) {
          return {
            success: true,
            data: null,
            message: 'Opération réussie',
            errors: [],
          };
        }

        // Si response.data est directement un tableau, c'est une réponse directe
        if (Array.isArray(response.data)) {
          console.log('API returned direct array, length:', response.data.length);
          return {
            success: true,
            data: response.data,
            message: 'Opération réussie',
            errors: [],
          };
        }

        // Si response.data est un objet mais n'a pas les champs attendus (success, data, result, etat)
        // C'est probablement une réponse directe d'objet
        // Vérifier aussi si c'est un format paginé: { data: [...], total: number, page: number, limit: number }
        if (typeof response.data === 'object' && response.data !== null) {
          const hasDataArray = Array.isArray(response.data.data) || Array.isArray(response.data.items) || Array.isArray(response.data.results);
          const hasPaginationFields = 'total' in response.data || 'page' in response.data || 'limit' in response.data || 'count' in response.data;
          
          if (!('success' in response.data) && !('result' in response.data) && !('etat' in response.data)) {
            // Si c'est un format paginé ou un objet simple sans wrapper
            if (hasDataArray || hasPaginationFields || !('data' in response.data)) {
              return {
                success: true,
                data: response.data,
                message: 'Opération réussie',
                errors: [],
              };
            }
          }
        }

        console.log('Extracting data from response.data:', response.data);
        const {
          data: responseData,
          success,
          message = '',
          error,
          errors,
          result,
          etat,
        } = response.data || {};
        const isSuccess = success ?? etat ?? false;
        const finalData = responseData ?? result ?? response.data;
        const finalMessage = message || '';
        const finalErrors = errors || (error ? [error] : []);
        console.log('Extracted data:', {
          responseData,
          result,
          finalData,
          isSuccess,
          finalDataIsArray: Array.isArray(finalData),
          finalDataLength: Array.isArray(finalData) ? finalData.length : 'N/A',
        });
        if (!isSuccess && finalMessage.toLowerCase().includes('token')) {
          AdminStorage.clearStokage();
          window.location.href = '/login';
          return {
            success: false,
            message: 'Session expirée, veuillez vous reconnecter',
            errors: [],
          };
        }

        return {
          success: isSuccess,
          data: finalData,
          message: finalMessage,
          errors: finalErrors,
        };
      }

      if (response.status === 401) {
        AdminStorage.clearStokage();
        window.location.href = '/login';
        return {
          success: false,
          message: 'Session expirée, veuillez vous reconnecter',
          errors: [],
        };
      }

      return {
        success: false,
        message: 'Un problème avec le serveur. Veuillez réessayer ultérieurement',
        errors: [],
      };
    } catch (error) {
      console.error('API Error:', error);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
        const { message, error: errorMsg, errors } = error.response.data;
        if (
          message?.toLowerCase().includes('token') ||
          message?.toLowerCase().includes('unauthorized')
        ) {
           AdminStorage.clearStokage();
           window.location.href = '/login';
          return {
            success: false,
            message: 'Session expirée, veuillez vous reconnecter',
            errors: [],
          };
        }
        return {
          success: false,
          message: message || errorMsg || "Une erreur s'est produite",
          errors: errors || (errorMsg ? [errorMsg] : []),
        };
      }
      return {
        success: false,
        message: "Un problème lors de l'envoi. Veuillez vérifier votre connexion internet",
        errors: [],
      };
    }
  }

  static async get(url, requiresAuth = true) {
    return this.request('GET', url, null, requiresAuth);
  }

  static async post(url, data, requiresAuth = true) {
    return this.request('POST', url, data, requiresAuth);
  }

  static async put(url, data, requiresAuth = true) {
    return this.request('PUT', url, data, requiresAuth);
  }

  static async delete(url, requiresAuth = true) {
    return this.request('DELETE', url, null, requiresAuth);
  }
}

export default ApiClient;
