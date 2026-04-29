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
import { appendBillingInvoiceTag, BILLING_INVOICE_ID_REGEX } from 'src/utils/billing-utils';
import { closeActiveTracking, startMedecinServicePassage } from 'src/utils/time-tracking-client';
import { fetchLaboratoryAnalysesForConsultation } from 'src/utils/consultation-laboratory-analysis';
import {
  getConsultationIdValue,
  flattenLaboratoryAnalysisRow,
  getPatientIdFromConsultation,
  getPrescribingDoctorIdFromConsultation,
} from 'src/utils/laboratory-analyses-consultation';

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

function sanitizeAnalysisObservations(observations) {
  if (!observations || typeof observations !== 'string') return '';
  return observations.replace(BILLING_INVOICE_ID_REGEX, '').trim();
}

const HEMATOLOGY_CONFIG = {
  globules_blancs: { label: 'Globules blancs', unite: '10³/mm³', normeMin: 4, normeMax: 10 },
  globules_rouges: { label: 'Globules rouges', unite: '10⁶/mm³', normeMin: 4.5, normeMax: 6 },
  hemoglobine: { label: 'Hémoglobine', unite: 'g/dl', normeMin: 13, normeMax: 18 },
  hematocrite: { label: 'Hématocrite', unite: '%', normeMin: 40, normeMax: 52 },
  vgm: { label: 'VGM', unite: 'μm³', normeMin: 80, normeMax: 95 },
  tcmh: { label: 'TCMH', unite: 'pg', normeMin: 27, normeMax: 31 },
  ccmh: { label: 'CCMH', unite: 'g/dl', normeMin: 32, normeMax: 36 },
  plaquettes: { label: 'Plaquettes', unite: '10³/mm³', normeMin: 150, normeMax: 400 },
  lymphocytes: { label: 'Lymphocytes', unite: '%', normeMin: 19, normeMax: 48 },
  monocytes: { label: 'Monocytes', unite: '%', normeMin: 3.4, normeMax: 9 },
  granulocytes: { label: 'Granulocytes', unite: '%', normeMin: 40, normeMax: 74 },
};

function normalizeToSlug(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function extractResultMap(results) {
  const out = {};
  if (!Array.isArray(results)) return out;
  results.forEach((entry) => {
    if (entry?.input) out[String(entry.input)] = entry.resultat ?? entry.value ?? '';
    if (entry?.parameter) out[normalizeToSlug(String(entry.parameter))] = entry.value ?? entry.resultat ?? '';
    if (Array.isArray(entry?.resultats)) {
      entry.resultats.forEach((r) => {
        if (r?.input) out[String(r.input)] = r.resultat ?? '';
      });
    }
  });
  return out;
}

function evaluateRangeStatus(value, min, max) {
  if (Number.isNaN(value)) return 'normal';
  if (value < min) return 'bas';
  if (value > max) return 'eleve';
  return 'normal';
}

function getStatusUi(status) {
  if (status === 'eleve') return { label: '🔴 Élevé', color: 'error' };
  if (status === 'bas') return { label: '🟠 Bas', color: 'warning' };
  return { label: '🟢 Normal', color: 'success' };
}

function transformHematologyResults(results) {
  const resultMap = extractResultMap(results);
  return Object.entries(HEMATOLOGY_CONFIG).map(([input, config]) => {
    const rawValue = resultMap[input];
    const parsedValue = Number.parseFloat(rawValue);
    const hasValue = rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '';
    const status = hasValue ? evaluateRangeStatus(parsedValue, config.normeMin, config.normeMax) : 'normal';
    return {
      key: input,
      name: config.label,
      nameWithUnit: `${config.label} (${config.unite})`,
      value: hasValue ? rawValue : '—',
      unit: config.unite,
      norme: `${config.normeMin}–${config.normeMax}`,
      status,
      hasValue,
    };
  });
}

function normalizeAnalysisEntity(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload?.analyseNumber || payload?.analysisType || payload?.sampleType) return payload;
  if (payload?.analyse && typeof payload.analyse === 'object' && !Array.isArray(payload.analyse)) {
    return payload.analyse;
  }
  return payload;
}

function flattenResults(results) {
  const out = [];
  (Array.isArray(results) ? results : []).forEach((entry) => {
    if (Array.isArray(entry?.resultats)) {
      entry.resultats.forEach((row) => {
        out.push({
          ...row,
          acteBiologieId: entry?.acteBiologieId || entry?.actes_biologies || row?.acteBiologieId,
          parameter: row?.parameter || row?.name || row?.input,
          value: row?.value ?? row?.resultat ?? '',
        });
      });
      return;
    }
    out.push({
      ...entry,
      parameter: entry?.parameter || entry?.name || entry?.input,
      value: entry?.value ?? entry?.resultat ?? '',
    });
  });
  return out;
}

function isHematologyAnalysis(analysis) {
  const type = String(analysis?.analysisType || '').toUpperCase();
  if (type === 'HEMATOLOGIE') return true;
  const analyseEntries = Array.isArray(analysis?.analyse) ? analysis.analyse : [];
  return analyseEntries.some((entry) => String(entry?.name || '').toUpperCase().includes('HEMATOLOGIE'));
}

function getAnalysisItemCalculatedPrice(item) {
  const price =
    item?.exam_tariff?.calculatedPrice ??
    item?.exam_tariff?.calculated_price ??
    item?.examTariff?.calculatedPrice ??
    item?.examTariff?.calculated_price;
  const numeric = Number(price);
  return Number.isNaN(numeric) ? 0 : numeric;
}

