import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { TabList, TabPanel, TabContext, LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Chip,
  Stack,
  Table,
  Alert,
  Paper,
  Button,
  Dialog,
  Select,
  Divider,
  Tooltip,
  MenuItem,
  TableRow,
  TextField,
  Container,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  TableContainer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const ROLE_COLORS = {
  DIRECTEUR: 'error',
  ADMINISTRATEUR: 'warning',
  RH: 'info',
  COMPTABLE: 'primary',
  ACHAT: 'secondary',
  ASSURANCE: 'success',
  LABORANTIN: 'default',
  MEDECIN: 'error',
  INFIRMIER: 'warning',
  AIDE_SOIGNANT: 'info',
};

const ROLE_LABELS = {
  DIRECTEUR: 'Directeur',
  ADMINISTRATEUR: 'Administrateur',
  RH: 'RH',
  COMPTABLE: 'Comptable',
  ACHAT: 'Achat',
  ASSURANCE: 'Assurance',
  LABORANTIN: 'Laborantin',
  MEDECIN: 'Médecin',
  INFIRMIER: 'Infirmier',
  AIDE_SOIGNANT: 'Aide-soignant',
};

export default function RolesPermissionsView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();
  
  const [currentTab, setCurrentTab] = useState('modules');
  const [loading, setLoading] = useState(false);

  // Modules de permissions
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Toutes les permissions
  const [allPermissions, setAllPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Permissions par module
  const [permissionsByModule, setPermissionsByModule] = useState({});

  // Rôles
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Rôles assignés aux modules
  const [moduleRoles, setModuleRoles] = useState({});

  // Liste des utilisateurs
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Dialogs
  const [createModuleDialog, setCreateModuleDialog] = useState({ open: false, name: '', description: '', statut: 'ACTIF' });
  const [createPermissionDialog, setCreatePermissionDialog] = useState({ open: false, moduleId: '', name: '', description: '' });
  const [assignRoleDialog, setAssignRoleDialog] = useState({ open: false, moduleId: '', roleId: '' });
  const [changeRoleDialog, setChangeRoleDialog] = useState({ open: false, user: null, newRole: '' });
  const [resetPasswordDialog, setResetPasswordDialog] = useState({ open: false, user: null, newPassword: '', confirmPassword: '' });
  const [disconnectDialog, setDisconnectDialog] = useState({ open: false, user: null });
  
  // Role management dialogs
  const [createRoleDialog, setCreateRoleDialog] = useState({ open: false, name: '' });
  const [editRoleDialog, setEditRoleDialog] = useState({ open: false, role: null, name: '' });
  const [deleteRoleDialog, setDeleteRoleDialog] = useState({ open: false, role: null });
  const [manageRolePermissionsDialog, setManageRolePermissionsDialog] = useState({ open: false, role: null });
  
  // Role permissions state
  const [rolePermissions, setRolePermissions] = useState(null);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);

  useEffect(() => {
    console.log('Tab changed to:', currentTab);
    if (currentTab === 'modules') {
      loadModules();
    } else if (currentTab === 'permissions') {
      console.log('Loading permissions for tab');
      loadAllPermissions();
    } else if (currentTab === 'roles') {
      loadRoles();
      loadModules();
    } else if (currentTab === 'users') {
      loadUsers();
      loadRoles();
    }
  }, [currentTab]);

  // Charger tous les modules
  const loadModules = useCallback(async () => {
    setLoadingModules(true);
    try {
      const result = await ConsumApi.getPermissionModules();
      console.log('Raw API result:', result); // Debug
      
      // Vérifier si result a déjà la structure attendue
      if (result && result.success === false) {
        console.error('API returned error:', result.message, result.errors);
        showError('Erreur', result.message || 'Impossible de charger les modules');
        setModules([]);
        return;
      }
      
      // Traiter la réponse directement si elle a déjà la structure attendue
      let processed = result;
      if (result && typeof result === 'object' && 'success' in result) {
        // Utiliser showApiResponse seulement si la structure est standard
        processed = showApiResponse(result, {
          successTitle: 'Modules chargés',
        errorTitle: 'Erreur de chargement',
          showNotification: false,
        });
      } else if (result && typeof result === 'object') {
        // Si pas de champ success, considérer comme succès si on a des données
        processed = {
          success: true,
          data: result.data || result,
          message: 'Opération réussie',
          errors: [],
        };
      }
      
      console.log('Processed result:', processed); // Debug
      console.log('Processed data:', processed.data); // Debug
      
      if (processed && (processed.success || processed.data)) {
        // La réponse peut être directement un tableau ou un objet avec data
        let modulesData = [];
        
        if (Array.isArray(processed.data)) {
          modulesData = processed.data;
        } else if (processed.data && typeof processed.data === 'object') {
          if (Array.isArray(processed.data.data)) {
            modulesData = processed.data.data;
          } else if (Array.isArray(processed.data.items)) {
            modulesData = processed.data.items;
          } else if (Array.isArray(processed.data.results)) {
            modulesData = processed.data.results;
          }
        }
        
        console.log('Modules data:', modulesData); // Debug
        
        setModules(modulesData);
      } else {
        console.error('Failed to load modules:', processed.message, processed.errors);
        showError('Erreur', processed.message || 'Impossible de charger les modules');
        setModules([]);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      console.error('Error details:', error.response?.data || error.message);
      showError('Erreur', error.message || 'Impossible de charger les modules');
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  }, []);

  // Charger les permissions d'un module (à la demande)
  const loadPermissionsForModule = useCallback(async (moduleId) => {
    try {
      // Essayer d'abord l'endpoint spécifique au module
      let result = await ConsumApi.getPermissionsByModule(moduleId);
      console.log(`Raw permissions result for module ${moduleId}:`, result); // Debug
      
      // Si l'endpoint spécifique ne fonctionne pas (404 ou erreur), utiliser toutes les permissions et filtrer
      if (result && result.success === false && (result.message?.includes('404') || result.message?.includes('Not Found'))) {
        console.log(`Endpoint spécifique non disponible, récupération de toutes les permissions et filtrage par module ${moduleId}`);
        result = await ConsumApi.getPermissions();
        console.log(`All permissions result:`, result); // Debug
        
        // Filtrer les permissions par module
        if (result && (result.success || result.data)) {
          let permissionsList = [];
          
          if (Array.isArray(result.data)) {
            permissionsList = result.data;
          } else if (result.data && typeof result.data === 'object') {
            if (Array.isArray(result.data.data)) {
              permissionsList = result.data.data;
            } else if (Array.isArray(result.data.items)) {
              permissionsList = result.data.items;
            } else if (Array.isArray(result.data.results)) {
              permissionsList = result.data.results;
            }
          }
          
          // Filtrer par module (le module peut être dans permission.module.id ou permission.module_uuid)
          const filteredPermissions = permissionsList.filter(permission => {
            const moduleIdMatch = permission.module?.id === moduleId || 
                                  permission.module_uuid === moduleId ||
                                  permission.moduleId === moduleId;
            return moduleIdMatch;
          });
          
          console.log(`Filtered permissions for module ${moduleId}:`, filteredPermissions); // Debug
          
          setPermissionsByModule(prev => ({
            ...prev,
            [moduleId]: filteredPermissions,
          }));
          return;
        }
      }
      
      // Traiter la réponse directement si elle a déjà la structure attendue
      let processed = result;
      if (result && typeof result === 'object' && 'success' in result) {
        processed = result;
      } else if (result && typeof result === 'object') {
        // Si pas de champ success, considérer comme succès si on a des données
        processed = {
          success: true,
          data: result.data || result,
          message: 'Opération réussie',
          errors: [],
        };
      }
      
      console.log(`Processed permissions result for module ${moduleId}:`, processed); // Debug
      
      if (processed && (processed.success || processed.data)) {
        // La réponse peut être directement un tableau ou un objet avec data
        let permissionsData = [];
        
        if (Array.isArray(processed.data)) {
          permissionsData = processed.data;
        } else if (processed.data && typeof processed.data === 'object') {
          if (Array.isArray(processed.data.data)) {
            permissionsData = processed.data.data;
          } else if (Array.isArray(processed.data.items)) {
            permissionsData = processed.data.items;
          } else if (Array.isArray(processed.data.results)) {
            permissionsData = processed.data.results;
          }
        }
        
        console.log(`Permissions data for module ${moduleId}:`, permissionsData); // Debug
        
        setPermissionsByModule(prev => ({
          ...prev,
          [moduleId]: permissionsData,
        }));
      } else {
        console.error(`Failed to load permissions for module ${moduleId}:`, processed?.message, processed?.errors);
        setPermissionsByModule(prev => ({
          ...prev,
          [moduleId]: [],
        }));
      }
    } catch (error) {
      console.error(`Error loading permissions for module ${moduleId}:`, error);
      console.error(`Error details:`, error.response?.data || error.message);
      
      // Si l'erreur est 404, essayer de récupérer toutes les permissions et filtrer
      if (error.response?.status === 404 || error.message?.includes('404') || error.message?.includes('Not Found')) {
        try {
          console.log(`404 error, trying to get all permissions and filter by module ${moduleId}`);
          const allPermissionsResult = await ConsumApi.getPermissions();
          console.log(`All permissions result (fallback):`, allPermissionsResult);
          
          if (allPermissionsResult && (allPermissionsResult.success || allPermissionsResult.data)) {
            let permissionsList = [];
            
            if (Array.isArray(allPermissionsResult.data)) {
              permissionsList = allPermissionsResult.data;
            } else if (allPermissionsResult.data && typeof allPermissionsResult.data === 'object') {
              if (Array.isArray(allPermissionsResult.data.data)) {
                permissionsList = allPermissionsResult.data.data;
              } else if (Array.isArray(allPermissionsResult.data.items)) {
                permissionsList = allPermissionsResult.data.items;
              } else if (Array.isArray(allPermissionsResult.data.results)) {
                permissionsList = allPermissionsResult.data.results;
              }
            }
            
            // Filtrer par module
            const filteredPermissions = permissionsList.filter(permission => {
              const moduleIdMatch = permission.module?.id === moduleId || 
                                    permission.module_uuid === moduleId ||
                                    permission.moduleId === moduleId;
              return moduleIdMatch;
            });
            
            console.log(`Filtered permissions for module ${moduleId} (fallback):`, filteredPermissions);
            
            setPermissionsByModule(prev => ({
              ...prev,
              [moduleId]: filteredPermissions,
            }));
            return;
          }
        } catch (fallbackError) {
          console.error(`Error in fallback loading permissions:`, fallbackError);
        }
      }
      
      // Initialiser avec un tableau vide en cas d'erreur
      setPermissionsByModule(prev => ({
        ...prev,
        [moduleId]: [],
      }));
    }
  }, []);

  // Charger les rôles assignés à un module (à la demande)
  const loadRolesForModule = useCallback(async (moduleId) => {
    try {
      const result = await ConsumApi.getModuleRoles(moduleId);
      if (result.success) {
        setModuleRoles(prev => ({
          ...prev,
          [moduleId]: Array.isArray(result.data) ? result.data : [],
        }));
      } else {
        // Si l'endpoint n'existe pas (404), initialiser avec un tableau vide
        setModuleRoles(prev => ({
          ...prev,
          [moduleId]: [],
        }));
      }
    } catch (error) {
      console.error(`Error loading roles for module ${moduleId}:`, error);
      // Initialiser avec un tableau vide en cas d'erreur
      setModuleRoles(prev => ({
        ...prev,
        [moduleId]: [],
      }));
    }
  }, []);

  // Charger les rôles
  const loadRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const result = await ConsumApi.getRoles();
      const processed = showApiResponse(result, {
        successTitle: 'Rôles chargés',
        errorTitle: 'Erreur de chargement',
        showNotification: false,
      });
      if (processed.success) {
        setRoles(Array.isArray(processed.data) ? processed.data : []);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      showError('Erreur', 'Impossible de charger les rôles');
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Charger toutes les permissions
  const loadAllPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      const result = await ConsumApi.getPermissions();
      console.log('=== LOAD PERMISSIONS DEBUG ===');
      console.log('Raw all permissions result:', result);
      console.log('Type of result:', typeof result);
      console.log('Is array?', Array.isArray(result));
      console.log('Has success?', result && 'success' in result);
      console.log('Has data?', result && 'data' in result);
      
      // Vérifier si result a déjà la structure attendue
      if (result && result.success === false) {
        console.error('API returned error:', result.message, result.errors);
        showError('Erreur', result.message || 'Impossible de charger les permissions');
        setAllPermissions([]);
        return;
      }
      
      // Si result est directement un tableau (cas où ApiClient retourne directement le tableau)
      if (Array.isArray(result)) {
        console.log('Result is directly an array, length:', result.length);
        setAllPermissions(result);
        return;
      }
      
      // Traiter la réponse directement si elle a déjà la structure attendue
      let processed = result;
      if (result && typeof result === 'object' && 'success' in result) {
        processed = result;
      } else if (result && typeof result === 'object') {
        // Si pas de champ success, considérer comme succès si on a des données
        processed = {
          success: true,
          data: result.data || result,
          message: 'Opération réussie',
          errors: [],
        };
      }
      
      console.log('Processed all permissions result:', processed);
      
      if (processed && (processed.success || processed.data)) {
        // La réponse peut être directement un tableau ou un objet avec data
        let permissionsData = [];
        
        // Si processed.data est directement un tableau
        if (Array.isArray(processed.data)) {
          permissionsData = processed.data;
        } 
        // Si processed.data est un objet, chercher un tableau dedans
        else if (processed.data && typeof processed.data === 'object') {
          if (Array.isArray(processed.data.data)) {
            permissionsData = processed.data.data;
          } else if (Array.isArray(processed.data.items)) {
            permissionsData = processed.data.items;
          } else if (Array.isArray(processed.data.results)) {
            permissionsData = processed.data.results;
          }
        }
        
        console.log('All permissions data:', permissionsData);
        console.log('Permissions count:', permissionsData.length);
        console.log('Sample permission:', permissionsData[0]);
        
        if (permissionsData.length > 0) {
          setAllPermissions(permissionsData);
        } else {
          console.warn('No permissions found in response');
          setAllPermissions([]);
        }
      } else {
        console.error('Failed to load permissions:', processed?.message, processed?.errors);
        showError('Erreur', processed?.message || 'Impossible de charger les permissions');
        setAllPermissions([]);
      }
    } catch (error) {
      console.error('Error loading all permissions:', error);
      console.error('Error details:', error.response?.data || error.message);
      showError('Erreur', error.message || 'Impossible de charger les permissions');
      setAllPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  // Charger les utilisateurs
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const result = await ConsumApi.getRolesUsers();
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateurs chargés',
        errorTitle: 'Erreur de chargement',
        showNotification: false,
      });
      if (processed.success) {
        setUsers(Array.isArray(processed.data) ? processed.data : []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Créer un module
  const handleCreateModule = async () => {
    if (!createModuleDialog.name || !createModuleDialog.description) {
      showError('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.createPermissionModule({
        name: createModuleDialog.name,
        description: createModuleDialog.description,
        statut: createModuleDialog.statut,
      });
      const processed = showApiResponse(result, {
        successTitle: 'Module créé',
        errorTitle: 'Erreur de création',
      });
      if (processed.success) {
        setCreateModuleDialog({ open: false, name: '', description: '', statut: 'ACTIF' });
        loadModules();
      }
    } catch (error) {
      console.error('Error creating module:', error);
      showError('Erreur', 'Impossible de créer le module');
    } finally {
      setLoading(false);
    }
  };

  // Créer une permission
  const handleCreatePermission = async () => {
    if (!createPermissionDialog.moduleId || !createPermissionDialog.name || !createPermissionDialog.description) {
      showError('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.createPermission({
        module_uuid: createPermissionDialog.moduleId,
        name: createPermissionDialog.name,
        description: createPermissionDialog.description,
      });
      const processed = showApiResponse(result, {
        successTitle: 'Permission créée',
        errorTitle: 'Erreur de création',
      });
      if (processed.success) {
        const moduleId = createPermissionDialog.moduleId;
        setCreatePermissionDialog({ open: false, moduleId: '', name: '', description: '' });
        // Recharger toutes les permissions et les permissions du module
        await loadAllPermissions();
        if (moduleId) {
          await loadPermissionsForModule(moduleId);
        }
      }
    } catch (error) {
      console.error('Error creating permission:', error);
      showError('Erreur', 'Impossible de créer la permission');
    } finally {
      setLoading(false);
    }
  };

  // Assigner un rôle à un module
  const handleAssignRoleToModule = async () => {
    if (!assignRoleDialog.moduleId || !assignRoleDialog.roleId) {
      showError('Erreur', 'Veuillez sélectionner un module et un rôle');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.assignRoleToModule(assignRoleDialog.moduleId, assignRoleDialog.roleId);
      const processed = showApiResponse(result, {
        successTitle: 'Rôle assigné',
        errorTitle: 'Erreur d\'assignation',
      });
      if (processed.success) {
        setAssignRoleDialog({ open: false, moduleId: '', roleId: '' });
        await loadRolesForModule(assignRoleDialog.moduleId);
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      showError('Erreur', 'Impossible d\'assigner le rôle');
    } finally {
      setLoading(false);
    }
  };

  // Retirer un rôle d'un module
  const handleRemoveRoleFromModule = async (moduleId, roleId) => {
    setLoading(true);
    try {
      const result = await ConsumApi.removeRoleFromModule(moduleId, roleId);
      const processed = showApiResponse(result, {
        successTitle: 'Rôle retiré',
        errorTitle: 'Erreur de suppression',
      });
      if (processed.success) {
        await loadRolesForModule(moduleId);
      }
    } catch (error) {
      console.error('Error removing role:', error);
      showError('Erreur', 'Impossible de retirer le rôle');
    } finally {
      setLoading(false);
    }
  };

  // Modifier le rôle d'un utilisateur
  const handleChangeRole = async () => {
    if (!changeRoleDialog.user || !changeRoleDialog.newRole) {
      showError('Erreur', 'Veuillez sélectionner un rôle');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.updateRolesUserRole(changeRoleDialog.user.id, changeRoleDialog.newRole);
      const processed = showApiResponse(result, {
        successTitle: 'Rôle modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le rôle de l\'utilisateur a été modifié avec succès');
        setChangeRoleDialog({ open: false, user: null, newRole: '' });
        loadUsers();
      }
    } catch (error) {
      console.error('Error changing role:', error);
      showError('Erreur', 'Impossible de modifier le rôle');
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le mot de passe
  const handleResetPassword = async () => {
    if (!resetPasswordDialog.user || !resetPasswordDialog.newPassword) {
      showError('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (resetPasswordDialog.newPassword !== resetPasswordDialog.confirmPassword) {
      showError('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (resetPasswordDialog.newPassword.length < 8) {
      showError('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.resetRolesUserPassword(resetPasswordDialog.user.id, resetPasswordDialog.newPassword);
      const processed = showApiResponse(result, {
        successTitle: 'Mot de passe réinitialisé',
        errorTitle: 'Erreur de réinitialisation',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le mot de passe de l\'utilisateur a été réinitialisé avec succès');
        setResetPasswordDialog({ open: false, user: null, newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showError('Erreur', 'Impossible de réinitialiser le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  // Forcer la déconnexion
  const handleDisconnect = async () => {
    if (!disconnectDialog.user) {
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.disconnectRolesUser(disconnectDialog.user.id);
      const processed = showApiResponse(result, {
        successTitle: 'Utilisateur déconnecté',
        errorTitle: 'Erreur de déconnexion',
      });
      if (processed.success) {
        showSuccess('Succès', 'L\'utilisateur a été déconnecté avec succès');
        setDisconnectDialog({ open: false, user: null });
      }
    } catch (error) {
      console.error('Error disconnecting user:', error);
      showError('Erreur', 'Impossible de déconnecter l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  // ========== ROLE CRUD OPERATIONS ==========

  // Créer un rôle
  const handleCreateRole = async () => {
    if (!createRoleDialog.name.trim()) {
      showError('Erreur', 'Veuillez saisir un nom de rôle');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.createRole(createRoleDialog.name);
      const processed = showApiResponse(result, {
        successTitle: 'Rôle créé',
        errorTitle: 'Erreur de création',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le rôle a été créé avec succès');
        setCreateRoleDialog({ open: false, name: '' });
        loadRoles();
      }
    } catch (error) {
      console.error('Error creating role:', error);
      showError('Erreur', 'Impossible de créer le rôle');
    } finally {
      setLoading(false);
    }
  };

  // Modifier un rôle
  const handleUpdateRole = async () => {
    if (!editRoleDialog.role || !editRoleDialog.name.trim()) {
      showError('Erreur', 'Veuillez saisir un nom de rôle');
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.updateRole(editRoleDialog.role.id, editRoleDialog.name);
      const processed = showApiResponse(result, {
        successTitle: 'Rôle modifié',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le rôle a été modifié avec succès');
        setEditRoleDialog({ open: false, role: null, name: '' });
        loadRoles();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showError('Erreur', 'Impossible de modifier le rôle');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un rôle
  const handleDeleteRole = async () => {
    if (!deleteRoleDialog.role) {
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.deleteRole(deleteRoleDialog.role.id);
      const processed = showApiResponse(result, {
        successTitle: 'Rôle supprimé',
        errorTitle: 'Erreur de suppression',
      });
      if (processed.success) {
        showSuccess('Succès', 'Le rôle a été supprimé avec succès');
        setDeleteRoleDialog({ open: false, role: null });
        loadRoles();
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showError('Erreur', 'Impossible de supprimer le rôle');
    } finally {
      setLoading(false);
    }
  };

  // Charger les permissions d'un rôle
  const loadRolePermissions = useCallback(async (roleUuid) => {
    setLoadingRolePermissions(true);
    try {
      const result = await ConsumApi.getRoleGlobalPermissions(roleUuid);
      if (result.success) {
        setRolePermissions(result.data);
      } else {
        showError('Erreur', result.message || 'Impossible de charger les permissions');
        setRolePermissions(null);
      }
    } catch (error) {
      console.error('Error loading role permissions:', error);
      showError('Erreur', 'Impossible de charger les permissions du rôle');
      setRolePermissions(null);
    } finally {
      setLoadingRolePermissions(false);
    }
  }, []);

  // Ouvrir le dialog de gestion des permissions
  const handleOpenManagePermissions = async (role) => {
    setManageRolePermissionsDialog({ open: true, role });
    // Charger les permissions du rôle (qui contient déjà toutes les permissions disponibles)
    await loadRolePermissions(role.id);
  };

  // Toggle une permission pour un rôle
  const handleToggleRolePermission = async (permissionUuid) => {
    if (!permissionUuid) {
      console.error('Permission UUID is missing');
      showError('Erreur', 'UUID de permission manquant');
      return;
    }

    console.log('=== TOGGLE PERMISSION DEBUG ===');
    console.log('Permission UUID:', permissionUuid);
    console.log('Role:', manageRolePermissionsDialog.role);

    setLoading(true);
    try {
      const result = await ConsumApi.toggleRolePermissionStatus(permissionUuid);
      console.log('Toggle result:', result);
      
      const processed = showApiResponse(result, {
        successTitle: 'Permission modifiée',
        errorTitle: 'Erreur de modification',
      });
      if (processed.success) {
        // Recharger les permissions du rôle
        if (manageRolePermissionsDialog.role) {
          await loadRolePermissions(manageRolePermissionsDialog.role.id);
        }
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Ne pas afficher d'erreur si c'est une redirection (401)
      if (error.response?.status !== 401) {
        showError('Erreur', 'Impossible de modifier la permission');
      }
    } finally {
      setLoading(false);
    }
  };

  // Générer toutes les permissions pour un rôle
  const handleGenerateRolePermissions = async () => {
    if (!manageRolePermissionsDialog.role) {
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.generateRolePermissions(manageRolePermissionsDialog.role.id);
      const processed = showApiResponse(result, {
        successTitle: 'Permissions générées',
        errorTitle: 'Erreur de génération',
      });
      if (processed.success) {
        showSuccess('Succès', 'Toutes les permissions ont été générées pour ce rôle');
        await loadRolePermissions(manageRolePermissionsDialog.role.id);
      }
    } catch (error) {
      console.error('Error generating permissions:', error);
      showError('Erreur', 'Impossible de générer les permissions');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une permission à un rôle (utilise toggle)
  const handleAddPermissionToRole = async (permission) => {
    if (!manageRolePermissionsDialog.role) {
      return;
    }

    setLoading(true);
    try {
      let permissionUuid = permission.role_permission_uuid;
      
      // Si la permission n'a pas encore de role_permission_uuid, générer toutes les permissions d'abord
      if (!permissionUuid) {
        const generateResult = await ConsumApi.generateRolePermissions(manageRolePermissionsDialog.role.id);
        const generateProcessed = showApiResponse(generateResult, {
          successTitle: 'Permissions générées',
          errorTitle: 'Erreur de génération',
        });
        
        if (!generateProcessed.success) {
          return;
        }
        
        // Recharger les permissions pour obtenir les nouveaux role_permission_uuid
        const reloadResult = await ConsumApi.getRoleGlobalPermissions(manageRolePermissionsDialog.role.id);
        if (reloadResult.success && reloadResult.data && reloadResult.data.modules) {
          // Chercher la permission mise à jour avec son role_permission_uuid
          const foundModule = reloadResult.data.modules.find((module) => {
            if (module.permissions) {
              const found = module.permissions.find(p => p.id === permission.id);
              if (found && found.role_permission_uuid) {
                permissionUuid = found.role_permission_uuid;
                return true;
              }
            }
            return false;
          });
        }
        
        if (!permissionUuid) {
          showError('Erreur', 'Impossible de récupérer l\'UUID de la permission après génération');
          // Recharger quand même pour mettre à jour l'affichage
          await loadRolePermissions(manageRolePermissionsDialog.role.id);
          return;
        }
      }
      
      // Utiliser toggle pour activer/ajouter la permission
      const toggleResult = await ConsumApi.toggleRolePermissionStatus(permissionUuid);
      const toggleProcessed = showApiResponse(toggleResult, {
        successTitle: 'Permission ajoutée',
        errorTitle: 'Erreur d\'ajout',
      });
      
      if (toggleProcessed.success) {
        showSuccess('Succès', 'La permission a été ajoutée au rôle');
        await loadRolePermissions(manageRolePermissionsDialog.role.id);
      }
    } catch (error) {
      console.error('Error adding permission:', error);
      showError('Erreur', 'Impossible d\'ajouter la permission');
    } finally {
      setLoading(false);
    }
  };

  // Helper pour organiser les permissions en deux groupes : celles du rôle et les autres
  const organizePermissions = () => {
    if (!rolePermissions || !rolePermissions.modules) {
      return { rolePermissions: [], otherPermissions: [] };
    }

    // Séparer les permissions
    const rolePerms = [];
    const otherPerms = [];

    // Organiser les permissions par module
    rolePermissions.modules.forEach((module) => {
      if (module.permissions && module.permissions.length > 0) {
        // Permissions assignées au rôle (avec role_permission_uuid)
        const assignedPerms = module.permissions.filter((p) => p.role_permission_uuid !== null);
        // Permissions non assignées (sans role_permission_uuid)
        const unassignedPerms = module.permissions.filter((p) => p.role_permission_uuid === null);

        // Ajouter les permissions assignées dans la section "Permissions du Rôle"
        if (assignedPerms.length > 0) {
          rolePerms.push({
            ...module,
            permissions: assignedPerms,
          });
        }

        // Ajouter les permissions non assignées dans la section "Autres Permissions Disponibles"
        if (unassignedPerms.length > 0) {
          otherPerms.push({
            ...module,
            permissions: unassignedPerms,
          });
        }
      }
    });

    return { rolePermissions: rolePerms, otherPermissions: otherPerms };
  };

  // Rendre la section Modules (tableau simple)
  const renderModulesSection = () => (
      <Stack spacing={3}>
        <Alert severity="info">
        Gérez les modules de permissions du système.
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Modules de Permissions</Typography>
            <Stack direction="row" spacing={2}>
              <LoadingButton
                variant="outlined"
                onClick={() => loadModules()}
                loading={loadingModules}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Actualiser
              </LoadingButton>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-outline" />}
                onClick={() => setCreateModuleDialog({ open: true, name: '', description: '', statut: 'ACTIF' })}
              >
                Créer un Module
              </Button>
            </Stack>
            </Box>
            <Divider />

          {modules.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Slug</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date de création</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{module.name}</Typography>
                      </TableCell>
                      <TableCell>{module.description || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {module.slug || module.id}
          </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={module.statut || 'ACTIF'}
                          color={module.statut === 'ACTIF' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {module.createdAt
                          ? new Date(module.createdAt).toLocaleDateString('fr-FR')
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              onClick={() => {
                                // TODO: Implémenter la modification
                                showError('Info', 'Fonctionnalité à venir');
                              }}
                            >
                              <Iconify icon="solar:pen-bold" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async () => {
                                if (window.confirm(`Êtes-vous sûr de vouloir supprimer le module "${module.name}" ?`)) {
                                  setLoading(true);
                                  try {
                                    const result = await ConsumApi.deletePermissionModule(module.id);
                                    const processed = showApiResponse(result, {
                                      successTitle: 'Module supprimé',
                                      errorTitle: 'Erreur de suppression',
                                    });
                                    if (processed.success) {
                                      loadModules();
                                    }
                                  } catch (error) {
                                    console.error('Error deleting module:', error);
                                    showError('Erreur', 'Impossible de supprimer le module');
                                  } finally {
                                    setLoading(false);
                                  }
                                }
                              }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              {loadingModules ? 'Chargement...' : 'Aucun module trouvé'}
            </Typography>
          )}

          {modules.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {modules.length} module(s) affiché(s)
              </Typography>
            </Box>
          )}
        </Stack>
      </Card>
      </Stack>
    );

  // Rendre la section Permissions (tableau avec module associé)
  const renderPermissionsSection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Gérez les permissions liées aux modules du système.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Permissions</Typography>
            <Stack direction="row" spacing={2}>
              <LoadingButton
                variant="outlined"
                onClick={() => loadAllPermissions()}
                loading={loadingPermissions}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Actualiser
              </LoadingButton>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-outline" />}
                onClick={() => {
                  // Charger les modules d'abord si nécessaire
                  if (modules.length === 0) {
                    loadModules();
                  }
                  setCreatePermissionDialog({ open: true, moduleId: '', name: '', description: '' });
                }}
              >
                Créer une Permission
              </Button>
            </Stack>
          </Box>
          <Divider />

          {loadingPermissions && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography color="text.secondary">Chargement des permissions...</Typography>
            </Box>
          )}
          {!loadingPermissions && allPermissions.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Module</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Slug</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date de création</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allPermissions.map((permission) => {
                    console.log('Rendering permission:', permission);
    return (
                      <TableRow key={permission.id || permission.slug}>
                        <TableCell>
                          <Typography variant="subtitle2">{permission.name}</Typography>
                        </TableCell>
                        <TableCell>{permission.description || '-'}</TableCell>
                        <TableCell>
                          {permission.module ? (
                            <Chip
                              label={permission.module.name || permission.module.slug || permission.module}
                              color="primary"
                              size="small"
                              title={permission.module.description || ''}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {permission.slug || permission.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {permission.createdAt
                            ? new Date(permission.createdAt).toLocaleDateString('fr-FR')
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Modifier">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  // TODO: Implémenter la modification
                                  showError('Info', 'Fonctionnalité à venir');
                                }}
                              >
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={async () => {
                                  if (window.confirm(`Êtes-vous sûr de vouloir supprimer la permission "${permission.name}" ?`)) {
                                    setLoading(true);
                                    try {
                                      const result = await ConsumApi.deletePermission(permission.id);
                                      const processed = showApiResponse(result, {
                                        successTitle: 'Permission supprimée',
                                        errorTitle: 'Erreur de suppression',
                                      });
                                      if (processed.success) {
                                        loadAllPermissions();
                                      }
                                    } catch (error) {
                                      console.error('Error deleting permission:', error);
                                      showError('Erreur', 'Impossible de supprimer la permission');
                                    } finally {
                                      setLoading(false);
                                    }
                                  }
                                }}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!loadingPermissions && allPermissions.length === 0 && (
            <Box sx={{ py: 4 }}>
              <Typography color="text.secondary" align="center" sx={{ mb: 2 }}>
                Aucune permission trouvée
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                État: {allPermissions.length} permission(s) chargée(s)
              </Typography>
            </Box>
          )}

          {allPermissions.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {allPermissions.length} permission(s) affichée(s)
              </Typography>
            </Box>
          )}
        </Stack>
      </Card>
    </Stack>
  );

  // Rendre la section Modules (ancienne version avec accordéons - à supprimer ou garder pour référence)
  const renderModulesSectionOld = () => (
      <Stack spacing={3}>
        <Alert severity="info">
        Gérez les modules de permissions, leurs permissions associées et les rôles assignés.
        </Alert>

        <Card sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Modules de Permissions</Typography>
            <Stack direction="row" spacing={2}>
              <LoadingButton
                variant="outlined"
                onClick={() => loadModules()}
                loading={loadingModules}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Actualiser
              </LoadingButton>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-outline" />}
                onClick={() => setCreateModuleDialog({ open: true, name: '', description: '', statut: 'ACTIF' })}
              >
                Créer un Module
              </Button>
            </Stack>
            </Box>
            <Divider />

          {modules.length > 0 ? (
            <Stack spacing={2}>
              {modules.map((module) => {
                const permissions = permissionsByModule[module.id] || [];
                const assignedRoles = moduleRoles[module.id] || [];

    return (
                  <Accordion 
                    key={module.id}
                    onChange={(event, expanded) => {
                      if (expanded) {
                        // Charger les permissions et rôles quand l'accordéon s'ouvre
                        if (!permissionsByModule[module.id]) {
                          loadPermissionsForModule(module.id);
                        }
                        if (!moduleRoles[module.id]) {
                          loadRolesForModule(module.id);
                        }
                      }
                    }}
                  >
                    <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                          {module.name}
                        </Typography>
                    <Chip
                          label={module.statut || 'ACTIF'}
                          color={module.statut === 'ACTIF' ? 'success' : 'default'}
                          size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                          {permissions.length} permission(s) • {assignedRoles.length} rôle(s)
                    </Typography>
                  </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={3}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Description: {module.description || 'Aucune description'}
                          </Typography>
                      <Typography variant="body2" color="text.secondary">
                            Slug: {module.slug || module.id}
                      </Typography>
                        </Box>

                        <Divider />

                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2">Permissions ({permissions.length})</Typography>
                            <Button
                          size="small"
                          variant="outlined"
                              startIcon={<Iconify icon="eva:plus-outline" />}
                              onClick={() => setCreatePermissionDialog({ open: true, moduleId: module.id, name: '', description: '' })}
                            >
                              Ajouter une Permission
                            </Button>
                    </Box>
                          {permissions.length > 0 ? (
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {permissions.map((permission) => (
                                    <TableRow key={permission.id}>
                                      <TableCell>{permission.name}</TableCell>
                                      <TableCell>{permission.description || '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                              Aucune permission pour ce module
                            </Typography>
                  )}
                </Box>

                <Divider />

                <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2">Rôles Assignés ({assignedRoles.length})</Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Iconify icon="eva:plus-outline" />}
                              onClick={() => setAssignRoleDialog({ open: true, moduleId: module.id, roleId: '' })}
                            >
                              Assigner un Rôle
                            </Button>
                          </Box>
                          {assignedRoles.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {assignedRoles.map((role) => (
                      <Chip
                                  key={role.id || role.roleId}
                                  label={ROLE_LABELS[role.name || role.roleName] || role.name || role.roleName}
                                  color={ROLE_COLORS[role.name || role.roleName] || 'default'}
                                  onDelete={() => handleRemoveRoleFromModule(module.id, role.id || role.roleId)}
                                  deleteIcon={<Iconify icon="eva:close-outline" />}
                      />
                    ))}
                  </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                              Aucun rôle assigné à ce module
                            </Typography>
                          )}
                </Box>
              </Stack>
                    </AccordionDetails>
                  </Accordion>
          );
        })}
            </Stack>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              {loadingModules ? 'Chargement...' : 'Aucun module trouvé'}
            </Typography>
          )}

          {/* Information sur le nombre de modules */}
          {modules.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {modules.length} module(s) affiché(s)
              </Typography>
            </Box>
          )}
        </Stack>
      </Card>
    </Stack>
  );

  // Rendre la section Rôles
  const renderRolesSection = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        Gérez tous les rôles disponibles dans le système et leurs permissions.
      </Alert>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Rôles</Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-outline" />}
                onClick={() => setCreateRoleDialog({ open: true, name: '' })}
              >
                Créer un Rôle
              </Button>
              <LoadingButton
                variant="outlined"
                onClick={loadRoles}
                loading={loadingRoles}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Actualiser
              </LoadingButton>
            </Stack>
          </Box>
          <Divider />

          {roles.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Slug</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date de Création</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Chip
                          label={ROLE_LABELS[role.name] || role.name}
                          color={ROLE_COLORS[role.name] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{role.slug}</TableCell>
                      <TableCell>
                        {role.createdAt
                          ? new Date(role.createdAt).toLocaleDateString('fr-FR')
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Gérer les permissions">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenManagePermissions(role)}
                            >
                              <Iconify icon="eva:settings-outline" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => setEditRoleDialog({ open: true, role, name: role.name })}
                            >
                              <Iconify icon="eva:edit-outline" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteRoleDialog({ open: true, role })}
                            >
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              {loadingRoles ? 'Chargement...' : 'Aucun rôle trouvé'}
            </Typography>
          )}
        </Stack>
      </Card>
    </Stack>
  );

  // Rendre la section Utilisateurs
  const renderUsersSection = () => (
      <Stack spacing={3}>
        <Alert severity="info">
          Gérez tous les utilisateurs du système, leurs rôles et leurs permissions.
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Tous les Utilisateurs</Typography>
              <LoadingButton
                variant="contained"
                onClick={loadUsers}
                loading={loadingUsers}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Actualiser
              </LoadingButton>
            </Box>
            <Divider />

            {users.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Téléphone</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Rôle</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date Création</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {user.firstName} {user.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Chip
                          label={user.role?.name || user.role || '-'}
                          color={ROLE_COLORS[user.role?.name || user.role] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isSuspended ? 'Suspendu' : 'Actif'}
                            color={user.isSuspended ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('fr-FR')
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Modifier le rôle">
                              <IconButton
                                size="small"
                              onClick={() => setChangeRoleDialog({ open: true, user, newRole: user.role?.id || user.role })}
                              >
                                <Iconify icon="solar:user-id-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Réinitialiser le mot de passe">
                              <IconButton
                                size="small"
                                onClick={() => setResetPasswordDialog({ open: true, user, newPassword: '', confirmPassword: '' })}
                              >
                                <Iconify icon="solar:lock-password-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Forcer la déconnexion">
                              <IconButton
                                size="small"
                                onClick={() => setDisconnectDialog({ open: true, user })}
                                color="error"
                              >
                                <Iconify icon="solar:logout-2-bold" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                {loadingUsers ? 'Chargement...' : 'Aucun utilisateur trouvé'}
              </Typography>
            )}
          </Stack>
        </Card>
      </Stack>
    );

  return (
    <>
      <Helmet>
        <title> Rôles & Permissions | AnnourTravel </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Rôles & Permissions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gérez les modules de permissions, les rôles et les utilisateurs du système
            </Typography>
          </Box>

          <Card>
            <TabContext value={currentTab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                  onChange={(event, newValue) => setCurrentTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab
                    label="Modules"
                    value="modules"
                    icon={<Iconify icon="solar:folder-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Permissions"
                    value="permissions"
                    icon={<Iconify icon="solar:key-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Rôles"
                    value="roles"
                    icon={<Iconify icon="solar:shield-check-bold" />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Gestion des Utilisateurs"
                    value="users"
                    icon={<Iconify icon="solar:users-group-rounded-bold" />}
                    iconPosition="start"
                  />
                </TabList>
              </Box>

              <Box sx={{ p: 3 }}>
                <TabPanel value="modules" sx={{ p: 0 }}>
                  {renderModulesSection()}
                </TabPanel>
                <TabPanel value="permissions" sx={{ p: 0 }}>
                  {renderPermissionsSection()}
                </TabPanel>
                <TabPanel value="roles" sx={{ p: 0 }}>
                  {renderRolesSection()}
                </TabPanel>
                <TabPanel value="users" sx={{ p: 0 }}>
                  {renderUsersSection()}
                </TabPanel>
              </Box>
            </TabContext>
          </Card>
        </Stack>
      </Container>

      {/* Dialog pour créer un module */}
      <Dialog
        open={createModuleDialog.open}
        onClose={() => setCreateModuleDialog({ open: false, name: '', description: '', statut: 'ACTIF' })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Créer un Module de Permissions
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Nom du Module"
              value={createModuleDialog.name}
              onChange={(e) => setCreateModuleDialog({ ...createModuleDialog, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={createModuleDialog.description}
              onChange={(e) => setCreateModuleDialog({ ...createModuleDialog, description: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={createModuleDialog.statut}
                label="Statut"
                onChange={(e) => setCreateModuleDialog({ ...createModuleDialog, statut: e.target.value })}
              >
                <MenuItem value="ACTIF">Actif</MenuItem>
                <MenuItem value="INACTIF">Inactif</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
              <Button
                onClick={() => setCreateModuleDialog({ open: false, name: '', description: '', statut: 'ACTIF' })}
                variant="outlined"
              >
                Annuler
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleCreateModule}
                loading={loading}
                disabled={!createModuleDialog.name || !createModuleDialog.description}
              >
                Créer
              </LoadingButton>
            </Box>
          </Stack>
        </Box>
      </Dialog>

      {/* Dialog pour créer une permission */}
      <Dialog
        open={createPermissionDialog.open}
        onClose={() => setCreatePermissionDialog({ open: false, moduleId: '', name: '', description: '' })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Créer une Permission
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Module</InputLabel>
              <Select
                value={createPermissionDialog.moduleId}
                label="Module"
                onChange={(e) => setCreatePermissionDialog({ ...createPermissionDialog, moduleId: e.target.value })}
              >
                {modules.map((module) => (
                  <MenuItem key={module.id} value={module.id}>
                    {module.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Nom de la Permission"
              value={createPermissionDialog.name}
              onChange={(e) => setCreatePermissionDialog({ ...createPermissionDialog, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={createPermissionDialog.description}
              onChange={(e) => setCreatePermissionDialog({ ...createPermissionDialog, description: e.target.value })}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
              <Button
                onClick={() => setCreatePermissionDialog({ open: false, moduleId: '', name: '', description: '' })}
                variant="outlined"
              >
                Annuler
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleCreatePermission}
                loading={loading}
                disabled={!createPermissionDialog.moduleId || !createPermissionDialog.name}
              >
                Créer
              </LoadingButton>
            </Box>
          </Stack>
        </Box>
      </Dialog>

      {/* Dialog pour assigner un rôle à un module */}
      <Dialog
        open={assignRoleDialog.open}
        onClose={() => setAssignRoleDialog({ open: false, moduleId: '', roleId: '' })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Assigner un Rôle au Module
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={assignRoleDialog.roleId}
                label="Rôle"
                onChange={(e) => setAssignRoleDialog({ ...assignRoleDialog, roleId: e.target.value })}
              >
                {roles
                  .filter((role) => {
                    const assigned = moduleRoles[assignRoleDialog.moduleId] || [];
                    return !assigned.some((r) => (r.id || r.roleId) === role.id);
                  })
                  .map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {ROLE_LABELS[role.name] || role.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Alert severity="info">
              Ce rôle aura accès à toutes les permissions de ce module.
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
              <Button
                onClick={() => setAssignRoleDialog({ open: false, moduleId: '', roleId: '' })}
                variant="outlined"
              >
                Annuler
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleAssignRoleToModule}
                loading={loading}
                disabled={!assignRoleDialog.roleId}
              >
                Assigner
              </LoadingButton>
            </Box>
          </Stack>
        </Box>
      </Dialog>

      {/* Dialog pour changer le rôle */}
      <Dialog
        open={changeRoleDialog.open}
        onClose={() => setChangeRoleDialog({ open: false, user: null, newRole: '' })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Modifier le Rôle
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {changeRoleDialog.user && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Utilisateur:
                </Typography>
                <Typography variant="subtitle1">
                  {changeRoleDialog.user.firstName} {changeRoleDialog.user.lastName} ({changeRoleDialog.user.email})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Rôle actuel: <Chip label={changeRoleDialog.user.role?.name || changeRoleDialog.user.role} size="small" color={ROLE_COLORS[changeRoleDialog.user.role?.name || changeRoleDialog.user.role]} />
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Nouveau Rôle</InputLabel>
                <Select
                  value={changeRoleDialog.newRole}
                  label="Nouveau Rôle"
                  onChange={(e) => setChangeRoleDialog({ ...changeRoleDialog, newRole: e.target.value })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {ROLE_LABELS[role.name] || role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Alert severity="warning">
                Attention: La modification du rôle peut affecter les permissions et l&apos;accès de l&apos;utilisateur.
              </Alert>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => setChangeRoleDialog({ open: false, user: null, newRole: '' })}
                  variant="outlined"
                >
                  Annuler
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleChangeRole}
                  loading={loading}
                >
                  Modifier
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Box>
      </Dialog>

      {/* Dialog pour réinitialiser le mot de passe */}
      <Dialog
        open={resetPasswordDialog.open}
        onClose={() => setResetPasswordDialog({ open: false, user: null, newPassword: '', confirmPassword: '' })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Réinitialiser le Mot de Passe
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {resetPasswordDialog.user && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Utilisateur:
                </Typography>
                <Typography variant="subtitle1">
                  {resetPasswordDialog.user.firstName} {resetPasswordDialog.user.lastName} ({resetPasswordDialog.user.email})
                </Typography>
              </Box>

              <TextField
                fullWidth
                type="password"
                label="Nouveau Mot de Passe"
                value={resetPasswordDialog.newPassword}
                onChange={(e) => setResetPasswordDialog({ ...resetPasswordDialog, newPassword: e.target.value })}
                helperText="Minimum 8 caractères"
              />

              <TextField
                fullWidth
                type="password"
                label="Confirmer le Mot de Passe"
                value={resetPasswordDialog.confirmPassword}
                onChange={(e) => setResetPasswordDialog({ ...resetPasswordDialog, confirmPassword: e.target.value })}
                error={resetPasswordDialog.newPassword !== resetPasswordDialog.confirmPassword && resetPasswordDialog.confirmPassword !== ''}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => setResetPasswordDialog({ open: false, user: null, newPassword: '', confirmPassword: '' })}
                  variant="outlined"
                >
                  Annuler
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleResetPassword}
                  loading={loading}
                  disabled={resetPasswordDialog.newPassword !== resetPasswordDialog.confirmPassword || resetPasswordDialog.newPassword.length < 8}
                >
                  Réinitialiser
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Box>
      </Dialog>

      {/* Dialog pour forcer la déconnexion */}
      <Dialog
        open={disconnectDialog.open}
        onClose={() => setDisconnectDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Forcer la Déconnexion
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {disconnectDialog.user && (
            <Stack spacing={3}>
              <Alert severity="warning">
                Êtes-vous sûr de vouloir forcer la déconnexion de cet utilisateur ?
              </Alert>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Utilisateur:
                </Typography>
                <Typography variant="subtitle1">
                  {disconnectDialog.user.firstName} {disconnectDialog.user.lastName} ({disconnectDialog.user.email})
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => setDisconnectDialog({ open: false, user: null })}
                  variant="outlined"
                >
                  Annuler
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleDisconnect}
                  loading={loading}
                  color="error"
                >
                  Déconnecter
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Box>
      </Dialog>

      {/* Dialog pour créer un rôle */}
      <Dialog
        open={createRoleDialog.open}
        onClose={() => setCreateRoleDialog({ open: false, name: '' })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Créer un Rôle
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Nom du Rôle"
              value={createRoleDialog.name}
              onChange={(e) => setCreateRoleDialog({ ...createRoleDialog, name: e.target.value })}
              required
              placeholder="Ex: ADMINISTRATEUR"
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
              <Button
                onClick={() => setCreateRoleDialog({ open: false, name: '' })}
                variant="outlined"
              >
                Annuler
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleCreateRole}
                loading={loading}
                disabled={!createRoleDialog.name.trim()}
              >
                Créer
              </LoadingButton>
            </Box>
          </Stack>
        </Box>
      </Dialog>

      {/* Dialog pour modifier un rôle */}
      <Dialog
        open={editRoleDialog.open}
        onClose={() => setEditRoleDialog({ open: false, role: null, name: '' })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Modifier un Rôle
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {editRoleDialog.role && (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Nom du Rôle"
                value={editRoleDialog.name}
                onChange={(e) => setEditRoleDialog({ ...editRoleDialog, name: e.target.value })}
                required
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => setEditRoleDialog({ open: false, role: null, name: '' })}
                  variant="outlined"
                >
                  Annuler
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleUpdateRole}
                  loading={loading}
                  disabled={!editRoleDialog.name.trim()}
                >
                  Modifier
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Box>
      </Dialog>

      {/* Dialog pour supprimer un rôle */}
      <Dialog
        open={deleteRoleDialog.open}
        onClose={() => setDeleteRoleDialog({ open: false, role: null })}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Supprimer un Rôle
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {deleteRoleDialog.role && (
            <Stack spacing={3}>
              <Alert severity="warning">
                Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.
              </Alert>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Rôle:
                </Typography>
                <Typography variant="subtitle1">
                  {deleteRoleDialog.role.name} ({deleteRoleDialog.role.slug})
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => setDeleteRoleDialog({ open: false, role: null })}
                  variant="outlined"
                >
                  Annuler
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleDeleteRole}
                  loading={loading}
                  color="error"
                >
                  Supprimer
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Box>
      </Dialog>

      {/* Dialog pour gérer les permissions d'un rôle */}
      <Dialog
        open={manageRolePermissionsDialog.open}
        onClose={() => {
          setManageRolePermissionsDialog({ open: false, role: null });
          setRolePermissions(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Gérer les Permissions - {manageRolePermissionsDialog.role?.name}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {manageRolePermissionsDialog.role && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Gérez les permissions pour le rôle: <strong>{manageRolePermissionsDialog.role.name}</strong>
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="eva:refresh-outline" />}
                  onClick={() => loadRolePermissions(manageRolePermissionsDialog.role.id)}
                  disabled={loadingRolePermissions}
                >
                  Actualiser
                </Button>
              </Box>

              {loadingRolePermissions && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography color="text.secondary">Chargement des permissions...</Typography>
                </Box>
              )}
              {!loadingRolePermissions && rolePermissions && rolePermissions.modules && (
                <Stack spacing={4}>
                  {(() => {
                    const { rolePermissions: rolePerms, otherPermissions: otherPerms } = organizePermissions();
                    
                    return (
                      <>
                        {/* Section 1: Permissions du Rôle */}
                        <Box>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Permissions du Rôle
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          
                          {rolePerms.length > 0 ? (
                            <Stack spacing={2}>
                              {rolePerms.map((module) => (
                                <Accordion key={module.uuid}>
                                  <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                                        {module.name}
                                      </Typography>
                                      <Chip
                                        label={`${module.permissions?.filter(p => p.status).length || 0}/${module.permissions?.length || 0} activées`}
                                        size="small"
                                        color="primary"
                                      />
                                    </Box>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    {module.permissions && module.permissions.length > 0 ? (
                                      <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell sx={{ fontWeight: 'bold' }}>Permission</TableCell>
                                              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {module.permissions.map((permission) => (
                                              <TableRow key={permission.id}>
                                                <TableCell>{permission.name}</TableCell>
                                                <TableCell>{permission.description || '-'}</TableCell>
                                                <TableCell align="center">
                                                  <Chip
                                                    label={permission.status ? 'Activée' : 'Non activée'}
                                                    color={permission.status ? 'success' : 'default'}
                                                    size="small"
                                                  />
                                                </TableCell>
                                                <TableCell align="center">
                                                  <FormControlLabel
                                                    control={
                                                      <Checkbox
                                                        checked={permission.status || false}
                                                        onChange={() => handleToggleRolePermission(permission.role_permission_uuid)}
                                                        disabled={loading}
                                                      />
                                                    }
                                                    label=""
                                                  />
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                        Aucune permission pour ce module
                                      </Typography>
                                    )}
                                  </AccordionDetails>
                                </Accordion>
                              ))}
                            </Stack>
                          ) : (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              Ce rôle n&apos;a aucune permission assignée pour le moment.
                            </Alert>
                          )}
                        </Box>

                        {/* Section 2: Autres Permissions Disponibles */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                              Autres Permissions Disponibles
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Iconify icon="eva:plus-outline" />}
                              onClick={handleGenerateRolePermissions}
                              disabled={loading}
                            >
                              Générer Toutes les Permissions
                            </Button>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          
                          {otherPerms.length > 0 ? (
                            <Stack spacing={2}>
                              {otherPerms.map((module) => (
                                <Accordion key={module.uuid}>
                                  <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                                        {module.name}
                                      </Typography>
                                      <Chip
                                        label={`${module.permissions?.length || 0} permission(s) disponible(s)`}
                                        size="small"
                                        color="info"
                                      />
                                    </Box>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    {module.permissions && module.permissions.length > 0 ? (
                                      <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell sx={{ fontWeight: 'bold' }}>Permission</TableCell>
                                              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {module.permissions.map((permission) => (
                                              <TableRow key={permission.id}>
                                                <TableCell>{permission.name}</TableCell>
                                                <TableCell>{permission.description || '-'}</TableCell>
                                                <TableCell align="center">
                                                  <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<Iconify icon="eva:plus-outline" />}
                                                    onClick={() => handleAddPermissionToRole(permission)}
                                                    disabled={loading}
                                                  >
                                                    Ajouter
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                        Aucune permission disponible pour ce module
                                      </Typography>
                                    )}
                                  </AccordionDetails>
                                </Accordion>
                              ))}
                            </Stack>
                          ) : (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              Toutes les permissions disponibles sont déjà assignées à ce rôle.
                            </Alert>
                          )}
                        </Box>
                      </>
                    );
                  })()}
                </Stack>
              )}
              {!loadingRolePermissions && rolePermissions && !rolePermissions.modules && (
                <Alert severity="info">
                  Aucune permission trouvée. Cliquez sur &quot;Générer Toutes les Permissions&quot; pour créer toutes les permissions disponibles.
                </Alert>
              )}
              {!loadingRolePermissions && !rolePermissions && (
                <Alert severity="error">
                  Impossible de charger les permissions. Veuillez réessayer.
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => {
                    setManageRolePermissionsDialog({ open: false, role: null });
                    setRolePermissions(null);
                  }}
                  variant="outlined"
                >
                  Fermer
                </Button>
              </Box>
            </Stack>
          )}
        </Box>
      </Dialog>
    </>
  );
}
