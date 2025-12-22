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
      console.log('response API', url, response);

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

        const {
          data: responseData,
          success,
          message = '',
          error,
          errors,
          result,
          etat,
        } = response.data;
        const isSuccess = success ?? etat ?? false;
        const finalData = responseData ?? result;
        const finalMessage = message || '';
        const finalErrors = errors || (error ? [error] : []);
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