function pickEntrySelectedItemIds(entry) {
  if (Array.isArray(entry?.actes_biologies_items)) return entry.actes_biologies_items;
  if (Array.isArray(entry?.actesBiologiesItems)) return entry.actesBiologiesItems;
  return [];
}

function pickEntryActeBiologiesItems(entry) {
  if (Array.isArray(entry?.actes_biologies_items)) return entry.actes_biologies_items;
  if (Array.isArray(entry?.actes_biologies_items_details)) return entry.actes_biologies_items_details;
  if (Array.isArray(entry?.actesBiologiesItems)) return entry.actesBiologiesItems;
  if (Array.isArray(entry?.items)) return entry.items;
  return [];
}

function itemsFromActeBiologieItemsApiResponse(itemsRes) {
  const { data } = itemsRes || {};
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function hemogramStatusRowClass(status) {
  if (status === 'eleve') return 'status-high';
  if (status === 'bas') return 'status-low';
  return 'status-normal';
}

function doctorListAnalysisStatusChipLabel(status) {
  if (status === 'EN_ATTENTE') return 'En attente';
  if (status === 'EN_COURS') return 'En cours';
  if (status === 'TERMINE') return 'Terminé';
  if (status === 'VALIDE') return 'Validé';
  return status || 'N/A';
}

function doctorListAnalysisStatusChipColor(status) {
  if (status === 'EN_ATTENTE') return 'warning';
  if (status === 'EN_COURS') return 'info';
  if (status === 'TERMINE' || status === 'VALIDE') return 'success';
  return 'default';
}

function extractAnalysisActesDetails(analysis) {
  const analyseEntries = Array.isArray(analysis?.analyse) ? analysis.analyse : [];
  return analyseEntries.map((entry, idx) => {
    const acteName = String(
      entry?.actes_biologies_name || entry?.acteBiologieName || entry?.name || `Acte ${idx + 1}`
    ).trim();
    const items = pickEntryActeBiologiesItems(entry);

    const normalizedItems = items
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') {
          const name = item.trim();
          if (!name) return null;
          return { id: `${acteName}-${name}`, name, calculatedPrice: 0 };
        }
        const name = String(item.name || item.label || item.itemName || '').trim();
        if (!name) return null;
        return {
          id: item.id || `${acteName}-${name}`,
          name,
          calculatedPrice: getAnalysisItemCalculatedPrice(item),
        };
      })
      .filter(Boolean);

    return {
      acteName,
      items: normalizedItems,
    };
  });
}

function isHematologyResults(results) {
  const knownKeys = new Set(Object.keys(HEMATOLOGY_CONFIG));
  const values = Array.isArray(results) ? results : [];
  return values.some((entry) => {
    if (Array.isArray(entry?.resultats)) {
      return entry.resultats.some((row) => {
        const key = normalizeToSlug(String(row?.input || row?.parameter || row?.name || ''));
        return knownKeys.has(key);
      });
    }
    const key = normalizeToSlug(String(entry?.input || entry?.parameter || entry?.name || ''));
    return knownKeys.has(key);
  });
}

