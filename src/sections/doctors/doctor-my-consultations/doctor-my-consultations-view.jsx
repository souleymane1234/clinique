import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  Divider,
  MenuItem,
  TableRow,
  Checkbox,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  InputAdornment,
  TableContainer,
  TablePagination,
  FormControlLabel,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDateTime } from 'src/utils/format-time';
import { appendBillingInvoiceTag } from 'src/utils/billing-utils';
import { closeActiveTracking, startMedecinServicePassage } from 'src/utils/time-tracking-client';

import ConsumApi from 'src/services_workers/consum_api';
import { AdminStorage } from 'src/storages/admins_storage';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  EN_ATTENTE: 'warning',
  EN_COURS: 'info',
  TERMINEE: 'success',
  ANNULEE: 'error',
};

const STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

const CONSULTATION_TYPES = {
  PREMIERE_CONSULTATION: 'Première consultation',
  CONSULTATION_SUIVI: 'Consultation de suivi',
  URGENCE: 'Urgence',
};

function laboratoryAnalysisConsultationId(analysis) {
  if (!analysis || typeof analysis !== 'object') return undefined;
  return (
    analysis.consultationId ||
    analysis.consultation_id ||
    analysis.consultation?.id ||
    undefined
  );
}

function laboratoryAnalysisPatientId(analysis) {
  if (!analysis || typeof analysis !== 'object') return undefined;
  return (
    analysis.patientId ||
    analysis.patient_id ||
    analysis.patient?.id ||
    undefined
  );
}

/** N’affiche que les analyses de cette consultation / ce patient (l’API peut ignorer les query params). */
function filterLaboratoryAnalysesForConsultation(analysesList, { consultationId, patientId, medecinId }) {
  if (!Array.isArray(analysesList)) return [];
  return analysesList.filter((analysis) => {
    if (medecinId) {
      const docOk =
        analysis.prescribingDoctor?.id === medecinId || analysis.prescribingDoctorId === medecinId;
      if (!docOk) return false;
    }
    const ap = laboratoryAnalysisPatientId(analysis);
    if (patientId != null && patientId !== '' && ap != null && ap !== patientId) return false;
    const ac = laboratoryAnalysisConsultationId(analysis);
    if (consultationId != null && consultationId !== '' && ac != null && ac !== consultationId) return false;
    if (consultationId != null && consultationId !== '' && ac === consultationId) return true;
    if (patientId != null && patientId !== '' && ap === patientId) return true;
    return false;
  });
}

/** Prix unitaire renvoyé par l’API pricing/exams : calculatedPrice, sinon price, sinon baseUnitCost */
function getPricingExamUnitPrice(ex) {
  if (!ex || typeof ex !== 'object') return 0;
  const calculated = Number(ex.calculatedPrice);
  if (!Number.isNaN(calculated) && calculated > 0) return calculated;
  const priceField = Number(ex.price);
  if (!Number.isNaN(priceField) && priceField > 0) return priceField;
  const base = Number(ex.baseUnitCost);
  if (!Number.isNaN(base) && base > 0) return base;
  return 0;
}

