import axios from 'axios';
import React from 'react';
import { pdf } from '@react-pdf/renderer';

import { apiUrl } from 'src/constants/apiUrl';
import { useAdminStore } from 'src/store/useAdminStore';
import { AdminStorage } from 'src/storages/admins_storage';

import { FacturePdfDocument } from 'src/components/generator-facture';
import { BonDeSortiePdfDocument } from 'src/components/generator-bon-de-sortie';

export default class ConsumApi {
  static api = axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
    transformResponse: [
      function transformResponse(data) {
        // Si la réponse est la string "null", retourner null
        if (data === 'null' || data === '') {
          return null;
        }
        // Si c'est déjà un objet, le retourner tel quel
        if (typeof data === 'object') {
          return data;
        }
        // Sinon, essayer de parser comme JSON
        try {
          return JSON.parse(data);
        } catch (e) {
          // Si le parsing échoue, retourner la string telle quelle
          return data;
        }
      },
    ],
  });

  // ========== AUTHENTICATION ==========

  static async login({ email, password }) {
    try {
      // La nouvelle API retourne directement { access_token } avec status 201
      const response = await ConsumApi.api.post(apiUrl.authentication, { email, password });
      console.log('Login response:', response);
      
      if (response.status === 201 && response.data?.access_token) {
        const accessToken = response.data.access_token;
        
        // Sauvegarder le token
        AdminStorage.saveTokenAdmin(accessToken);
        
        // Récupérer les informations de l'utilisateur
        const userResponse = await this.getCurrentUser();
        
        if (userResponse.success && userResponse.data) {
          updateClientInfo(userResponse.data, accessToken);
          return { 
            data: userResponse.data, 
            success: true, 
            message: 'Connexion réussie' 
          };
        }
        
        // Si on ne peut pas récupérer les infos utilisateur, retourner quand même le succès
        return { 
          data: null, 
          success: true, 
          message: 'Connexion réussie' 
        };
      }
      
      return { 
        success: false, 
        message: 'Erreur de connexion',
        errors: []
      };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur de connexion';
    return { 
      success: false, 
        message: errorMessage,
        errors: error.response?.data?.errors || []
      };
    }
  }

  static async register({ email, password, firstname, lastname, service }) {
    try {
      // La nouvelle API retourne directement { access_token } avec status 201
      const response = await ConsumApi.api.post(apiUrl.register, { 
        email, 
        password, 
        firstname, 
        lastname, 
        service 
      });
      console.log('Register response:', response);
      
      if (response.status === 201 && response.data?.access_token) {
        const accessToken = response.data.access_token;
        
        // Sauvegarder le token
        AdminStorage.saveTokenAdmin(accessToken);
        
        // Récupérer les informations de l'utilisateur
        const userResponse = await this.getCurrentUser();
        
        if (userResponse.success && userResponse.data) {
          updateClientInfo(userResponse.data, accessToken);
          return { 
            data: userResponse.data, 
            success: true, 
            message: 'Inscription réussie' 
          };
        }
        
        return { 
          data: null, 
          success: true, 
          message: 'Inscription réussie' 
        };
      }
      
      return { 
        success: false, 
        message: 'Erreur lors de l\'inscription',
        errors: []
      };
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'inscription';
      return { 
        success: false, 
        message: errorMessage,
        errors: error.response?.data?.errors || []
      };
    }
  }

  static async getCurrentUser() {
    try {
      const token = AdminStorage.getTokenAdmin();
      if (!token) {
        return {
          success: false,
          message: 'Aucun token trouvé',
          errors: []
        };
      }

      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await ConsumApi.api.get(apiUrl.getCurrentUser, {
        headers: {
          Authorization: authToken
        }
      });

      if (response.status === 200 && response.data) {
      return {
        success: true,
        data: response.data,
          message: 'Utilisateur récupéré avec succès',
          errors: []
        };
      }

      return {
        success: false,
        message: 'Erreur lors de la récupération de l\'utilisateur',
        errors: []
      };
    } catch (error) {
      console.error('GetCurrentUser error:', error);
      if (error.response?.status === 401) {
        AdminStorage.clearStokage();
        return {
          success: false,
          message: 'Session expirée, veuillez vous reconnecter',
          errors: []
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération de l\'utilisateur',
        errors: []
      };
    }
  }

  static async resetPassword({ email }) {
    try {
      const response = await ConsumApi.api.put(apiUrl.resetPassword, { email });
      
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.data,
          message: 'Email de réinitialisation envoyé',
          errors: []
        };
      }
      
      return {
        success: false,
        message: 'Erreur lors de la réinitialisation du mot de passe',
        errors: []
      };
    } catch (error) {
      console.error('ResetPassword error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la réinitialisation du mot de passe';
      return {
        success: false,
        message: errorMessage,
        errors: error.response?.data?.errors || []
      };
    }
  }

  // ========== CLIENTS ==========

  // Helper pour les requêtes authentifiées
  static async _authenticatedRequest(method, url, data = null) {
    const token = AdminStorage.getTokenAdmin();
    if (!token) {
      return {
        success: false,
        message: 'Aucun token trouvé',
        errors: []
      };
    }

    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const config = {
      headers: {
        Authorization: authToken
      }
    };

    try {
      let response;
      if (method === 'GET' || method === 'DELETE') {
        response = await ConsumApi.api[method.toLowerCase()](url, config);
      } else if (method === 'PATCH' && data === null) {
        // Pour les PATCH sans body, ne pas envoyer de body
        response = await ConsumApi.api.patch(url, undefined, config);
      } else {
        response = await ConsumApi.api[method.toLowerCase()](url, data, config);
      }

      if (response.status >= 200 && response.status < 300) {
        // Gérer le cas où la réponse est la string "null" ou vide
        let responseData = response.data;
        if (typeof responseData === 'string') {
          if (responseData === 'null' || responseData.trim() === '') {
            responseData = null;
          } else {
            try {
              responseData = JSON.parse(responseData);
            } catch (e) {
              // Si ce n'est pas du JSON valide, garder la string
            }
          }
        }
        
        return {
          success: true,
          data: responseData,
          message: 'Opération réussie',
          errors: []
        };
      }

      // Gérer les erreurs 4xx et 5xx
      let errorMessage = 'Erreur lors de l\'opération';
      let errorErrors = [];
      
      if (response.data) {
        if (typeof response.data === 'string') {
          if (response.data !== 'null' && response.data.trim() !== '') {
            try {
              const parsed = JSON.parse(response.data);
              errorMessage = parsed.message || errorMessage;
              errorErrors = parsed.errors || [];
            } catch (e) {
              errorMessage = response.data;
            }
          }
        } else if (typeof response.data === 'object') {
          errorMessage = response.data.message || errorMessage;
          errorErrors = response.data.errors || [];
        }
      }

      return {
        success: false,
        message: errorMessage,
        errors: errorErrors
      };
    } catch (error) {
      // Ne pas logger les erreurs 404 pour les endpoints qui peuvent ne pas exister encore
      if (error.response?.status !== 404) {
        console.error(`API Error (${method} ${url}):`, error);
      }
      
      if (error.response?.status === 401) {
        AdminStorage.clearStokage();
        return {
          success: false,
          message: 'Session expirée, veuillez vous reconnecter',
          errors: []
        };
      }
      
      // Pour les erreurs 404, retourner un message spécifique
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Endpoint non disponible (404)',
          errors: [],
          status: 404
        };
      }
      
      // Gérer le cas où error.response.data est la string "null"
      let errorMessage = error.message || 'Erreur lors de l\'opération';
      let errorErrors = [];
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          if (error.response.data === 'null' || error.response.data.trim() === '') {
            errorMessage = 'Erreur lors de l\'opération';
          } else {
            try {
              const parsed = JSON.parse(error.response.data);
              errorMessage = parsed.message || errorMessage;
              errorErrors = parsed.errors || [];
            } catch (e) {
              // Si ce n'est pas du JSON valide, utiliser la string comme message
              errorMessage = error.response.data;
            }
          }
        } else if (typeof error.response.data === 'object') {
          errorMessage = error.response.data.message || errorMessage;
          errorErrors = error.response.data.errors || [];
        }
      }
      
      return {
        success: false,
        message: errorMessage,
        errors: errorErrors
      };
    }
  }

  // Créer un nouveau client
  static async createClient({ nom, numero, email, service, commentaire, status }) {
    return this._authenticatedRequest('POST', apiUrl.clients, {
      nom,
      numero,
      email,
      service,
      commentaire,
      status
    });
  }

  // Obtenir tous les clients
  static async getClients() {
    return this._authenticatedRequest('GET', apiUrl.clients);
  }

  // Obtenir les clients non assignés
  static async getUnassignedClients() {
    return this._authenticatedRequest('GET', apiUrl.clientsUnassigned);
  }

  // Obtenir les clients avec leur commercial
  static async getClientsWithCommercial() {
    return this._authenticatedRequest('GET', apiUrl.clientsWithCommercial);
  }

  // Compter les clients par statut
  static async getClientsCountByStatus() {
    return this._authenticatedRequest('GET', apiUrl.clientsCountByStatus);
  }

  // Vérifier l'existence d'un client par numéro
  static async checkClientByNumber(numero) {
    return this._authenticatedRequest('GET', apiUrl.clientCheckByNumber(numero));
  }

  // Obtenir les clients assignés à un utilisateur
  static async getClientsAssignedToUser(userId) {
    return this._authenticatedRequest('GET', apiUrl.clientsAssignedToUser(userId));
  }

  // Obtenir un client par ID
  static async getClientById(id) {
    return this._authenticatedRequest('GET', apiUrl.clientById(id));
  }

  // Obtenir le résumé d'un client
  static async getClientSummary(id) {
    return this._authenticatedRequest('GET', apiUrl.clientSummary(id));
  }

  // Assigner un client à un commercial
  static async assignClient(id, userId) {
    return this._authenticatedRequest('POST', apiUrl.clientAssign(id), { userId });
  }

  // Mettre à jour le statut d'un client
  static async updateClientStatus(id, { status, step }) {
    return this._authenticatedRequest('PATCH', apiUrl.clientStatus(id), { status, step });
  }

  // Obtenir toutes les sessions d'un client
  static async getClientSessions(id) {
    return this._authenticatedRequest('GET', apiUrl.clientSessions(id));
  }

  // Obtenir la session active d'un client
  static async getClientActiveSession(id) {
    return this._authenticatedRequest('GET', apiUrl.clientActiveSession(id));
  }

  // Ouvrir une session pour un client
  static async openClientSession(id, service) {
    return this._authenticatedRequest('POST', apiUrl.clientOpenSession(id), { service });
  }

  // Obtenir les détails d'une session
  static async getSessionById(sessionId) {
    return this._authenticatedRequest('GET', apiUrl.sessionById(sessionId));
  }

  // Clôturer une session (pour les clients)
  static async closeClientSession(sessionId) {
    return this._authenticatedRequest('PATCH', apiUrl.sessionClose(sessionId), null);
  }

  // Clôturer une session (pour les admins - même endpoint)
  static async closeSession(sessionId) {
    return this._authenticatedRequest('PATCH', apiUrl.sessionClose(sessionId), null);
  }

  // Ajouter une conclusion à une session
  static async addSessionConclusion(sessionId, { text, reminderDate }) {
    return this._authenticatedRequest('POST', apiUrl.sessionConclusions(sessionId), {
      text,
      reminderDate
    });
  }


  // ========== USERS ==========

  // Créer un utilisateur (utilise POST /auth/register - endpoint public)
  // API: POST /auth/register
  // Body: { email, password, firstname, lastname, service, telephone }
  // Response 201: { access_token }
  // Response 400: Données invalides ou email déjà utilisé
  static async createUser({ email, password, firstname, lastname, service, telephone }) {
    try {
      const requestData = {
        email: email?.trim() || '',
        password: password || '',
        firstname: firstname?.trim() || '',
        lastname: lastname?.trim() || '',
        service: service || 'commercial',
        telephone: telephone?.trim() || '',
      };

      console.log('🔵 POST /auth/register');
      console.log('🔵 URL:', apiUrl.register);
      console.log('🔵 Request data:', requestData);

      // L'endpoint /auth/register est public, pas besoin d'authentification
      const response = await ConsumApi.api.post(apiUrl.register, requestData);

      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);

      // L'API retourne 201 avec { access_token } en cas de succès
      if (response.status === 201) {
        return {
          success: true,
          data: response.data,
          message: 'Utilisateur créé avec succès',
          errors: [],
        };
      }

      return {
        success: false,
        message: 'Erreur lors de la création de l\'utilisateur',
        errors: [],
        status: response.status,
      };
    } catch (error) {
      console.error('❌ Create user error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);

      const status = error.response?.status;
      let errorMessage = 'Erreur lors de la création de l\'utilisateur';
      let errors = [];

      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (typeof error.response.data === 'object') {
          errorMessage = error.response.data.message || errorMessage;
          errors = error.response.data.errors || [];
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (status === 400) {
        errorMessage = errorMessage || 'Données invalides ou email déjà utilisé';
      }

      return {
        success: false,
        message: errorMessage,
        errors,
        status,
      };
    }
  }

  // Obtenir tous les utilisateurs
  // API: GET /users
  // Response 200: Array d'utilisateurs
  static async getUsers() {
    return this._authenticatedRequest('GET', apiUrl.users);
  }

  // Obtenir un utilisateur par ID
  // API: GET /users/{userId}
  // Response 200: Objet utilisateur
  // Response 404: Utilisateur non trouvé
  static async getUserById(userId) {
    return this._authenticatedRequest('GET', apiUrl.getUserById(userId));
  }

  // Modifier un utilisateur
  // API: PATCH /users/{id}
  // Body: { email?, firstname?, lastname?, telephone?, service? }
  // Response 200: { user, message }
  // Response 400: Erreur de validation ou email déjà utilisé
  // Response 404: Utilisateur non trouvé
  static async updateUser(id, { email, firstname, lastname, telephone, service }) {
    const updateData = {};
    
    if (email !== undefined) updateData.email = email?.trim();
    if (firstname !== undefined) updateData.firstname = firstname?.trim();
    if (lastname !== undefined) updateData.lastname = lastname?.trim();
    if (telephone !== undefined) updateData.telephone = telephone?.trim();
    if (service !== undefined) updateData.service = service;

    return this._authenticatedRequest('PATCH', apiUrl.updateUser(id), updateData);
  }

  // Supprimer un utilisateur
  // API: DELETE /users/{id}
  // Response 200: { message }
  // Response 400: Impossible de supprimer (utilisateur a des clients assignés, factures ou bons de sortie)
  // Response 404: Utilisateur non trouvé
  static async deleteUser(id) {
    return this._authenticatedRequest('DELETE', apiUrl.deleteUser(id));
  }

  // Suspendre ou réactiver un utilisateur
  // API: PATCH /users/{id}/suspend
  // Body: { status: "active" | "suspended" }
  // Response 200: { user, message }
  // Response 404: Utilisateur non trouvé
  static async suspendUser(id, status) {
    return this._authenticatedRequest('PATCH', apiUrl.suspendUser(id), { status });
  }

  // Créer un commercial (utilise createUser avec conversion du rôle en service)
  // Cette fonction est maintenue pour compatibilité avec commercial-create-view.jsx
  static async createCommercial({ email, password, firstname, lastname, telephone, role }) {
    // Convertir le rôle en service pour l'API
    const roleToService = {
      'COMMERCIAL': 'Commercial',
      'ADMIN': 'Administrateur',
      'COMPTABLE': 'Comptable',
      'ADMIN_SITE_WEB': 'Administrateur site web',
    };
    
    const service = roleToService[role] || 'Commercial';
    
    console.log('🔵 createCommercial - Converting role to service:', { role, service });
    
    // Utiliser createUser qui utilise /auth/register
    return this.createUser({
      email,
      password,
      firstname,
      lastname,
      telephone,
      service,
    });
  }

  // ========== FACTURATION ==========

  // Créer une nouvelle facture
  static async createFacture({ clientId, sessionId, montantTotal, dateEcheance, clientAddress, items }) {
    return this._authenticatedRequest('POST', apiUrl.factures, {
      clientId,
      sessionId,
      montantTotal,
      dateEcheance,
      clientAddress,
      items
    });
  }

  // Obtenir toutes les factures
  static async getFactures() {
    return this._authenticatedRequest('GET', apiUrl.factures);
  }

  // Obtenir une facture par ID
  static async getFactureById(id) {
    return this._authenticatedRequest('GET', apiUrl.factureById(id));
  }

  // Obtenir les factures d'un client
  static async getClientFactures(clientId) {
    return this._authenticatedRequest('GET', apiUrl.clientFactures(clientId));
  }

  // Enregistrer un paiement
  static async createPaiement({ factureId, montant, method, reference }) {
    return this._authenticatedRequest('POST', apiUrl.paiements, {
      factureId,
      montant,
      method,
      reference
    });
  }

  // Obtenir les paiements d'une facture
  static async getFacturePaiements(factureId) {
    return this._authenticatedRequest('GET', apiUrl.facturePaiements(factureId));
  }

  // Fonction helper pour charger une image et la convertir en base64
  static async loadImageAsBase64(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  }

  // Télécharger le PDF d'une facture (généré côté frontend)
  static async downloadFacturePdf(factureId) {
    try {
      // Récupérer les données de la facture
      const factureResult = await this.getFactureById(factureId);
      
      if (!factureResult.success || !factureResult.data) {
        return {
          success: false,
          message: 'Impossible de récupérer les données de la facture',
          errors: []
        };
      }

      const facture = factureResult.data;
      
      // Récupérer les paiements si nécessaire
      const paiementsResult = await this.getFacturePaiements(factureId);
      if (paiementsResult.success && Array.isArray(paiementsResult.data)) {
        facture.paiements = paiementsResult.data;
      }

      // Charger les images en base64 pour le PDF
      const {origin} = window.location;
      const [headerImageBase64, logoBase64] = await Promise.all([
        this.loadImageAsBase64(`${origin}/document/TETE.jpg`),
        this.loadImageAsBase64(`${origin}/document/logo.jpg`),
      ]);

      // Ajouter les images en base64 à la facture pour le PDF
      facture._headerImage = headerImageBase64;
      facture._watermarkLogo = logoBase64;

      // Générer le PDF avec React-PDF
      const blob = await pdf(React.createElement(FacturePdfDocument, { facture })).toBlob();
      
      // Télécharger le PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${facture.numeroFacture || factureId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        data: blob,
        message: 'PDF téléchargé avec succès',
        errors: []
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération du PDF',
        errors: []
      };
    }
  }

  // Ouvrir le PDF d'une facture dans un nouvel onglet (généré côté frontend)
  static async openFacturePdfInNewTab(factureId) {
    try {
      // Récupérer les données de la facture
      const factureResult = await this.getFactureById(factureId);
      
      if (!factureResult.success || !factureResult.data) {
        return {
          success: false,
          message: 'Impossible de récupérer les données de la facture',
          errors: []
        };
      }

      const facture = factureResult.data;
      
      // Récupérer les paiements si nécessaire
      const paiementsResult = await this.getFacturePaiements(factureId);
      if (paiementsResult.success && Array.isArray(paiementsResult.data)) {
        facture.paiements = paiementsResult.data;
      }

      // Charger les images en base64 pour le PDF
      const {origin} = window.location;
      const [headerImageBase64, logoBase64] = await Promise.all([
        this.loadImageAsBase64(`${origin}/document/TETE.jpg`),
        this.loadImageAsBase64(`${origin}/document/logo.jpg`),
      ]);

      // Ajouter les images en base64 à la facture pour le PDF
      facture._headerImage = headerImageBase64;
      facture._watermarkLogo = logoBase64;

      // Générer le PDF avec React-PDF
      const blob = await pdf(React.createElement(FacturePdfDocument, { facture })).toBlob();
      
      // Ouvrir le PDF dans un nouvel onglet
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Nettoyer l'URL après un délai pour libérer la mémoire
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      return {
        success: true,
        data: blob,
        message: 'PDF ouvert avec succès',
        errors: []
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération du PDF',
        errors: []
      };
    }
  }

  // Générer manuellement le PDF d'une facture
  // Utilise POST /facturation/factures/{id}/generate-pdf pour forcer la génération/mise à jour du PDF
  // Le PDF peut être généré à tout moment, même pour les factures partiellement payées
  // Le PDF est régénéré pour inclure tous les paiements récents
  static async generateFacturePdf(factureId) {
    return this._authenticatedRequest('POST', apiUrl.factureGeneratePdf(factureId));
  }

  // ========== FACTURATION PROFORMA ==========

  // Créer une nouvelle facture proforma
  // Utilise le même endpoint que les factures normales mais avec type: "proforma"
  static async createFactureProforma({ clientId, sessionId, montantTotal, dateEcheance, clientAddress, items }) {
    return this._authenticatedRequest('POST', apiUrl.factures, {
      clientId,
      sessionId,
      montantTotal,
      dateEcheance,
      clientAddress,
      items,
      type: 'proforma', // Marque comme facture proforma
    });
  }

  // Obtenir toutes les factures proforma
  // On récupère toutes les factures et on filtre celles avec type: "proforma"
  static async getFacturesProforma() {
    const result = await this._authenticatedRequest('GET', apiUrl.factures);
    if (result.success && Array.isArray(result.data)) {
      // Filtrer uniquement les factures proforma
      const proformaFactures = result.data.filter((f) => f.type === 'proforma');
      return {
        ...result,
        data: proformaFactures,
      };
    }
    return result;
  }

  // Obtenir une facture proforma par ID (utilise le même endpoint)
  static async getFactureProformaById(id) {
    return this._authenticatedRequest('GET', apiUrl.factureById(id));
  }

  // Obtenir les factures proforma d'un client
  static async getClientFacturesProforma(clientId) {
    const result = await this._authenticatedRequest('GET', apiUrl.clientFactures(clientId));
    if (result.success && Array.isArray(result.data)) {
      // Filtrer uniquement les factures proforma
      const proformaFactures = result.data.filter((f) => f.type === 'proforma');
      return {
        ...result,
        data: proformaFactures,
      };
    }
    return result;
  }

  // ========== NOTIFICATIONS ==========

  // Obtenir les notifications d'un utilisateur
  static async getNotifications(userId, includeUpcoming = false) {
    const url = `${apiUrl.notifications(userId)}?includeUpcoming=${includeUpcoming}`;
    return this._authenticatedRequest('GET', url);
  }

  // Marquer une notification comme lue
  static async markNotificationAsRead(notificationId) {
    return this._authenticatedRequest('PATCH', apiUrl.notificationRead(notificationId));
  }

  // Marquer toutes les notifications d'un utilisateur comme lues
  static async markAllNotificationsAsRead(userId) {
    return this._authenticatedRequest('PATCH', apiUrl.notificationsReadAll(userId));
  }

  // ========== STATISTICS ==========

  // Obtenir les statistiques globales
  static async getGlobalStatistics() {
    return this._authenticatedRequest('GET', apiUrl.statisticsGlobal);
  }

  // Obtenir les statistiques des clients
  static async getClientStatistics() {
    return this._authenticatedRequest('GET', apiUrl.statisticsClients);
  }

  // Obtenir les statistiques de facturation
  static async getFacturationStatistics() {
    return this._authenticatedRequest('GET', apiUrl.statisticsFacturation);
  }


  // ========== RENDEZ-VOUS ==========

  // Obtenir les rendez-vous du jour pour un commercial spécifique
  // API: GET /rendez-vous/du-jour/{userId}?date=YYYY-MM-DD (optionnel)
  static async getRendezVousDuJour(userId, date = null) {
    let url = apiUrl.rendezVousDuJour(userId);
    if (date) {
      url += `?date=${date}`;
    }
    return this._authenticatedRequest('GET', url);
  }

  // Obtenir tous les rendez-vous
  static async getRendezVous() {
    return this._authenticatedRequest('GET', apiUrl.rendezVous);
  }

  // Obtenir un rendez-vous par ID
  static async getRendezVousById(id) {
    return this._authenticatedRequest('GET', apiUrl.rendezVousById(id));
  }

  // Créer un rendez-vous
  static async createRendezVous({ clientId, dateRendezVous, description, service, notes }) {
    return this._authenticatedRequest('POST', apiUrl.rendezVous, {
      clientId,
      dateRendezVous,
      description,
      service,
      notes,
    });
  }

  // Mettre à jour un rendez-vous
  static async updateRendezVous(id, { dateRendezVous, description, service, notes, status }) {
    return this._authenticatedRequest('PATCH', apiUrl.rendezVousById(id), {
      dateRendezVous,
      description,
      service,
      notes,
      status,
    });
  }

  // Reprogrammer un rendez-vous
  // API: PATCH /rendez-vous/{id}/reprogrammer
  // Body: { userId, reminderDate }
  static async reprogrammerRendezVous(id, userId, reminderDate) {
    return this._authenticatedRequest('PATCH', apiUrl.reprogrammerRendezVous(id), {
      userId,
      reminderDate,
    });
  }

  // Marquer un rendez-vous comme complété
  // API: PATCH /rendez-vous/{id}/prendre
  // Body: { userId }
  static async prendreRendezVous(id, userId) {
    return this._authenticatedRequest('PATCH', apiUrl.prendreRendezVous(id), {
      userId,
    });
  }

  // Supprimer un rendez-vous
  // API: DELETE /rendez-vous/{id}
  // Body: { userId }
  static async deleteRendezVous(id, userId) {
    return this._authenticatedRequest('DELETE', apiUrl.rendezVousById(id), {
      userId,
    });
  }

  // ========== FINANCE - BONS DE SORTIE ==========

  // Créer un bon de sortie
  static async createBonDeSortie({ montant, description, categorie, methode, reference, dateBon }) {
    return this._authenticatedRequest('POST', apiUrl.bonsDeSortie, {
      montant,
      description,
      categorie,
      methode: methode || 'cash',
      reference,
      dateBon,
    });
  }

  // Obtenir tous les bons de sortie
  static async getBonsDeSortie() {
    return this._authenticatedRequest('GET', apiUrl.bonsDeSortie);
  }

  // Obtenir un bon de sortie par ID
  static async getBonDeSortieById(id) {
    return this._authenticatedRequest('GET', apiUrl.bonDeSortieById(id));
  }

  // Supprimer un bon de sortie
  static async deleteBonDeSortie(id) {
    return this._authenticatedRequest('DELETE', apiUrl.bonDeSortieById(id));
  }

  // Mettre à jour le statut d'un bon de sortie
  static async updateBonDeSortieStatus(id, status) {
    return this._authenticatedRequest('PATCH', apiUrl.bonDeSortieStatus(id), { status });
  }

  // Obtenir le bilan mensuel
  static async getBilanMensuel(month, year) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    const url = `${apiUrl.bilanMensuel}${params.toString() ? `?${params.toString()}` : ''}`;
    return this._authenticatedRequest('GET', url);
  }

  // Obtenir le bilan annuel
  static async getBilanAnnuel(year) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    const url = `${apiUrl.bilanAnnuel}${params.toString() ? `?${params.toString()}` : ''}`;
    return this._authenticatedRequest('GET', url);
  }

  // Ouvrir le PDF d'un bon de sortie dans un nouvel onglet
  static async openBonDeSortiePdfInNewTab(bonId) {
    try {
      // Récupérer les données du bon de sortie
      const bonResult = await this.getBonDeSortieById(bonId);
      
      if (!bonResult.success || !bonResult.data) {
        return {
          success: false,
          message: 'Impossible de récupérer les données du bon de sortie',
          errors: []
        };
      }

      const bon = bonResult.data;
      
      // Charger les images en base64 pour le PDF
      const {origin} = window.location;
      const [headerImageBase64, logoBase64] = await Promise.all([
        this.loadImageAsBase64(`${origin}/document/TETE.jpg`),
        this.loadImageAsBase64(`${origin}/document/logo.jpg`),
      ]);

      // Ajouter les images en base64 au bon pour le PDF
      bon._headerImage = headerImageBase64;
      bon._watermarkLogo = logoBase64;

      // Générer le PDF avec React-PDF
      const blob = await pdf(React.createElement(BonDeSortiePdfDocument, { bon })).toBlob();
      
      // Ouvrir le PDF dans un nouvel onglet
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Nettoyer l'URL après un délai pour libérer la mémoire
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      return {
        success: true,
        data: blob,
        message: 'PDF ouvert avec succès',
        errors: []
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération du PDF',
        errors: []
      };
    }
  }

  // ========== SITE ADMINISTRATION - SLIDES ==========

  // Obtenir tous les slides (admin)
  static async getSiteAdminSlides(includeInactive = false) {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    const url = `${apiUrl.siteAdminSlides}${params.toString() ? `?${params.toString()}` : ''}`;
    return this._authenticatedRequest('GET', url);
  }

  // Obtenir un slide par ID
  static async getSiteAdminSlideById(id) {
    return this._authenticatedRequest('GET', apiUrl.siteAdminSlideById(id));
  }

  // Créer un nouveau slide
  static async createSiteAdminSlide(data) {
    return this._authenticatedRequest('POST', apiUrl.siteAdminSlides, data);
  }

  // Mettre à jour un slide
  static async updateSiteAdminSlide(id, data) {
    return this._authenticatedRequest('PATCH', apiUrl.siteAdminSlideById(id), data);
  }

  // Supprimer un slide
  static async deleteSiteAdminSlide(id) {
    return this._authenticatedRequest('DELETE', apiUrl.siteAdminSlideById(id));
  }

  // Activer/Désactiver un slide
  static async toggleSiteAdminSlideActive(id) {
    return this._authenticatedRequest('PATCH', apiUrl.siteAdminSlideToggleActive(id));
  }

  // Uploader une image pour un slide
  static async uploadSiteAdminSlideImage(file) {
    const token = AdminStorage.getTokenAdmin();
    if (!token) {
      return {
        success: false,
        message: 'Aucun token trouvé',
        errors: []
      };
    }

    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await ConsumApi.api.post(apiUrl.siteAdminSlideUploadImage, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: authToken
        }
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.data,
          message: 'Image uploadée avec succès',
          errors: []
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Erreur lors de l\'upload',
        errors: response.data?.errors || []
      };
    } catch (error) {
      console.error('Upload slide image error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'upload',
        errors: error.response?.data?.errors || []
      };
    }
  }

  // ========== SITE ADMINISTRATION - SERVICES ==========

  // Obtenir tous les services (admin)
  static async getSiteAdminServices(includeInactive = false) {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    const url = `${apiUrl.siteAdminServices}${params.toString() ? `?${params.toString()}` : ''}`;
    return this._authenticatedRequest('GET', url);
  }

  // Obtenir un service par ID
  static async getSiteAdminServiceById(id) {
    return this._authenticatedRequest('GET', apiUrl.siteAdminServiceById(id));
  }

  // Créer un nouveau service
  static async createSiteAdminService(data) {
    return this._authenticatedRequest('POST', apiUrl.siteAdminServices, data);
  }

  // Mettre à jour un service
  static async updateSiteAdminService(id, data) {
    return this._authenticatedRequest('PATCH', apiUrl.siteAdminServiceById(id), data);
  }

  // Supprimer un service
  static async deleteSiteAdminService(id) {
    return this._authenticatedRequest('DELETE', apiUrl.siteAdminServiceById(id));
  }

  // Activer/Désactiver un service
  static async toggleSiteAdminServiceActive(id) {
    return this._authenticatedRequest('PATCH', apiUrl.siteAdminServiceToggleActive(id));
  }

  // Uploader une image pour un service
  static async uploadSiteAdminServiceImage(file) {
    const token = AdminStorage.getTokenAdmin();
    if (!token) {
      return {
        success: false,
        message: 'Aucun token trouvé',
        errors: []
      };
    }

    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await ConsumApi.api.post(apiUrl.siteAdminServiceUploadImage, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: authToken
        }
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.data,
          message: 'Image uploadée avec succès',
          errors: []
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Erreur lors de l\'upload',
        errors: response.data?.errors || []
      };
    } catch (error) {
      console.error('Upload service image error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'upload',
        errors: error.response?.data?.errors || []
      };
    }
  }

  // ========== SITE ADMINISTRATION - PARTNER LOGOS ==========

  // Obtenir tous les logos partenaires (admin)
  static async getSiteAdminPartnerLogos(includeInactive = false) {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    const url = `${apiUrl.siteAdminPartnerLogos}${params.toString() ? `?${params.toString()}` : ''}`;
    return this._authenticatedRequest('GET', url);
  }

  // Obtenir un logo partenaire par ID
  static async getSiteAdminPartnerLogoById(id) {
    return this._authenticatedRequest('GET', apiUrl.siteAdminPartnerLogoById(id));
  }

  // Créer un nouveau logo partenaire
  static async createSiteAdminPartnerLogo(data) {
    return this._authenticatedRequest('POST', apiUrl.siteAdminPartnerLogos, data);
  }

  // Mettre à jour un logo partenaire
  static async updateSiteAdminPartnerLogo(id, data) {
    return this._authenticatedRequest('PATCH', apiUrl.siteAdminPartnerLogoById(id), data);
  }

  // Supprimer un logo partenaire
  static async deleteSiteAdminPartnerLogo(id) {
    return this._authenticatedRequest('DELETE', apiUrl.siteAdminPartnerLogoById(id));
  }

  // Activer/Désactiver un logo partenaire
  static async toggleSiteAdminPartnerLogoActive(id) {
    return this._authenticatedRequest('PATCH', apiUrl.siteAdminPartnerLogoToggleActive(id));
  }

  // Uploader un logo partenaire
  static async uploadSiteAdminPartnerLogo(file) {
    const token = AdminStorage.getTokenAdmin();
    if (!token) {
      return {
        success: false,
        message: 'Aucun token trouvé',
        errors: []
      };
    }

    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await ConsumApi.api.post(apiUrl.siteAdminPartnerLogoUpload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: authToken
        }
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.data,
          message: 'Logo uploadé avec succès',
          errors: []
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Erreur lors de l\'upload',
        errors: response.data?.errors || []
      };
    } catch (error) {
      console.error('Upload partner logo error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'upload',
        errors: error.response?.data?.errors || []
      };
    }
  }
}