const DEFAULT_ARRET_CONTENT = 'Certificat établi pour servir et valoir ce que de droit.';

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
  const [actesBiologies, setActesBiologies] = useState([]);
  const [actesBiologiesItemsMap, setActesBiologiesItemsMap] = useState({});
  const [analysisResultsDialog, setAnalysisResultsDialog] = useState({
    open: false,
    analysisId: null,
    analysis: null,
    results: [],
    loading: false,
  });
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
  const [analysisForm, setAnalysisForm] = useState({
    analysisName: '',
    analysisType: 'HEMATOLOGIE',
    sampleType: 'SANG',
    observations: '',
    urgent: false,
    price: 0,
    analyse: [],
  });
  const [certificatForm, setCertificatForm] = useState({
    type: 'ARRET_TRAVAIL',
    content: DEFAULT_ARRET_CONTENT,
    durationDays: 0,
    startDate: '',
    endDate: '',
  });
  const [currentMedecinId, setCurrentMedecinId] = useState(null);
  const clinicLogoUrl = `${window.location.origin}/assets/logo.jpeg`;

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
          // Filtrer aussi par médecin côté client (comparaison en string : uuid vs nombre selon l’API)
          consultationsData = consultationsData.filter((c) => {
            const mid = c.medecinId ?? c.medecin_id ?? c.medecin?.id;
            return String(mid) === String(currentMedecinId);
          });
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

  const enrichAnalysesWithItemDetails = useCallback(
    async (analysesList) => {
      const list = Array.isArray(analysesList) ? analysesList : [];
      if (list.length === 0) return [];

      const acteIds = new Set();
      list.forEach((analysis) => {
        const entries = Array.isArray(analysis?.analyse) ? analysis.analyse : [];
        entries.forEach((entry) => {
          const acteId = entry?.acteBiologieId || entry?.actes_biologies || entry?.acte_biologie_id;
          const selectedItems = pickEntrySelectedItemIds(entry);
          if (acteId && selectedItems.length > 0) acteIds.add(String(acteId));
        });
      });

      if (acteIds.size === 0) return list;

      const missingActeIds = [...acteIds].filter((acteId) => !Array.isArray(actesBiologiesItemsMap[acteId]));
      let fetchedMap = {};
      if (missingActeIds.length > 0) {
        const fetchedEntries = await Promise.all(
          missingActeIds.map(async (acteId) => {
            try {
              const itemsRes = await ConsumApi.getActesBiologieItems(acteId);
              const items = itemsFromActeBiologieItemsApiResponse(itemsRes);
              return [acteId, items];
            } catch (error) {
              console.error(`Error loading actes biologie items for ${acteId}:`, error);
              return [acteId, []];
            }
          })
        );
        fetchedMap = Object.fromEntries(fetchedEntries);
        setActesBiologiesItemsMap((prev) => ({ ...prev, ...fetchedMap }));
      }

      const fullItemsMap = { ...actesBiologiesItemsMap, ...fetchedMap };

      return list.map((analysis) => {
        const entries = Array.isArray(analysis?.analyse) ? analysis.analyse : [];
        const nextEntries = entries.map((entry) => {
          const acteIdRaw = entry?.acteBiologieId || entry?.actes_biologies || entry?.acte_biologie_id;
          const acteId = acteIdRaw ? String(acteIdRaw) : null;
          if (!acteId) return entry;

          const selectedIdsRaw = pickEntrySelectedItemIds(entry);
          const selectedIds = selectedIdsRaw.map((id) => String(id));
          if (selectedIds.length === 0) return entry;

          const catalogue = Array.isArray(fullItemsMap[acteId]) ? fullItemsMap[acteId] : [];
          const details = selectedIds
            .map((itemId) => catalogue.find((item) => String(item?.id) === itemId))
            .filter(Boolean);

          if (details.length === 0) return entry;

          return {
            ...entry,
            actes_biologies_items_details: details,
          };
        });

        return { ...analysis, analyse: nextEntries };
      });
    },
    [actesBiologiesItemsMap]
  );

  const handleViewDetails = async (consultation) => {
    setDetailsDialog({ open: true, consultation, loading: true, editing: false });
    setEditForm(null);
    setPrescriptions([]);
    setCertificats([]);
    setAnalyses([]);
    
    try {
      const rowConsultationId = getConsultationIdValue(consultation);
      if (!rowConsultationId) {
        showError('Erreur', 'Consultation sans identifiant.');
        setDetailsDialog((prev) => ({ ...prev, loading: false }));
        return;
      }
      const result = await ConsumApi.getConsultationById(rowConsultationId);
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
        
        const { ok: analysesOk, analyses: analysesList } = await fetchLaboratoryAnalysesForConsultation(
          consultationData,
          consultation
        );
        const enrichedAnalyses = analysesOk
          ? await enrichAnalysesWithItemDetails(analysesList)
          : [];
        setAnalyses(enrichedAnalyses);

        const detailConsultationId =
          getConsultationIdValue(consultationData) || getConsultationIdValue(consultation) || rowConsultationId;
        // Charger les prescriptions
        const prescriptionsResult = await ConsumApi.getConsultationPrescriptions(detailConsultationId);
        if (prescriptionsResult.success) {
          const prescriptionsList = Array.isArray(prescriptionsResult.data) ? prescriptionsResult.data : [];
          setPrescriptions(prescriptionsList);
        }
        
        // Charger les certificats
        const certificatsResult = await ConsumApi.getConsultationCertificats(detailConsultationId);
        if (certificatsResult.success) {
          const certificatsList = Array.isArray(certificatsResult.data) ? certificatsResult.data : [];
          setCertificats(certificatsList);
        }

        // Time tracking: démarrer le passage MEDECIN lorsque le médecin ouvre une consultation en cours (réception)
        try {
          const pid = consultationData.patientId || consultationData.patient?.id;
          if (pid && consultationData.status === 'EN_COURS' && currentMedecinId) {
            await startMedecinServicePassage(pid, {
              handledByUserId: adminInfo?.id || null,
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
              handledByUserId: adminInfo?.id || null,
              notes: 'Réception médecin',
            });
          }
        } catch (e) {
          console.error('Time tracking (MEDECIN reception fallback) failed:', e);
        }

        const { ok: analysesOkFb, analyses: analysesFb } =
          await fetchLaboratoryAnalysesForConsultation(consultation);
        const enrichedFallbackAnalyses = analysesOkFb
          ? await enrichAnalysesWithItemDetails(analysesFb)
          : [];
        setAnalyses(enrichedFallbackAnalyses);
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
        await handleViewDetails({
          id: getConsultationIdValue(detailsDialog.consultation) || detailsDialog.consultation.id,
        });
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
      analyse: [],
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

    // Créer une prescription médicament
    if (!prescriptionForm.label.trim()) {
      showError('Erreur', 'Veuillez remplir au moins le nom du médicament');
      return;
    }

    setPrescriptionDialog({ open: true, loading: true });
    try {
      const result = await ConsumApi.addConsultationPrescription(detailsDialog.consultation.id, {
        ...prescriptionForm,
        type: 'MEDICAMENT',
      });
      const processed = showApiResponse(result, {
        successTitle: 'Ordonnace ajoutée',
        errorTitle: 'Erreur d&apos;ajout',
      });

      if (processed.success) {
        showSuccess('Succès', 'Ordonnace ajoutée avec succès');
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
      setPrescriptionDialog((prev) => ({ ...prev, loading: false }));
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
      analyse: [],
    });
    setActesBiologies([]);
    setActesBiologiesItemsMap({});
    setPrescriptionDialog({ open: true, loading: false, isAnalysis: true });
    try {
      const actesRes = await ConsumApi.getActesBiologies();
      if (!actesRes?.success) {
        showError('Actes biologiques', actesRes?.message || 'Impossible de charger les catégories.');
      }
      let actes = [];
      if (Array.isArray(actesRes?.data)) actes = actesRes.data;
      else if (Array.isArray(actesRes?.data?.data)) actes = actesRes.data.data;
      setActesBiologies(actes);

      const itemsEntries = await Promise.all(
        actes.map(async (acte) => {
          const itemsRes = await ConsumApi.getActesBiologieItems(acte.id);
          const { data } = itemsRes || {};
          const { items: dataItems } = data || {};
          let items = [];
          if (Array.isArray(data)) items = data;
          else if (Array.isArray(dataItems)) items = dataItems;
          return [acte.id, items];
        })
      );
      setActesBiologiesItemsMap(Object.fromEntries(itemsEntries));
    } catch (e) {
      console.error('Error loading analysis data:', e);
      setActesBiologies([]);
      setActesBiologiesItemsMap({});
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
      analyse: [],
    });
    setActesBiologies([]);
    setActesBiologiesItemsMap({});
  };

  const handleToggleActeBiologieItem = (acteId, itemId) => {
    setAnalysisForm((prev) => {
      const currentAnalyse = Array.isArray(prev.analyse) ? prev.analyse : [];
      const existingActe = currentAnalyse.find((entry) => entry.actes_biologies === acteId);
      const currentItems = Array.isArray(existingActe?.actes_biologies_items)
        ? existingActe.actes_biologies_items
        : [];
      const itemAlreadySelected = currentItems.includes(itemId);
      const nextItems = itemAlreadySelected
        ? currentItems.filter((id) => id !== itemId)
        : [...currentItems, itemId];

      const others = currentAnalyse.filter((entry) => entry.actes_biologies !== acteId);
      const nextAnalyse = nextItems.length > 0
        ? [...others, { actes_biologies: acteId, actes_biologies_items: nextItems }]
        : others;

      const nextTotal = nextAnalyse.reduce((sum, group) => {
        const items = group.actes_biologies_items || [];
        const lineTotal = items.reduce((sub, selectedItemId) => {
          const item = (actesBiologiesItemsMap[group.actes_biologies] || []).find((x) => x.id === selectedItemId);
          const price = getPricingExamUnitPrice(item?.examTariff);
          return sub + price;
        }, 0);
        return sum + lineTotal;
      }, 0);
      return { ...prev, analyse: nextAnalyse, price: nextTotal };
    });
  };

  const handleSaveAnalysis = async () => {
    if (!detailsDialog.consultation) {
      showError('Erreur', 'Consultation introuvable');
      return;
    }

    if (!Array.isArray(analysisForm.analyse) || analysisForm.analyse.length === 0) {
      showError('Erreur', 'Veuillez sélectionner au moins une catégorie et un examen.');
      return;
    }

    const amount = Number(analysisForm.price || 0);
    if (amount <= 0) {
      showError('Erreur', 'Sélectionnez un tarif d’examen ou indiquez un montant supérieur à 0.');
      return;
    }

    const patientId = getPatientIdFromConsultation(detailsDialog.consultation);
    const consultationId = getConsultationIdValue(detailsDialog.consultation);
    const prescribingDoctorId =
      currentMedecinId ?? getPrescribingDoctorIdFromConsultation(detailsDialog.consultation);

    if (!patientId || !consultationId) {
      showError('Erreur', 'Patient ou consultation introuvable pour l’analyse.');
      return;
    }
    if (!prescribingDoctorId) {
      showError(
        'Erreur',
        'Médecin prescripteur introuvable. Connectez-vous avec un compte médecin ou vérifiez qu’un médecin est assigné à cette consultation.'
      );
      return;
    }

    setPrescriptionDialog({ open: true, loading: true, isAnalysis: true });
    try {
      const invoiceRes = await ConsumApi.createBillingInvoice({
        patientId,
        consultationId,
        totalAmount: amount,
        currency: 'FCFA',
        note: 'Analyse laboratoire — paiement à l’accueil avant réalisation',
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
        prescribingDoctorId,
        analyse: analysisForm.analyse,
        sampleType: analysisForm.sampleType || 'SANG',
        status: 'EN_ATTENTE',
        urgent: Boolean(analysisForm.urgent),
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
          'Facture pro-forma créée et analyse enregistrée. Le laboratoire effectuera le prélèvement après paiement à l’accueil.'
        );
        handleCloseAnalysisDialog();
        const { ok: reloadOk, analyses: nextAnalyses } = await fetchLaboratoryAnalysesForConsultation(
          detailsDialog.consultation
        );
        let finalList = reloadOk && Array.isArray(nextAnalyses) ? [...nextAnalyses] : [];
        const createdRaw = result?.data;
        if (createdRaw && typeof createdRaw === 'object') {
          const optimisticRow = flattenLaboratoryAnalysisRow({
            ...createdRaw,
            patientId,
            consultationId,
            status: createdRaw.status || 'EN_ATTENTE',
            price: createdRaw.price ?? amount,
          });
          const rid = optimisticRow?.id;
          if (rid != null && rid !== '' && !finalList.some((x) => String(x?.id) === String(rid))) {
            finalList = [optimisticRow, ...finalList];
          }
        }
        const enrichedAfterCreate = await enrichAnalysesWithItemDetails(finalList);
        setAnalyses(enrichedAfterCreate);
      } else if (invoiceRes?.success && invoiceRes?.data?.id) {
        showError(
          'Analyse',
          'La facture pro-forma a été créée mais l’enregistrement de l’analyse a échoué. Vérifiez le message d’erreur ou contactez l’administrateur.'
        );
      }
    } catch (error) {
      console.error('Error adding analysis:', error);
      showError('Erreur', 'Erreur lors de l\'ajout de l\'analyse');
    } finally {
      setPrescriptionDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleViewAnalysisResults = async (analysisId) => {
    setAnalysisResultsDialog({ open: true, analysisId, analysis: null, results: [], loading: true });
    try {
      const [result, complete] = await Promise.all([
        ConsumApi.getLaboratoryAnalysisResults(analysisId),
        ConsumApi.getLaboratoryAnalysisComplete(analysisId),
      ]);
      const analysisData = complete.success ? normalizeAnalysisEntity(complete.data) : null;
      const normalizedResults = flattenResults(result.data || []);
      if (result.success) {
        setAnalysisResultsDialog({
          open: true,
          analysisId,
          analysis: analysisData,
          results: normalizedResults,
          loading: false,
        });
      } else {
        setAnalysisResultsDialog({ open: true, analysisId, analysis: analysisData, results: [], loading: false });
      }
    } catch (error) {
      console.error('Error loading analysis results:', error);
      setAnalysisResultsDialog({ open: true, analysisId, analysis: null, results: [], loading: false });
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
    const isHema = isHematologyAnalysis(analysisDetails) || isHematologyResults(results);
    const transformedHema = transformHematologyResults(results);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError('Erreur', 'Impossible d’ouvrir la fenêtre d’impression');
      return;
    }

    const hemoRows = transformedHema.filter((row) =>
      ['globules_blancs', 'globules_rouges', 'hemoglobine', 'hematocrite', 'vgm', 'tcmh', 'ccmh', 'plaquettes'].includes(row.key)
    ).filter((row) => row.hasValue);
    const leucoRows = transformedHema.filter((row) =>
      ['lymphocytes', 'monocytes', 'granulocytes'].includes(row.key)
    ).filter((row) => row.hasValue);

    const printContent = isHema
      ? `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hématologie - Résultats</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 1.2cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.35;
              max-width: 900px;
              margin: 0 auto;
              padding: 10px;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .header img {
              max-width: 320px;
              width: 100%;
              height: auto;
              margin: 0 auto 6px auto;
              display: block;
            }
            .header h1 {
              margin: 2px 0;
              font-size: 18px;
              letter-spacing: 0.4px;
            }
            .header h2 {
              margin: 2px 0;
              font-size: 15px;
            }
            .meta-grid {
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 6px 24px;
              margin: 8px 0 10px 0;
            }
            .meta-item {
              min-width: 260px;
            }
            .label {
              font-weight: bold;
            }
            .section {
              margin-top: 10px;
            }
            .section-title {
              font-weight: bold;
              margin: 6px 0;
              text-transform: uppercase;
            }
            .subtitle {
              font-weight: bold;
              margin: 8px 0 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .status-normal {
              color: #1f7a1f;
              font-weight: bold;
            }
            .status-high {
              color: #c62828;
              font-weight: bold;
            }
            .status-low {
              color: #ef6c00;
              font-weight: bold;
            }
            .signature {
              margin-top: 20px;
              text-align: right;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${clinicLogoUrl}" alt="Logo clinique" />
            <div>LABORATOIRE D&apos;ANALYSES MEDICALES - TEL 89 63 26 46 / 40 88 44 00</div>
            <div>Soigner avec amour</div>
            <h1>HEMATOLOGIE</h1>
            <h2>RESULTATS D&apos;ANALYSE</h2>
          </div>

          <div class="meta-grid">
            ${patient?.lastName ? `<div class="meta-item"><span class="label">NOM:</span> ${patient.lastName}</div>` : ''}
            ${patient?.firstName ? `<div class="meta-item"><span class="label">PRENOMS:</span> ${patient.firstName}</div>` : ''}
            ${patient?.gender ? `<div class="meta-item"><span class="label">SEXE:</span> ${patient.gender}</div>` : ''}
            ${patient?.dateOfBirth ? `<div class="meta-item"><span class="label">AGE:</span> ${Math.max(0, new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear())} ANS</div>` : ''}
            ${(medecin?.firstName || medecin?.lastName) ? `<div class="meta-item"><span class="label">PRESCRIPTEUR:</span> DR ${medecin?.firstName || ''} ${medecin?.lastName || ''}</div>` : ''}
            <div class="meta-item"><span class="label">DATE:</span> ${analysisDetails?.samplingDate ? new Date(analysisDetails.samplingDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</div>
            ${analysisDetails?.analyseNumber ? `<div class="meta-item"><span class="label">NUMERO DE DOSSIER:</span> ${analysisDetails.analyseNumber}</div>` : ''}
          </div>

          <div class="section">
            <div class="subtitle">HEMOGRAMME SUR COMPTEUR MINDRAY BC 30 S</div>
            <table>
              <thead>
                <tr>
                  <th>Analyse</th>
                  <th>Résultat</th>
                  <th>Norme</th>
                  <th>Unité</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${hemoRows.map((row) => {
                  const statusClass = hemogramStatusRowClass(row.status);
                  const statusLabel = getStatusUi(row.status).label;
                  return `<tr>
                    <td>${row.name}</td>
                    <td>${row.value}</td>
                    <td>${row.norme}</td>
                    <td>${row.unit || ''}</td>
                    <td class="${statusClass}">${statusLabel}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="subtitle">FORMULE LEUCOCYTAIRE</div>
            <table>
              <thead>
                <tr>
                  <th>Analyse</th>
                  <th>Résultat</th>
                  <th>Norme</th>
                  <th>Unité</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${leucoRows.map((row) => {
                  const statusClass = hemogramStatusRowClass(row.status);
                  const statusLabel = getStatusUi(row.status).label;
                  return `<tr>
                    <td>${row.name}</td>
                    <td>${row.value}</td>
                    <td>${row.norme}</td>
                    <td>${row.unit || ''}</td>
                    <td class="${statusClass}">${statusLabel}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="signature">
            SIGNATURE BIOLOGISTE
          </div>
        </body>
      </html>
    `
      : `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Résultats d&apos;Analyse</title>
          <style>
            @media print { @page { size: A4; margin: 2cm; } }
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 auto 8px auto; display: block; }
            .info-section { margin-bottom: 30px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .info-label { font-weight: bold; }
            .analysis-details { border: 1px solid #000; padding: 20px; margin: 20px 0; }
            .results-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .results-table th, .results-table td { border: 1px solid #000; padding: 10px; text-align: left; }
            .results-table th { background-color: #f0f0f0; font-weight: bold; }
            .abnormal { color: red; font-weight: bold; }
            .footer { margin-top: 50px; text-align: right; }
            .signature { margin-top: 50px; border-top: 1px solid #000; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header"><img src="${clinicLogoUrl}" alt="Logo clinique" /><h1>RÉSULTATS D&apos;ANALYSE</h1></div>
          <div class="info-section">
            <div class="info-row"><span class="info-label">Date de l&apos;analyse:</span><span>${analysisDetails?.samplingDate ? new Date(analysisDetails.samplingDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</span></div>
            <div class="info-row"><span class="info-label">Numéro d&apos;analyse:</span><span>${analysisDetails?.analyseNumber || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Patient:</span><span>${patient?.firstName || ''} ${patient?.lastName || ''}</span></div>
            <div class="info-row"><span class="info-label">Date de naissance:</span><span>${patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Médecin prescripteur:</span><span>Dr. ${medecin?.firstName || ''} ${medecin?.lastName || ''} - ${medecin?.speciality || ''}</span></div>
          </div>
          <div class="analysis-details">
            <h2>Résultats</h2>
            <table class="results-table">
              <thead><tr><th>Paramètre</th><th>Valeur</th><th>Unité</th><th>Valeurs de référence</th><th>Statut</th></tr></thead>
              <tbody>
                ${results.map((result) => `
                  <tr>
                    <td>${result.parameter || 'N/A'}</td>
                    <td class="${result.abnormal ? 'abnormal' : ''}">${result.value || 'N/A'}</td>
                    <td>${result.unit || ''}</td>
                    <td>${result.referenceValueMin && result.referenceValueMax ? `${result.referenceValueMin} - ${result.referenceValueMax} ${result.unit || ''}` : 'N/A'}</td>
                    <td class="${result.abnormal ? 'abnormal' : ''}">${result.abnormal ? 'Anormal' : 'Normal'}</td>
                  </tr>
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
    setAnalysisResultsDialog({ open: false, analysisId: null, analysis: null, results: [], loading: false });
  };

  const handleOpenCertificatDialog = () => {
    setCertificatForm({
      type: 'ARRET_TRAVAIL',
      content: DEFAULT_ARRET_CONTENT,
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
    if (!detailsDialog.consultation) {
      showError('Erreur', 'Consultation introuvable');
      return;
    }

    setCertificatDialog({ open: true, loading: true });
    try {
      const result = await ConsumApi.addConsultationCertificat(detailsDialog.consultation.id, {
        ...certificatForm,
        type: 'ARRET_TRAVAIL',
        content: certificatForm.content || DEFAULT_ARRET_CONTENT,
      });
      const processed = showApiResponse(result, {
        successTitle: 'Arrêt de travail ajouté',
        errorTitle: 'Erreur d&apos;ajout',
      });

      if (processed.success) {
        showSuccess('Succès', 'Arrêt de travail ajouté avec succès');
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
      showError('Erreur', 'Erreur lors de l\'ajout de l\'arrêt de travail');
    } finally {
      setCertificatDialog((prev) => ({ ...prev, loading: false }));
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
              handledByUserId: adminInfo?.id || null,
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
          <title>Ordonnace Médicale</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0.8cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 6px;
              font-size: 12px;
              line-height: 1.25;
              min-height: calc(100vh - 1.6cm);
              display: flex;
              flex-direction: column;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .header h1 {
              margin: 2px 0 0 0;
              font-size: 20px;
              letter-spacing: 1px;
            }
            .header img {
              max-width: 240px;
              width: 100%;
              height: auto;
              margin: 0 auto 4px auto;
              display: block;
            }
            .header .subtitle {
              margin-top: 0;
              font-size: 11px;
              color: #555;
            }
            .info-section {
              margin-bottom: 8px;
              border: 1px solid #ddd;
              border-radius: 6px;
              padding: 6px 8px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              gap: 8px;
            }
            .info-label {
              font-weight: bold;
            }
            .prescription-details {
              border: 1px solid #000;
              padding: 8px;
              margin: 6px 0;
              min-height: 0;
            }
            .drug-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 12px;
              text-transform: uppercase;
            }
            .line {
              margin: 8px 0;
              font-size: 15px;
            }
            .line strong {
              display: inline-block;
              min-width: 110px;
            }
            .ord-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            .ord-table th,
            .ord-table td {
              border: 1px solid #000;
              padding: 4px 6px;
              text-align: left;
              vertical-align: top;
              font-size: 12px;
            }
            .ord-table th {
              background: #f3f3f3;
              font-weight: bold;
            }
            .ord-note {
              margin-top: 6px;
              font-size: 11px;
              color: #333;
            }
            .urgent {
              color: red;
              font-weight: bold;
            }
            .footer {
              margin-top: auto;
              text-align: right;
            }
            .signature {
              margin-top: 16px;
              border-top: 1px solid #000;
              padding-top: 8px;
              display: inline-block;
              min-width: 220px;
              text-align: center;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${clinicLogoUrl}" alt="Logo clinique" />
            <h1>ORDONNACE MÉDICALE</h1>
            <div class="subtitle">Prévenir - Soigner - Surveiller</div>
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
              <span class="info-label">Prescripteur:</span>
              <span>Dr. ${medecin?.firstName || ''} ${medecin?.lastName || ''} - ${medecin?.speciality || ''}</span>
            </div>
          </div>
          
          <div class="prescription-details">
            <table class="ord-table">
              <thead>
                <tr>
                  <th>Médicament</th>
                  <th>Dosage</th>
                  <th>Durée</th>
                  <th>Quantité</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    ${prescription.label || '—'}
                    ${prescription.urgent ? '<div class="urgent">(URGENT)</div>' : ''}
                  </td>
                  <td>${prescription.dosage || '—'}</td>
                  <td>${prescription.duration || '—'}</td>
                  <td>${prescription.quantity || '—'}</td>
                  <td>${prescription.instructions || '—'}</td>
                </tr>
              </tbody>
            </table>
            <div class="ord-note">Respecter strictement cette ordonnance selon les indications du médecin.</div>
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
                margin: 1.2cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 10px;
              line-height: 1.35;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
              margin-bottom: 16px;
            }
            .header h1 {
              margin: 4px 0 2px 0;
              font-size: 22px;
            }
            .header img {
              max-width: 320px;
              width: 100%;
              height: auto;
              margin: 0 auto 6px auto;
              display: block;
            }
            .header .subtitle {
              font-size: 12px;
              color: #555;
            }
            .info-section {
              margin-bottom: 12px;
              border: 1px solid #ddd;
              border-radius: 6px;
              padding: 10px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              gap: 12px;
            }
            .info-label {
              font-weight: bold;
            }
            .certificat-content {
              border: 1px solid #000;
              padding: 16px;
              margin: 14px 0;
              min-height: 320px;
              text-align: justify;
            }
            .cert-title {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
              margin: 0 0 14px 0;
            }
            .cert-body p {
              margin: 0 0 10px 0;
              font-size: 14px;
            }
            .cert-strong {
              font-weight: bold;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 24px;
              text-align: right;
            }
            .signature {
              margin-top: 32px;
              border-top: 1px solid #000;
              padding-top: 10px;
              display: inline-block;
              min-width: 260px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${clinicLogoUrl}" alt="Logo clinique" />
            <h1>CERTIFICAT MÉDICAL</h1>
            <div class="subtitle">Prévenir - Soigner - Surveiller</div>
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
            <div class="cert-title">CERTIFICAT MÉDICAL D&apos;ARRÊT DE TRAVAIL</div>
            <div class="cert-body">
              <p>
                Je soussigné(e), <span class="cert-strong">Dr. ${medecin?.firstName || ''} ${medecin?.lastName || ''}</span>,
                certifie avoir examiné ce jour :
              </p>
              <p>
                <span class="cert-strong">M./Mme ${patient?.firstName || ''} ${patient?.lastName || ''}</span>
                ${patient?.dateOfBirth ? `, né(e) le ${new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}` : ''}.
              </p>
              <p>
                L&apos;état de santé du/de la patient(e) nécessite un arrêt de travail
                ${certificat.durationDays ? ` de <span class="cert-strong">${certificat.durationDays} jour(s)</span>` : ''}.
              </p>
              ${(certificat.startDate || certificat.endDate) ? `
                <p>
                  ${certificat.startDate ? `À compter du <span class="cert-strong">${new Date(certificat.startDate).toLocaleDateString('fr-FR')}</span>` : ''}
                  ${certificat.endDate ? ` jusqu&apos;au <span class="cert-strong">${new Date(certificat.endDate).toLocaleDateString('fr-FR')}</span>` : ''}.
                </p>
              ` : ''}
              <p>Certificat établi pour servir et valoir ce que de droit.</p>
            </div>
          </div>
          
          <div class="footer">
            <div class="signature">
              <p>Signature et cachet du médecin</p>
              <br>
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
                    {analyses.map((analysis, index) => {
                      const acteGroups = extractAnalysisActesDetails(analysis);
                      return (
                        <Card key={analysis.id || index} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                          <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Chip
                              label={doctorListAnalysisStatusChipLabel(analysis.status)}
                              size="small"
                              color={doctorListAnalysisStatusChipColor(analysis.status)}
                            />
                          </Box>
                          {acteGroups.length > 0 && (
                            <Box>
                              {acteGroups.map((group, groupIndex) => (
                                <Box key={`${analysis.id || index}-${group.acteName}-${groupIndex}`} sx={{ mb: 0.75 }}>
                                  <Typography variant="body2">
                                    <strong>{group.acteName}</strong>
                                  </Typography>
                                  {group.items.map((item) => (
                                    <Typography key={`${analysis.id || index}-${item.id}`} variant="body2" color="text.secondary">
                                      - {item.name} ({Number(item.calculatedPrice || 0).toLocaleString('fr-FR')} FCFA)
                                    </Typography>
                                  ))}
                                </Box>
                              ))}
                            </Box>
                          )}
                          {analysis.samplingDate && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Date de prélèvement:</strong> {fDateTime(analysis.samplingDate)}
                            </Typography>
                          )}
                          {analysis.price && (
                            <Typography variant="body2">
                              <strong>Prix:</strong> {analysis.price} FCFA
                            </Typography>
                          )}
                          {(() => {
                            const cleanObservations = sanitizeAnalysisObservations(analysis.observations);
                            if (!cleanObservations) return null;
                            return (
                              <Typography variant="body2">
                                <strong>Observations:</strong> {cleanObservations}
                              </Typography>
                            );
                          })()}
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
                      );
                    })}
                  </Stack>
                )}

                <Divider>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Typography>Ordonnaces</Typography>
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
                    Aucune ordonnace
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
                            <strong>Durée:</strong> {certificat.durationDays || 'N/A'} jours
                            {certificat.startDate && (
                              <> | <strong>Du:</strong> {new Date(certificat.startDate).toLocaleDateString('fr-FR')}</>
                            )}
                            {certificat.endDate && (
                              <> | <strong>Au:</strong> {new Date(certificat.endDate).toLocaleDateString('fr-FR')}</>
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
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Catégories et examens
                </Typography>
                {actesBiologies.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aucune catégorie disponible.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {actesBiologies.map((acte) => {
                      const items = actesBiologiesItemsMap[acte.id] || [];
                      const selectedItems =
                        analysisForm.analyse.find((entry) => entry.actes_biologies === acte.id)?.actes_biologies_items || [];
                      return (
                        <Card key={acte.id} variant="outlined" sx={{ p: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {acte.name}
                          </Typography>
                          {items.length === 0 ? (
                            <Typography variant="caption" color="text.secondary">
                              Aucun examen dans cette catégorie.
                            </Typography>
                          ) : (
                            <Stack spacing={0.5}>
                              {items.map((item) => (
                                <FormControlLabel
                                  key={item.id}
                                  control={
                                    <Checkbox
                                      checked={selectedItems.includes(item.id)}
                                      onChange={() => handleToggleActeBiologieItem(acte.id, item.id)}
                                    />
                                  }
                                  label={`${item.name || item.id} — ${getPricingExamUnitPrice(item.examTariff).toLocaleString('fr-FR')} FCFA`}
                                />
                              ))}
                            </Stack>
                          )}
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observations"
                value={analysisForm.observations}
                onChange={(e) => setAnalysisForm({ ...analysisForm, observations: e.target.value })}
                placeholder="Observations ou notes sur l&apos;analyse..."
              />
              <Alert severity="info">
                Coût total : <strong>{Number(analysisForm.price || 0).toLocaleString('fr-FR')} FCFA</strong>
              </Alert>
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
              disabled={analysisForm.analyse.length === 0 || Number(analysisForm.price) <= 0}
            >
              Créer l&apos;analyse
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}

      {/* Ordonnace Dialog */}
      {!prescriptionDialog.isAnalysis && (
        <Dialog open={prescriptionDialog.open} onClose={handleClosePrescriptionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Ajouter une Ordonnace
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <>
                <TextField
                  fullWidth
                  label="Nom du médicament"
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrescriptionDialog}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleSavePrescription}
            loading={prescriptionDialog.loading}
            disabled={!prescriptionForm.label.trim()}
          >
            Ajouter
          </LoadingButton>
        </DialogActions>
      </Dialog>
      )}

      {/* Arrêt de travail Dialog */}
      <Dialog open={certificatDialog.open} onClose={handleCloseCertificatDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un Arrêt de travail</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Type"
              value="Arrêt de travail"
              InputProps={{ readOnly: true }}
            />
            <TextField
              fullWidth
              type="date"
              label="Date de début"
              value={certificatForm.startDate}
              onChange={(e) =>
                setCertificatForm((prev) => {
                  const startDate = e.target.value;
                  const { endDate } = prev;
                  let durationDays = 0;
                  if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
                    durationDays = diff >= 0 ? diff + 1 : 0;
                  }
                  return { ...prev, startDate, durationDays };
                })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="date"
              label="Date de fin"
              value={certificatForm.endDate}
              onChange={(e) =>
                setCertificatForm((prev) => {
                  const endDate = e.target.value;
                  const { startDate } = prev;
                  let durationDays = 0;
                  if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
                    durationDays = diff >= 0 ? diff + 1 : 0;
                  }
                  return { ...prev, endDate, durationDays };
                })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="number"
              label="Durée (en jours)"
              value={certificatForm.durationDays}
              InputProps={{ readOnly: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCertificatDialog}>Annuler</Button>
          <LoadingButton
            variant="contained"
            onClick={handleSaveCertificat}
            loading={certificatDialog.loading}
            disabled={!certificatForm.startDate || !certificatForm.endDate || certificatForm.durationDays <= 0}
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
              {isHematologyAnalysis(analysisResultsDialog.analysis) || isHematologyResults(analysisResultsDialog.results) ? (
                <Card sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Hématologie</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Analyse</TableCell>
                            <TableCell>Résultat</TableCell>
                            <TableCell>Norme</TableCell>
                            <TableCell>Statut</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {transformHematologyResults(analysisResultsDialog.results).filter((item) => item.hasValue).map((item) => (
                            <TableRow key={item.key}>
                              <TableCell>{item.nameWithUnit}</TableCell>
                              <TableCell>{item.value}</TableCell>
                              <TableCell>{item.norme}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{getStatusUi(item.status).label}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {transformHematologyResults(analysisResultsDialog.results).filter((item) => item.hasValue).length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Aucun résultat renseigné pour l&apos;hématologie.
                      </Typography>
                    )}
                  </Stack>
                </Card>
              ) : (
                analysisResultsDialog.results.map((result, index) => (
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
                ))
              )}
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
