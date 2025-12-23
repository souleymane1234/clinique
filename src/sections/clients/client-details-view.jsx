import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Chip,
  Grid,
  Tabs,
  Stack,
  Table,
  Alert,
  alpha,
  Paper,
  Button,
  Dialog,
  Select,
  Avatar,
  Divider,
  TableRow,
  MenuItem,
  TextField,
  TableBody,
  TableCell,
  Container,
  TableHead,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  LinearProgress,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';
import { useAdminStore } from 'src/store/useAdminStore';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';
import { fNumber } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const SERVICE_OPTIONS = [
  { value: 'VisaCanada', label: 'Visa Canada' },
  { value: 'VisaArabieSaoudite', label: 'Visa Arabie Saoudite' },
  { value: 'VisaDubai', label: 'Visa Dubai' },
  { value: 'VisaChine', label: 'Visa Chine' },
  { value: 'VisaMaroc', label: 'Visa Maroc' },
  { value: 'VisaTurquie', label: 'Visa Turquie' },
  { value: 'VisaSchengen', label: 'Visa Schengen (France, Espagne)' },
  { value: 'BilletAvion', label: 'Billet d\'avion' },
  { value: 'ReservationHotel', label: 'Réservation d\'hôtel' },
  { value: 'CircuitDubai', label: 'Package circuit Touristique Dubaï' },
  { value: 'OUMRA', label: 'Package OUMRA Arabie Saoudite' },
  { value: 'AttestationReservationBillet', label: 'Attestation de réservation de billet d\'avion' },
  { value: 'AttestationReservationHotel', label: 'Attestation de réservation d\'hôtel' },
  { value: 'AssuranceVoyage', label: 'Assurance voyage' },
  { value: 'CargoEnvoiColis', label: 'Cargo et envoi de colis' },
  { value: 'TransfertArgent', label: 'Transfert d\'argent' },
];

const STATUS_COLORS = {
  lead: 'info',
  prospect: 'warning',
  client: 'success',
  archived: 'default',
};

const SESSION_STATUS_COLORS = {
  active: 'success',
  closed: 'default',
};

const FACTURE_STATUS_COLORS = {
  pending: 'warning',
  partial: 'info',
  paid: 'success',
  overdue: 'error',
};

const STATUS_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'client', label: 'Client' },
  { value: 'archived', label: 'Archivé' },
];

const base_url = 'http://localhost:3001';

const getDocumentUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${base_url}${url}`;
};

export default function ClientDetailsView() {
  const { id: clientId } = useParams();
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();
  const { admin } = useAdminStore();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [currentTab, setCurrentTab] = useState('overview');

  console.log(summary);

  // Dialogs
  const [openSessionDialog, setOpenSessionDialog] = useState({
    open: false,
    loading: false,
    service: '',
  });

  const [closeSessionDialog, setCloseSessionDialog] = useState({
    open: false,
    session: null,
    loading: false,
  });

  const [addConclusionDialog, setAddConclusionDialog] = useState({
    open: false,
    session: null,
    loading: false,
    text: '',
    reminderDate: '',
  });

  const [statusDialog, setStatusDialog] = useState({
    open: false,
    loading: false,
    status: 'lead',
    step: 1,
  });

  const [assignDialog, setAssignDialog] = useState({
    open: false,
    loading: false,
    userId: '',
  });

  // Dialog édition client
  const [editClientDialog, setEditClientDialog] = useState({
    open: false,
    loading: false,
    formData: {
      nom: '',
      numero: '',
      email: '',
      service: '',
      commentaire: '',
      status: 'lead',
    },
  });

  const [deleteClientDialog, setDeleteClientDialog] = useState({
    open: false,
    loading: false,
  });

  const [commerciaux, setCommerciaux] = useState([]);
  const [loadingCommerciaux, setLoadingCommerciaux] = useState(false);

  // Facturation
  const [sessionFactures, setSessionFactures] = useState([]);
  const [loadingFactures, setLoadingFactures] = useState(false);
  const [createFactureDialog, setCreateFactureDialog] = useState({
    open: false,
    loading: false,
    montantTotal: '',
    dateEcheance: '',
    clientAddress: '',
  });

  // Documents
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadDocumentDialog, setUploadDocumentDialog] = useState({
    open: false,
    loading: false,
    file: null,
    title: '',
  });
  const [uploadMultipleDialog, setUploadMultipleDialog] = useState({
    open: false,
    loading: false,
    files: [],
    titles: [],
  });
  const [deleteDocumentDialog, setDeleteDocumentDialog] = useState({
    open: false,
    document: null,
    loading: false,
  });

  // Helper pour obtenir le nom d'un commercial à partir de assignedTo
  const getCommercialName = (assignedTo) => {
    if (!assignedTo) return 'Non assigné';
    
    // Si c'est un objet, extraire le nom
    if (typeof assignedTo === 'object' && assignedTo !== null) {
      const firstName = assignedTo.firstname || assignedTo.firstName || '';
      const lastName = assignedTo.lastname || assignedTo.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName) return fullName;
      if (assignedTo.email) return assignedTo.email;
      // Ne pas afficher l'ID, chercher dans la liste des commerciaux chargés
      const commercialId = assignedTo.id || assignedTo.userId;
      if (commercialId) {
        const commercial = commerciaux.find((c) => c.id === commercialId);
        if (commercial && commercial.name) return commercial.name;
      }
      return 'Commercial inconnu';
    }
    
    // Si c'est une string (ID), chercher dans la liste des commerciaux
    const commercial = commerciaux.find((c) => c.id === assignedTo);
    if (commercial && commercial.name) return commercial.name;
    
    // Ne pas afficher l'ID, retourner un message générique
    return 'Commercial inconnu';
  };

  const loadCommerciaux = async () => {
    setLoadingCommerciaux(true);
    try {
      // Obtenir tous les utilisateurs et filtrer par service "Commercial"
      const result = await ConsumApi.getUsers();
      if (result.success && Array.isArray(result.data)) {
        // Filtrer commerciaux + admins (rôle ou service)
        const commerciauxList = result.data
          .filter((user) => {
            const service = (user.service || '').trim().toLowerCase();
            const role = (user.role || '').trim().toUpperCase();
            return (
              service === 'commercial' ||
              service === 'commerciale' ||
              service.includes('commercial') ||
              service.includes('admin') ||
              role.startsWith('ADMIN') ||
              role === 'SUPERADMIN'
            );
          })
          .map((commercial) => {
            const firstName = commercial.firstname || commercial.firstName || '';
            const lastName = commercial.lastname || commercial.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            
            return {
              id: commercial.id,
              name: fullName || commercial.email || commercial.id,
              email: commercial.email || null,
            };
          });
        setCommerciaux(commerciauxList);
      } else {
        setCommerciaux([]);
      }
    } catch (error) {
      console.error('Error loading commerciaux:', error);
      setCommerciaux([]);
    } finally {
      setLoadingCommerciaux(false);
    }
  };

  const loadClientData = async () => {
    setLoading(true);
    try {
      const [clientResult, summaryResult, sessionsResult, activeSessionResult] = await Promise.all([
        ConsumApi.getClientById(clientId),
        ConsumApi.getClientSummary(clientId),
        ConsumApi.getClientSessions(clientId),
        ConsumApi.getClientActiveSession(clientId),
      ]);

      if (clientResult.success) {
        setClient(clientResult.data);
      }

      if (summaryResult.success) {
        setSummary(summaryResult.data);
      }

      if (sessionsResult.success) {
        setSessions(Array.isArray(sessionsResult.data) ? sessionsResult.data : []);
      }

      if (activeSessionResult.success && activeSessionResult.data) {
        setActiveSession(activeSessionResult.data);
        // Charger les factures de la session active
        loadSessionFactures(activeSessionResult.data.id);
      } else {
        setActiveSession(null);
        setSessionFactures([]);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      showError('Erreur', 'Impossible de charger les données du client');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionFactures = async (sessionId) => {
    if (!sessionId) return;
    setLoadingFactures(true);
    try {
      // Charger toutes les factures du client et filtrer par session
      const result = await ConsumApi.getClientFactures(clientId);
      if (result.success && Array.isArray(result.data)) {
        const factures = result.data.filter((f) => f.sessionId === sessionId);
        setSessionFactures(factures);
      } else {
        setSessionFactures([]);
      }
    } catch (error) {
      console.error('Error loading session factures:', error);
      setSessionFactures([]);
    } finally {
      setLoadingFactures(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadClientData();
      loadCommerciaux();
    }
  }, [clientId]);

  // Charger les factures quand on passe à l'onglet Sessions et qu'il y a une session active
  useEffect(() => {
    if (currentTab === 'sessions' && activeSession) {
      loadSessionFactures(activeSession.id);
    }
  }, [currentTab, activeSession]);

  // Charger les documents quand on passe à l'onglet Documents
  useEffect(() => {
    if (currentTab === 'documents' && clientId) {
      loadDocuments();
    }
  }, [currentTab, clientId]);

  const loadDocuments = async () => {
    if (!clientId) return;
    setLoadingDocuments(true);
    try {
      const result = await ConsumApi.getClientDocuments(clientId);
      if (result.success && Array.isArray(result.data)) {
        setDocuments(result.data);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadDocumentDialog.file || !uploadDocumentDialog.title.trim()) {
      showError('Erreur', 'Veuillez sélectionner un fichier et entrer un titre');
      return;
    }
  
    setUploadDocumentDialog({ ...uploadDocumentDialog, loading: true });
  
    try {
      const result = await ConsumApi.uploadClientDocument(
        clientId,
        uploadDocumentDialog.file,
        uploadDocumentDialog.title
      );
  
      showApiResponse(result, {
        successTitle: 'Document uploadé',
        errorTitle: 'Erreur d\'upload',
      });
  
      if (result.success) {
        setUploadDocumentDialog({ open: false, loading: false, file: null, title: '' });
        loadDocuments();
      } else {
        // En cas d'échec, on garde le modal ouvert mais on arrête le loading
        setUploadDocumentDialog({ ...uploadDocumentDialog, loading: false });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      showError('Erreur', 'Une erreur est survenue lors de l\'upload');
      setUploadDocumentDialog({ ...uploadDocumentDialog, loading: false });
    }
  };

  const handleUploadMultipleDocuments = async () => {
    if (uploadMultipleDialog.files.length === 0) {
      showError('Erreur', 'Veuillez sélectionner au moins un fichier');
      return;
    }
  
    if (uploadMultipleDialog.files.length !== uploadMultipleDialog.titles.length) {
      showError('Erreur', 'Le nombre de fichiers doit correspondre au nombre de titres');
      return;
    }
  
    // Vérifier que tous les titres sont remplis
    const emptyTitles = uploadMultipleDialog.titles.some((title) => !title.trim());
    if (emptyTitles) {
      showError('Erreur', 'Tous les titres doivent être remplis');
      return;
    }
  
    setUploadMultipleDialog({ ...uploadMultipleDialog, loading: true });
  
    try {
      const result = await ConsumApi.uploadClientDocumentsMultiple(
        clientId,
        uploadMultipleDialog.files,
        uploadMultipleDialog.titles
      );
  
      showApiResponse(result, {
        successTitle: 'Documents uploadés',
        errorTitle: 'Erreur d\'upload',
      });
  
      if (result.success) {
        setUploadMultipleDialog({ open: false, loading: false, files: [], titles: [] });
        loadDocuments();
      } else {
        // En cas d'échec, on garde le modal ouvert mais on arrête le loading
        setUploadMultipleDialog({ ...uploadMultipleDialog, loading: false });
      }
    } catch (error) {
      console.error('Error uploading multiple documents:', error);
      showError('Erreur', 'Une erreur est survenue lors de l\'upload');
      setUploadMultipleDialog({ ...uploadMultipleDialog, loading: false });
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocumentDialog.document) return;

    setDeleteDocumentDialog({ ...deleteDocumentDialog, loading: true });
    try {
      const result = await ConsumApi.deleteClientDocument(deleteDocumentDialog.document.id);

      showApiResponse(result, {
        successTitle: 'Document supprimé',
        errorTitle: 'Erreur de suppression',
      });

      if (result.success) {
        setDeleteDocumentDialog({ open: false, document: null, loading: false });
        loadDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Erreur', 'Une erreur est survenue lors de la suppression');
    } finally {
      setDeleteDocumentDialog({ ...deleteDocumentDialog, loading: false });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return 'solar:gallery-bold';
    if (mimeType === 'application/pdf') return 'solar:file-text-bold';
    if (mimeType?.includes('word')) return 'solar:file-bold';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'solar:file-bold';
    return 'solar:document-bold';
  };

  const openEditClientDialog = () => {
    if (!client) return;
    setEditClientDialog({
      open: true,
      loading: false,
      formData: {
        nom: client.nom || '',
        numero: client.numero || '',
        email: client.email || '',
        service: client.service || '',
        commentaire: client.commentaire || '',
        status: client.status || client.statut || 'lead',
      },
    });
  };

  const handleUpdateClientInfo = async () => {
    if (!clientId) return;
    const { nom, numero, email, service, commentaire, status } = editClientDialog.formData;

    if (!nom?.trim() || !numero?.trim()) {
      showError('Erreur', 'Le nom et le numéro sont obligatoires');
      return;
    }

    setEditClientDialog((prev) => ({ ...prev, loading: true }));
    try {
      const result = await ConsumApi.updateClient(clientId, {
        nom,
        numero,
        email,
        service,
        commentaire,
        status,
      });

      const processed = showApiResponse(result, {
        successTitle: 'Client mis à jour',
        errorTitle: 'Erreur de mise à jour',
      });

      if (processed.success) {
        // Toujours recharger les données complètes pour garder tout en cohérence
        await loadClientData();
        setEditClientDialog({
          open: false,
          loading: false,
          formData: { nom: '', numero: '', email: '', service: '', commentaire: '', status: 'lead' },
        });
      } else {
        setEditClientDialog((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error updating client:', error);
      showError('Erreur', 'Impossible de mettre à jour le client');
      setEditClientDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const canDeleteClient = () => {
    const role = (admin?.role || '').toUpperCase();
    const service = (admin?.service || '').toLowerCase();
    return role === 'SUPERADMIN' || role === 'ADMIN' || service.includes('admin');
  };

  const handleDeleteClient = async () => {
    if (!clientId) return;

    setDeleteClientDialog((prev) => ({ ...prev, loading: true }));
    try {
      const result = await ConsumApi.deleteClient(clientId);
      const processed = showApiResponse(result, {
        successTitle: 'Client supprimé',
        errorTitle: 'Suppression impossible',
      });

      if (processed.success) {
        showSuccess('Succès', 'Client supprimé avec succès');
        setDeleteClientDialog({ open: false, loading: false });
        router.push('/clients');
      } else {
        setDeleteClientDialog((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      showError('Erreur', 'Impossible de supprimer le client');
      setDeleteClientDialog((prev) => ({ ...prev, loading: false }));
    }
  };


  const handleOpenSession = async () => {
    // Vérifier si le client est assigné à un commercial
    if (!client?.assignedTo) {
      showError('Erreur', 'Le client doit être assigné à un commercial avant de créer une session');
      setOpenSessionDialog({ open: false, loading: false, service: '' });
      setAssignDialog({ open: true, loading: false, userId: '' });
      return;
    }
  
    if (!openSessionDialog.service.trim()) {
      showError('Erreur', 'Le service est obligatoire');
      return;
    }
  
    setOpenSessionDialog(prev => ({ ...prev, loading: true }));
    try {
      const result = await ConsumApi.openClientSession(clientId, openSessionDialog.service);
      showApiResponse(result, {
        successTitle: 'Session ouverte',
        errorTitle: 'Erreur',
      });

      const processed = showApiResponse(result, {
        successTitle: 'Session ouverte',
        errorTitle: 'Erreur',
      });

      if (processed.success) {
        showSuccess('Succès', 'Session ouverte avec succès');
        setOpenSessionDialog({ open: false, loading: false, service: '' });
        loadClientData();
      } else {
        setOpenSessionDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error opening session:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Impossible d\'ouvrir la session';
      if (errorMessage.includes('non assigné') || errorMessage.includes('assigné')) {
        showError('Erreur', 'Le client doit être assigné à un commercial avant de créer une session');
        setOpenSessionDialog({ open: false, loading: false, service: '' });
        setAssignDialog({ open: true, loading: false, userId: '' });
      } else {
        showError('Erreur', errorMessage);
        setOpenSessionDialog(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const handleCloseSession = async () => {
    if (!closeSessionDialog.session) return;

    setCloseSessionDialog(prev => ({ ...prev, loading: true }));
    try {
      const result = await ConsumApi.closeClientSession(closeSessionDialog.session.id);
      showApiResponse(result, {
        successTitle: 'Session fermée',
        errorTitle: 'Erreur',
      });

      const processed = showApiResponse(result, {
        successTitle: 'Session fermée',
        errorTitle: 'Erreur',
      });

      if (processed && processed.success) {
        showSuccess('Succès', 'Session fermée avec succès');
        setCloseSessionDialog({ open: false, session: null, loading: false });
        loadClientData();
      } else {
        setCloseSessionDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error closing session:', error);
      showError('Erreur', 'Impossible de fermer la session');
      setCloseSessionDialog(prev => ({ ...prev, loading: false }));
    } 
  };

  const handleAddConclusion = async () => {
    if (!addConclusionDialog.text.trim()) {
      showError('Erreur', 'Le texte de la conclusion est obligatoire');
      return;
    }

    if (!addConclusionDialog.session) return;
    setAddConclusionDialog(prev => ({ ...prev, loading: true }));
    try {
      // Formater la reminderDate en ISO string si elle est fournie
      let reminderDate;
      if (addConclusionDialog.reminderDate) {
        // Si c'est un datetime-local, le convertir en ISO
        const dateValue = new Date(addConclusionDialog.reminderDate);
        if (!Number.isNaN(dateValue.getTime())) {
          reminderDate = dateValue.toISOString();
        }
      }

      const result = await ConsumApi.addSessionConclusion(addConclusionDialog.session.id, {
        text: addConclusionDialog.text.trim(),
        reminderDate,
      });

      const processed = showApiResponse(result, {
        successTitle: 'Conclusion ajoutée',
        errorTitle: 'Erreur',
      });

      if (processed && processed.success) {
        const message = reminderDate 
          ? 'Conclusion ajoutée avec succès. Un rendez-vous a été programmé et une notification a été envoyée au commercial.'
          : 'Conclusion ajoutée avec succès';
        showSuccess('Succès', message);
        setAddConclusionDialog({ open: false, session: null, loading: false, text: '', reminderDate: '' });
        loadClientData();
      } else {
        setAddConclusionDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error adding conclusion:', error);
      showError('Erreur', 'Impossible d\'ajouter la conclusion');
      setAddConclusionDialog(prev => ({ ...prev, loading: false }));
    } 
  };

  const handleUpdateStatus = async () => {
    setStatusDialog({ ...statusDialog, loading: true });
    try {
      const result = await ConsumApi.updateClientStatus(clientId, {
        status: statusDialog.status,
        step: statusDialog.step,
      });

      showApiResponse(result, {
        successTitle: 'Statut mis à jour',
        errorTitle: 'Erreur',
      });
      if (result.success === true) {
        showSuccess('Succès', 'Statut mis à jour avec succès');
        // Fermer le dialog immédiatement
        setStatusDialog({ open: false, loading: false, status: 'lead', step: 1 });
        loadClientData();
         // Sortir pour éviter d'exécuter le finally
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      // Ne réinitialiser que si le dialog est encore ouvert
      if (statusDialog.open) {
        setStatusDialog({ ...statusDialog, loading: false });
      }
    }
  };

  const handleAssignClient = async () => {
    if (!assignDialog.userId.trim()) {
      showError('Erreur', 'Veuillez sélectionner un commercial');
      return;
    }

    setAssignDialog(prev => ({ ...prev, loading: true }));
    try {
      const result = await ConsumApi.assignClient(clientId, assignDialog.userId);
      const processed = showApiResponse(result, {
        successTitle: 'Client assigné',
        errorTitle: 'Erreur',
      });

      if (processed && processed.success) {
        setAssignDialog({ open: false, loading: false, userId: '' });
        await loadClientData();
        // Si on venait d'essayer d'ouvrir une session, rouvrir le dialog
        if (openSessionDialog.service) {
          setOpenSessionDialog({ open: true, loading: false, service: openSessionDialog.service });
        }
      } else {
        setAssignDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error assigning client:', error);
      showError('Erreur', 'Impossible d\'assigner le client');
      setAssignDialog(prev => ({ ...prev, loading: false }));
    } 
  };

  const handleCreateFacture = async () => {
    if (!createFactureDialog.montantTotal || parseFloat(createFactureDialog.montantTotal) <= 0) {
      showError('Erreur', 'Le montant doit être supérieur à 0');
      return;
    }

    if (!activeSession) {
      showError('Erreur', 'Aucune session active');
      return;
    }

    setCreateFactureDialog({ ...createFactureDialog, loading: true });
    try {
      const result = await ConsumApi.createFacture({
        clientId,
        sessionId: activeSession.id,
        montantTotal: parseFloat(createFactureDialog.montantTotal),
        dateEcheance: createFactureDialog.dateEcheance || undefined,
        clientAddress: createFactureDialog.clientAddress || undefined,
        items: [
          {
            description: activeSession.service || 'Service',
            quantity: 1,
            unitPrice: parseFloat(createFactureDialog.montantTotal),
          },
        ],
      });

      const processed = showApiResponse(result, {
        successTitle: 'Facture créée',
        errorTitle: 'Erreur',
      });

      if (processed && processed.success) {
        showSuccess('Succès', 'Facture créée avec succès');
        setCreateFactureDialog({ open: false, loading: false, montantTotal: '', dateEcheance: '', clientAddress: '' });
        await loadSessionFactures(activeSession.id);
      }
    } catch (error) {
      console.error('Error creating facture:', error);
      showError('Erreur', 'Impossible de créer la facture');
    } finally {
      if (createFactureDialog.open) {
        setCreateFactureDialog({ ...createFactureDialog, loading: false });
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Stack spacing={2} alignItems="center">
            <LinearProgress sx={{ width: 200 }} />
            <Typography>Chargement...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (!client) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 3 }}>
          Client non trouvé
        </Alert>
      </Container>
    );
  }

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title>{client?.nom ? `Client ${client.nom} | Annour Travel` : 'Client | Annour Travel'}</title>
      </Helmet>

      <Container maxWidth="xl">
        {/* Header avec avatar et actions */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                color: 'primary.main',
                fontSize: 32,
                fontWeight: 'bold',
              }}
            >
              {getInitials(client.nom)}
            </Avatar>

            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                <Typography variant="h4">{client.nom}</Typography>
                <Chip
                  label={client.status || 'lead'}
                  color={STATUS_COLORS[client.status] || 'default'}
                  size="small"
                />
              </Stack>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:phone-bold" width={20} sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {client.numero}
                  </Typography>
                </Stack>
                {client.email && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify icon="solar:letter-bold" width={20} sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {client.email}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:calendar-bold" width={20} sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Créé le {client.createdAt ? fDate(client.createdAt) : '-'}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              <IconButton onClick={() => router.back()} size="large">
                <Iconify icon="eva:arrow-ios-back-fill" />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:settings-bold" />}
                onClick={() =>
                  setStatusDialog({
                    open: true,
                    loading: false,
                    status: client.status || 'lead',
                    step: client.step || 1,
                  })
                }
              >
                Modifier le statut
              </Button>
              {!client?.assignedTo && (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<Iconify icon="solar:user-check-rounded-bold" />}
                  onClick={async () => {
                    if (commerciaux.length === 0 && !loadingCommerciaux) {
                      await loadCommerciaux();
                    }
                    setAssignDialog({ open: true, loading: false, userId: '' });
                  }}
                >
                  Assigner
                </Button>
              )}
              {canDeleteClient() && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                  onClick={() => setDeleteClientDialog({ open: true, loading: false })}
                >
                  Supprimer
                </Button>
              )}
              {activeSession ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Iconify icon="solar:close-circle-bold" />}
                  onClick={() => setCloseSessionDialog({ open: true, session: activeSession, loading: false })}
                >
                  Fermer session
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() => {
                    // Vérifier si le client est assigné avant d'ouvrir le dialog
                    if (!client?.assignedTo) {
                      showError('Erreur', 'Le client doit être assigné à un commercial avant de créer une session');
                      setAssignDialog({ open: true, loading: false, userId: '' });
                    } else {
                      setOpenSessionDialog({ open: true, loading: false, service: '' });
                    }
                  }}
                >
                  Nouvelle session
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ px: 2.5, pt: 1 }}>
            <Tab
              label="Vue d'ensemble"
              value="overview"
              icon={<Iconify icon="solar:widget-5-bold" />}
              iconPosition="start"
            />
            <Tab
              label="Sessions"
              value="sessions"
              icon={<Iconify icon="solar:document-bold" />}
              iconPosition="start"
            />
            <Tab
              label="Informations"
              value="info"
              icon={<Iconify icon="solar:user-bold" />}
              iconPosition="start"
            />
            <Tab
              label="Documents"
              value="documents"
              icon={<Iconify icon="solar:folder-with-files-bold" />}
              iconPosition="start"
            />
          </Tabs>
        </Card>

        {/* Tab Content */}
        {currentTab === 'overview' && (
          <Grid container spacing={3}>
            {/* Statistiques rapides */}
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Iconify icon="solar:document-bold" width={40} sx={{ color: 'primary.main', mb: 1 }} />
                <Typography variant="h4">{sessions.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sessions totales
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Iconify
                  icon="solar:check-circle-bold"
                  width={40}
                  sx={{ color: activeSession ? 'success.main' : 'text.disabled', mb: 1 }}
                />
                <Typography variant="h4">{activeSession ? 1 : 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Session active
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Iconify icon="solar:chat-round-bold" width={40} sx={{ color: 'info.main', mb: 1 }} />
                <Typography variant="h4">
                  {sessions.reduce((acc, s) => acc + (s.conclusions?.length || 0), 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conclusions
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Iconify icon="solar:user-check-rounded-bold" width={40} sx={{ color: 'warning.main', mb: 1 }} />
                <Typography variant="h4">{client.assignedTo ? 'Oui' : 'Non'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Assigné
                </Typography>
              </Card>
            </Grid>

            {/* Résumé Session active */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Session Active</Typography>
                  {activeSession && (
                    <Chip
                      label={activeSession.status}
                      color={SESSION_STATUS_COLORS[activeSession.status] || 'default'}
                      size="small"
                    />
                  )}
                </Stack>
                <Divider sx={{ mb: 3 }} />

                {activeSession ? (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Service
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {activeSession.service}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Date d&apos;ouverture
                      </Typography>
                      <Typography variant="body1">
                        {activeSession.createdAt ? fDate(activeSession.createdAt) : '-'}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Conclusions
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {activeSession.conclusions?.length || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Factures
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {sessionFactures.length}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setCurrentTab('sessions')}
                      endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                    >
                      Voir les détails de la session
                    </Button>
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Iconify icon="solar:document-add-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Aucune session active
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setCurrentTab('sessions')}
                      sx={{ mt: 2 }}
                      endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                    >
                      Voir les sessions
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        )}

        {currentTab === 'sessions' && (
          <Stack spacing={3}>
            {/* Session Active - Section détaillée */}
            {activeSession && (
              <Card sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Iconify icon="solar:document-bold" width={24} sx={{ color: 'primary.main' }} />
                    <Typography variant="h6">Session Active</Typography>
                    <Chip
                      label={activeSession.status}
                      color={SESSION_STATUS_COLORS[activeSession.status] || 'default'}
                      size="small"
                    />
                  </Stack>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Iconify icon="solar:close-circle-bold" />}
                    onClick={() => setCloseSessionDialog({ open: true, session: activeSession, loading: false })}
                  >
                    Fermer la session
                  </Button>
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Service
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {activeSession.service}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Date d&apos;ouverture
                        </Typography>
                        <Typography variant="body1">
                          {activeSession.createdAt ? fDate(activeSession.createdAt) : '-'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Conclusions */}
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Conclusions ({activeSession.conclusions?.length || 0})
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Iconify icon="mingcute:add-line" />}
                          onClick={() =>
                            setAddConclusionDialog({
                              open: true,
                              session: activeSession,
                              loading: false,
                              text: '',
                              reminderDate: '',
                            })
                          }
                        >
                          Ajouter
                        </Button>
                      </Stack>
                      {activeSession.conclusions && activeSession.conclusions.length > 0 ? (
                        <Stack spacing={1.5}>
                          {activeSession.conclusions.map((conclusion) => (
                            <Paper
                              key={conclusion.id}
                              sx={{
                                p: 2,
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                borderLeft: 3,
                                borderColor: 'primary.main',
                              }}
                            >
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {conclusion.text}
                              </Typography>
                              <Stack direction="row" spacing={2}>
                                <Typography variant="caption" color="text.secondary">
                                  {fDate(conclusion.createdAt)}
                                </Typography>
                                {conclusion.reminderDate && (
                                  <Typography variant="caption" color="warning.main">
                                    Rappel: {fDate(conclusion.reminderDate)}
                                  </Typography>
                                )}
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      ) : (
                        <Alert severity="info">Aucune conclusion</Alert>
                      )}
                    </Box>
                  </Grid>

                  {/* Facturation */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Facturation ({sessionFactures.length})
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Iconify icon="solar:bill-list-bold" />}
                          onClick={() =>
                            setCreateFactureDialog({
                              open: true,
                              loading: false,
                              montantTotal: '',
                              dateEcheance: '',
                              clientAddress: '',
                            })
                          }
                        >
                          Demander facturation
                        </Button>
                      </Stack>

                      {loadingFactures && (
                        <Box sx={{ py: 2, textAlign: 'center' }}>
                          <LinearProgress />
                        </Box>
                      )}
                      {!loadingFactures && sessionFactures.length === 0 && (
                        <Alert severity="info">Aucune facture pour cette session</Alert>
                      )}
                      {!loadingFactures && sessionFactures.length > 0 && (
                        <Stack spacing={2}>
                          {sessionFactures.map((facture) => {
                            const statusText = {
                              pending: 'En attente',
                              partial: 'Partiel',
                              paid: 'Payé',
                              overdue: 'En retard',
                            };
                            return (
                              <Paper
                                key={facture.id}
                                sx={{
                                  p: 2,
                                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                  borderLeft: 3,
                                  borderColor: (theme) =>
                                    FACTURE_STATUS_COLORS[facture.status]
                                      ? theme.palette[FACTURE_STATUS_COLORS[facture.status]]?.main || 'primary.main'
                                      : 'primary.main',
                                }}
                              >
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                      {facture.numeroFacture || `Facture #${facture.id.slice(0, 8)}`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {facture.dateFacture ? fDate(facture.dateFacture) : '-'}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={statusText[facture.status] || facture.status}
                                    color={FACTURE_STATUS_COLORS[facture.status] || 'default'}
                                    size="small"
                                  />
                                </Stack>
                                <Divider sx={{ my: 1.5 }} />
                                <Grid container spacing={2}>
                                  <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">
                                      Montant total
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {fNumber(facture.montantTotal || 0)} FCFA
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">
                                      Payé
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                      {fNumber(facture.montantPaye || 0)} FCFA
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">
                                      Restant
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                      {fNumber(facture.montantRestant || 0)} FCFA
                                    </Typography>
                                  </Grid>
                                </Grid>
                                {facture.status === 'partial' && (
                                  <Alert severity="info" sx={{ mt: 1.5 }}>
                                    Paiement partiel : {fNumber(facture.montantPaye || 0)} FCFA sur{' '}
                                    {fNumber(facture.montantTotal || 0)} FCFA. Il reste{' '}
                                    {fNumber(facture.montantRestant || 0)} FCFA à payer.
                                  </Alert>
                                )}
                                {facture.status === 'pending' && (
                                  <Alert severity="warning" sx={{ mt: 1.5 }}>
                                    En attente de paiement : {fNumber(facture.montantTotal || 0)} FCFA à payer.
                                  </Alert>
                                )}
                                {facture.status === 'paid' && (
                                  <Alert severity="success" sx={{ mt: 1.5 }}>
                                    Facture entièrement payée.
                                  </Alert>
                                )}
                              </Paper>
                            );
                          })}
                        </Stack>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            )}

            {/* Historique des Sessions */}
            <Card>
              <Box sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    {activeSession ? 'Historique des Sessions' : 'Sessions'}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => {
                      if (!client?.assignedTo) {
                        showError('Erreur', 'Le client doit être assigné à un commercial avant de créer une session');
                        setAssignDialog({ open: true, loading: false, userId: '' });
                      } else {
                        setOpenSessionDialog({ open: true, loading: false, service: '' });
                      }
                    }}
                  >
                    Nouvelle session
                  </Button>
                </Stack>
                <Divider sx={{ mt: 2 }} />
              </Box>
              <Scrollbar>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Date d&apos;ouverture</TableCell>
                        <TableCell>Date de fermeture</TableCell>
                        <TableCell>Conclusions</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                            <Iconify icon="solar:document-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                              Aucune session
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        sessions.map((session) => (
                          <TableRow key={session.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2">{session.service}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={session.status}
                                color={SESSION_STATUS_COLORS[session.status] || 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{session.createdAt ? fDate(session.createdAt) : '-'}</TableCell>
                            <TableCell>{session.closedAt ? fDate(session.closedAt) : '-'}</TableCell>
                            <TableCell>
                              <Chip label={session.conclusions?.length || 0} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              {session.status === 'active' && (
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setAddConclusionDialog({
                                      open: true,
                                      session,
                                      loading: false,
                                      text: '',
                                      reminderDate: '',
                                    })
                                  }
                                >
                                  <Iconify icon="mingcute:add-line" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Scrollbar>
            </Card>
          </Stack>
        )}

        {currentTab === 'info' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">Informations de Contact</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Iconify icon="solar:pen-bold" />}
                    onClick={openEditClientDialog}
                  >
                    Modifier
                  </Button>
                </Stack>
                <Divider sx={{ mb: 3 }} />
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Nom complet
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {client.nom}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Numéro de téléphone
                    </Typography>
                    <Typography variant="body1">{client.numero}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1">{client.email || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Service
                    </Typography>
                    <Typography variant="body1">{client.service || '-'}</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Informations Système
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Statut
                    </Typography>
                    <Chip
                      label={client.status || 'lead'}
                      color={STATUS_COLORS[client.status] || 'default'}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Étape
                    </Typography>
                    <Typography variant="body1">{client.step || 1}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Assigné à
                    </Typography>
                    <Typography variant="body1">{client.assignedTo || 'Non assigné'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Date de création
                    </Typography>
                    <Typography variant="body1">{client.createdAt ? fDate(client.createdAt) : '-'}</Typography>
                  </Box>
                  {client.commentaire && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Commentaire
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                        <Typography variant="body2">{client.commentaire}</Typography>
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {currentTab === 'documents' && (
          <Card sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Documents du client</Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:upload-bold" />}
                  onClick={() => setUploadDocumentDialog({ open: true, loading: false, file: null, title: '' })}
                >
                  Uploader un document
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:folder-with-files-bold" />}
                  onClick={() => setUploadMultipleDialog({ open: true, loading: false, files: [], titles: [] })}
                >
                  Uploader plusieurs documents
                </Button>
              </Stack>
            </Stack>

            {loadingDocuments && (
              <Box sx={{ py: 5 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                  Chargement des documents...
                </Typography>
              </Box>
            )}
            {!loadingDocuments && documents.length === 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Aucun document uploadé pour ce client.
                </Typography>
              </Alert>
            )}
            {!loadingDocuments && documents.length > 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell>Titre</TableCell>
                      <TableCell>Taille</TableCell>
                      <TableCell>Date d&apos;upload</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Iconify icon={getFileIcon(document.mimeType)} width={24} />
                            <Typography variant="body2">{document.fileName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {document.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatFileSize(document.fileSize)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {document.createdAt ? fDate(document.createdAt) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {document.fileUrl && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => window.open(getDocumentUrl(document.fileUrl), '_blank')}
                                title="Télécharger"
                              >
                                <Iconify icon="solar:download-bold" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDocumentDialog({ open: true, document, loading: false })}
                              title="Supprimer"
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {/* Dialog ouvrir session */}
        <Dialog
          open={openSessionDialog.open}
          onClose={() => setOpenSessionDialog({ open: false, loading: false, service: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Ouvrir une session</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Service *</InputLabel>
              <Select
                value={openSessionDialog.service}
                label="Service *"
                onChange={(e) => setOpenSessionDialog({ ...openSessionDialog, service: e.target.value })}
              >
                {SERVICE_OPTIONS.map((service) => (
                  <MenuItem key={service.value} value={service.value}>
                    {service.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSessionDialog({ open: false, loading: false, service: '' })}>
              Annuler
            </Button>
            <LoadingButton variant="contained" onClick={handleOpenSession} loading={openSessionDialog.loading}>
              Ouvrir
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog fermer session */}
        <Dialog
          open={closeSessionDialog.open}
          onClose={() => setCloseSessionDialog({ open: false, session: null, loading: false })}
        >
          <DialogTitle>Fermer la session</DialogTitle>
          <DialogContent>
            <Typography>Êtes-vous sûr de vouloir fermer cette session ?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCloseSessionDialog({ open: false, session: null, loading: false })}>
              Annuler
            </Button>
            <LoadingButton
              variant="contained"
              color="error"
              onClick={handleCloseSession}
              loading={closeSessionDialog.loading}
            >
              Fermer
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog ajouter conclusion */}
        <Dialog
          open={addConclusionDialog.open}
          onClose={() => setAddConclusionDialog({ open: false, session: null, loading: false, text: '', reminderDate: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Ajouter une conclusion</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Texte *"
                fullWidth
                multiline
                rows={4}
                value={addConclusionDialog.text}
                onChange={(e) => setAddConclusionDialog({ ...addConclusionDialog, text: e.target.value })}
              />
              <TextField
                label="Date de rappel (optionnel)"
                fullWidth
                type="datetime-local"
                value={addConclusionDialog.reminderDate}
                onChange={(e) => setAddConclusionDialog({ ...addConclusionDialog, reminderDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setAddConclusionDialog({ open: false, session: null, loading: false, text: '', reminderDate: '' })}
            >
              Annuler
            </Button>
            <LoadingButton variant="contained" onClick={handleAddConclusion} loading={addConclusionDialog.loading}>
              Ajouter
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog modifier statut */}
        <Dialog
          open={statusDialog.open}
          onClose={() => setStatusDialog({ open: false, loading: false, status: 'lead', step: 1 })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Modifier le statut</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={statusDialog.status}
                  label="Statut"
                  onChange={(e) => setStatusDialog({ ...statusDialog, status: e.target.value })}
                >
                  <MenuItem value="lead">Lead</MenuItem>
                  <MenuItem value="prospect">Prospect</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                  <MenuItem value="archived">Archivé</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog({ open: false, loading: false, status: 'lead', step: 1 })}>
              Annuler
            </Button>
            <LoadingButton variant="contained" onClick={handleUpdateStatus} loading={statusDialog.loading}>
              Enregistrer
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog assigner client */}
        <Dialog
          open={assignDialog.open}
          onClose={() => setAssignDialog({ open: false, loading: false, userId: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={2} alignItems="center">
              <Iconify icon="solar:user-check-rounded-bold" width={24} />
              <Box>
                <Typography variant="h6">Assigner le client</Typography>
                <Typography variant="caption" color="text.secondary">
                  {client?.nom}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Commercial actuel */}
              {client?.assignedTo && (
                <Alert severity="info">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Iconify icon="solar:user-check-rounded-bold" width={20} />
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Commercial actuellement assigné
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getCommercialName(client.assignedTo)}
                      </Typography>
                    </Box>
                  </Stack>
                </Alert>
              )}

              {loadingCommerciaux && (
                <Box sx={{ py: 3 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                    Chargement des commerciaux...
                  </Typography>
                </Box>
              )}
              {!loadingCommerciaux && commerciaux.length === 0 && (
                <Alert severity="warning">
                  <Typography variant="body2" gutterBottom>
                    Aucun commercial disponible dans la liste.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Vous pouvez entrer l&apos;ID du commercial manuellement ci-dessous.
                  </Typography>
                </Alert>
              )}
              {!loadingCommerciaux && commerciaux.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>Commercial *</InputLabel>
                  <Select
                    value={assignDialog.userId}
                    label="Commercial *"
                    onChange={(e) => setAssignDialog({ ...assignDialog, userId: e.target.value })}
                    renderValue={(selected) => {
                      if (!selected) return '';
                      // Chercher dans la liste des commerciaux chargés
                      const selectedCommercial = commerciaux.find((c) => c.id === selected);
                      if (selectedCommercial?.name) {
                        return selectedCommercial.name;
                      }
                      // Si le commercial n'est pas dans la liste, utiliser getCommercialName
                      // en créant un objet temporaire avec l'ID
                      const tempAssignedTo = { id: selected };
                      const name = getCommercialName(tempAssignedTo);
                      if (name && name !== 'Non assigné' && name !== 'Commercial inconnu') {
                        return name;
                      }
                      // Si toujours pas trouvé, chercher dans client.assignedTo
                      if (client?.assignedTo) {
                        const assignedToId = typeof client.assignedTo === 'object' && client.assignedTo !== null
                          ? client.assignedTo.id || client.assignedTo.userId
                          : client.assignedTo;
                        if (assignedToId === selected) {
                          const nameFromClient = getCommercialName(client.assignedTo);
                          if (nameFromClient && nameFromClient !== 'Non assigné' && nameFromClient !== 'Commercial inconnu') {
                            return nameFromClient;
                          }
                        }
                      }
                      return 'Sélectionner un commercial';
                    }}
                  >
                    {commerciaux.map((commercial) => (
                      <MenuItem key={commercial.id} value={commercial.id}>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {commercial.name}
                          </Typography>
                          {commercial.email && commercial.email !== commercial.name && (
                            <Typography variant="caption" color="text.secondary">
                              {commercial.email}
                            </Typography>
                          )}
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialog({ open: false, loading: false, userId: '' })}>Annuler</Button>
            <LoadingButton
              variant="contained"
              onClick={handleAssignClient}
              loading={assignDialog.loading}
              disabled={!assignDialog.userId.trim()}
              startIcon={<Iconify icon="solar:user-check-rounded-bold" />}
            >
              Assigner
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog éditer client */}
        <Dialog
          open={editClientDialog.open}
          onClose={() =>
            setEditClientDialog({
              open: false,
              loading: false,
              formData: { nom: '', numero: '', email: '', service: '', commentaire: '', status: 'lead' },
            })
          }
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Nom *"
                fullWidth
                value={editClientDialog.formData.nom}
                onChange={(e) =>
                  setEditClientDialog({
                    ...editClientDialog,
                    formData: { ...editClientDialog.formData, nom: e.target.value },
                  })
                }
              />
              <TextField
                label="Numéro *"
                fullWidth
                value={editClientDialog.formData.numero}
                onChange={(e) =>
                  setEditClientDialog({
                    ...editClientDialog,
                    formData: { ...editClientDialog.formData, numero: e.target.value },
                  })
                }
              />
              <TextField
                label="Email (optionnel)"
                fullWidth
                type="email"
                value={editClientDialog.formData.email}
                onChange={(e) =>
                  setEditClientDialog({
                    ...editClientDialog,
                    formData: { ...editClientDialog.formData, email: e.target.value },
                  })
                }
              />
              <TextField
                label="Service"
                fullWidth
                value={editClientDialog.formData.service}
                onChange={(e) =>
                  setEditClientDialog({
                    ...editClientDialog,
                    formData: { ...editClientDialog.formData, service: e.target.value },
                  })
                }
                placeholder="Ex: Visa Canada"
              />
              <TextField
                label="Commentaire"
                fullWidth
                multiline
                rows={3}
                value={editClientDialog.formData.commentaire}
                onChange={(e) =>
                  setEditClientDialog({
                    ...editClientDialog,
                    formData: { ...editClientDialog.formData, commentaire: e.target.value },
                  })
                }
              />
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={editClientDialog.formData.status}
                  label="Statut"
                  onChange={(e) =>
                    setEditClientDialog({
                      ...editClientDialog,
                      formData: { ...editClientDialog.formData, status: e.target.value },
                    })
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setEditClientDialog({
                  open: false,
                  loading: false,
                  formData: { nom: '', numero: '', email: '', service: '', commentaire: '', status: 'lead' },
                })
              }
              disabled={editClientDialog.loading}
            >
              Annuler
            </Button>
            <LoadingButton
              variant="contained"
              onClick={handleUpdateClientInfo}
              loading={editClientDialog.loading}
              startIcon={<Iconify icon="solar:pen-bold" />}
            >
              Enregistrer
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog supprimer client */}
        <Dialog
          open={deleteClientDialog.open}
          onClose={() => setDeleteClientDialog({ open: false, loading: false })}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Supprimer le client</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography>
                Cette action supprimera le client s&apos;il n&apos;a pas de sessions, factures ou paiements associés.
              </Typography>
              <Alert severity="warning">
                Vérifiez qu&apos;aucune session/facture/paiement n&apos;est lié à ce client avant de confirmer.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteClientDialog({ open: false, loading: false })} disabled={deleteClientDialog.loading}>
              Annuler
            </Button>
            <LoadingButton
              color="error"
              variant="contained"
              onClick={handleDeleteClient}
              loading={deleteClientDialog.loading}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            >
              Supprimer
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog créer facture */}
        <Dialog
          open={createFactureDialog.open}
          onClose={() => setCreateFactureDialog({ open: false, loading: false, montantTotal: '', dateEcheance: '', clientAddress: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Demander une facturation</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Montant à facturer (FCFA) *"
                fullWidth
                type="number"
                value={createFactureDialog.montantTotal}
                onChange={(e) => setCreateFactureDialog({ ...createFactureDialog, montantTotal: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Montant total à facturer pour cette session"
              />
              <TextField
                label="Date d'échéance (optionnel)"
                fullWidth
                type="date"
                value={createFactureDialog.dateEcheance}
                onChange={(e) => setCreateFactureDialog({ ...createFactureDialog, dateEcheance: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Adresse du client (optionnel)"
                fullWidth
                multiline
                rows={2}
                value={createFactureDialog.clientAddress}
                onChange={(e) => setCreateFactureDialog({ ...createFactureDialog, clientAddress: e.target.value })}
                helperText="Adresse à inclure sur la facture"
              />
              {activeSession && (
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Service :</strong> {activeSession.service}
                  </Typography>
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setCreateFactureDialog({ open: false, loading: false, montantTotal: '', dateEcheance: '', clientAddress: '' })}
            >
              Annuler
            </Button>
            <LoadingButton
              variant="contained"
              onClick={handleCreateFacture}
              loading={createFactureDialog.loading}
              disabled={!createFactureDialog.montantTotal || parseFloat(createFactureDialog.montantTotal) <= 0}
              startIcon={<Iconify icon="solar:bill-list-bold" />}
            >
              Créer la facture
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog uploader un document */}
        <Dialog
          open={uploadDocumentDialog.open}
          onClose={() => setUploadDocumentDialog({ open: false, loading: false, file: null, title: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Uploader un document</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Titre du document *"
                fullWidth
                value={uploadDocumentDialog.title}
                onChange={(e) => setUploadDocumentDialog({ ...uploadDocumentDialog, title: e.target.value })}
                placeholder="Ex: Passeport, Visa, etc."
              />
              <Box>
                <input
                  accept="*/*"
                  style={{ display: 'none' }}
                  id="upload-document-file"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadDocumentDialog({ ...uploadDocumentDialog, file });
                    }
                  }}
                />
                <label htmlFor="upload-document-file">
                  <Button variant="outlined" component="span" fullWidth startIcon={<Iconify icon="solar:upload-bold" />}>
                    {uploadDocumentDialog.file ? uploadDocumentDialog.file.name : 'Sélectionner un fichier'}
                  </Button>
                </label>
                {uploadDocumentDialog.file && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Taille: {formatFileSize(uploadDocumentDialog.file.size)}
                  </Typography>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDocumentDialog({ open: false, loading: false, file: null, title: '' })}>
              Annuler
            </Button>
            <LoadingButton
              variant="contained"
              onClick={handleUploadDocument}
              loading={uploadDocumentDialog.loading}
              disabled={!uploadDocumentDialog.file || !uploadDocumentDialog.title.trim()}
              startIcon={<Iconify icon="solar:upload-bold" />}
            >
              Uploader
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog uploader plusieurs documents */}
        <Dialog
          open={uploadMultipleDialog.open}
          onClose={() => setUploadMultipleDialog({ open: false, loading: false, files: [], titles: [] })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Uploader plusieurs documents</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  Vous pouvez uploader jusqu&apos;à 10 fichiers. Les titres doivent être dans le même ordre que les fichiers.
                </Typography>
              </Alert>
              <Box>
                <input
                  accept="*/*"
                  style={{ display: 'none' }}
                  id="upload-multiple-files"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 10) {
                      showError('Erreur', 'Maximum 10 fichiers autorisés');
                      return;
                    }
                    const titles = files.map(() => '');
                    setUploadMultipleDialog({ ...uploadMultipleDialog, files, titles });
                  }}
                />
                <label htmlFor="upload-multiple-files">
                  <Button variant="outlined" component="span" fullWidth startIcon={<Iconify icon="solar:folder-with-files-bold" />}>
                    Sélectionner les fichiers ({uploadMultipleDialog.files.length})
                  </Button>
                </label>
              </Box>
              {uploadMultipleDialog.files.length > 0 && (
                <Stack spacing={2}>
                  {uploadMultipleDialog.files.map((file, index) => (
                    <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Iconify icon={getFileIcon(file.type)} width={24} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(file.size)}
                            </Typography>
                          </Box>
                        </Stack>
                        <TextField
                          label={`Titre pour ${file.name} *`}
                          fullWidth
                          size="small"
                          value={uploadMultipleDialog.titles[index] || ''}
                          onChange={(e) => {
                            const newTitles = [...uploadMultipleDialog.titles];
                            newTitles[index] = e.target.value;
                            setUploadMultipleDialog({ ...uploadMultipleDialog, titles: newTitles });
                          }}
                          placeholder="Ex: Passeport, Visa, etc."
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadMultipleDialog({ open: false, loading: false, files: [], titles: [] })}>
              Annuler
            </Button>
            <LoadingButton
              variant="contained"
              onClick={handleUploadMultipleDocuments}
              loading={uploadMultipleDialog.loading}
              disabled={uploadMultipleDialog.files.length === 0}
              startIcon={<Iconify icon="solar:upload-bold" />}
            >
              Uploader {uploadMultipleDialog.files.length} document(s)
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Dialog supprimer document */}
        <Dialog
          open={deleteDocumentDialog.open}
          onClose={() => setDeleteDocumentDialog({ open: false, document: null, loading: false })}
        >
          <DialogTitle>Supprimer le document</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer le document &quot;{deleteDocumentDialog.document?.title}&quot; ?
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDocumentDialog({ open: false, document: null, loading: false })}>
              Annuler
            </Button>
            <LoadingButton
              variant="contained"
              color="error"
              onClick={handleDeleteDocument}
              loading={deleteDocumentDialog.loading}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            >
              Supprimer
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
