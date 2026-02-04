import axios from 'axios';
import React from 'react';
import { pdf } from '@react-pdf/renderer';

import { apiUrl } from 'src/constants/apiUrl';
import { useAdminStore } from 'src/store/useAdminStore';
import { AdminStorage } from 'src/storages/admins_storage';
import ApiClient from 'src/services_workers/apiClient';

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
      // Appel direct à l'API avec axios pour gérer la structure de réponse spécifique
      const response = await this.api.post(apiUrl.authentication, { email, password });

      // La réponse de l'API est : { access_token, data: { id, email, first_name, last_name, role: { name, slug }, ... } }
      // Status 201 = Created (succès)
      if (response.status === 201 && response.data) {
        const { access_token, data } = response.data;
        
        if (!access_token || !data) {
          return { 
            success: false,
            message: 'Réponse invalide du serveur',
            errors: ['Token ou données utilisateur manquants'],
          };
        }

        // Mapper la réponse de l'API vers le format attendu par updateClientInfo
        const userData = {
          id: data.id,
          email: data.email,
          firstname: data.first_name || data.firstName || null,
          lastname: data.last_name || data.lastName || null,
          service: data.role?.name || data.role || 'USER', // Utiliser le nom du rôle
        };

        // Sauvegarder le token et les informations utilisateur
        updateClientInfo(userData, access_token);

        console.log('✅ Connexion réussie');
        console.log('📧 Email:', data.email);
        console.log('👤 Rôle:', userData.service);
        console.log('🔑 Token:', access_token.substring(0, 20) + '...');

        return { 
          success: true, 
          data: userData,
          message: 'Connexion réussie',
        };
      }
      
      // Si le statut n'est pas 201
      return { 
        success: false, 
        message: 'Erreur de connexion',
        errors: ['Réponse inattendue du serveur'],
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Gérer les erreurs de l'API
      if (error.response?.data) {
        const { message, error: errorMsg } = error.response.data;
    return { 
      success: false, 
          message: message || errorMsg || 'Erreur de connexion',
          errors: [message || errorMsg || 'Identifiants invalides'],
        };
      }
      
      return {
        success: false,
        message: error.message || 'Une erreur est survenue lors de la connexion',
        errors: [error.message || 'Erreur de connexion au serveur'],
      };
    }
  }

  static async register({ email, password, firstname, lastname, service }) {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));

    // Données factices pour l'inscription
    const accessToken = `fake_token_${  Date.now()}`;
        
        // Sauvegarder le token
        AdminStorage.saveTokenAdmin(accessToken);
        
    // Récupérer les informations de l'utilisateur (fake)
    const userData = {
      id: Date.now().toString(),
      email: email || 'user@example.com',
      firstname: firstname || 'User',
      lastname: lastname || 'New',
      service: service || 'Commercial'
    };
    
    updateClientInfo(userData, accessToken);
        
        return { 
      data: userData, 
          success: true, 
      message: 'Inscription réussie (mode fake data)' 
    };
  }

  static async getCurrentUser() {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 200));

      const token = AdminStorage.getTokenAdmin();
      if (!token) {
        return {
          success: false,
          message: 'Aucun token trouvé',
          errors: []
        };
      }

    // Retourner des données factices
    const userData = {
      id: '1',
      email: 'admin@example.com',
      firstname: 'Admin',
      lastname: 'User',
      service: 'Administrateur'
    };

      return {
        success: true,
      data: userData,
      message: 'Utilisateur récupéré avec succès (mode fake data)',
          errors: []
        };
  }

  static async resetPassword({ email }) {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));
      
    // Retourner un succès factice
        return {
          success: true,
      data: { email },
      message: 'Email de réinitialisation envoyé (mode fake data)',
          errors: []
        };
  }

  // ========== CLIENTS ==========

  // Helper pour les requêtes authentifiées
  static async _authenticatedRequest(method, url, data = null) {
    const urlLower = url.toLowerCase();
    
    // Pour les endpoints de modules de permissions ET PATIENTS, utiliser l'API réelle
    if (urlLower.includes('/module-permission') || 
        urlLower.includes('/permission') || 
        urlLower.includes('/permissions') || 
        urlLower.includes('/patients') ||
        (urlLower.includes('/role') && !urlLower.includes('/roles-permissions/matrix'))) {
      // Utiliser ApiClient pour les vraies requêtes
      if (method === 'GET') {
        return ApiClient.get(url, true);
      } else if (method === 'POST') {
        return ApiClient.post(url, data, true);
      } else if (method === 'PUT') {
        return ApiClient.put(url, data, true);
      } else if (method === 'PATCH') {
        return ApiClient.request('PATCH', url, data, true);
      } else if (method === 'DELETE') {
        return ApiClient.delete(url, true);
      }
    }
    
    // Pour les autres endpoints, utiliser le mode fake data (temporaire)
    await new Promise(resolve => setTimeout(resolve, 200));
    return this._getFakeDataForUrl(method, url, data);
  }

  // Générateur de données factices basé sur l'URL
  static _getFakeDataForUrl(method, url, data = null) {
    const urlLower = url.toLowerCase();
    
    // CLIENTS
    if (urlLower.includes('/clients') && !urlLower.includes('/sessions') && !urlLower.includes('/documents')) {
      if (method === 'GET') {
        if (urlLower.includes('/unassigned')) {
          return { success: true, data: this._generateFakeClients(5), message: 'Opération réussie', errors: [] };
        }
        if (urlLower.includes('/withcommercial')) {
          return { success: true, data: this._generateFakeClients(8, true), message: 'Opération réussie', errors: [] };
        }
        if (urlLower.includes('/count-by-status')) {
          return { success: true, data: [
            { status: 'lead', count: 25 },
            { status: 'client', count: 45 },
            { status: 'prospect', count: 12 }
          ], message: 'Opération réussie', errors: [] };
        }
        if (urlLower.includes('/check/')) {
          return { success: true, data: { exists: false }, message: 'Opération réussie', errors: [] };
        }
        if (urlLower.includes('/assigned/')) {
          return { success: true, data: this._generateFakeClients(3), message: 'Opération réussie', errors: [] };
        }
        if (urlLower.includes('/summary') || url.match(/\/clients\/\d+$/)) {
          const id = url.match(/\/clients\/(\d+)/)?.[1] || '1';
          return { success: true, data: this._generateFakeClient(id), message: 'Opération réussie', errors: [] };
        }
        return { success: true, data: this._generateFakeClients(20), message: 'Opération réussie', errors: [] };
      }
      if (method === 'POST') {
        return { success: true, data: { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() }, message: 'Client créé avec succès', errors: [] };
      }
      if (method === 'PATCH') {
        return { success: true, data: { ...data, id: url.match(/\/(\d+)/)?.[1] || '1', updatedAt: new Date().toISOString() }, message: 'Client mis à jour avec succès', errors: [] };
      }
      if (method === 'DELETE') {
        return { success: true, data: null, message: 'Client supprimé avec succès', errors: [] };
      }
    }

    // ROLES & PERMISSIONS
    if (urlLower.includes('/roles-permissions')) {
      if (method === 'GET') {
        if (urlLower.includes('/matrix')) {
          return { success: true, data: this._generateFakeRolesPermissionsMatrix(), message: 'Matrice chargée avec succès', errors: [] };
        }
        if (urlLower.includes('/users')) {
          return { success: true, data: this._generateFakeUsers(15), message: 'Utilisateurs chargés avec succès', errors: [] };
        }
      }
      if (method === 'POST') {
        if (urlLower.includes('/permissions')) {
          return { success: true, data: { ...data, added: true }, message: 'Permission ajoutée avec succès', errors: [] };
        }
        if (urlLower.includes('/disconnect')) {
          return { success: true, data: { disconnected: true }, message: 'Utilisateur déconnecté avec succès', errors: [] };
        }
      }
      if (method === 'PATCH') {
        if (urlLower.includes('/role')) {
          return { success: true, data: { ...data, role: data.role }, message: 'Rôle modifié avec succès', errors: [] };
        }
        if (urlLower.includes('/reset-password')) {
          return { success: true, data: { passwordReset: true }, message: 'Mot de passe réinitialisé avec succès', errors: [] };
        }
      }
      if (method === 'DELETE') {
        return { success: true, data: { removed: true }, message: 'Permission retirée avec succès', errors: [] };
      }
    }

    // USERS
    if (urlLower.includes('/users')) {
      if (method === 'GET') {
        if (url.match(/\/users\/(\d+)$/)) {
          const id = url.match(/\/users\/(\d+)/)?.[1] || '1';
          return { success: true, data: this._generateFakeUser(id), message: 'Opération réussie', errors: [] };
        }
        return { success: true, data: this._generateFakeUsers(15), message: 'Opération réussie', errors: [] };
      }
      if (method === 'POST') {
        return { success: true, data: { ...data, id: Date.now().toString() }, message: 'Utilisateur créé avec succès', errors: [] };
      }
      if (method === 'PATCH') {
        return { success: true, data: { ...data, id: url.match(/\/(\d+)/)?.[1] || '1' }, message: 'Utilisateur mis à jour avec succès', errors: [] };
      }
      if (method === 'DELETE') {
        return { success: true, data: null, message: 'Utilisateur supprimé avec succès', errors: [] };
      }
    }

    // FACTURES
    if (urlLower.includes('/factures') || urlLower.includes('/facturation')) {
      if (method === 'GET') {
        if (url.match(/\/factures\/(\d+)/)) {
          const id = url.match(/\/factures\/(\d+)/)?.[1] || '1';
          return { success: true, data: this._generateFakeFacture(id), message: 'Opération réussie', errors: [] };
        }
        return { success: true, data: this._generateFakeFactures(15), message: 'Opération réussie', errors: [] };
      }
      if (method === 'POST') {
        return { success: true, data: { ...data, id: Date.now().toString(), numeroFacture: `FAC-${Date.now()}` }, message: 'Facture créée avec succès', errors: [] };
      }
    }

    // BONS DE SORTIE
    if (urlLower.includes('/bons-de-sortie') || urlLower.includes('/bonsdesortie')) {
      if (method === 'GET') {
        if (url.match(/\/\d+/)) {
          const id = url.match(/\/(\d+)/)?.[1] || '1';
          return { success: true, data: this._generateFakeBonDeSortie(id), message: 'Opération réussie', errors: [] };
        }
        return { success: true, data: this._generateFakeBonsDeSortie(10), message: 'Opération réussie', errors: [] };
      }
      if (method === 'POST') {
        return { success: true, data: { ...data, id: Date.now().toString() }, message: 'Bon de sortie créé avec succès', errors: [] };
      }
      if (method === 'PATCH') {
        return { success: true, data: { ...data, id: url.match(/\/(\d+)/)?.[1] || '1' }, message: 'Bon de sortie mis à jour avec succès', errors: [] };
      }
      if (method === 'DELETE') {
        return { success: true, data: null, message: 'Bon de sortie supprimé avec succès', errors: [] };
      }
    }

    // RENDEZ-VOUS
    if (urlLower.includes('/rendez-vous')) {
      if (method === 'GET') {
        if (url.match(/\/\d+/)) {
          const id = url.match(/\/(\d+)/)?.[1] || '1';
          return { success: true, data: this._generateFakeRendezVous(id), message: 'Opération réussie', errors: [] };
        }
        return { success: true, data: this._generateFakeRendezVousList(10), message: 'Opération réussie', errors: [] };
      }
      if (method === 'POST') {
        return { success: true, data: { ...data, id: Date.now().toString() }, message: 'Rendez-vous créé avec succès', errors: [] };
      }
      if (method === 'PATCH') {
        return { success: true, data: { ...data, id: url.match(/\/(\d+)/)?.[1] || '1' }, message: 'Rendez-vous mis à jour avec succès', errors: [] };
      }
      if (method === 'DELETE') {
        return { success: true, data: null, message: 'Rendez-vous supprimé avec succès', errors: [] };
      }
    }

    // STATISTICS
    if (urlLower.includes('/statistics') || urlLower.includes('/stats')) {
      return { success: true, data: this._generateFakeStatistics(), message: 'Opération réussie', errors: [] };
    }

    // NOTIFICATIONS
    if (urlLower.includes('/notifications')) {
      if (method === 'GET') {
        return { success: true, data: this._generateFakeNotifications(10), message: 'Opération réussie', errors: [] };
      }
      if (method === 'PATCH') {
        return { success: true, data: { id: url.match(/\/(\d+)/)?.[1] || '1', read: true }, message: 'Notification marquée comme lue', errors: [] };
      }
    }

    // SITE ADMIN - SERVICES
    if (urlLower.includes('/site-admin/services') || urlLower.includes('/api/site-admin/services')) {
      if (method === 'GET') {
        if (url.match(/\/\d+/)) {
          const id = url.match(/\/(\d+)/)?.[1] || '1';
          const services = this._generateFakeServices(24);
          const service = services.find((s) => s.id === id) || services[0];
          return { success: true, data: service, message: 'Opération réussie', errors: [] };
        }
        const allServices = this._generateFakeServices(24);
        const includeInactive = urlLower.includes('includeinactive=true');
        const filteredServices = includeInactive ? allServices : allServices.filter((s) => s.isActive);
        return { success: true, data: filteredServices, message: 'Opération réussie', errors: [] };
      }
      if (method === 'POST') {
        return { success: true, data: { ...data, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, message: 'Service créé avec succès', errors: [] };
      }
      if (method === 'PATCH') {
        const id = url.match(/\/(\d+)/)?.[1] || '1';
        if (urlLower.includes('/toggle-active')) {
          const services = this._generateFakeServices(24);
          const service = services.find((s) => s.id === id) || services[0];
          return { success: true, data: { ...service, isActive: !service.isActive }, message: 'Statut modifié avec succès', errors: [] };
        }
        return { success: true, data: { ...data, id, updatedAt: new Date().toISOString() }, message: 'Service mis à jour avec succès', errors: [] };
      }
      if (method === 'DELETE') {
        return { success: true, data: null, message: 'Service supprimé avec succès', errors: [] };
      }
    }

    // SITE ADMIN - SLIDES, PARTNER LOGOS
    if (urlLower.includes('/slides') || urlLower.includes('/partner-logos')) {
      if (method === 'GET') {
        if (url.match(/\/\d+/)) {
          const id = url.match(/\/(\d+)/)?.[1] || '1';
          return { success: true, data: { id, title: `Item ${id}`, active: true }, message: 'Opération réussie', errors: [] };
        }
        const count = urlLower.includes('slides') ? 5 : 6;
        return { success: true, data: Array.from({ length: count }, (_, i) => ({ id: (i + 1).toString(), title: `Item ${i + 1}`, active: true })), message: 'Opération réussie', errors: [] };
      }
      if (method === 'POST') {
        return { success: true, data: { ...data, id: Date.now().toString() }, message: 'Item créé avec succès', errors: [] };
      }
      if (method === 'PATCH') {
        return { success: true, data: { ...data, id: url.match(/\/(\d+)/)?.[1] || '1' }, message: 'Item mis à jour avec succès', errors: [] };
      }
      if (method === 'DELETE') {
        return { success: true, data: null, message: 'Item supprimé avec succès', errors: [] };
      }
    }

    // CLIENT DOCUMENTS
    if (urlLower.includes('/documents')) {
      if (method === 'GET') {
        return { success: true, data: this._generateFakeDocuments(5), message: 'Opération réussie', errors: [] };
      }
      if (method === 'POST') {
        return { success: true, data: { id: Date.now().toString(), ...data }, message: 'Document uploadé avec succès', errors: [] };
      }
      if (method === 'DELETE') {
        return { success: true, data: null, message: 'Document supprimé avec succès', errors: [] };
      }
    }

    // SESSIONS
    if (urlLower.includes('/sessions')) {
      if (method === 'GET') {
        if (url.match(/\/\d+/)) {
          const id = url.match(/\/(\d+)/)?.[1] || '1';
          return { success: true, data: this._generateFakeSession(id), message: 'Opération réussie', errors: [] };
        }
        return { success: true, data: this._generateFakeSessions(5), message: 'Opération réussie', errors: [] };
      }
      if (method === 'POST') {
        return { success: true, data: { ...data, id: Date.now().toString(), status: 'open' }, message: 'Session créée avec succès', errors: [] };
      }
      if (method === 'PATCH') {
        return { success: true, data: { ...data, id: url.match(/\/(\d+)/)?.[1] || '1', status: 'closed' }, message: 'Session fermée avec succès', errors: [] };
      }
    }

    // Par défaut, retourner un succès générique
    if (method === 'GET') {
      return { success: true, data: [], message: 'Opération réussie', errors: [] };
    }
    if (method === 'POST' || method === 'PATCH') {
      return { success: true, data: { ...data, id: Date.now().toString() }, message: 'Opération réussie', errors: [] };
    }
    if (method === 'DELETE') {
      return { success: true, data: null, message: 'Opération réussie', errors: [] };
    }

    return { success: true, data: null, message: 'Opération réussie', errors: [] };
  }

  // Créer un nouveau client
  static async createClient({ nom, numero, email, service, commentaire, status }) {
    // Construire le payload en évitant d'envoyer un email vide (optionnel)
    const payload = {
      nom: nom?.trim() || '',
      numero: numero?.trim() || '',
      status: status || 'lead',
    };

    if (email && email.trim()) {
      payload.email = email.trim();
    }
    if (service) {
      payload.service = service;
    }
    if (commentaire && commentaire.trim()) {
      payload.commentaire = commentaire.trim();
    }

    return this._authenticatedRequest('POST', apiUrl.clients, payload);
  }

  // Mettre à jour un client (seuls les champs fournis sont modifiés)
  static async updateClient(id, { nom, numero, email, service, commentaire, status } = {}) {
    const updateData = {};

    const nomTrim = nom?.trim();
    const numeroTrim = numero?.trim();
    const emailTrim = email?.trim();
    const commentaireTrim = commentaire?.trim();

    if (nom !== undefined && nomTrim) updateData.nom = nomTrim;
    if (numero !== undefined && numeroTrim) updateData.numero = numeroTrim;
    if (status !== undefined && status) updateData.status = status;

    // Email optionnel : l'envoyer uniquement s'il est non vide, ou explicitement null pour l'effacer
    if (email !== undefined) {
      if (emailTrim) {
        updateData.email = emailTrim;
      } else {
        updateData.email = null; // autoriser la suppression de l'email
      }
    }

    if (service !== undefined && service) updateData.service = service;
    if (commentaire !== undefined && commentaireTrim) updateData.commentaire = commentaireTrim;

    // Éviter d'envoyer un payload vide
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        message: 'Aucune donnée à mettre à jour',
        errors: [],
      };
    }

    return this._authenticatedRequest('PATCH', apiUrl.updateClient(id), updateData);
  }

  // Supprimer un client
  static async deleteClient(id) {
    return this._authenticatedRequest('DELETE', apiUrl.deleteClient(id));
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
    // Compat: certains backends attendent "userId", d'autres "assignedTo"
    return this._authenticatedRequest('POST', apiUrl.clientAssign(id), { userId, assignedTo: userId });
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
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));

    // Retourner des données factices
    const userData = {
      id: Date.now().toString(),
      email: email || 'user@example.com',
      firstname: firstname || 'User',
      lastname: lastname || 'New',
      service: service || 'Commercial',
      telephone: telephone || '',
      access_token: `fake_token_${  Date.now()}`
    };

        return {
          success: true,
      data: userData,
      message: 'Utilisateur créé avec succès (mode fake data)',
      errors: []
    };
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

  // Changer le mot de passe d'un utilisateur
  // API: PATCH /users/{id}/change-password
  // Body: { newPassword: string }
  // Response 200: { message }
  // Response 400: Erreur de validation (mot de passe trop court)
  // Response 404: Utilisateur non trouvé
  static async changeUserPassword(id, newPassword) {
    return this._authenticatedRequest('PATCH', apiUrl.changeUserPassword(id), { newPassword });
  }

  // ========== ROLES & PERMISSIONS ==========

  // Obtenir la matrice des permissions (legacy)
  static async getRolesPermissionsMatrix() {
    return this._authenticatedRequest('GET', apiUrl.rolesPermissionsMatrix);
  }

  // Obtenir tous les utilisateurs avec leurs rôles
  static async getRolesUsers() {
    return this._authenticatedRequest('GET', apiUrl.rolesUsers);
  }

  // Mettre à jour le rôle d'un utilisateur
  static async updateRolesUserRole(userId, newRole) {
    return this._authenticatedRequest('PATCH', apiUrl.updateUserRole(userId), { role: newRole });
  }

  // Réinitialiser le mot de passe d'un utilisateur
  static async resetRolesUserPassword(userId, newPassword) {
    return this._authenticatedRequest('PATCH', apiUrl.resetUserPassword(userId), { newPassword });
  }

  // Forcer la déconnexion d'un utilisateur
  static async disconnectRolesUser(userId) {
    return this._authenticatedRequest('POST', apiUrl.disconnectUser(userId));
  }

  // Ajouter une permission à un rôle (legacy)
  static async addRolePermission(role, permission) {
    return this._authenticatedRequest('POST', apiUrl.addRolePermission(role), { permission });
  }

  // Retirer une permission d'un rôle (legacy)
  static async removeRolePermission(role, permission) {
    return this._authenticatedRequest('DELETE', apiUrl.removeRolePermission(role, permission));
  }

  // ========== MODULES DE PERMISSIONS ==========

  // Obtenir tous les modules de permissions
  static async getPermissionModules() {
    console.log('Calling getPermissionModules with URL:', apiUrl.permissionModules);
    const result = await this._authenticatedRequest('GET', apiUrl.permissionModules);
    console.log('getPermissionModules result:', result);
    return result;
  }

  // Obtenir les modules de permissions avec pagination
  static async getPermissionModulesPaginated(page = 1, limit = 10) {
    const url = `${apiUrl.permissionModulesPaginated}?page=${page}&limit=${limit}`;
    console.log('Calling getPermissionModulesPaginated with URL:', url);
    const result = await this._authenticatedRequest('GET', url);
    console.log('getPermissionModulesPaginated result:', result);
    return result;
  }

  // Obtenir un module par ID
  static async getPermissionModuleById(moduleId) {
    return this._authenticatedRequest('GET', apiUrl.permissionModuleById(moduleId));
  }

  // Créer un module de permissions
  static async createPermissionModule(data) {
    return this._authenticatedRequest('POST', apiUrl.permissionModules, data);
  }

  // Mettre à jour un module de permissions
  static async updatePermissionModule(moduleId, data) {
    return this._authenticatedRequest('PUT', apiUrl.permissionModuleById(moduleId), data);
  }

  // Supprimer un module de permissions
  static async deletePermissionModule(moduleId) {
    return this._authenticatedRequest('DELETE', apiUrl.permissionModuleById(moduleId));
  }

  // ========== PERMISSIONS ==========

  // Obtenir toutes les permissions
  static async getPermissions() {
    console.log('=== GET PERMISSIONS DEBUG ===');
    console.log('Calling getPermissions with URL:', apiUrl.permissions);
    console.log('Full URL:', apiUrl.permissions);
    const result = await this._authenticatedRequest('GET', apiUrl.permissions);
    console.log('getPermissions result:', result);
    console.log('getPermissions result type:', typeof result);
    console.log('getPermissions is array:', Array.isArray(result));
    console.log('getPermissions result.data:', result?.data);
    console.log('getPermissions result.data type:', typeof result?.data);
    console.log('getPermissions result.data is array:', Array.isArray(result?.data));
    if (result?.data && Array.isArray(result.data)) {
      console.log('getPermissions result.data length:', result.data.length);
      console.log('getPermissions result.data[0]:', result.data[0]);
    }
    return result;
  }

  // Obtenir les permissions avec pagination
  static async getPermissionsPaginated(page = 1, limit = 10) {
    const url = `${apiUrl.permissionsPaginated}?page=${page}&limit=${limit}`;
    console.log('Calling getPermissionsPaginated with URL:', url);
    const result = await this._authenticatedRequest('GET', url);
    console.log('getPermissionsPaginated result:', result);
    return result;
  }

  // Obtenir les permissions d'un module
  static async getPermissionsByModule(moduleId) {
    return this._authenticatedRequest('GET', apiUrl.permissionsByModule(moduleId));
  }

  // Obtenir les permissions d'un module avec pagination
  static async getPermissionsByModulePaginated(moduleId, page = 1, limit = 10) {
    const url = `${apiUrl.permissionsByModulePaginated(moduleId)}?page=${page}&limit=${limit}`;
    console.log('Calling getPermissionsByModulePaginated with URL:', url);
    const result = await this._authenticatedRequest('GET', url);
    console.log('getPermissionsByModulePaginated result:', result);
    return result;
  }

  // Obtenir une permission par ID
  static async getPermissionById(permissionId) {
    return this._authenticatedRequest('GET', apiUrl.permissionById(permissionId));
  }

  // Créer une permission
  static async createPermission(data) {
    return this._authenticatedRequest('POST', apiUrl.permissions, data);
  }

  // Mettre à jour une permission
  static async updatePermission(permissionId, data) {
    return this._authenticatedRequest('PUT', apiUrl.permissionById(permissionId), data);
  }

  // Supprimer une permission
  static async deletePermission(permissionId) {
    return this._authenticatedRequest('DELETE', apiUrl.permissionById(permissionId));
  }

  // ========== RÔLES ==========

  // Créer un rôle
  static async createRole(name) {
    return this._authenticatedRequest('POST', apiUrl.role, { name });
  }

  // Obtenir tous les rôles
  static async getRoles() {
    return this._authenticatedRequest('GET', apiUrl.role);
  }

  // Obtenir un rôle par ID
  static async getRoleById(roleId) {
    return this._authenticatedRequest('GET', apiUrl.roleById(roleId));
  }

  // Mettre à jour un rôle
  static async updateRole(roleId, name) {
    return this._authenticatedRequest('PUT', apiUrl.roleById(roleId), { name });
  }

  // Supprimer un rôle
  static async deleteRole(roleId) {
    return this._authenticatedRequest('DELETE', apiUrl.roleById(roleId));
  }

  // Obtenir tous les rôles avec pagination
  static async getRolesPaginated(page = 1, limit = 10) {
    return this._authenticatedRequest('GET', `${apiUrl.rolePaginated}?page=${page}&limit=${limit}`);
  }

  // Obtenir toutes les permissions d'un rôle (groupées par modules)
  static async getRoleGlobalPermissions(roleUuid) {
    return this._authenticatedRequest('GET', apiUrl.roleGlobalPermissions(roleUuid));
  }

  // Toggle le statut d'une permission pour un rôle
  static async toggleRolePermissionStatus(permissionUuid) {
    // Pour une requête PUT de type toggle, utiliser directement ApiClient
    // Certaines APIs préfèrent ne pas avoir de body pour les requêtes PUT de type toggle
    const url = apiUrl.roleTogglePermissionStatus(permissionUuid);
    console.log('=== TOGGLE PERMISSION API CALL ===');
    console.log('URL:', url);
    console.log('Permission UUID:', permissionUuid);
    
    // Utiliser ApiClient directement pour avoir plus de contrôle
    return ApiClient.put(url, null, true);
  }

  // Générer toutes les permissions pour un rôle
  static async generateRolePermissions(roleUuid) {
    return this._authenticatedRequest('POST', apiUrl.roleGeneratePermissions(roleUuid));
  }

  // ========== ASSIGNATION RÔLES AUX MODULES ==========

  // Assigner un rôle à un module
  static async assignRoleToModule(moduleId, roleId) {
    return this._authenticatedRequest('POST', apiUrl.assignRoleToModule(moduleId, roleId));
  }

  // Retirer un rôle d'un module
  static async removeRoleFromModule(moduleId, roleId) {
    return this._authenticatedRequest('DELETE', apiUrl.removeRoleFromModule(moduleId, roleId));
  }

  // Obtenir les rôles assignés à un module
  static async getModuleRoles(moduleId) {
    return this._authenticatedRequest('GET', apiUrl.moduleRoles(moduleId));
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
      'GERANT': 'Gerant',
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
  static async createFacture({ type, clientId, sessionId, montantTotal, dateFacture, dateEcheance, clientAddress, items }) {
    const payload = {
      type: type || 'facture',
      clientId,
      montantTotal,
    };

    if (dateFacture) payload.dateFacture = dateFacture;
    if (dateEcheance) payload.dateEcheance = dateEcheance;
    if (sessionId) payload.sessionId = sessionId;
    if (clientAddress) payload.clientAddress = clientAddress;
    if (items) payload.items = items;

    return this._authenticatedRequest('POST', apiUrl.factures, payload);
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
  static async createFactureProforma({ type, clientId, sessionId, montantTotal, dateFacture, dateEcheance, clientAddress, items }) {
    const payload = {
      type: type || 'proforma',
      clientId,
      montantTotal,
    };

    if (dateFacture) payload.dateFacture = dateFacture;
    if (dateEcheance) payload.dateEcheance = dateEcheance;
    if (sessionId) payload.sessionId = sessionId;
    if (clientAddress) payload.clientAddress = clientAddress;
    if (items) payload.items = items;

    return this._authenticatedRequest('POST', apiUrl.factures, payload);
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

  // Uploader une image pour un slide - MODE FAKE DATA
  static async uploadSiteAdminSlideImage(file) {
    await new Promise(resolve => setTimeout(resolve, 500));
        return {
          success: true,
      data: { url: `/uploads/slide_${  Date.now()  }.jpg`, id: Date.now().toString() },
      message: 'Image uploadée avec succès (mode fake data)',
          errors: []
        };
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

  // Uploader une image pour un service - MODE FAKE DATA
  static async uploadSiteAdminServiceImage(file) {
    await new Promise(resolve => setTimeout(resolve, 500));
        return {
          success: true,
      data: { url: `/uploads/service_${  Date.now()  }.jpg`, id: Date.now().toString() },
      message: 'Image uploadée avec succès (mode fake data)',
          errors: []
        };
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

  // Uploader un logo partenaire - MODE FAKE DATA
  static async uploadSiteAdminPartnerLogo(file) {
    await new Promise(resolve => setTimeout(resolve, 500));
      return {
      success: true,
      data: { url: `/uploads/partner_${  Date.now()  }.png`, id: Date.now().toString() },
      message: 'Logo uploadé avec succès (mode fake data)',
        errors: []
      };
    }

  // ========== CLIENT DOCUMENTS ==========

  // Obtenir tous les documents d'un client
  static async getClientDocuments(clientId) {
    return this._authenticatedRequest('GET', apiUrl.clientDocuments(clientId));
  }

  // Uploader un document pour un client - MODE FAKE DATA
  static async uploadClientDocument(clientId, file, title) {
    await new Promise(resolve => setTimeout(resolve, 500));
        return {
          success: true,
      data: { 
        id: Date.now().toString(), 
        url: `/documents/doc_${  Date.now()  }.pdf`, 
        title: title || 'Document',
        clientId,
        uploadedAt: new Date().toISOString()
      },
      message: 'Document uploadé avec succès (mode fake data)',
          errors: []
        };
      }

  // Uploader plusieurs documents pour un client - MODE FAKE DATA
  static async uploadClientDocumentsMultiple(clientId, files, titles) {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (files.length !== titles.length) {
      return {
        success: false,
        message: 'Le nombre de fichiers doit correspondre au nombre de titres',
        errors: ['Le nombre de fichiers doit correspondre au nombre de titres']
      };
    }

    if (files.length > 10) {
      return {
        success: false,
        message: 'Maximum 10 fichiers autorisés',
        errors: ['Maximum 10 fichiers autorisés']
      };
    }

    const documents = files.map((file, index) => ({
      id: (Date.now() + index).toString(),
      url: `/documents/doc_${  Date.now() + index  }.pdf`,
      title: titles[index] || `Document ${index + 1}`,
      clientId,
      uploadedAt: new Date().toISOString()
    }));

    return {
      success: true,
      data: documents,
      message: `${files.length} document(s) uploadé(s) avec succès (mode fake data)`,
      errors: []
    };
  }

  // Supprimer un document client
  static async deleteClientDocument(documentId) {
    return this._authenticatedRequest('DELETE', apiUrl.clientDocumentDelete(documentId));
  }

  // ========== WEBTV ==========
  static async getWebTVCategories(params = {}) {
    const limit = params.limit || 100;
    return { success: true, data: this._generateFakeWebTVCategories(limit), message: 'Opération réussie', errors: [] };
  }

  static async getWebTVVideos(params = {}) {
    const limit = params.limit || 20;
    return { success: true, data: this._generateFakeWebTVVideos(limit), message: 'Opération réussie', errors: [] };
  }

  static async getWebTVVideoById(id) {
    return { success: true, data: this._generateFakeWebTVVideo(id), message: 'Opération réussie', errors: [] };
  }

  static async createWebTVVideo(data) {
    return { success: true, data: { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() }, message: 'Vidéo créée avec succès', errors: [] };
  }

  static async updateWebTVVideo(id, data) {
    return { success: true, data: { ...data, id, updatedAt: new Date().toISOString() }, message: 'Vidéo mise à jour avec succès', errors: [] };
  }

  static async deleteWebTVVideo(id) {
    return { success: true, data: null, message: 'Vidéo supprimée avec succès', errors: [] };
  }

  static async getWebTVPlaylists(params = {}) {
    const limit = params.limit || 20;
    return { success: true, data: this._generateFakeWebTVPlaylists(limit), message: 'Opération réussie', errors: [] };
  }

  static async getWebTVPlaylistById(id) {
    return { success: true, data: this._generateFakeWebTVPlaylist(id), message: 'Opération réussie', errors: [] };
  }

  static async createWebTVPlaylist(data) {
    return { success: true, data: { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() }, message: 'Playlist créée avec succès', errors: [] };
  }

  static async updateWebTVPlaylist(id, data) {
    return { success: true, data: { ...data, id, updatedAt: new Date().toISOString() }, message: 'Playlist mise à jour avec succès', errors: [] };
  }

  static async deleteWebTVPlaylist(id) {
    return { success: true, data: null, message: 'Playlist supprimée avec succès', errors: [] };
  }

  static async getWebTVLikes(params = {}) {
    const limit = params.limit || 20;
    return { success: true, data: this._generateFakeWebTVLikes(limit), message: 'Opération réussie', errors: [] };
  }

  static async createWebTVLike(data) {
    return { success: true, data: { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() }, message: 'Like créé avec succès', errors: [] };
  }

  static async updateWebTVLike(id, data) {
    return { success: true, data: { ...data, id, updatedAt: new Date().toISOString() }, message: 'Like mis à jour avec succès', errors: [] };
  }

  static async deleteWebTVLike(id) {
    return { success: true, data: null, message: 'Like supprimé avec succès', errors: [] };
  }

  static async getWebTVComments(params = {}) {
    const limit = params.limit || 20;
    return { success: true, data: this._generateFakeWebTVComments(limit), message: 'Opération réussie', errors: [] };
  }

  static async getWebTVCategoriesStats() {
    return { success: true, data: { total: 10, withVideos: 8 }, message: 'Opération réussie', errors: [] };
  }

  static async getWebTVVideosStats() {
    return { success: true, data: { total: 50, byStatus: [{ status: 'published', count: 40 }, { status: 'draft', count: 10 }] }, message: 'Opération réussie', errors: [] };
  }

  static async getWebTVPlaylistsStats() {
    return { success: true, data: { total: 15, byUser: [{ userId: '1', count: 5 }] }, message: 'Opération réussie', errors: [] };
  }

  // ========== SCHOOLS ==========
  static async getSchools(params = {}) {
    const limit = params.limit || 20;
    return { success: true, data: this._generateFakeSchools(limit), message: 'Opération réussie', errors: [] };
  }

  static async getSchoolById(id) {
    return { success: true, data: this._generateFakeSchool(id), message: 'Opération réussie', errors: [] };
  }

  static async getSchoolStatsOverview() {
    return { success: true, data: { totalSchools: 25, schoolsByRegion: [{ region: 'Abidjan', count: 10 }, { region: 'Yamoussoukro', count: 8 }] }, message: 'Opération réussie', errors: [] };
  }

  // ========== USERS LEGACY ==========
  static async getUsersLegacy() {
    return { success: true, data: this._generateFakeUsers(50), message: 'Opération réussie', errors: [] };
  }

  // ========== SCHOLARSHIPS ==========
  static async getScholarships(params = {}) {
    const limit = params.limit || 20;
    return { success: true, data: this._generateFakeScholarships(limit), message: 'Opération réussie', errors: [] };
  }

  static async getScholarshipById(id) {
    return { success: true, data: this._generateFakeScholarship(id), message: 'Opération réussie', errors: [] };
  }

  // ========== NEWS ==========
  static async getNews(params = {}) {
    const limit = params.limit || 20;
    return { success: true, data: this._generateFakeNews(limit), message: 'Opération réussie', errors: [] };
  }

  static async getNewsById(id) {
    return { success: true, data: this._generateFakeNewsItem(id), message: 'Opération réussie', errors: [] };
  }

  // ========== FAKE DATA GENERATORS ==========

  static _generateFakeClients(count = 10, withCommercial = false) {
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Paul', 'Anne', 'Luc', 'Julie', 'Marc', 'Sarah'];
    const lastNames = ['Dupont', 'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Leroy', 'Moreau'];
    const statuses = ['lead', 'client', 'prospect'];
    const services = ['Consultation', 'Traitement', 'Suivi', 'Contrôle'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      nom: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      numero: `+225 07 ${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      email: `client${i + 1}@example.com`,
      status: statuses[i % statuses.length],
      service: services[i % services.length],
      commentaire: `Client ${i + 1} - Commentaire factice`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      ...(withCommercial && { commercial: { id: (i % 3 + 1).toString(), nom: `Commercial ${i % 3 + 1}` } })
    }));
  }

  static _generateFakeClient(id) {
      return {
      id,
      nom: 'Jean Dupont',
      numero: '+225 07 12345678',
      email: 'client@example.com',
      status: 'client',
      service: 'Consultation',
      commentaire: 'Client factice',
      createdAt: new Date().toISOString(),
      sessions: this._generateFakeSessions(3)
    };
  }

  static _generateFakeUsers(count = 15) {
    const firstNames = ['Jean', 'Marie', 'Amadou', 'Fatou', 'Ibrahima', 'Aissatou', 'Ousmane', 'Awa', 'Khadija', 'Moussa', 'Mariama', 'Samba', 'Aminata', 'Modou', 'Ndèye'];
    const lastNames = ['Dupont', 'Diop', 'Sarr', 'Ba', 'Fall', 'Diallo', 'Ndiaye', 'Sy', 'Thiam', 'Cissé', 'Kane', 'Sow', 'Toure', 'Seck', 'Mbaye'];
    const roles = ['DIRECTEUR', 'RH', 'COMPTABLE', 'ACHAT', 'ASSURANCE', 'LABORANTIN', 'MEDECIN', 'MEDECIN', 'INFIRMIER', 'INFIRMIER', 'AIDE_SOIGNANT', 'AIDE_SOIGNANT', 'ADMINISTRATEUR', 'ADMINISTRATEUR', 'RH'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      matricule: `MAT${String(i + 1).padStart(3, '0')}`,
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[i % lastNames.length],
      // Garder aussi les anciens champs pour compatibilité
      firstname: firstNames[i % firstNames.length],
      lastname: lastNames[i % lastNames.length],
      email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@example.com`,
      phone: `+221 77 ${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
      phoneNumber: `+221 77 ${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
      // Garder aussi les anciens champs pour compatibilité
      telephone: `+221 77 ${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
      role: roles[i % roles.length],
      service: roles[i % roles.length], // Garder pour compatibilité
      isSuspended: false,
      emailVerified: true,
      status: 'active',
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeUser(id) {
    return {
      id,
      email: 'user@example.com',
      firstname: 'Jean',
      lastname: 'Dupont',
      service: 'Commercial',
      telephone: '+225 07 12345678',
      status: 'active',
      createdAt: new Date().toISOString()
    };
  }

  static _generateFakeFactures(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      numeroFacture: `FAC-${String(i + 1).padStart(6, '0')}`,
      type: i % 2 === 0 ? 'facture' : 'proforma',
      montantTotal: Math.floor(Math.random() * 500000) + 50000,
      dateFacture: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      dateEcheance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      client: { id: (i % 5 + 1).toString(), nom: `Client ${i % 5 + 1}` },
      status: ['draft', 'sent', 'paid', 'overdue'][i % 4]
    }));
  }

  static _generateFakeFacture(id) {
    return {
      id,
      numeroFacture: `FAC-${String(id).padStart(6, '0')}`,
      type: 'facture',
      montantTotal: 150000,
      dateFacture: new Date().toISOString(),
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      client: { id: '1', nom: 'Client Test' },
      status: 'sent',
      items: [
        { description: 'Consultation', quantity: 1, price: 50000 },
        { description: 'Traitement', quantity: 1, price: 100000 }
      ]
    };
  }

  static _generateFakeBonsDeSortie(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      numeroBon: `BS-${String(i + 1).padStart(6, '0')}`,
      montant: Math.floor(Math.random() * 200000) + 20000,
      description: `Bon de sortie ${i + 1}`,
      categorie: ['Dépenses', 'Fournitures', 'Urgences'][i % 3],
      methode: ['cash', 'check', 'transfer'][i % 3],
      dateBon: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: ['pending', 'approved', 'rejected'][i % 3]
    }));
  }

  static _generateFakeBonDeSortie(id) {
    return {
      id,
      numeroBon: `BS-${String(id).padStart(6, '0')}`,
      montant: 75000,
      description: 'Bon de sortie factice',
      categorie: 'Dépenses',
      methode: 'cash',
      dateBon: new Date().toISOString(),
      status: 'approved'
    };
  }

  static _generateFakeRendezVousList(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      client: { id: (i % 5 + 1).toString(), nom: `Client ${i % 5 + 1}` },
      dateRendezVous: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      description: `Rendez-vous ${i + 1}`,
      service: 'Consultation',
      status: ['scheduled', 'completed', 'cancelled'][i % 3]
    }));
  }

  static _generateFakeRendezVous(id) {
    return {
      id,
      client: { id: '1', nom: 'Client Test' },
      dateRendezVous: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      description: 'Rendez-vous factice',
      service: 'Consultation',
      status: 'scheduled',
      notes: 'Notes du rendez-vous'
    };
  }

  static _generateFakeSessions(count = 5) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      clientId: '1',
      service: 'Consultation',
      status: i === count - 1 ? 'open' : 'closed',
      createdAt: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString(),
      closedAt: i === count - 1 ? null : new Date(Date.now() - (count - i - 1) * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeSession(id) {
    return {
      id,
      clientId: '1',
      service: 'Consultation',
      status: 'open',
      createdAt: new Date().toISOString(),
      closedAt: null
    };
  }


  static _generateFakeNotifications(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      title: `Notification ${i + 1}`,
      message: `Message de la notification ${i + 1}`,
      type: ['info', 'warning', 'success', 'error'][i % 4],
      read: i > 5,
      createdAt: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeStatistics() {
    return {
      totalClients: 125,
      totalUsers: 15,
      totalFactures: 245,
      totalRevenue: 12500000,
      totalBonsDeSortie: 45,
      clientsByStatus: [
        { status: 'lead', count: 25 },
        { status: 'client', count: 75 },
        { status: 'prospect', count: 25 }
      ],
      revenueByMonth: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        revenue: Math.floor(Math.random() * 2000000) + 500000
      }))
    };
  }

  static _generateFakeWebTVCategories(count = 10) {
    const categories = ['Actualités', 'Éducation', 'Divertissement', 'Sport', 'Musique', 'Documentaires', 'Interviews', 'Reportages'];
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      name: categories[i % categories.length] || `Catégorie ${i + 1}`,
      description: `Description de la catégorie ${i + 1}`,
      videoCount: Math.floor(Math.random() * 50),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeWebTVVideos(count = 20) {
    const titles = ['Vidéo 1', 'Reportage spécial', 'Interview exclusive', 'Documentaire', 'Actualité'];
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      title: `${titles[i % titles.length]} ${i + 1}`,
      description: `Description de la vidéo ${i + 1}`,
      url: `https://example.com/video${i + 1}.mp4`,
      thumbnail: `https://example.com/thumb${i + 1}.jpg`,
      categoryId: (i % 5 + 1).toString(),
      views: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 500),
      status: ['published', 'draft'][i % 2],
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeWebTVVideo(id) {
    return {
      id,
      title: 'Vidéo factice',
      description: 'Description de la vidéo factice',
      url: 'https://example.com/video.mp4',
      thumbnail: 'https://example.com/thumb.jpg',
      categoryId: '1',
      views: 5000,
      likes: 250,
      status: 'published',
      createdAt: new Date().toISOString()
    };
  }

  static _generateFakeWebTVPlaylists(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      name: `Playlist ${i + 1}`,
      description: `Description de la playlist ${i + 1}`,
      videoCount: Math.floor(Math.random() * 20) + 5,
      userId: (i % 3 + 1).toString(),
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeWebTVPlaylist(id) {
    return {
      id,
      name: 'Playlist factice',
      description: 'Description de la playlist factice',
      videoCount: 10,
      userId: '1',
      videos: this._generateFakeWebTVVideos(10),
      createdAt: new Date().toISOString()
    };
  }

  static _generateFakeWebTVLikes(count = 20) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      videoId: (i % 10 + 1).toString(),
      userId: (i % 5 + 1).toString(),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeWebTVComments(count = 20) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      videoId: (i % 10 + 1).toString(),
      userId: (i % 5 + 1).toString(),
      text: `Commentaire ${i + 1} - Texte factice`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeSchools(count = 20) {
    const names = ['INPHB', 'Université FHB', 'ESI', 'ESATIC', 'ISTC'];
    const regions = ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Korhogo', 'San-Pédro'];
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      name: `${names[i % names.length]} ${i > 4 ? i + 1 : ''}`,
      region: regions[i % regions.length],
      address: `Adresse ${i + 1}`,
      phone: `+225 07 ${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      email: `ecole${i + 1}@example.com`,
      studentCount: Math.floor(Math.random() * 5000) + 500,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeSchool(id) {
    return {
      id,
      name: 'École factice',
      region: 'Abidjan',
      address: 'Adresse factice',
      phone: '+225 07 12345678',
      email: 'ecole@example.com',
      studentCount: 2500,
      createdAt: new Date().toISOString()
    };
  }

  static _generateFakeScholarships(count = 15) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      title: `Bourse ${i + 1}`,
      description: `Description de la bourse ${i + 1}`,
      amount: Math.floor(Math.random() * 5000000) + 500000,
      deadline: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: ['open', 'closed', 'upcoming'][i % 3],
      applicationCount: Math.floor(Math.random() * 200),
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeScholarship(id) {
    return {
      id,
      title: 'Bourse factice',
      description: 'Description de la bourse factice',
      amount: 1000000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open',
      applicationCount: 50,
      requirements: ['Requirement 1', 'Requirement 2'],
      createdAt: new Date().toISOString()
    };
  }

  static _generateFakeNews(count = 20) {
    const titles = ['Actualité', 'Nouvelle', 'Article', 'Reportage'];
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      title: `${titles[i % titles.length]} ${i + 1}`,
      content: `Contenu de l'actualité ${i + 1}`,
      categoryId: (i % 5 + 1).toString(),
      authorId: (i % 3 + 1).toString(),
      publishedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: ['published', 'draft'][i % 2],
      views: Math.floor(Math.random() * 5000),
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  static _generateFakeNewsItem(id) {
    return {
      id,
      title: 'Actualité factice',
      content: 'Contenu de l\'actualité factice',
      categoryId: '1',
      authorId: '1',
      publishedAt: new Date().toISOString(),
      status: 'published',
      views: 1000,
      createdAt: new Date().toISOString()
    };
  }

  // ========== ACTIVITY LOG ==========
  static async getActivityLogs(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const limit = params.limit || 25;
    return {
      success: true,
      data: {
        activities: this._generateFakeActivityLogs(limit),
        stats: {
          total: 1245,
          today: 45,
          thisWeek: 320,
          thisMonth: 890,
        },
        pagination: {
          page: params.page || 1,
          limit,
          total: 1245,
        },
      },
      message: 'Journal chargé avec succès',
        errors: []
      };
    }

  static async exportActivityLogs(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: {
        url: `/exports/activity-logs-${  Date.now()  }.csv`,
      },
      message: 'Export réussi',
      errors: []
    };
  }

  // ========== BACKUP & RESTORE ==========
  static async getBackups() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: this._generateFakeBackups(5),
      message: 'Sauvegardes chargées',
      errors: []
    };
  }

  static async createBackup(data) {
    await new Promise(resolve => setTimeout(resolve, 800));
        return {
          success: true,
      data: {
        id: Date.now().toString(),
        name: data.name || `Sauvegarde ${  new Date().toLocaleString()}`,
        description: data.description || '',
        type: 'manual',
        size: Math.floor(Math.random() * 100000000) + 50000000,
        createdAt: new Date().toISOString(),
      },
      message: 'Sauvegarde créée avec succès',
          errors: []
        };
      }

  static async restoreBackup(backupId) {
    await new Promise(resolve => setTimeout(resolve, 2000));
      return {
      success: true,
      data: { id: backupId },
      message: 'Restauration réussie',
      errors: []
    };
  }

  static async deleteBackup(backupId) {
    await new Promise(resolve => setTimeout(resolve, 300));
      return {
      success: true,
      data: null,
      message: 'Sauvegarde supprimée',
      errors: []
    };
  }

  static async downloadBackup(backupId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: {
        url: `/backups/backup-${  backupId  }.zip`,
      },
      message: 'Téléchargement disponible',
      errors: []
    };
  }

  static async getAutoBackupSettings() {
    await new Promise(resolve => setTimeout(resolve, 200));
      return {
      success: true,
      data: {
        enabled: false,
        frequency: 'daily',
        time: '02:00',
        keepLast: 30,
      },
      message: 'Paramètres chargés',
        errors: []
      };
    }

  static async updateAutoBackupSettings(settings) {
    await new Promise(resolve => setTimeout(resolve, 300));
      return {
      success: true,
      data: settings,
      message: 'Paramètres sauvegardés',
      errors: []
    };
  }

  // ========== MULTI-CLINICS ==========
  static async getClinics() {
    await new Promise(resolve => setTimeout(resolve, 300));
      return {
      success: true,
      data: this._generateFakeClinics(3),
      message: 'Cliniques chargées',
      errors: []
    };
  }

  static async getCurrentClinic() {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      success: true,
      data: {
        id: '1',
        name: 'Clinique Principale',
        address: '123 Rue de la Santé',
        city: 'Abidjan',
        country: 'CI',
        phone: '+225 07 12345678',
        email: 'contact@clinique.example.com',
        license: 'LIC-001',
        status: 'active',
        settings: {
          timezone: 'Africa/Abidjan',
          language: 'fr',
          currency: 'XOF',
        },
      },
      message: 'Clinique actuelle chargée',
      errors: []
    };
  }

  static async createClinic(data) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
      },
      message: 'Clinique créée avec succès',
      errors: []
    };
  }

  static async updateClinic(clinicId, data) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      success: true,
      data: {
        id: clinicId,
        ...data,
        updatedAt: new Date().toISOString(),
      },
      message: 'Clinique mise à jour',
      errors: []
    };
  }

  static async deleteClinic(clinicId) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: null,
      message: 'Clinique supprimée',
      errors: []
    };
  }

  static async switchClinic(clinicId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: { id: clinicId },
      message: 'Clinique changée avec succès',
      errors: []
    };
  }

  // ========== PATIENTS ==========

  static async getPatients(filters = {}) {
    let url = apiUrl.patients;
    
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.gender) params.append('gender', filters.gender);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const result = await this._authenticatedRequest('GET', url);
    
    // Mapper les champs si différents
    if (result.success && result.data) {
      if (Array.isArray(result.data)) {
        result.data = result.data.map(p => this._mapPatientFields(p));
      } else if (result.data.patients) {
        result.data.patients = result.data.patients.map(p => this._mapPatientFields(p));
      }
    }
    
    return result;
  }

  static async getPatientsPaginated(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.gender) params.append('gender', filters.gender);
    const url = `${apiUrl.patientsPaginated}?${params.toString()}`;

    const result = await this._authenticatedRequest('GET', url);

    // Normalize items if present
    if (result.success && result.data) {
      // common shapes: { items: [], total, page, limit } or { patients: [], total }
      if (Array.isArray(result.data)) {
        result.data = {
          items: result.data.map(p => this._mapPatientFields(p)),
          total: result.data.length,
          page,
          limit
        };
      } else if (result.data.items) {
        result.data.items = result.data.items.map(p => this._mapPatientFields(p));
      } else if (result.data.patients) {
        result.data.patients = result.data.patients.map(p => this._mapPatientFields(p));
      }
    }

    return result;
  }

  static async getPatientById(patientId) {
    const result = await this._authenticatedRequest('GET', apiUrl.patientById(patientId));
    
    if (result.success && result.data) {
      result.data = this._mapPatientFields(result.data);
    }
    
    return result;
  }

  // Alias: récupérer un patient par son numéro (ex: PAT-2026-00001)
  static async getPatientByNumber(patientNumber) {
    const result = await this._authenticatedRequest('GET', apiUrl.patientByNumber(patientNumber));
    if (result.success && result.data) {
      result.data = this._mapPatientFields(result.data);
    }
    return result;
  }

  static async createPatient(data) {
    // Normaliser les données selon la structure API réelle
    const normalizeGender = (gender) => {
      if (!gender) return 'MALE';
      if (gender === 'M') return 'MALE';
      if (gender === 'F') return 'FEMALE';
      return gender.toUpperCase();
    };
    
    const normalizedData = {
      // Identité
      patientNumber: data.patientNumber || data.patientId || `PAT-${Date.now()}`,
      firstName: data.firstName || data.firstname || '',
      lastName: data.lastName || data.lastname || '',
      
      // Informations personnelles
      dateOfBirth: data.dateOfBirth || data.date_of_birth || '',
      placeOfBirth: data.placeOfBirth || data.place_of_birth || '',
      nationality: data.nationality || '',
      gender: normalizeGender(data.gender),
      maritalStatus: data.maritalStatus || data.marital_status || 'SINGLE',
      
      // Contact
      phone: data.phone || data.telephone || '',
      email: data.email || '',
      address: data.address || data.adresse || '',
      city: data.city || data.ville || '',
      country: data.country || data.pays || '',
      
      // Médical
      bloodGroup: data.bloodGroup || data.blood_group || '',
      height: data.height ? parseInt(data.height) : null,
      weight: data.weight ? parseFloat(data.weight) : null,
      
      // Profession
      occupation: data.occupation || data.profession || data.metier || '',
      
      // Contact d'urgence (structure plate pour API)
      emergencyContactName: data.emergencyContactName || (data.emergencyContact?.name || ''),
      emergencyContactPhone: data.emergencyContactPhone || (data.emergencyContact?.phone || ''),
      emergencyContactRelationship: data.emergencyContactRelationship || (data.emergencyContact?.relationship || ''),
      
      // Assurance
      insuranceType: data.insuranceType || data.insurance?.type || 'NONE',
      insuranceCompany: data.insuranceCompany || data.insurance?.company || '',
      insuranceNumber: data.insuranceNumber || data.insurance?.number || '',
      insuranceValidUntil: data.insuranceValidUntil || data.insurance?.validUntil || '',
      
      // Statut
      status: data.status || 'ACTIVE',
      isActive: data.isActive !== undefined ? data.isActive : true,
      
      // Autres
      photo: data.photo || '',
      notes: data.notes || ''
    };
    
    return this._authenticatedRequest('POST', apiUrl.patients, normalizedData);
  }

  static async updatePatient(patientId, data) {
    // Normaliser les données - similiaire à createPatient
    // IMPORTANT: PUT requiert TOUS les champs, donc on doit fournir des valeurs par défaut
    const normalizeGender = (gender) => {
      if (!gender) return 'MALE';
      if (gender === 'M') return 'MALE';
      if (gender === 'F') return 'FEMALE';
      return gender.toUpperCase();
    };
    
    const normalizedData = {
      // Identité - REQUIS
      patientNumber: data.patientNumber || data.patientId || patientId || '',
      firstName: data.firstName || data.firstname || '',
      lastName: data.lastName || data.lastname || '',
      
      // Informations personnelles
      dateOfBirth: data.dateOfBirth || data.date_of_birth || '',
      placeOfBirth: data.placeOfBirth || data.place_of_birth || '',
      nationality: data.nationality || '',
      gender: normalizeGender(data.gender),
      maritalStatus: data.maritalStatus || data.marital_status || 'SINGLE',
      
      // Contact
      phone: data.phone || data.telephone || '',
      email: data.email || '',
      address: data.address || data.adresse || '',
      city: data.city || data.ville || '',
      country: data.country || data.pays || '',
      
      // Médical
      bloodGroup: data.bloodGroup || data.blood_group || '',
      height: data.height ? parseInt(data.height) : null,
      weight: data.weight ? parseFloat(data.weight) : null,
      
      // Profession
      occupation: data.occupation || data.profession || data.metier || '',
      
      // Contact d'urgence (structure plate pour API)
      emergencyContactName: data.emergencyContactName || (data.emergencyContact?.name || ''),
      emergencyContactPhone: data.emergencyContactPhone || (data.emergencyContact?.phone || ''),
      emergencyContactRelationship: data.emergencyContactRelationship || (data.emergencyContact?.relationship || ''),
      
      // Assurance
      insuranceType: data.insuranceType || data.insurance?.type || 'NONE',
      insuranceCompany: data.insuranceCompany || data.insurance?.company || '',
      insuranceNumber: data.insuranceNumber || data.insurance?.number || '',
      insuranceValidUntil: data.insuranceValidUntil || data.insurance?.validUntil || '',
      
      // Statut
      status: data.status || 'ACTIVE',
      isActive: data.isActive !== undefined ? data.isActive : true,
      
      // Autres
      photo: data.photo || '',
      notes: data.notes || ''
    };
    
    // PUT requiert l'ID du patient - utiliser patientNumber si disponible
    const updateUrl = apiUrl.updatePatient(data.patientNumber || patientId);
    
    return this._authenticatedRequest('PUT', updateUrl, normalizedData);
  }

  static async deletePatient(patientId) {
    return this._authenticatedRequest('DELETE', apiUrl.deletePatient(patientId));
  }

  // Alias: supprimer par numéro de patient
  static async deletePatientByNumber(patientNumber) {
    return this._authenticatedRequest('DELETE', apiUrl.deletePatient(patientNumber));
  }

  static async getPatientMedicalHistory(patientId, filters = {}) {
    let url = apiUrl.patientMedicalHistory(patientId);
    
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this._authenticatedRequest('GET', url);
  }

  // ========== ANTECEDENTS (new endpoints) ==========

  static async createAntecedent(data) {
    const normalizedData = {
      patientId: data.patientId || data.patient_id || '',
      type: data.type || 'Médical', // Médical, Chirurgical, Familial, etc.
      description: data.description || '',
      diagnosedDate: data.diagnosedDate || data.diagnosed_date || data.date || '',
      notes: data.notes || '',
      isActive: data.isActive !== undefined ? data.isActive : true
    };
    
    return this._authenticatedRequest('POST', apiUrl.antecedents, normalizedData);
  }

  static async getAntecedents(filters = {}) {
    let url = apiUrl.antecedents;
    const params = new URLSearchParams();
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.type) params.append('type', filters.type);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this._authenticatedRequest('GET', url);
  }

  static async getAntecedentById(antecedentId) {
    return this._authenticatedRequest('GET', apiUrl.antecedentById(antecedentId));
  }

  static async updateAntecedent(antecedentId, data) {
    const normalizedData = {
      type: data.type || 'Médical',
      description: data.description || '',
      diagnosedDate: data.diagnosedDate || data.diagnosed_date || data.date || '',
      notes: data.notes || '',
      isActive: data.isActive !== undefined ? data.isActive : true
    };
    
    return this._authenticatedRequest('PUT', apiUrl.updateAntecedent(antecedentId), normalizedData);
  }

  static async deleteAntecedent(antecedentId) {
    return this._authenticatedRequest('DELETE', apiUrl.deleteAntecedent(antecedentId));
  }

  static async getAntecedentsPaginated(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.type) params.append('type', filters.type);
    const url = `${apiUrl.antecedentsPaginated}?${params.toString()}`;
    
    return this._authenticatedRequest('GET', url);
  }

  static async getPatientAntecedents(patientId) {
    return this._authenticatedRequest('GET', apiUrl.patientAntecedents(patientId));
  }

  // Deprecated (backward compatibility)
  static async addPatientAntecedent(patientId, data) {
    return this.createAntecedent({ ...data, patientId });
  }

  static async deletePatientAntecedent(antecedentId) {
    return this.deleteAntecedent(antecedentId);
  }

  // ========== ALLERGIES (new endpoints) ==========

  static async createAllergy(data) {
    // Normaliser les données pour l'API
    const normalizedData = {
      patientId: data.patientId || data.patient_id || '',
      allergen: data.allergen || '',
      type: data.type || 'Aliment', // Aliment, Médicament, Environnement, etc.
      severity: data.severity || 'Modérée', // Légère, Modérée, Sévère
      reaction: data.reaction || data.reactions || '',
      discoveredDate: data.discoveredDate || data.discovered_date || '',
      isActive: data.isActive !== undefined ? data.isActive : true
    };
    
    return this._authenticatedRequest('POST', apiUrl.allergies, normalizedData);
  }

  static async getAllergies(filters = {}) {
    let url = apiUrl.allergies;
    const params = new URLSearchParams();
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.type) params.append('type', filters.type);
    if (filters.severity) params.append('severity', filters.severity);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this._authenticatedRequest('GET', url);
  }

  static async getAllergyById(allergyId) {
    return this._authenticatedRequest('GET', apiUrl.allergyById(allergyId));
  }

  static async updateAllergy(allergyId, data) {
    const normalizedData = {
      allergen: data.allergen || '',
      type: data.type || 'Aliment',
      severity: data.severity || 'Modérée',
      reaction: data.reaction || data.reactions || '',
      discoveredDate: data.discoveredDate || data.discovered_date || '',
      isActive: data.isActive !== undefined ? data.isActive : true
    };
    
    return this._authenticatedRequest('PUT', apiUrl.updateAllergy(allergyId), normalizedData);
  }

  static async deleteAllergy(allergyId) {
    return this._authenticatedRequest('DELETE', apiUrl.deleteAllergy(allergyId));
  }

  static async getAllergiesPaginated(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.type) params.append('type', filters.type);
    if (filters.severity) params.append('severity', filters.severity);
    const url = `${apiUrl.allergiesPaginated}?${params.toString()}`;
    
    return this._authenticatedRequest('GET', url);
  }

  static async getPatientAllergies(patientId) {
    return this._authenticatedRequest('GET', apiUrl.patientAllergies(patientId));
  }

  // Deprecated (backward compatibility)
  static async addPatientAllergy(patientId, data) {
    // Wrapper vers createAllergy avec patientId
    return this.createAllergy({ ...data, patientId });
  }

  static async deletePatientAllergy(allergyId) {
    return this.deleteAllergy(allergyId);
  }

  static async getPatientDocuments(patientId) {
    return this._authenticatedRequest('GET', apiUrl.patientDocuments(patientId));
  }

  static async uploadPatientDocument(patientId, file, title, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('type', type);
    
    return this._authenticatedRequest('POST', apiUrl.uploadPatientDocument(patientId), formData);
  }

  static async downloadPatientDocument(documentId) {
    return this._authenticatedRequest('GET', apiUrl.patientDocuments(documentId));
  }

  static async deletePatientDocument(documentId) {
    return this._authenticatedRequest('DELETE', apiUrl.deletePatientDocument(documentId));
  }

  static async getPatientConsultations(patientId) {
    return this._authenticatedRequest('GET', apiUrl.patientConsultations(patientId));
  }

  static async getAppointments(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));
    let appointments = this._generateFakeAppointments(30);

    if (filters.status) {
      appointments = appointments.filter(a => a.status === filters.status);
    }

    if (filters.date) {
      appointments = appointments.filter(a => a.date?.startsWith(filters.date));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      appointments = appointments.filter(a =>
        (a.patient?.firstName || '').toLowerCase().includes(searchLower) ||
        (a.doctor?.name || '').toLowerCase().includes(searchLower)
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      success: true,
      data: {
        appointments: appointments.slice(start, end),
        total: appointments.length,
        page,
        limit,
      },
      message: 'Rendez-vous récupérés avec succès',
      errors: []
    };
  }

  static async updateAppointmentStatus(appointmentId, status) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: { id: appointmentId, status },
      message: 'Statut du rendez-vous mis à jour avec succès',
      errors: []
    };
  }

  static async getPatientQueue(filters = {}) {
    let url = apiUrl.patientQueue;
    
    const params = new URLSearchParams();
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this._authenticatedRequest('GET', url);
  }

  static async updatePatientTriage(patientId, data) {
    return this._authenticatedRequest('PATCH', apiUrl.updatePatientTriage(patientId), data);
  }

  static async removeFromQueue(patientId) {
    return this._authenticatedRequest('DELETE', apiUrl.removeFromQueue(patientId));
  }

  // ========== FAKE DATA GENERATORS FOR PATIENTS ==========

  static _calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  }

  static _generateFakePatients(count = 20) {
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Paul', 'Julie', 'Marc', 'Anne', 'Luc', 'Catherine'];
    const lastNames = ['Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy'];
    const cities = ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo'];
    
    return Array.from({ length: count }, (_, i) => {
      const gender = i % 2 === 0 ? 'M' : 'F';
      const birthYear = 1950 + Math.floor(Math.random() * 60);
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const dateOfBirth = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
      
      return {
        id: (i + 1).toString(),
        patientId: `PAT${String(i + 1).padStart(6, '0')}`,
        firstName: firstNames[i % firstNames.length],
        firstname: firstNames[i % firstNames.length],
        lastName: lastNames[i % lastNames.length],
        lastname: lastNames[i % lastNames.length],
        dateOfBirth,
        gender,
        phone: `+225 07 ${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        email: `patient${i + 1}@example.com`,
        address: `${Math.floor(Math.random() * 100)} Rue de la Santé`,
        city: cities[i % cities.length],
        profession: ['Médecin', 'Enseignant', 'Commerçant', 'Ingénieur', 'Employé'][i % 5],
        emergencyContact: {
          name: `Contact ${i + 1}`,
          phone: `+225 07 ${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          relationship: ['Conjoint', 'Parent', 'Enfant', 'Ami'][i % 4],
        },
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
  }

  static _generateFakeMedicalHistory(count = 20) {
    const types = ['consultation', 'examen', 'hospitalisation', 'chirurgie', 'traitement'];
    const doctors = ['Dr. Martin', 'Dr. Dubois', 'Dr. Durand', 'Dr. Moreau', 'Dr. Bernard'];
    const descriptions = [
      'Consultation de routine',
      'Examen médical général',
      'Suivi post-opératoire',
      'Consultation spécialisée',
      'Bilan de santé',
    ];
    const diagnoses = [
      'Hypertension artérielle',
      'Diabète de type 2',
      'Infection respiratoire',
      'Migraine',
      'Rhumatisme',
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      patientId: String(Math.floor(Math.random() * 50) + 1),
      type: types[i % types.length],
      description: descriptions[i % descriptions.length],
      title: descriptions[i % descriptions.length],
      diagnosis: diagnoses[i % diagnoses.length],
      diagnostic: diagnoses[i % diagnoses.length],
      doctor: { name: doctors[i % doctors.length] },
      medecin: doctors[i % doctors.length],
      date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  static _generateFakeAntecedents(count = 5) {
    const types = ['medical', 'chirurgical', 'familial'];
    const descriptions = [
      'Hypertension artérielle diagnostiquée en 2010',
      'Appendicectomie en 2005',
      'Antécédents familiaux de diabète',
      'Chirurgie cardiaque en 2015',
      'Antécédents familiaux d\'asthme',
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      type: types[i % types.length],
      description: descriptions[i % descriptions.length],
      date: new Date(Date.now() - i * 365 * 24 * 60 * 60 * 1000).toISOString(),
      severity: ['mild', 'moderate', 'severe'][i % 3],
      createdAt: new Date(Date.now() - i * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  static _generateFakeAllergies(count = 3) {
    const allergens = ['Pénicilline', 'Latex', 'Aspirine', 'Iode', 'Nuts'];
    const reactions = ['Urticaire', 'Difficultés respiratoires', 'Œdème', 'Rash cutané'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      allergen: allergens[i % allergens.length],
      reaction: reactions[i % reactions.length],
      severity: ['mild', 'moderate', 'severe'][i % 3],
      date: new Date(Date.now() - i * 180 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - i * 180 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  static _generateFakeDocuments(count = 10) {
    const types = ['prescription', 'ordonnance', 'rapport', 'certificat', 'radiologie', 'laboratoire', 'other'];
    const titles = [
      'Rapport médical',
      'Prescription du Dr. Martin',
      'Résultats de laboratoire',
      'Radiographie thorax',
      'Certificat médical',
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      title: titles[i % titles.length],
      name: titles[i % titles.length],
      type: types[i % types.length],
      size: Math.floor(Math.random() * 5000000) + 100000,
      uploadedAt: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
      url: '#',
    }));
  }

  static _generateFakeConsultations(count = 15) {
    const doctors = ['Dr. Martin', 'Dr. Dubois', 'Dr. Durand', 'Dr. Moreau'];
    const reasons = ['Consultation de routine', 'Suivi médical', 'Problème de santé', 'Bilan annuel'];
    const diagnoses = ['État normal', 'Prescription de médicaments', 'Examen complémentaire nécessaire', 'Suivi recommandé'];
    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      patientId: String(Math.floor(Math.random() * 50) + 1),
      date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      doctor: { name: doctors[i % doctors.length] },
      medecin: doctors[i % doctors.length],
      reason: reasons[i % reasons.length],
      motif: reasons[i % reasons.length],
      diagnosis: diagnoses[i % diagnoses.length],
      diagnostic: diagnoses[i % diagnoses.length],
      status: statuses[i % statuses.length],
      notes: 'Notes de consultation',
      prescription: i % 2 === 0 ? 'Prescription médicale' : null,
    }));
  }

  static _generateFakeAppointments(count = 30) {
    const doctors = ['Dr. Martin', 'Dr. Dubois', 'Dr. Durand', 'Dr. Moreau', 'Dr. Bernard'];
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Paul'];
    const lastNames = ['Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas'];
    const reasons = ['Consultation', 'Examen', 'Suivi', 'Bilan'];
    const statuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    
    return Array.from({ length: count }, (_, i) => {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + (i % 14) - 7);
      appointmentDate.setHours(9 + (i % 8), (i % 2) * 30, 0, 0);
      
      return {
        id: (i + 1).toString(),
        patientId: String(Math.floor(Math.random() * 50) + 1),
        date: appointmentDate.toISOString(),
        dateTime: appointmentDate.toISOString(),
        patient: {
          id: String(Math.floor(Math.random() * 50) + 1),
          firstName: firstNames[i % firstNames.length],
          lastName: lastNames[i % lastNames.length],
        },
        patientName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
        doctor: { name: doctors[i % doctors.length] },
        doctorName: doctors[i % doctors.length],
        reason: reasons[i % reasons.length],
        motif: reasons[i % reasons.length],
        status: statuses[i % statuses.length],
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      };
    });
  }

  static _generateFakeQueue(count = 15) {
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Paul'];
    const lastNames = ['Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas'];
    const priorities = ['urgent', 'high', 'medium', 'low'];
    const symptoms = [
      'Douleur thoracique',
      'Fièvre élevée',
      'Difficultés respiratoires',
      'Maux de tête',
      'Nausées',
    ];
    
    return Array.from({ length: count }, (_, i) => {
      const arrivalTime = new Date();
      arrivalTime.setMinutes(arrivalTime.getMinutes() - (i * 15 + Math.floor(Math.random() * 30)));
      
      return {
        id: (i + 1).toString(),
        patientId: String(Math.floor(Math.random() * 50) + 1),
        patient: {
          id: String(Math.floor(Math.random() * 50) + 1),
          firstName: firstNames[i % firstNames.length],
          lastName: lastNames[i % lastNames.length],
        },
        patientName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
        priority: priorities[i % priorities.length],
        symptoms: symptoms[i % symptoms.length],
        arrivalTime: arrivalTime.toISOString(),
        createdAt: arrivalTime.toISOString(),
        triageNotes: i % 3 === 0 ? 'Notes de triage importantes' : null,
      };
    });
  }

  // ========== FAKE DATA GENERATORS FOR NEW MODULES ==========
  static _generateFakeActivityLogs(count = 25) {
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'];
    const modules = ['users', 'clients', 'factures', 'settings', 'roles'];
    const users = ['Admin User', 'Commercial User', 'Comptable User'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      action: actions[i % actions.length],
      module: modules[i % modules.length],
      description: `Action ${actions[i % actions.length]} dans ${modules[i % modules.length]}`,
      userId: (i % 3 + 1).toString(),
      user: {
        id: (i % 3 + 1).toString(),
        firstname: users[i % users.length].split(' ')[0],
        lastname: users[i % users.length].split(' ')[1],
        email: `user${i % 3 + 1}@example.com`,
      },
      ipAddress: `192.168.1.${i % 255}`,
      createdAt: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
      timestamp: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
    }));
  }

  static _generateFakeBackups(count = 5) {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      name: i === 0 ? 'Sauvegarde automatique quotidienne' : `Sauvegarde manuelle ${i}`,
      description: i === 0 ? 'Sauvegarde automatique' : `Sauvegarde créée manuellement`,
      type: i === 0 ? 'auto' : 'manual',
      size: Math.floor(Math.random() * 100000000) + 50000000,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  static _generateFakeServices(count = 24) {
    const servicesData = [
      {
        id: '1',
        name: 'Consultation générale',
        description: 'Consultation médicale générale pour le diagnostic et le traitement de diverses affections courantes.',
        imageUrl: '/assets/images/services/consultation-generale.jpg',
        isActive: true,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      },
      {
        id: '2',
        name: 'Consultation pédiatrique',
        description: 'Consultation spécialisée pour les enfants et adolescents avec suivi de croissance et vaccination.',
        imageUrl: '/assets/images/services/consultation-pediatrie.jpg',
        isActive: true,
        createdAt: '2024-01-16T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
      },
      {
        id: '3',
        name: 'Consultation gynécologique',
        description: 'Consultation spécialisée en gynécologie et suivi de la santé reproductive des femmes.',
        imageUrl: '/assets/images/services/consultation-gynecologie.jpg',
        isActive: true,
        createdAt: '2024-01-17T10:00:00.000Z',
        updatedAt: '2024-01-17T10:00:00.000Z',
      },
      {
        id: '4',
        name: 'Consultation cardiologique',
        description: 'Consultation spécialisée en cardiologie pour le diagnostic et le suivi des maladies cardiaques.',
        imageUrl: '/assets/images/services/consultation-cardio.jpg',
        isActive: true,
        createdAt: '2024-01-18T10:00:00.000Z',
        updatedAt: '2024-01-18T10:00:00.000Z',
      },
      {
        id: '5',
        name: 'Consultation dermatologique',
        description: 'Consultation spécialisée en dermatologie pour le traitement des affections cutanées.',
        imageUrl: '/assets/images/services/consultation-dermatologie.jpg',
        isActive: true,
        createdAt: '2024-01-19T10:00:00.000Z',
        updatedAt: '2024-01-19T10:00:00.000Z',
      },
      {
        id: '6',
        name: 'Soins infirmiers',
        description: 'Services de soins infirmiers à domicile et en clinique pour les patients nécessitant des soins continus.',
        imageUrl: '/assets/images/services/soins-infirmiers.jpg',
        isActive: true,
        createdAt: '2024-01-20T10:00:00.000Z',
        updatedAt: '2024-01-20T10:00:00.000Z',
      },
      {
        id: '7',
        name: 'Analyses médicales',
        description: 'Service de laboratoire d\'analyses médicales (sang, urines, tests de dépistage, etc.).',
        imageUrl: '/assets/images/services/analyses-medicales.jpg',
        isActive: true,
        createdAt: '2024-01-21T10:00:00.000Z',
        updatedAt: '2024-01-21T10:00:00.000Z',
      },
      {
        id: '8',
        name: 'Radiologie',
        description: 'Services d\'imagerie médicale : radiographies, échographies, scanners et IRM.',
        imageUrl: '/assets/images/services/radiologie.jpg',
        isActive: true,
        createdAt: '2024-01-22T10:00:00.000Z',
        updatedAt: '2024-01-22T10:00:00.000Z',
      },
      {
        id: '9',
        name: 'Pharmacie',
        description: 'Pharmacie intégrée pour la dispensation de médicaments et conseils pharmaceutiques.',
        imageUrl: '/assets/images/services/pharmacie.jpg',
        isActive: true,
        createdAt: '2024-01-23T10:00:00.000Z',
        updatedAt: '2024-01-23T10:00:00.000Z',
      },
      {
        id: '10',
        name: 'Vaccination',
        description: 'Service de vaccination pour enfants et adultes avec suivi des calendriers vaccinaux.',
        imageUrl: '/assets/images/services/vaccination.jpg',
        isActive: true,
        createdAt: '2024-01-24T10:00:00.000Z',
        updatedAt: '2024-01-24T10:00:00.000Z',
      },
      {
        id: '11',
        name: 'Urgences',
        description: 'Service d\'urgence 24/7 pour les cas nécessitant une intervention médicale immédiate.',
        imageUrl: '/assets/images/services/urgences.jpg',
        isActive: true,
        createdAt: '2024-01-25T10:00:00.000Z',
        updatedAt: '2024-01-25T10:00:00.000Z',
      },
      {
        id: '12',
        name: 'Chirurgie ambulatoire',
        description: 'Service de chirurgie ambulatoire pour interventions mineures ne nécessitant pas d\'hospitalisation.',
        imageUrl: '/assets/images/services/chirurgie-ambulatoire.jpg',
        isActive: true,
        createdAt: '2024-01-26T10:00:00.000Z',
        updatedAt: '2024-01-26T10:00:00.000Z',
      },
      {
        id: '13',
        name: 'Physiothérapie',
        description: 'Service de rééducation et physiothérapie pour la récupération fonctionnelle et la réadaptation.',
        imageUrl: '/assets/images/services/physiotherapie.jpg',
        isActive: true,
        createdAt: '2024-01-27T10:00:00.000Z',
        updatedAt: '2024-01-27T10:00:00.000Z',
      },
      {
        id: '14',
        name: 'Consultation ophtalmologique',
        description: 'Consultation spécialisée en ophtalmologie pour le diagnostic et le traitement des troubles visuels.',
        imageUrl: '/assets/images/services/consultation-ophtalmo.jpg',
        isActive: true,
        createdAt: '2024-01-28T10:00:00.000Z',
        updatedAt: '2024-01-28T10:00:00.000Z',
      },
      {
        id: '15',
        name: 'Consultation ORL',
        description: 'Consultation spécialisée en oto-rhino-laryngologie pour les troubles de l\'oreille, du nez et de la gorge.',
        imageUrl: '/assets/images/services/consultation-orl.jpg',
        isActive: true,
        createdAt: '2024-01-29T10:00:00.000Z',
        updatedAt: '2024-01-29T10:00:00.000Z',
      },
      {
        id: '16',
        name: 'Nutrition et diététique',
        description: 'Consultation en nutrition et diététique pour le suivi alimentaire et les régimes thérapeutiques.',
        imageUrl: '/assets/images/services/nutrition.jpg',
        isActive: true,
        createdAt: '2024-01-30T10:00:00.000Z',
        updatedAt: '2024-01-30T10:00:00.000Z',
      },
      {
        id: '17',
        name: 'Consultation neurologique',
        description: 'Consultation spécialisée en neurologie pour le diagnostic et le traitement des troubles neurologiques.',
        imageUrl: '/assets/images/services/consultation-neuro.jpg',
        isActive: true,
        createdAt: '2024-02-01T10:00:00.000Z',
        updatedAt: '2024-02-01T10:00:00.000Z',
      },
      {
        id: '18',
        name: 'Consultation urologique',
        description: 'Consultation spécialisée en urologie pour le traitement des affections de l\'appareil urinaire.',
        imageUrl: '/assets/images/services/consultation-urologie.jpg',
        isActive: true,
        createdAt: '2024-02-02T10:00:00.000Z',
        updatedAt: '2024-02-02T10:00:00.000Z',
      },
      {
        id: '19',
        name: 'Médecine préventive',
        description: 'Services de médecine préventive : bilans de santé, dépistages et examens de routine.',
        imageUrl: '/assets/images/services/medecine-preventive.jpg',
        isActive: true,
        createdAt: '2024-02-03T10:00:00.000Z',
        updatedAt: '2024-02-03T10:00:00.000Z',
      },
      {
        id: '20',
        name: 'Suivi de grossesse',
        description: 'Suivi prénatal complet avec consultations régulières et échographies pour les femmes enceintes.',
        imageUrl: '/assets/images/services/suivi-grossesse.jpg',
        isActive: true,
        createdAt: '2024-02-04T10:00:00.000Z',
        updatedAt: '2024-02-04T10:00:00.000Z',
      },
      {
        id: '21',
        name: 'Consultation psychologique',
        description: 'Services de consultation psychologique et soutien mental pour les patients nécessitant un accompagnement psychologique.',
        imageUrl: '/assets/images/services/consultation-psycho.jpg',
        isActive: false,
        createdAt: '2024-02-05T10:00:00.000Z',
        updatedAt: '2024-02-05T10:00:00.000Z',
      },
      {
        id: '22',
        name: 'Électrocardiogramme (ECG)',
        description: 'Service d\'électrocardiogramme pour l\'évaluation de l\'activité cardiaque et le dépistage de problèmes cardiaques.',
        imageUrl: '/assets/images/services/ecg.jpg',
        isActive: true,
        createdAt: '2024-02-06T10:00:00.000Z',
        updatedAt: '2024-02-06T10:00:00.000Z',
      },
      {
        id: '23',
        name: 'Pansements et soins de plaies',
        description: 'Service de soins de plaies et pansements pour le traitement des blessures et la cicatrisation.',
        imageUrl: '/assets/images/services/pansements.jpg',
        isActive: true,
        createdAt: '2024-02-07T10:00:00.000Z',
        updatedAt: '2024-02-07T10:00:00.000Z',
      },
      {
        id: '24',
        name: 'Consultation orthopédique',
        description: 'Consultation spécialisée en orthopédie pour le traitement des troubles musculo-squelettiques.',
        imageUrl: '/assets/images/services/consultation-orthopedie.jpg',
        isActive: true,
        createdAt: '2024-02-08T10:00:00.000Z',
        updatedAt: '2024-02-08T10:00:00.000Z',
      },
    ];

    return servicesData.slice(0, count);
  }

  static _generateFakeRolesPermissionsMatrix() {
    // Toutes les fonctionnalités disponibles dans l'application
    const allFunctionalities = [
      // Administration
      'Gestion des utilisateurs',
      'Gestion des rôles et permissions',
      'Configuration globale',
      'Rapports et statistiques',
      'Journal d\'activité',
      'Sauvegarde et restauration',
      'Gestion multi-cliniques',
      'Actions critiques',
      
      // Patients
      'Consultation des dossiers patients',
      'Création de dossiers patients',
      'Modification de dossiers patients',
      'Suppression de dossiers patients',
      'Gestion des antécédents',
      'Gestion des allergies',
      'Historique médical',
      'Gestion des documents',
      'Gestion des consultations',
      'Gestion des rendez-vous',
      'Gestion de la file d\'attente',
      
      // Médecins
      'Consultation des dossiers',
      'Création de consultations',
      'Diagnostic',
      'Prescriptions (examens)',
      'Prescriptions (médicaments)',
      'Ordonnances imprimables',
      'Demandes d\'hospitalisation',
      'Certificats médicaux',
      'Messagerie interne',
      
      // Infirmiers
      'Planning de soins',
      'Administration des traitements',
      'Suivi des signes vitaux',
      'Notes infirmières',
      'Validation des soins',
      'Alertes et urgences',
      
      // Aides-soignantes
      'Tâches assignées',
      'Soins de base',
      'Assistance aux infirmiers',
      'Notes et observations',
      'Historique des interventions',
      
      // Laboratoire
      'Réception des prescriptions',
      'Gestion des analyses',
      'Saisie et validation des résultats',
      'Transmission automatique',
      'Impression des résultats',
      'Gestion des consommables',
      'Statistiques laboratoire',
      
      // Pharmacie
      'Gestion des stocks',
      'Entrées / sorties',
      'Alertes de rupture et péremption',
      'Dispensation des médicaments',
      'Tarification',
      'Gestion fournisseurs',
      'Inventaire',
      
      // Caisse / Facturation
      'Création des factures',
      'Facturation par service',
      'Paiements (espèces)',
      'Paiements (mobile money)',
      'Paiements (carte)',
      'Tickets et reçus',
      'Gestion des impayés',
      'Clôture journalière',
      'Historique des transactions',
      
      // Gestionnaire / Direction
      'Tableau de bord global',
      'Statistiques médicales',
      'Statistiques financières',
      'Suivi des performances',
      'Rapports périodiques',
      'Suivi des stocks',
      'Audit et contrôle interne',
      
      // Rendez-vous & Planning
      'Prise de rendez-vous',
      'Gestion des rendez-vous',
      'Agenda médecins',
      'Agenda infirmiers',
      'Notifications rendez-vous',
      'Gestion des urgences',
      
      // Notifications & Communication
      'Notifications internes',
      'Alertes médicales',
      'Rappels patients',
      'Messagerie interne',
      'Historique des échanges',
      
      // Documents & Impressions
      'Impression ordonnances',
      'Impression résultats d\'analyses',
      'Impression factures',
      'Impression certificats médicaux',
      'Impression rapports',
      'Export PDF',
      'Export Excel',
      
      // Sécurité & Conformité
      'Authentification sécurisée',
      'Gestion des accès par rôle',
      'Chiffrement des données',
      'Traçabilité des accès',
      'Conformité réglementaire',
      
      // Technique
      'API REST / GraphQL',
      'Application web',
      'Application mobile',
      'Sauvegardes automatiques',
      'Multilingue',
      'Intégration SMS',
      'Intégration paiements',
    ];

    // Définition des permissions par rôle
    const rolePermissions = {
      DIRECTEUR: {
        level: 10,
        permissions: allFunctionalities, // Accès total
      },
      ADMINISTRATEUR: {
        level: 9,
        permissions: allFunctionalities.filter(f => !f.includes('Actions critiques')),
      },
      RH: {
        level: 7,
        permissions: [
          'Gestion des utilisateurs',
          'Gestion des rôles et permissions',
          'Rapports et statistiques',
          'Journal d\'activité',
        ],
      },
      COMPTABLE: {
        level: 6,
        permissions: [
          'Création des factures',
          'Facturation par service',
          'Paiements (espèces)',
          'Paiements (mobile money)',
          'Paiements (carte)',
          'Tickets et reçus',
          'Gestion des impayés',
          'Clôture journalière',
          'Historique des transactions',
          'Statistiques financières',
          'Rapports périodiques',
          'Export PDF',
          'Export Excel',
        ],
      },
      ACHAT: {
        level: 5,
        permissions: [
          'Gestion des stocks',
          'Entrées / sorties',
          'Alertes de rupture et péremption',
          'Gestion fournisseurs',
          'Inventaire',
          'Suivi des stocks',
        ],
      },
      ASSURANCE: {
        level: 5,
        permissions: [
          'Consultation des dossiers patients',
          'Gestion des factures',
          'Gestion des paiements',
          'Rapports périodiques',
          'Export PDF',
          'Export Excel',
        ],
      },
      LABORANTIN: {
        level: 4,
        permissions: [
          'Réception des prescriptions',
          'Gestion des analyses',
          'Saisie et validation des résultats',
          'Transmission automatique',
          'Impression des résultats',
          'Gestion des consommables',
          'Statistiques laboratoire',
        ],
      },
      MEDECIN: {
        level: 8,
        permissions: [
          'Consultation des dossiers',
          'Création de consultations',
          'Diagnostic',
          'Prescriptions (examens)',
          'Prescriptions (médicaments)',
          'Ordonnances imprimables',
          'Demandes d\'hospitalisation',
          'Certificats médicaux',
          'Messagerie interne',
          'Prise de rendez-vous',
          'Gestion des rendez-vous',
          'Agenda médecins',
          'Notifications rendez-vous',
          'Alertes médicales',
        ],
      },
      INFIRMIER: {
        level: 5,
        permissions: [
          'Consultation des dossiers patients',
          'Planning de soins',
          'Administration des traitements',
          'Suivi des signes vitaux',
          'Notes infirmières',
          'Validation des soins',
          'Alertes et urgences',
          'Agenda infirmiers',
          'Notifications rendez-vous',
          'Alertes médicales',
        ],
      },
      AIDE_SOIGNANT: {
        level: 3,
        permissions: [
          'Tâches assignées',
          'Soins de base',
          'Assistance aux infirmiers',
          'Notes et observations',
          'Historique des interventions',
        ],
      },
    };

    // Hiérarchie des rôles (qui peut gérer qui)
    const hierarchy = {
      DIRECTEUR: ['ADMINISTRATEUR', 'RH', 'COMPTABLE', 'ACHAT', 'ASSURANCE', 'LABORANTIN', 'MEDECIN', 'INFIRMIER', 'AIDE_SOIGNANT'],
      ADMINISTRATEUR: ['RH', 'COMPTABLE', 'ACHAT', 'ASSURANCE', 'LABORANTIN', 'MEDECIN', 'INFIRMIER', 'AIDE_SOIGNANT'],
      RH: ['MEDECIN', 'INFIRMIER', 'AIDE_SOIGNANT'],
      MEDECIN: ['INFIRMIER', 'AIDE_SOIGNANT'],
      INFIRMIER: ['AIDE_SOIGNANT'],
    };

    return {
      matrix: rolePermissions,
      hierarchy,
      allFunctionalities,
    };
  }

  static _generateFakeClinics(count = 3) {
    const names = ['Clinique Principale', 'Clinique Sud', 'Clinique Nord'];
    const cities = ['Abidjan', 'Yamoussoukro', 'Bouaké'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      name: names[i] || `Clinique ${i + 1}`,
      address: `${i + 1}23 Rue de la Santé`,
      city: cities[i] || 'Abidjan',
      country: 'CI',
      phone: `+225 07 ${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      email: `clinique${i + 1}@example.com`,
      license: `LIC-${String(i + 1).padStart(3, '0')}`,
      status: i === 0 ? 'active' : ['active', 'inactive'][i % 2],
      settings: {
        timezone: 'Africa/Abidjan',
        language: 'fr',
        currency: 'XOF',
      },
      createdAt: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
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

// ========== MAPPING DES CHAMPS ==========

// Mapper les champs patient API → Frontend
ConsumApi.prototype._mapPatientFields = function(patient) {
  if (!patient) return patient;
  
  // Normaliser le genre (MALE/FEMALE → M/F ou vice versa)
  const normalizeGender = (gender) => {
    if (!gender) return '';
    if (gender === 'MALE' || gender === 'M') return 'M';
    if (gender === 'FEMALE' || gender === 'F') return 'F';
    return gender;
  };
  
  // Reconstruire l'objet contact d'urgence depuis les champs plats
  const emergencyContact = patient.emergencyContact || {
    name: patient.emergencyContactName || '',
    phone: patient.emergencyContactPhone || '',
    relationship: patient.emergencyContactRelationship || ''
  };
  
  // Reconstruire l'objet assurance
  const insurance = patient.insurance || {
    type: patient.insuranceType || 'NONE',
    company: patient.insuranceCompany || '',
    number: patient.insuranceNumber || '',
    validUntil: patient.insuranceValidUntil || ''
  };
  
  return {
    // Identifiants
    id: patient.id || patient._id || patient.uuid || patient.patientNumber,
    patientId: patient.patientNumber || patient.patientId || patient.id,
    patientNumber: patient.patientNumber || '',
    
    // Identité
    firstName: patient.firstName || patient.first_name || patient.prenom || '',
    firstname: patient.firstName || patient.first_name || patient.prenom || '',
    lastName: patient.lastName || patient.last_name || patient.nom || '',
    lastname: patient.lastName || patient.last_name || patient.nom || '',
    
    // Informations personnelles
    dateOfBirth: patient.dateOfBirth || patient.date_of_birth || patient.dateNaissance || '',
    placeOfBirth: patient.placeOfBirth || patient.place_of_birth || patient.lieuNaissance || '',
    nationality: patient.nationality || patient.nationalité || '',
    gender: normalizeGender(patient.gender || patient.sexe || ''),
    maritalStatus: patient.maritalStatus || patient.marital_status || patient.etatCivil || '',
    
    // Contact
    phone: patient.phone || patient.telephone || '',
    email: patient.email || '',
    address: patient.address || patient.adresse || '',
    city: patient.city || patient.ville || '',
    country: patient.country || patient.pays || '',
    
    // Informations médicales
    bloodGroup: patient.bloodGroup || patient.blood_group || patient.groupeSanguin || '',
    height: patient.height || patient.taille || null,
    weight: patient.weight || patient.poids || null,
    
    // Profession
    profession: patient.occupation || patient.profession || patient.metier || '',
    occupation: patient.occupation || patient.profession || '',
    
    // Contact d'urgence
    emergencyContact,
    emergencyContactName: patient.emergencyContactName || emergencyContact.name || '',
    emergencyContactPhone: patient.emergencyContactPhone || emergencyContact.phone || '',
    emergencyContactRelationship: patient.emergencyContactRelationship || emergencyContact.relationship || '',
    
    // Assurance
    insurance,
    insuranceType: patient.insuranceType || insurance.type || 'NONE',
    insuranceCompany: patient.insuranceCompany || insurance.company || '',
    insuranceNumber: patient.insuranceNumber || insurance.number || '',
    insuranceValidUntil: patient.insuranceValidUntil || insurance.validUntil || '',
    
    // Statut et autres
    status: patient.status || 'ACTIVE',
    isActive: patient.isActive !== undefined ? patient.isActive : true,
    photo: patient.photo || '',
    notes: patient.notes || patient.remarques || '',
    
    // Dates
    createdAt: patient.createdAt || patient.created_at || new Date().toISOString(),
    updatedAt: patient.updatedAt || patient.updated_at || new Date().toISOString(),
    
    // Garder les champs supplémentaires
    ...patient
  };
};


// Convertir données Frontend (format affichage) → API (format stockage)
ConsumApi.prototype._normalizePatientForApi = function(patientData) {
  const normalizeGender = (gender) => {
    if (!gender) return 'MALE';
    if (gender === 'M') return 'MALE';
    if (gender === 'F') return 'FEMALE';
    return gender.toUpperCase();
  };
  
  return {
    patientNumber: patientData.patientNumber || patientData.patientId,
    firstName: patientData.firstName || patientData.firstname,
    lastName: patientData.lastName || patientData.lastname,
    dateOfBirth: patientData.dateOfBirth,
    placeOfBirth: patientData.placeOfBirth,
    nationality: patientData.nationality,
    gender: normalizeGender(patientData.gender),
    maritalStatus: patientData.maritalStatus,
    phone: patientData.phone,
    email: patientData.email,
    address: patientData.address,
    city: patientData.city,
    country: patientData.country,
    bloodGroup: patientData.bloodGroup,
    height: patientData.height ? parseInt(patientData.height) : null,
    weight: patientData.weight ? parseFloat(patientData.weight) : null,
    occupation: patientData.occupation || patientData.profession,
    emergencyContactName: patientData.emergencyContactName || patientData.emergencyContact?.name,
    emergencyContactPhone: patientData.emergencyContactPhone || patientData.emergencyContact?.phone,
    emergencyContactRelationship: patientData.emergencyContactRelationship || patientData.emergencyContact?.relationship,
    insuranceType: patientData.insuranceType || patientData.insurance?.type || 'NONE',
    insuranceCompany: patientData.insuranceCompany || patientData.insurance?.company,
    insuranceNumber: patientData.insuranceNumber || patientData.insurance?.number,
    insuranceValidUntil: patientData.insuranceValidUntil || patientData.insurance?.validUntil,
    status: patientData.status || 'ACTIVE',
    isActive: patientData.isActive !== undefined ? patientData.isActive : true,
    photo: patientData.photo,
    notes: patientData.notes
  };
};

// Mapper les champs antécédent API → Frontend
ConsumApi.prototype._mapAntecedentFields = function(antecedent) {
  if (!antecedent) return antecedent;
  
  return {
    id: antecedent.id || antecedent._id || antecedent.uuid,
    type: antecedent.type || 'medical',
    description: antecedent.description || '',
    date: antecedent.diagnosedDate || antecedent.date || antecedent.dateAntecedent || '',
    diagnosedDate: antecedent.diagnosedDate || antecedent.date || '',
    notes: antecedent.notes || antecedent.remarques || '',
    severity: antecedent.severity || 'moderate',
    isActive: antecedent.isActive !== undefined ? antecedent.isActive : true,
    patientId: antecedent.patientId || antecedent.patient_id || '',
    createdAt: antecedent.createdAt || antecedent.created_at || new Date().toISOString(),
    ...antecedent
  };
};