// Fonction pour normaliser le rôle depuis l'API vers le format interne
const normalizeRole = (role) => {
  if (!role) return null;
  
  const roleUpper = role.toUpperCase();
  
  // Normaliser les différentes variations possibles
  if (roleUpper === 'SUPERADMIN' || roleUpper === 'SUPER_ADMIN') {
    return 'SUPERADMIN';
  }
  if (roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATEUR') {
    return 'ADMIN';
  }
  if (roleUpper === 'STATION') {
    return 'STATION';
  }
  
  // Retourner le rôle tel quel s'il n'est pas reconnu
  return roleUpper;
};

const updateClientInfo = (userData, accessToken) => {
  // Nouvelle structure de l'API : { id, email, firstname, lastname, service }
  const { id, email, firstname, lastname, service } = userData;
  
  // Normaliser le rôle/service
  const normalizedRole = normalizeRole(service);
  
  const adminData = { 
    id, 
    email, 
    phone: null, // Non fourni par la nouvelle API
    firstName: firstname || null,
    lastName: lastname || null,
    role: normalizedRole,
    service: service || null,
    // Nom complet pour l'affichage
    nom_complet: firstname && lastname ? `${firstname} ${lastname}` : email,
    // Champs optionnels pour compatibilité avec l'ancien code
    emailVerifie: true, // Par défaut, l'utilisateur connecté a un email vérifié
    premiumActif: false, // À mettre à jour selon les besoins
    dateCreation: new Date().toISOString(), // Date de connexion
  };
  useAdminStore.getState().setAdmin(adminData);
  AdminStorage.saveInfoAdmin(adminData);
  AdminStorage.saveTokenAdmin(accessToken);
  // La nouvelle API ne fournit pas de refreshToken, on ne le sauvegarde pas

  console.log('Admin data saved:', adminData);
};