export default function DoctorMyConsultationsView() {
  const router = useRouter();
  const { contextHolder, showError, showSuccess, showApiResponse } = useNotification();
  const adminInfo = AdminStorage.getInfoAdmin() || {};
  const normalizedRole = String(adminInfo?.role?.name || adminInfo?.role || adminInfo?.service || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  const isAdminOrDirecteur = normalizedRole === 'ADMIN' || normalizedRole === 'DIRECTEUR' || normalizedRole === 'ADMINISTRATEUR';

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // Par défaut, afficher toutes les consultations (EN_ATTENTE et EN_COURS)
  const [detailsDialog, setDetailsDialog] = useState({ open: false, consultation: null, loading: false, editing: false });
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [certificats, setCertificats] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [analysisResultsDialog, setAnalysisResultsDialog] = useState({ open: false, analysisId: null, results: [], loading: false });
  const [prescriptionDialog, setPrescriptionDialog] = useState({ open: false, loading: false, isAnalysis: false });
  const [certificatDialog, setCertificatDialog] = useState({ open: false, loading: false });
  const [prescriptionForm, setPrescriptionForm] = useState({
    type: 'MEDICAMENT',
    label: '',
    dosage: '',
    duration: '',
    quantity: 0,
    instructions: '',
    urgent: false,
  });
  const [examTariffs, setExamTariffs] = useState([]);
  const [analysisForm, setAnalysisForm] = useState({
    analysisName: '',
    analysisType: 'HEMATOLOGIE',
    sampleType: 'SANG',
    observations: '',
    urgent: false,
    price: 0,
    pricingExamId: '',
  });
  const [certificatForm, setCertificatForm] = useState({
    type: 'ARRET_TRAVAIL',
    content: '',
    durationDays: 0,
    startDate: '',
    endDate: '',
  });
  const [currentMedecinId, setCurrentMedecinId] = useState(null);

  // Récupérer l'ID du médecin connecté
  useEffect(() => {
    const loadCurrentMedecin = async () => {
      try {
        console.log('=== DEBUG: Loading current medecin ===');
        
        // Récupérer les informations de l'utilisateur connecté
        const storedAdminInfo = AdminStorage.getInfoAdmin();
        console.log('1. Admin info from storage:', storedAdminInfo);
        
        // Si l'utilisateur a un ID de médecin directement
        if (storedAdminInfo.medecinId || storedAdminInfo.medecin?.id) {
          const medecinId = storedAdminInfo.medecinId || storedAdminInfo.medecin?.id;
          console.log('2. Found medecinId in adminInfo:', medecinId);
          setCurrentMedecinId(medecinId);
          return;
        }
        
        // Sinon, essayer de récupérer l'utilisateur depuis l'API
        console.log('3. Fetching current user from API...');
        const userResult = await ConsumApi.getCurrentUser();
        console.log('4. User result:', userResult);
        
        if (userResult.success && userResult.data) {
          const userData = userResult.data;
          console.log('5. User data:', userData);
          
          // Chercher l'ID du médecin dans les données utilisateur
          if (userData.medecinId || userData.medecin?.id) {
            const medecinId = userData.medecinId || userData.medecin?.id;
            console.log('6. Found medecinId in userData:', medecinId);
            setCurrentMedecinId(medecinId);
            return;
          }
          
          // Si l'utilisateur a un ID, chercher le médecin associé
          if (userData.id) {
            console.log('7. Searching for medecin with userId:', userData.id);
            const medecinsResult = await ConsumApi.getMedecins({});
            console.log('8. Medecins result:', medecinsResult);
            
            if (medecinsResult.success) {
              let medecins = [];
              if (Array.isArray(medecinsResult.data)) {
                medecins = medecinsResult.data;
              } else if (medecinsResult.data && Array.isArray(medecinsResult.data.data)) {
                medecins = medecinsResult.data.data;
              } else if (medecinsResult.data && typeof medecinsResult.data === 'object') {
                medecins = medecinsResult.data.medecins || medecinsResult.data.items || [];
              }
              
              console.log('9. Medecins list:', medecins);
              
              // Chercher le médecin par l'ID utilisateur
              const medecin = medecins.find(
                (m) => 
                  m.user?.id === userData.id || 
                  m.userId === userData.id ||
                  m.user?.id === storedAdminInfo.id ||
                  m.userId === storedAdminInfo.id
              );
              
              if (medecin) {
                console.log('10. Found medecin:', medecin);
                setCurrentMedecinId(medecin.id);
              } else {
                console.warn('11. No medecin found for user:', userData.id, storedAdminInfo.id);
              }
            }
          }
        } else {
          console.warn('12. Failed to get current user:', userResult.message);
        }
      } catch (error) {
        console.error('Error loading current medecin:', error);
        console.error('Error stack:', error.stack);
      }
    };
    
    loadCurrentMedecin();
  }, []);

  const loadConsultations = useCallback(async () => {
    if (!isAdminOrDirecteur && !currentMedecinId) {
      console.log('⏳ Waiting for medecin ID...');
      return;
    }

    console.log('=== DEBUG: Loading consultations ===');
    console.log('Current medecinId:', currentMedecinId);
    console.log('Status filter:', statusFilter);
    console.log('Page:', page, 'RowsPerPage:', rowsPerPage);

    setLoading(true);
    try {
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (!isAdminOrDirecteur) {
        filters.medecinId = currentMedecinId; // Filtrer par médecin connecté
      }

      // Si un statut est sélectionné, l'ajouter au filtre
      if (statusFilter) {
        filters.status = statusFilter;
      }

      console.log('Filters sent to API:', filters);

      // Essayer d'abord avec le filtre medecinId
      let result = await ConsumApi.getConsultationsPaginated(page + 1, rowsPerPage, filters);
      
      console.log('API result with medecinId filter:', result);

      // Si aucun résultat avec le filtre medecinId, essayer sans filtre et filtrer côté client
      if (result.success && (!result.data?.data || result.data.data.length === 0)) {
        console.log('No results with medecinId filter, trying without filter...');
        const filtersWithoutMedecin = { ...filters };
        delete filtersWithoutMedecin.medecinId;
        if (statusFilter) {
          filtersWithoutMedecin.status = statusFilter;
        }
        result = await ConsumApi.getConsultationsPaginated(page + 1, rowsPerPage, filtersWithoutMedecin);
        console.log('API result without medecinId filter:', result);
      }

      if (result.success) {
        let consultationsData = result.data?.data || result.data?.consultations || [];
        
        // Si result.data est directement un tableau
        if (Array.isArray(result.data) && !result.data.data) {
          consultationsData = result.data;
        }
        
        console.log('Raw consultations data:', consultationsData);
        console.log('Number of consultations before filtering:', consultationsData.length);
        
        if (!isAdminOrDirecteur) {
          // Filtrer aussi par médecin côté client pour être sûr
          consultationsData = consultationsData.filter(
            (c) => {
              const medecinIdMatch = c.medecinId === currentMedecinId || c.medecin?.id === currentMedecinId;
              return medecinIdMatch;
            }
          );
          console.log('After medecin filter:', consultationsData.length, 'consultations');
        } else {
          console.log('Admin/Directeur: consultations globales');
        }
        
        // Si un filtre de statut est sélectionné, appliquer le filtre
        if (statusFilter) {
          consultationsData = consultationsData.filter(
            (c) => c.status === statusFilter
          );
          console.log(`After status filter (${statusFilter}):`, consultationsData.length, 'consultations');
        }
        // Sinon, afficher toutes les consultations (EN_ATTENTE, EN_COURS, TERMINEE, etc.)
        
        // Filtrer par recherche si présente
        if (search) {
          const searchLower = search.toLowerCase();
          consultationsData = consultationsData.filter(
            (c) =>
              (c.consultationNumber || '').toLowerCase().includes(searchLower) ||
              (c.patient?.firstName || '').toLowerCase().includes(searchLower) ||
              (c.patient?.lastName || '').toLowerCase().includes(searchLower) ||
              (c.patient?.phone || '').toLowerCase().includes(searchLower) ||
              (c.reason || '').toLowerCase().includes(searchLower)
          );
        }
        
        console.log('Final consultations:', consultationsData.length);
        console.log('Consultations:', consultationsData);
        
        setConsultations(consultationsData);
        setTotal(result.data?.pagination?.total || result.data?.total || consultationsData.length);
      } else {
        console.error('Failed to load consultations:', result.message || result.errors);
        // Ne pas appeler showError ici pour éviter les boucles
        setConsultations([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
      console.error('Error stack:', error.stack);
      // Ne pas appeler showError ici pour éviter les boucles
      setConsultations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, search, currentMedecinId, isAdminOrDirecteur]);

  useEffect(() => {
    if (!isAdminOrDirecteur && !currentMedecinId) return undefined;
    
    // Charger une seule fois au montage et quand les dépendances changent
    loadConsultations();
    
    // Recharger toutes les 30 secondes pour les consultations en attente ou en cours
    // Seulement si le statut n'est pas TERMINEE ou ANNULEE
    if (!statusFilter || statusFilter === 'EN_ATTENTE' || statusFilter === 'EN_COURS') {
      const interval = setInterval(() => {
        loadConsultations();
      }, 30000);
      return () => clearInterval(interval);
    }
    
    return undefined;
  }, [loadConsultations, statusFilter, currentMedecinId, isAdminOrDirecteur]);

  const handleViewDetails = async (consultation) => {
    setDetailsDialog({ open: true, consultation, loading: true, editing: false });
    setEditForm(null);
    setPrescriptions([]);
    setCertificats([]);
    setAnalyses([]);
    
    try {
      // Charger les détails complets de la consultation
      const result = await ConsumApi.getConsultationById(consultation.id);
      if (result.success) {
        const consultationData = result.data?.consultation || result.data;
        setDetailsDialog({ open: true, consultation: consultationData, loading: false, editing: false });
        
        // Initialiser le formulaire d'édition avec conversion des nombres
        const toNumber = (value, defaultValue = 0) => {
          if (value === null || value === undefined || value === '') return defaultValue;
          if (typeof value === 'number') return Number.isNaN(value) ? defaultValue : value;
          const parsed = parseFloat(value);
          return Number.isNaN(parsed) ? defaultValue : parsed;
        };

        const toInt = (value, defaultValue = 0) => {
          if (value === null || value === undefined || value === '') return defaultValue;
          if (typeof value === 'number') return Number.isNaN(value) ? defaultValue : Math.floor(value);
          const parsed = parseInt(value, 10);
          return Number.isNaN(parsed) ? defaultValue : parsed;
        };

        setEditForm({
          clinicalExamination: consultationData.clinicalExamination || '',
          temperature: toNumber(consultationData.temperature, 0),
          systolicBloodPressure: toInt(consultationData.systolicBloodPressure, 0),
          diastolicBloodPressure: toInt(consultationData.diastolicBloodPressure, 0),
          heartRate: toInt(consultationData.heartRate, 0),
          respiratoryRate: toInt(consultationData.respiratoryRate, 0),
          weight: toNumber(consultationData.weight, 0),
          height: toNumber(consultationData.height, 0),
          oxygenSaturation: toInt(consultationData.oxygenSaturation, 0),
          diagnostic: consultationData.diagnostic || '',
          differentialDiagnosis: consultationData.differentialDiagnosis || '',
          treatment: consultationData.treatment || '',
          recommendations: consultationData.recommendations || '',
          privateNotes: consultationData.privateNotes || '',
          nextAppointment: consultationData.nextAppointment || '',
          hospitalizationRequired: consultationData.hospitalizationRequired || false,
          hospitalizationReason: consultationData.hospitalizationReason || '',
        });
        
        // Charger les analyses créées pour cette consultation
        const patientIdForAnalyses =
          consultationData.patientId || consultationData.patient?.id || consultation.patientId || consultation.patient?.id;
        const analysesResult = await ConsumApi.getLaboratoryAnalyses({
          consultationId: consultation.id,
          patientId: patientIdForAnalyses,
          prescribingDoctorId: currentMedecinId,
        });
        if (analysesResult.success) {
          const analysesList = Array.isArray(analysesResult.data) ? analysesResult.data : [];
          setAnalyses(
            filterLaboratoryAnalysesForConsultation(analysesList, {
              consultationId: consultation.id,
              patientId: patientIdForAnalyses,
              medecinId: currentMedecinId,
            })
          );
        } else {
          setAnalyses([]);
        }
        
        // Charger les prescriptions
        const prescriptionsResult = await ConsumApi.getConsultationPrescriptions(consultation.id);
        if (prescriptionsResult.success) {
          const prescriptionsList = Array.isArray(prescriptionsResult.data) ? prescriptionsResult.data : [];
          setPrescriptions(prescriptionsList);
        }
        
        // Charger les certificats
        const certificatsResult = await ConsumApi.getConsultationCertificats(consultation.id);
        if (certificatsResult.success) {
          const certificatsList = Array.isArray(certificatsResult.data) ? certificatsResult.data : [];
          setCertificats(certificatsList);
        }

        // Time tracking: démarrer le passage MEDECIN lorsque le médecin ouvre une consultation en cours (réception)
        try {
          const pid = consultationData.patientId || consultationData.patient?.id;
          if (pid && consultationData.status === 'EN_COURS' && currentMedecinId) {
            await startMedecinServicePassage(pid, {
              handledByUserId: currentMedecinId,
              notes: 'Réception médecin',
            });
          }
        } catch (e) {
          console.error('Time tracking (MEDECIN reception on open details) failed:', e);
        }
      } else {
        // Si l'API complète échoue, utiliser les données de base
        setDetailsDialog({ open: true, consultation, loading: false, editing: false });
        setEditForm({
          clinicalExamination: consultation.clinicalExamination || '',
          temperature: typeof consultation.temperature === 'number' ? consultation.temperature : parseFloat(consultation.temperature) || 0,
          systolicBloodPressure: typeof consultation.systolicBloodPressure === 'number' ? consultation.systolicBloodPressure : parseInt(consultation.systolicBloodPressure, 10) || 0,
          diastolicBloodPressure: typeof consultation.diastolicBloodPressure === 'number' ? consultation.diastolicBloodPressure : parseInt(consultation.diastolicBloodPressure, 10) || 0,
          heartRate: typeof consultation.heartRate === 'number' ? consultation.heartRate : parseInt(consultation.heartRate, 10) || 0,
          respiratoryRate: typeof consultation.respiratoryRate === 'number' ? consultation.respiratoryRate : parseInt(consultation.respiratoryRate, 10) || 0,
          weight: typeof consultation.weight === 'number' ? consultation.weight : parseFloat(consultation.weight) || 0,
          height: typeof consultation.height === 'number' ? consultation.height : parseFloat(consultation.height) || 0,
          oxygenSaturation: typeof consultation.oxygenSaturation === 'number' ? consultation.oxygenSaturation : parseInt(consultation.oxygenSaturation, 10) || 0,
          diagnostic: consultation.diagnostic || '',
          differentialDiagnosis: consultation.differentialDiagnosis || '',
          treatment: consultation.treatment || '',
          recommendations: consultation.recommendations || '',
          privateNotes: consultation.privateNotes || '',
          nextAppointment: consultation.nextAppointment || '',
          hospitalizationRequired: consultation.hospitalizationRequired || false,
          hospitalizationReason: consultation.hospitalizationReason || '',
        });

        try {
          const pid = consultation.patientId || consultation.patient?.id;
          if (pid && consultation.status === 'EN_COURS' && currentMedecinId) {
            await startMedecinServicePassage(pid, {
              handledByUserId: currentMedecinId,
              notes: 'Réception médecin',
            });
          }
        } catch (e) {
          console.error('Time tracking (MEDECIN reception fallback) failed:', e);
        }

        const pidFallback = consultation.patientId || consultation.patient?.id;
        const analysesFallback = await ConsumApi.getLaboratoryAnalyses({
          consultationId: consultation.id,
          patientId: pidFallback,
          prescribingDoctorId: currentMedecinId,
        });
        if (analysesFallback.success) {
          const list = Array.isArray(analysesFallback.data) ? analysesFallback.data : [];
          setAnalyses(
            filterLaboratoryAnalysesForConsultation(list, {
              consultationId: consultation.id,
              patientId: pidFallback,
              medecinId: currentMedecinId,
            })
          );
        } else {
          setAnalyses([]);
        }
      }
    } catch (error) {
      console.error('Error loading consultation details:', error);
      setDetailsDialog({ open: true, consultation, loading: false, editing: false });
      setAnalyses([]);
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, consultation: null, loading: false, editing: false });
    setEditForm(null);
    setPrescriptions([]);
    setCertificats([]);
    setAnalyses([]);
  };

  const handleToggleEdit = () => {
    setDetailsDialog((prev) => ({ ...prev, editing: !prev.editing }));
  };

  const handleSaveConsultation = async () => {
    if (!detailsDialog.consultation || !editForm) return;

    setSaving(true);
    try {
      // Fonction helper pour convertir en nombre
      const toNumber = (value, defaultValue = 0) => {
        if (value === null || value === undefined || value === '') return defaultValue;
        if (typeof value === 'number') return Number.isNaN(value) ? defaultValue : value;
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? defaultValue : parsed;
      };

      const toInt = (value, defaultValue = 0) => {
        if (value === null || value === undefined || value === '') return defaultValue;
        if (typeof value === 'number') return Number.isNaN(value) ? defaultValue : Math.floor(value);
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? defaultValue : parsed;
      };

      // S'assurer que tous les champs numériques sont bien des nombres
      const updateData = {
        patientId: detailsDialog.consultation.patientId || detailsDialog.consultation.patient?.id,
        medecinId: detailsDialog.consultation.medecinId || detailsDialog.consultation.medecin?.id,
        type: detailsDialog.consultation.type,
        status: detailsDialog.consultation.status,
        consultationDate: detailsDialog.consultation.consultationDate,
        reason: detailsDialog.consultation.reason,
        clinicalExamination: editForm.clinicalExamination || '',
        temperature: toNumber(editForm.temperature, 0),
        systolicBloodPressure: toInt(editForm.systolicBloodPressure, 0),
        diastolicBloodPressure: toInt(editForm.diastolicBloodPressure, 0),
        heartRate: toInt(editForm.heartRate, 0),
        respiratoryRate: toInt(editForm.respiratoryRate, 0),
        weight: toNumber(editForm.weight, 0),
        height: toNumber(editForm.height, 0),
        oxygenSaturation: toInt(editForm.oxygenSaturation, 0),
        diagnostic: editForm.diagnostic || '',
        differentialDiagnosis: editForm.differentialDiagnosis || '',
        treatment: editForm.treatment || '',
        recommendations: editForm.recommendations || '',
        privateNotes: editForm.privateNotes || '',
        nextAppointment: editForm.nextAppointment || null,
        hospitalizationRequired: editForm.hospitalizationRequired || false,
        hospitalizationReason: editForm.hospitalizationRequired ? (editForm.hospitalizationReason || '') : '',
      };

      console.log('Update data before sending:', updateData);
      console.log('Weight type:', typeof updateData.weight, 'Value:', updateData.weight);
      console.log('Height type:', typeof updateData.height, 'Value:', updateData.height);
      const result = await ConsumApi.updateConsultation(detailsDialog.consultation.id, updateData);
      const processed = showApiResponse(result, {
        successTitle: 'Consultation mise à jour',
        errorTitle: 'Erreur de mise à jour',
      });

      if (processed.success) {
        showSuccess('Succès', 'Consultation mise à jour avec succès');
        setDetailsDialog((prev) => ({ ...prev, editing: false }));
        // Recharger les détails
        await handleViewDetails({ id: detailsDialog.consultation.id });
        // Recharger la liste
        loadConsultations();
      }
    } catch (error) {
      console.error('Error updating consultation:', error);
      showError('Erreur', 'Erreur lors de la mise à jour de la consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPrescriptionDialog = () => {
    setPrescriptionForm({
      type: 'MEDICAMENT',
      label: '',
      dosage: '',
      duration: '',
      quantity: 0,
      instructions: '',
      urgent: false,
    });
    setAnalysisForm({
      analysisName: '',
      analysisType: 'HEMATOLOGIE',
      sampleType: 'SANG',
      observations: '',
      urgent: false,
      price: 0,
    });
    setPrescriptionDialog({ open: true, loading: false, isAnalysis: false });
  };

  const handleClosePrescriptionDialog = () => {
    setPrescriptionDialog({ open: false, loading: false, isAnalysis: false });
  };

  const handleSavePrescription = async () => {
    if (!detailsDialog.consultation) {
      showError('Erreur', 'Consultation non trouvée');
      return;
    }

    // Si le type est ANALYSE, créer une analyse au lieu d'une prescription
    if (prescriptionForm.type === 'ANALYSE') {
      if (!analysisForm.analysisName.trim()) {
        showError('Erreur', 'Veuillez remplir au moins le nom de l\'analyse');
        return;
      }

      setPrescriptionDialog({ open: true, loading: true });
      try {
        const analysisData = {
          patientId: detailsDialog.consultation.patient?.id || detailsDialog.consultation.patientId,
          consultationId: detailsDialog.consultation.id,
          prescriptionId: null, // Peut être null pour une analyse directe
          prescribingDoctorId: currentMedecinId,
          analysisName: analysisForm.analysisName,
          analysisType: analysisForm.analysisType,
          sampleType: analysisForm.sampleType,
          status: 'EN_ATTENTE',
          urgent: analysisForm.urgent,
          observations: analysisForm.observations || '',
          price: analysisForm.price || 0,
        };

        const result = await ConsumApi.createLaboratoryAnalysis(analysisData);
        const processed = showApiResponse(result, {
          successTitle: 'Analyse créée',
          errorTitle: 'Erreur d&apos;ajout',
        });

        if (processed.success) {
          showSuccess('Succès', 'Analyse créée avec succès');
          handleClosePrescriptionDialog();
          // Recharger les prescriptions (pour afficher l'analyse si elle est liée)
          const prescriptionsResult = await ConsumApi.getConsultationPrescriptions(detailsDialog.consultation.id);
          if (prescriptionsResult.success) {
            const prescriptionsList = Array.isArray(prescriptionsResult.data) ? prescriptionsResult.data : [];
            setPrescriptions(prescriptionsList);
          }
        }
      } catch (error) {
        console.error('Error adding analysis:', error);
        showError('Erreur', 'Erreur lors de l\'ajout de l\'analyse');
      } finally {
        setPrescriptionDialog({ open: true, loading: false });
      }
      return;
    }

    // Sinon, créer une prescription normale
    if (!prescriptionForm.label.trim()) {
      showError('Erreur', 'Veuillez remplir au moins le nom du médicament');
      return;
    }

    setPrescriptionDialog({ open: true, loading: true });
    try {
      const result = await ConsumApi.addConsultationPrescription(detailsDialog.consultation.id, prescriptionForm);
      const processed = showApiResponse(result, {
        successTitle: 'Prescription ajoutée',
        errorTitle: 'Erreur d&apos;ajout',
      });

      if (processed.success) {
        showSuccess('Succès', 'Prescription ajoutée avec succès');
        handleClosePrescriptionDialog();
        // Recharger les prescriptions
        const prescriptionsResult = await ConsumApi.getConsultationPrescriptions(detailsDialog.consultation.id);
        if (prescriptionsResult.success) {
          const prescriptionsList = Array.isArray(prescriptionsResult.data) ? prescriptionsResult.data : [];
          setPrescriptions(prescriptionsList);
        }
      }
    } catch (error) {
      console.error('Error adding prescription:', error);
      showError('Erreur', 'Erreur lors de l\'ajout de la prescription');
    } finally {
      setPrescriptionDialog({ open: true, loading: false });
    }
  };

  const handleOpenAnalysisDialog = async () => {
    setAnalysisForm({
      analysisName: '',
      analysisType: 'HEMATOLOGIE',
      sampleType: 'SANG',
      observations: '',
      urgent: false,
      price: 0,
      pricingExamId: '',
    });
    setPrescriptionDialog({ open: true, loading: false, isAnalysis: true });
    try {
      const res = await ConsumApi.getPricingExamsActive();
      let list = [];
      if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.data?.data)) list = res.data.data;
      setExamTariffs(list);
    } catch (e) {
      console.error('Error loading exam tariffs:', e);
      setExamTariffs([]);
    }
  };

  const handleCloseAnalysisDialog = () => {
    setPrescriptionDialog({ open: false, loading: false, isAnalysis: false });
    setAnalysisForm({
      analysisName: '',
      analysisType: 'HEMATOLOGIE',
      sampleType: 'SANG',
      observations: '',
      urgent: false,
      price: 0,
      pricingExamId: '',
    });
  };

  const handleSaveAnalysis = async () => {
    if (!detailsDialog.consultation || !analysisForm.analysisName.trim()) {
      showError('Erreur', 'Veuillez remplir au moins le nom de l\'analyse');
      return;
    }

    if (!currentMedecinId) {
      showError('Erreur', 'Médecin non identifié');
      return;
    }

    const amount = Number(analysisForm.price || 0);
    if (amount <= 0) {
      showError('Erreur', 'Sélectionnez un tarif d’examen ou indiquez un montant supérieur à 0.');
      return;
    }

    setPrescriptionDialog({ open: true, loading: true, isAnalysis: true });
    try {
      const patientId = detailsDialog.consultation.patient?.id || detailsDialog.consultation.patientId;
      const consultationId = detailsDialog.consultation.id;

      const invoiceRes = await ConsumApi.createBillingInvoice({
        patientId,
        consultationId,
        totalAmount: amount,
        currency: 'FCFA',
        note: `Analyse laboratoire: ${analysisForm.analysisName.trim()} — paiement à l’accueil avant réalisation`,
      });

      if (!invoiceRes?.success || !invoiceRes.data?.id) {
        showApiResponse(invoiceRes, {
          successTitle: '',
          errorTitle: 'Facturation',
        });
        return;
      }

      const invoiceId = invoiceRes.data.id;
      const observationsWithBilling = appendBillingInvoiceTag(analysisForm.observations || '', invoiceId);

      const analysisData = {
        patientId,
        consultationId,
        prescriptionId: null,
        prescribingDoctorId: currentMedecinId,
        analysisName: analysisForm.analysisName,
        analysisType: analysisForm.analysisType,
        sampleType: analysisForm.sampleType,
        status: 'EN_ATTENTE',
        urgent: analysisForm.urgent,
        observations: observationsWithBilling,
        price: amount,
      };

      const result = await ConsumApi.createLaboratoryAnalysis(analysisData);
      const processed = showApiResponse(result, {
        successTitle: 'Analyse créée',
        errorTitle: 'Erreur d&apos;ajout',
      });

      if (processed.success) {
        showSuccess(
          'Succès',
          'Facture pro-forma créée et analyse enregistrée. Le patient doit payer à la secrétaire avant que le laboratoire ne réceptionne l’échantillon.'
        );
        handleCloseAnalysisDialog();
        // Recharger les analyses
        const patientIdReload =
          detailsDialog.consultation.patient?.id || detailsDialog.consultation.patientId;
        const analysesResult = await ConsumApi.getLaboratoryAnalyses({
          consultationId: detailsDialog.consultation.id,
          patientId: patientIdReload,
          prescribingDoctorId: currentMedecinId,
        });
        if (analysesResult.success) {
          const analysesList = Array.isArray(analysesResult.data) ? analysesResult.data : [];
          setAnalyses(
            filterLaboratoryAnalysesForConsultation(analysesList, {
              consultationId: detailsDialog.consultation.id,
              patientId: patientIdReload,
              medecinId: currentMedecinId,
            })
          );
        } else {
          setAnalyses([]);
        }
      }
    } catch (error) {
      console.error('Error adding analysis:', error);
      showError('Erreur', 'Erreur lors de l\'ajout de l\'analyse');
    } finally {
      setPrescriptionDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleViewAnalysisResults = async (analysisId) => {
    setAnalysisResultsDialog({ open: true, analysisId, results: [], loading: true });
    try {
      const result = await ConsumApi.getLaboratoryAnalysisResults(analysisId);
      if (result.success) {
        setAnalysisResultsDialog({ open: true, analysisId, results: result.data || [], loading: false });
      } else {
        setAnalysisResultsDialog({ open: true, analysisId, results: [], loading: false });
      }
    } catch (error) {
      console.error('Error loading analysis results:', error);
      setAnalysisResultsDialog({ open: true, analysisId, results: [], loading: false });
    }
  };

  const handlePrintAnalysisResults = async () => {
    const { analysisId, results } = analysisResultsDialog;
    if (!analysisId || results.length === 0) {
      showError('Erreur', 'Aucun résultat à imprimer');
      return;
    }

    // Récupérer les détails complets de l'analyse
    let analysisDetails = null;
    try {
      const analysisResult = await ConsumApi.getLaboratoryAnalysisComplete(analysisId);
      if (analysisResult.success) {
        analysisDetails = analysisResult.data?.analyse || analysisResult.data;
      }
    } catch (error) {
      console.error('Error loading analysis details:', error);
    }

    const { consultation } = detailsDialog;
    const patient = consultation?.patient;
    const medecin = consultation?.medecin;

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Résultats d&apos;Analyse</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 2cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
            }
            .analysis-details {
              border: 1px solid #000;
              padding: 20px;
              margin: 20px 0;
            }
            .results-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .results-table th,
            .results-table td {
              border: 1px solid #000;
              padding: 10px;
              text-align: left;
            }
            .results-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .abnormal {
              color: red;
              font-weight: bold;
            }
            .footer {
              margin-top: 50px;
              text-align: right;
            }
            .signature {
              margin-top: 50px;
              border-top: 1px solid #000;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RÉSULTATS D&apos;ANALYSE</h1>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Date de l&apos;analyse:</span>
              <span>${analysisDetails?.samplingDate ? new Date(analysisDetails.samplingDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Numéro d&apos;analyse:</span>
              <span>${analysisDetails?.analyseNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Patient:</span>
              <span>${patient?.firstName || ''} ${patient?.lastName || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date de naissance:</span>
              <span>${patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('fr-FR') : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Médecin prescripteur:</span>
              <span>Dr. ${medecin?.firstName || ''} ${medecin?.lastName || ''} - ${medecin?.speciality || ''}</span>
            </div>
          </div>
          
          <div class="analysis-details">
            <h2>Détails de l&apos;analyse</h2>
            <div class="info-row">
              <span class="info-label">Nom de l&apos;analyse:</span>
              <span>${analysisDetails?.analysisName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Type d&apos;analyse:</span>
              <span>${analysisDetails?.analysisType || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Type d&apos;échantillon:</span>
              <span>${analysisDetails?.sampleType || 'N/A'}</span>
            </div>
            ${analysisDetails?.observations ? `
            <div class="info-row">
              <span class="info-label">Observations:</span>
              <span>${analysisDetails.observations}</span>
            </div>
            ` : ''}
            ${analysisDetails?.urgent ? '<p class="abnormal">⚠️ ANALYSE URGENTE</p>' : ''}
          </div>
          
          <div class="analysis-details">
            <h2>Résultats</h2>
            <table class="results-table">
              <thead>
                <tr>
                  <th>Paramètre</th>
                  <th>Valeur</th>
                  <th>Unité</th>
                  <th>Valeurs de référence</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${results.map((result) => `
                  <tr>
                    <td>${result.parameter || 'N/A'}</td>
                    <td class="${result.abnormal ? 'abnormal' : ''}">${result.value || 'N/A'}</td>
                    <td>${result.unit || ''}</td>
                    <td>${result.referenceValueMin && result.referenceValueMax ? `${result.referenceValueMin} - ${result.referenceValueMax} ${result.unit || ''}` : 'N/A'}</td>
                    <td class="${result.abnormal ? 'abnormal' : ''}">${result.abnormal ? 'Anormal' : 'Normal'}</td>
                  </tr>
                  ${result.comment ? `
                  <tr>
                    <td colspan="5" style="font-style: italic; padding-left: 30px;">
                      <strong>Commentaire:</strong> ${result.comment}
                    </td>
                  </tr>
                  ` : ''}
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <div class="signature">
              <p>Signature et cachet du médecin</p>
              <br><br>
              <p>Dr. ${medecin?.firstName || ''} ${medecin?.lastName || ''}</p>
              <p>${medecin?.speciality || ''}</p>
              <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleCloseAnalysisResults = () => {
    setAnalysisResultsDialog({ open: false, analysisId: null, results: [], loading: false });
  };

  const handleOpenCertificatDialog = () => {
    setCertificatForm({
      type: 'ARRET_TRAVAIL',
      content: '',
      durationDays: 0,
      startDate: '',
      endDate: '',
    });
    setCertificatDialog({ open: true, loading: false });
  };

  const handleCloseCertificatDialog = () => {
    setCertificatDialog({ open: false, loading: false });
  };

  const handleSaveCertificat = async () => {
    if (!detailsDialog.consultation || !certificatForm.content.trim()) {
      showError('Erreur', 'Veuillez remplir le contenu du certificat');
      return;
    }

    setCertificatDialog({ open: true, loading: true });
    try {
      const result = await ConsumApi.addConsultationCertificat(detailsDialog.consultation.id, certificatForm);
      const processed = showApiResponse(result, {
        successTitle: 'Certificat ajouté',
        errorTitle: 'Erreur d&apos;ajout',
      });

      if (processed.success) {
        showSuccess('Succès', 'Certificat ajouté avec succès');
        handleCloseCertificatDialog();
        // Recharger les certificats
        const certificatsResult = await ConsumApi.getConsultationCertificats(detailsDialog.consultation.id);
        if (certificatsResult.success) {
          const certificatsList = Array.isArray(certificatsResult.data) ? certificatsResult.data : [];
          setCertificats(certificatsList);
        }
      }
    } catch (error) {
      console.error('Error adding certificat:', error);
      showError('Erreur', 'Erreur lors de l\'ajout du certificat');
    } finally {
      setCertificatDialog({ open: true, loading: false });
    }
  };

  const handleStartConsultation = async (consultationId) => {
    try {
      const result = await ConsumApi.updateConsultationStatus(consultationId, 'EN_COURS');
      if (result.success) {
        showSuccess('Succès', 'Consultation démarrée');
        // Time tracking: passage MEDECIN au moment où le médecin « reçoit » le patient (EN_ATTENTE → EN_COURS)
        try {
          const detail = await ConsumApi.getConsultationById(consultationId);
          const c = detail.data?.consultation || detail.data;
          const pid = c?.patientId || c?.patient?.id;
          if (pid && currentMedecinId) {
            await startMedecinServicePassage(pid, {
              handledByUserId: currentMedecinId,
              notes: 'Consultation démarrée',
            });
          }
        } catch (e) {
          console.error('Time tracking (MEDECIN on start consultation) failed:', e);
        }
        loadConsultations();
        // Rediriger vers la page de consultation
        router.push(`/doctors/create-consultation?id=${consultationId}`);
      } else {
        showError('Erreur', result.message || 'Impossible de démarrer la consultation');
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      showError('Erreur', 'Impossible de démarrer la consultation');
    }
  };

  const handleCompleteConsultation = async () => {
    if (!detailsDialog.consultation) return;

    setCompleting(true);
    try {
      const result = await ConsumApi.updateConsultationStatus(detailsDialog.consultation.id, 'TERMINEE');
      const processed = showApiResponse(result, {
        successTitle: 'Consultation terminée',
        errorTitle: 'Erreur',
      });

      if (processed.success) {
        showSuccess('Succès', 'Consultation terminée avec succès');

        // Time tracking: clôturer la visite (sortie clinique) à la fin de la consultation
        try {
          const pid = detailsDialog.consultation.patientId || detailsDialog.consultation.patient?.id;
          if (pid) await closeActiveTracking(pid);
        } catch (e) {
          console.error('Time tracking (close visit) failed:', e);
        }
        
        // Mettre à jour le statut localement dans le dialog
        setDetailsDialog((prev) => ({
          ...prev,
          consultation: prev.consultation ? { ...prev.consultation, status: 'TERMINEE' } : null,
        }));
        
        // Recharger la liste depuis l'API pour afficher la consultation terminée
        // Utiliser un setTimeout pour éviter les conflits avec les autres états
        setTimeout(() => {
          loadConsultations();
        }, 500);
      }
    } catch (error) {
      console.error('Error completing consultation:', error);
      showError('Erreur', 'Erreur lors de la finalisation de la consultation');
    } finally {
      setCompleting(false);
    }
  };

  const handlePrintPrescription = (prescription) => {
    const {consultation} = detailsDialog;
    const patient = consultation?.patient;
    const medecin = consultation?.medecin;
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription Médicale</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 2cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
            }
            .prescription-details {
              border: 1px solid #000;
              padding: 20px;
              margin: 20px 0;
            }
            .prescription-item {
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 1px solid #ddd;
            }
            .prescription-item:last-child {
              border-bottom: none;
            }
            .urgent {
              color: red;
              font-weight: bold;
            }
            .footer {
              margin-top: 50px;
              text-align: right;
            }
            .signature {
              margin-top: 50px;
              border-top: 1px solid #000;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PRESCRIPTION MÉDICALE</h1>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${consultation?.consultationDate ? new Date(consultation.consultationDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Patient:</span>
              <span>${patient?.firstName || ''} ${patient?.lastName || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date de naissance:</span>
              <span>${patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('fr-FR') : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Médecin:</span>
              <span>Dr. ${medecin?.firstName || ''} ${medecin?.lastName || ''} - ${medecin?.speciality || ''}</span>
            </div>
          </div>
          
          <div class="prescription-details">
            <h2>Prescription</h2>
            <div class="prescription-item">
              <p><strong>Médicament/Produit:</strong> ${prescription.label || 'N/A'} ${prescription.urgent ? '<span class="urgent">(URGENT)</span>' : ''}</p>
              <p><strong>Type:</strong> ${prescription.type || 'N/A'}</p>
              <p><strong>Dosage:</strong> ${prescription.dosage || 'N/A'}</p>
              <p><strong>Durée:</strong> ${prescription.duration || 'N/A'}</p>
              <p><strong>Quantité:</strong> ${prescription.quantity || 'N/A'}</p>
              <p><strong>Instructions:</strong> ${prescription.instructions || 'N/A'}</p>
            </div>
          </div>
          
          <div class="footer">
            <div class="signature">
              <p>Signature et cachet du médecin</p>
              <br><br>
              <p>Dr. ${medecin?.firstName || ''} ${medecin?.lastName || ''}</p>
              <p>${medecin?.speciality || ''}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handlePrintCertificat = (certificat) => {
    const {consultation} = detailsDialog;
    const patient = consultation?.patient;
    const medecin = consultation?.medecin;
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificat Médical</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 2cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
            }
            .certificat-content {
              border: 1px solid #000;
              padding: 30px;
              margin: 30px 0;
              min-height: 200px;
              text-align: justify;
            }
            .footer {
              margin-top: 50px;
              text-align: right;
            }
            .signature {
              margin-top: 50px;
              border-top: 1px solid #000;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CERTIFICAT MÉDICAL</h1>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${consultation?.consultationDate ? new Date(consultation.consultationDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Patient:</span>
              <span>${patient?.firstName || ''} ${patient?.lastName || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date de naissance:</span>
              <span>${patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('fr-FR') : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Médecin:</span>
              <span>Dr. ${medecin?.firstName || ''} ${medecin?.lastName || ''} - ${medecin?.speciality || ''}</span>
            </div>
          </div>
          
          <div class="certificat-content">
            <h2>${certificat.type || 'Certificat Médical'}</h2>
            <p>${certificat.content || 'N/A'}</p>
            ${certificat.durationDays ? `<p><strong>Durée:</strong> ${certificat.durationDays} jours</p>` : ''}
            ${certificat.startDate ? `<p><strong>Du:</strong> ${new Date(certificat.startDate).toLocaleDateString('fr-FR')}</p>` : ''}
            ${certificat.endDate ? `<p><strong>Au:</strong> ${new Date(certificat.endDate).toLocaleDateString('fr-FR')}</p>` : ''}
          </div>
          
          <div class="footer">
            <div class="signature">
              <p>Signature et cachet du médecin</p>
              <br><br>
              <p>Dr. ${medecin?.firstName || ''} ${medecin?.lastName || ''}</p>
              <p>${medecin?.speciality || ''}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      <Helmet>
        <title> Mes Consultations | PREVENTIC </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Mes Consultations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Liste de toutes mes consultations avec les patients
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Rechercher par numéro, patient, téléphone, motif..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Toutes (En attente + En cours)</MenuItem>
                <MenuItem value="EN_ATTENTE">En attente</MenuItem>
                <MenuItem value="EN_COURS">En cours</MenuItem>
                <MenuItem value="TERMINEE">Terminée</MenuItem>
                <MenuItem value="ANNULEE">Annulée</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Table */}
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Motif</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading && consultations.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (consultations.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            Aucune consultation trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return consultations.map((consultation) => (
                      <TableRow key={consultation.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {consultation.consultationNumber || consultation.id?.substring(0, 8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {consultation.patient?.firstName || consultation.patient?.firstname || 'N/A'}{' '}
                            {consultation.patient?.lastName || consultation.patient?.lastname || ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {consultation.patient?.phone || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {CONSULTATION_TYPES[consultation.type] || consultation.type || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {fDateTime(consultation.consultationDate || consultation.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {consultation.reason || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={STATUS_LABELS[consultation.status] || consultation.status}
                            color={STATUS_COLORS[consultation.status] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewDetails(consultation)}
                            >
                              Détails
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePagination
            page={page}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Card>
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Détails de la Consultation</Typography>
            {!detailsDialog.loading && detailsDialog.consultation && (
              <Button
                variant={detailsDialog.editing ? 'outlined' : 'contained'}
                startIcon={<Iconify icon={detailsDialog.editing ? 'eva:close-fill' : 'eva:edit-fill'} />}
                onClick={handleToggleEdit}
              >
                {detailsDialog.editing ? 'Annuler' : 'Modifier'}
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <LoadingButton loading>Chargement des détails...</LoadingButton>
            </Box>
          ) : (
            detailsDialog.consultation && editForm && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                {/* Informations de base (lecture seule) */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Numéro de consultation</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {detailsDialog.consultation.consultationNumber || detailsDialog.consultation.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Statut</Typography>
                    <Chip
                      label={STATUS_LABELS[detailsDialog.consultation.status] || detailsDialog.consultation.status}
                      color={STATUS_COLORS[detailsDialog.consultation.status] || 'default'}
                      size="small"
                    />
                  </Grid>
                </Grid>

                <Divider>Informations Patient</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Nom complet</Typography>
                    <Typography variant="body1">
                      {detailsDialog.consultation.patient?.firstName} {detailsDialog.consultation.patient?.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Téléphone</Typography>
                    <Typography variant="body1">{detailsDialog.consultation.patient?.phone || 'N/A'}</Typography>
                  </Grid>
                </Grid>

                <Divider>Examen Clinique</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Examen clinique"
                      value={editForm.clinicalExamination}
                      onChange={(e) => setEditForm({ ...editForm, clinicalExamination: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                </Grid>

                <Divider>Signes Vitaux</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Température (°C)"
                      value={editForm.temperature}
                      onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) || 0 })}
                      disabled={!detailsDialog.editing}
                      inputProps={{ step: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Pression artérielle systolique (mmHg)"
                      value={editForm.systolicBloodPressure}
                      onChange={(e) => setEditForm({ ...editForm, systolicBloodPressure: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Pression artérielle diastolique (mmHg)"
                      value={editForm.diastolicBloodPressure}
                      onChange={(e) => setEditForm({ ...editForm, diastolicBloodPressure: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Fréquence cardiaque (bpm)"
                      value={editForm.heartRate}
                      onChange={(e) => setEditForm({ ...editForm, heartRate: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Fréquence respiratoire (rpm)"
                      value={editForm.respiratoryRate}
                      onChange={(e) => setEditForm({ ...editForm, respiratoryRate: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Saturation en oxygène (%)"
                      value={editForm.oxygenSaturation}
                      onChange={(e) => setEditForm({ ...editForm, oxygenSaturation: parseInt(e.target.value, 10) || 0 })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Poids (kg)"
                      value={editForm.weight === 0 ? '' : editForm.weight}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numValue = val === '' ? 0 : parseFloat(val);
                        setEditForm({ ...editForm, weight: Number.isNaN(numValue) ? 0 : numValue });
                      }}
                      disabled={!detailsDialog.editing}
                      inputProps={{ step: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Taille (m)"
                      value={editForm.height === 0 ? '' : editForm.height}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numValue = val === '' ? 0 : parseFloat(val);
                        setEditForm({ ...editForm, height: Number.isNaN(numValue) ? 0 : numValue });
                      }}
                      disabled={!detailsDialog.editing}
                      inputProps={{ step: 0.01 }}
                    />
                  </Grid>
                </Grid>

                <Divider>Diagnostic et Traitement</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Diagnostic"
                      value={editForm.diagnostic}
                      onChange={(e) => setEditForm({ ...editForm, diagnostic: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Diagnostic différentiel"
                      value={editForm.differentialDiagnosis}
                      onChange={(e) => setEditForm({ ...editForm, differentialDiagnosis: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Traitement"
                      value={editForm.treatment}
                      onChange={(e) => setEditForm({ ...editForm, treatment: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Recommandations"
                      value={editForm.recommendations}
                      onChange={(e) => setEditForm({ ...editForm, recommendations: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes privées"
                      value={editForm.privateNotes}
                      onChange={(e) => setEditForm({ ...editForm, privateNotes: e.target.value })}
                      disabled={!detailsDialog.editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Prochain rendez-vous"
                      value={editForm.nextAppointment ? new Date(editForm.nextAppointment).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditForm({ ...editForm, nextAppointment: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      disabled={!detailsDialog.editing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Divider>Hospitalisation</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Hospitalisation requise</InputLabel>
                      <Select
                        value={editForm.hospitalizationRequired ? 'true' : 'false'}
                        label="Hospitalisation requise"
                        onChange={(e) => setEditForm({ ...editForm, hospitalizationRequired: e.target.value === 'true' })}
                        disabled={!detailsDialog.editing}
                      >
                        <MenuItem value="false">Non</MenuItem>
                        <MenuItem value="true">Oui</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {editForm.hospitalizationRequired && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Raison de l'hospitalisation"
                        value={editForm.hospitalizationReason}
                        onChange={(e) => setEditForm({ ...editForm, hospitalizationReason: e.target.value })}
                        disabled={!detailsDialog.editing}
                      />
                    </Grid>
                  )}
                </Grid>

                <Divider>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Typography>Analyses</Typography>
                    {!detailsDialog.editing && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Iconify icon="eva:plus-fill" />}
                        onClick={handleOpenAnalysisDialog}
                      >
                        Ajouter
                      </Button>
                    )}
                  </Box>
                </Divider>
                {analyses.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Aucune analyse
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {analyses.map((analysis, index) => (
                      <Card key={analysis.id || index} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">
                              {analysis.analysisName || 'N/A'} ({analysis.analyseNumber || 'N/A'})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {analysis.urgent && <Chip label="Urgent" color="error" size="small" />}
                              {(() => {
                                const getStatusLabel = (status) => {
                                  if (status === 'EN_ATTENTE') return 'En attente';
                                  if (status === 'EN_COURS') return 'En cours';
                                  if (status === 'TERMINE') return 'Terminé';
                                  if (status === 'VALIDE') return 'Validé';
                                  return status || 'N/A';
                                };
                                const getStatusColor = (status) => {
                                  if (status === 'EN_ATTENTE') return 'warning';
                                  if (status === 'EN_COURS') return 'info';
                                  if (status === 'TERMINE') return 'success';
                                  if (status === 'VALIDE') return 'success';
                                  return 'default';
                                };
                                return (
                                  <Chip
                                    label={getStatusLabel(analysis.status)}
                                    size="small"
                                    color={getStatusColor(analysis.status)}
                                  />
                                );
                              })()}
                            </Box>
                          </Box>
                          <Typography variant="body2">
                            <strong>Type:</strong> {analysis.analysisType || 'N/A'} | <strong>Échantillon:</strong> {analysis.sampleType || 'N/A'}
                          </Typography>
                          {analysis.observations && (
                            <Typography variant="body2">
                              <strong>Observations:</strong> {analysis.observations}
                            </Typography>
                          )}
                          {analysis.price && (
                            <Typography variant="body2">
                              <strong>Prix:</strong> {analysis.price} FCFA
                            </Typography>
                          )}
                          {analysis.samplingDate && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Date de prélèvement:</strong> {fDateTime(analysis.samplingDate)}
                            </Typography>
                          )}
                          {(analysis.status === 'TERMINE' || analysis.status === 'VALIDE') && (
                            <Box sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Iconify icon="eva:eye-fill" />}
                                onClick={() => handleViewAnalysisResults(analysis.id)}
                              >
                                Voir les résultats
                              </Button>
                            </Box>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}

                <Divider>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Typography>Prescriptions</Typography>
                    {!detailsDialog.editing && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Iconify icon="eva:plus-fill" />}
                        onClick={handleOpenPrescriptionDialog}
                      >
                        Ajouter
                      </Button>
                    )}
                  </Box>
                </Divider>
                {prescriptions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Aucune prescription
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {prescriptions.map((prescription, index) => (
                      <Card key={prescription.id || index} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">
                              {prescription.label} ({prescription.type})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {prescription.urgent && <Chip label="Urgent" color="error" size="small" />}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Iconify icon="eva:printer-fill" />}
                                onClick={() => handlePrintPrescription(prescription)}
                              >
                                Imprimer
                              </Button>
                            </Box>
                          </Box>
                          <Typography variant="body2">
                            <strong>Dosage:</strong> {prescription.dosage || 'N/A'} | <strong>Durée:</strong> {prescription.duration || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Quantité:</strong> {prescription.quantity || 'N/A'} | <strong>Instructions:</strong> {prescription.instructions || 'N/A'}
                          </Typography>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}

                <Divider>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Typography>Certificats Médicaux</Typography>
                    {!detailsDialog.editing && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Iconify icon="eva:plus-fill" />}
                        onClick={handleOpenCertificatDialog}
                      >
                        Ajouter
                      </Button>
                    )}
                  </Box>
                </Divider>
                {certificats.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Aucun certificat
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {certificats.map((certificat, index) => (
                      <Card key={certificat.id || index} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">{certificat.type}</Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Iconify icon="eva:printer-fill" />}
                              onClick={() => handlePrintCertificat(certificat)}
                            >
                              Imprimer
                            </Button>
                          </Box>
                          <Typography variant="body2">
                            <strong>Contenu:</strong> {certificat.content || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Durée:</strong> {certificat.durationDays || 'N/A'} jours
                            {certificat.startDate && (
                              <> | <strong>Du:</strong> {fDateTime(certificat.startDate)}</>
                            )}
                            {certificat.endDate && (
                              <> | <strong>Au:</strong> {fDateTime(certificat.endDate)}</>
                            )}
                          </Typography>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
          {detailsDialog.editing && (
            <LoadingButton variant="contained" onClick={handleSaveConsultation} loading={saving}>
              Enregistrer
            </LoadingButton>
          )}
          {!detailsDialog.editing && detailsDialog.consultation?.status === 'EN_ATTENTE' && (
            <Button
              variant="contained"
              onClick={() => {
                handleStartConsultation(detailsDialog.consultation.id);
                handleCloseDetails();
              }}
            >
              Recevoir le patient
            </Button>
          )}
          {!detailsDialog.editing && detailsDialog.consultation?.status === 'EN_COURS' && (
            <LoadingButton
              variant="contained"
              color="success"
              onClick={handleCompleteConsultation}
              loading={completing}
              startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
            >
              Terminer la consultation
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>

      {/* Analysis Dialog */}
      {prescriptionDialog.isAnalysis && (
        <Dialog open={prescriptionDialog.open} onClose={handleCloseAnalysisDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Créer une Analyse</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                Une facture pro-forma est créée automatiquement. Le patient doit régler à la secrétaire avant que le laboratoire ne prenne en charge l’analyse.
              </Alert>
              <FormControl fullWidth>
                <InputLabel>Tarif examen (barème)</InputLabel>
                <Select
                  value={analysisForm.pricingExamId || ''}
                  label="Tarif examen (barème)"
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) {
                      setAnalysisForm((p) => ({ ...p, pricingExamId: '' }));
                      return;
                    }
                    const ex = examTariffs.find((x) => x.id === id);
                    const price = getPricingExamUnitPrice(ex);
                    const name = (ex?.name || ex?.label || '').trim();
                    const section = typeof ex?.section === 'string' ? ex.section.trim() : '';
                    setAnalysisForm((p) => ({
                      ...p,
                      pricingExamId: id,
                      price,
                      analysisName: name || p.analysisName,
                      ...(section ? { analysisType: section } : {}),
                    }));
                  }}
                >
                  <MenuItem value="">— Saisie manuelle du montant —</MenuItem>
                  {examTariffs.map((ex) => (
                    <MenuItem key={ex.id} value={ex.id}>
                      {`${ex.name || ex.code || ex.id} — ${getPricingExamUnitPrice(ex).toLocaleString('fr-FR')} FCFA`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Nom de l&apos;analyse *"
                value={analysisForm.analysisName}
                onChange={(e) => setAnalysisForm({ ...analysisForm, analysisName: e.target.value })}
                required
                placeholder="Ex: NFS, Glycémie, Cholestérol..."
              />
              <FormControl fullWidth>
                <InputLabel>Type d&apos;analyse</InputLabel>
                <Select
                  value={analysisForm.analysisType}
                  label="Type d&apos;analyse"
                  onChange={(e) => setAnalysisForm({ ...analysisForm, analysisType: e.target.value })}
                >
                  <MenuItem value="HEMATOLOGIE">Hématologie</MenuItem>
                  <MenuItem value="BIOCHIMIE">Biochimie</MenuItem>
                  <MenuItem value="IMMUNOLOGIE">Immunologie</MenuItem>
                  <MenuItem value="MICROBIOLOGIE">Microbiologie</MenuItem>
                  <MenuItem value="SEROLOGIE">Sérologie</MenuItem>
                  <MenuItem value="PARASITOLOGIE">Parasitologie</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Type d&apos;échantillon</InputLabel>
                <Select
                  value={analysisForm.sampleType}
                  label="Type d&apos;échantillon"
                  onChange={(e) => setAnalysisForm({ ...analysisForm, sampleType: e.target.value })}
                >
                  <MenuItem value="SANG">Sang</MenuItem>
                  <MenuItem value="URINE">Urine</MenuItem>
                  <MenuItem value="SELLES">Selles</MenuItem>
                  <MenuItem value="SALIVE">Salive</MenuItem>
                  <MenuItem value="AUTRE">Autre</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observations"
                value={analysisForm.observations}
                onChange={(e) => setAnalysisForm({ ...analysisForm, observations: e.target.value })}
                placeholder="Observations ou notes sur l&apos;analyse..."
              />
              <TextField
                fullWidth
                type="number"
                label="Prix (FCFA)"
                value={analysisForm.price}
                onChange={(e) => setAnalysisForm({ ...analysisForm, price: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
                }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={analysisForm.urgent}
                    onChange={(e) => setAnalysisForm({ ...analysisForm, urgent: e.target.checked })}
                  />
                }
                label="Urgent"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAnalysisDialog}>Annuler</Button>
            <LoadingButton
              variant="contained"
              onClick={handleSaveAnalysis}
              loading={prescriptionDialog.loading}
              disabled={!analysisForm.analysisName.trim() || Number(analysisForm.price) <= 0}
            >
              Créer l&apos;analyse
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}

      {/* Prescription Dialog */}
      {!prescriptionDialog.isAnalysis && (
        <Dialog open={prescriptionDialog.open} onClose={handleClosePrescriptionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {prescriptionForm.type === 'ANALYSE' ? 'Créer une Analyse' : 'Ajouter une Prescription'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={prescriptionForm.type}
                label="Type"
                onChange={(e) => {
                  setPrescriptionForm({ ...prescriptionForm, type: e.target.value });
                  // Réinitialiser le formulaire d'analyse si on change de type
                  if (e.target.value === 'ANALYSE') {
                    setAnalysisForm({
                      analysisName: '',
                      analysisType: 'HEMATOLOGIE',
                      sampleType: 'SANG',
                      observations: '',
                      urgent: false,
                      price: 0,
                    });
                  }
                }}
              >
                <MenuItem value="MEDICAMENT">Médicament</MenuItem>
                <MenuItem value="ANALYSE">Analyse</MenuItem>
                <MenuItem value="EXAMEN">Examen</MenuItem>
                <MenuItem value="AUTRE">Autre</MenuItem>
              </Select>
            </FormControl>

            {prescriptionForm.type === 'ANALYSE' ? (
              <>
                <TextField
                  fullWidth
                  label="Nom de l&apos;analyse *"
                  value={analysisForm.analysisName}
                  onChange={(e) => setAnalysisForm({ ...analysisForm, analysisName: e.target.value })}
                  required
                  placeholder="Ex: NFS, Glycémie, Cholestérol..."
                />
                <FormControl fullWidth>
                  <InputLabel>Type d&apos;analyse</InputLabel>
                  <Select
                    value={analysisForm.analysisType}
                    label="Type d&apos;analyse"
                    onChange={(e) => setAnalysisForm({ ...analysisForm, analysisType: e.target.value })}
                  >
                    <MenuItem value="HEMATOLOGIE">Hématologie</MenuItem>
                    <MenuItem value="BIOCHIMIE">Biochimie</MenuItem>
                    <MenuItem value="IMMUNOLOGIE">Immunologie</MenuItem>
                    <MenuItem value="MICROBIOLOGIE">Microbiologie</MenuItem>
                    <MenuItem value="SEROLOGIE">Sérologie</MenuItem>
                    <MenuItem value="PARASITOLOGIE">Parasitologie</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Type d&apos;échantillon</InputLabel>
                  <Select
                    value={analysisForm.sampleType}
                    label="Type d&apos;échantillon"
                    onChange={(e) => setAnalysisForm({ ...analysisForm, sampleType: e.target.value })}
                  >
                    <MenuItem value="SANG">Sang</MenuItem>
                    <MenuItem value="URINE">Urine</MenuItem>
                    <MenuItem value="SELLES">Selles</MenuItem>
                    <MenuItem value="SALIVE">Salive</MenuItem>
                    <MenuItem value="AUTRE">Autre</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observations"
                  value={analysisForm.observations}
                  onChange={(e) => setAnalysisForm({ ...analysisForm, observations: e.target.value })}
                  placeholder="Observations ou notes sur l&apos;analyse..."
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Prix (FCFA)"
                  value={analysisForm.price}
                  onChange={(e) => setAnalysisForm({ ...analysisForm, price: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={analysisForm.urgent}
                      onChange={(e) => setAnalysisForm({ ...analysisForm, urgent: e.target.checked })}
                    />
                  }
                  label="Urgent"
                />
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Nom du médicament / Examen"
                  value={prescriptionForm.label}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, label: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  label="Dosage"
                  value={prescriptionForm.dosage}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Durée"
                  value={prescriptionForm.duration}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Quantité"
                  value={prescriptionForm.quantity}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, quantity: parseInt(e.target.value, 10) || 0 })}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Instructions"
                  value={prescriptionForm.instructions}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={prescriptionForm.urgent}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, urgent: e.target.checked })}
                    />
                  }
                  label="Urgent"
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrescriptionDialog}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleSavePrescription}
            loading={prescriptionDialog.loading}
            disabled={
              prescriptionForm.type === 'ANALYSE'
                ? !analysisForm.analysisName.trim()
                : !prescriptionForm.label.trim()
            }
          >
            {prescriptionForm.type === 'ANALYSE' ? 'Créer l&apos;analyse' : 'Ajouter'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
      )}

      {/* Certificat Dialog */}
      <Dialog open={certificatDialog.open} onClose={handleCloseCertificatDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un Certificat Médical</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type de certificat</InputLabel>
              <Select
                value={certificatForm.type}
                label="Type de certificat"
                onChange={(e) => setCertificatForm({ ...certificatForm, type: e.target.value })}
              >
                <MenuItem value="ARRET_TRAVAIL">Arrêt de travail</MenuItem>
                <MenuItem value="CERTIFICAT_MEDICAL">Certificat médical</MenuItem>
                <MenuItem value="CERTIFICAT_APTITUDE">Certificat d&apos;aptitude</MenuItem>
                <MenuItem value="AUTRE">Autre</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Contenu du certificat"
              value={certificatForm.content}
              onChange={(e) => setCertificatForm({ ...certificatForm, content: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="number"
              label="Durée (en jours)"
              value={certificatForm.durationDays}
              onChange={(e) => setCertificatForm({ ...certificatForm, durationDays: parseInt(e.target.value, 10) || 0 })}
            />
            <TextField
              fullWidth
              type="date"
              label="Date de début"
              value={certificatForm.startDate}
              onChange={(e) => setCertificatForm({ ...certificatForm, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="date"
              label="Date de fin"
              value={certificatForm.endDate}
              onChange={(e) => setCertificatForm({ ...certificatForm, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCertificatDialog}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleSaveCertificat}
            loading={certificatDialog.loading}
            disabled={!certificatForm.content.trim()}
          >
            Ajouter
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Analysis Results Dialog */}
      <Dialog open={analysisResultsDialog.open} onClose={handleCloseAnalysisResults} maxWidth="md" fullWidth>
        <DialogTitle>Résultats de l&apos;analyse</DialogTitle>
        <DialogContent>
          {(() => {
            if (analysisResultsDialog.loading) {
              return (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Chargement des résultats...
                </Typography>
              );
            }
            if (analysisResultsDialog.results.length === 0) {
              return (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Aucun résultat disponible
                </Typography>
              );
            }
            return (
              <Stack spacing={2} sx={{ mt: 1 }}>
              {analysisResultsDialog.results.map((result, index) => (
                <Card key={result.id || index} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">{result.parameter}</Typography>
                      {result.abnormal && <Chip label="Anormal" color="error" size="small" />}
                    </Box>
                    <Typography variant="body1">
                      <strong>Valeur:</strong> {result.value} {result.unit}
                    </Typography>
                    {result.referenceValueMin && result.referenceValueMax && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Valeurs de référence:</strong> {result.referenceValueMin} - {result.referenceValueMax} {result.unit}
                      </Typography>
                    )}
                    {result.comment && (
                      <Typography variant="body2">
                        <strong>Commentaire:</strong> {result.comment}
                      </Typography>
                    )}
                  </Stack>
                </Card>
              ))}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAnalysisResults}>Fermer</Button>
          {analysisResultsDialog.results.length > 0 && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:printer-bold" />}
              onClick={handlePrintAnalysisResults}
            >
              Imprimer
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
