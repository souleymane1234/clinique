import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  Button,
  Dialog,
  Select,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
  TablePagination,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';
import { getCurrentStaffDisplayName } from 'src/utils/lab-user';
import {
  BILLING_INVOICE_ID_REGEX,
  isBillingInvoicePaid,
  extractBillingInvoiceIdFromObservations,
} from 'src/utils/billing-utils';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  EN_ATTENTE: 'warning',
  EN_COURS: 'info',
  TERMINE: 'success',
  VALIDE: 'success',
  VALIDEE: 'success',
  ANNULE: 'error',
};

const STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  VALIDE: 'Validé',
  VALIDEE: 'Validée',
  ANNULE: 'Annulé',
};

const ANALYSIS_TYPES = {
  HEMATOLOGIE: 'Hématologie',
  BIOCHIMIE: 'Biochimie',
  IMMUNOLOGIE: 'Immunologie',
  MICROBIOLOGIE: 'Microbiologie',
  SEROLOGIE: 'Sérologie',
  PARASITOLOGIE: 'Parasitologie',
};

const SAMPLE_TYPES = {
  SANG: 'Sang',
  URINE: 'Urine',
  SELLES: 'Selles',
  SALIVE: 'Salive',
  AUTRE: 'Autre',
};

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

const ACTE_RESULT_MODELS = {
  HEMATOLOGIE: {
    label: 'Hématologie',
    pdfTemplateName: 'Modele HEMATOLOGIE',
    columns: [
      { key: 'label', header: 'Parametre' },
      { key: 'result', header: 'Resultat' },
      { key: 'reference', header: 'Valeurs de reference' },
      { key: 'status', header: 'Statut' },
    ],
    rows: [],
  },
  DEFAULT: {
    label: 'Modele standard',
    pdfTemplateName: 'Modele STANDARD',
    columns: [
      { key: 'label', header: 'Parametre' },
      { key: 'result', header: 'Resultat' },
      { key: 'reference', header: 'Reference' },
    ],
    rows: [],
  },
};

function sanitizeAnalysisObservations(observations) {
  if (!observations || typeof observations !== 'string') return '';
  return observations.replace(BILLING_INVOICE_ID_REGEX, '').trim();
}

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

function getResultModelByActeName(acteName) {
  const normalized = normalizeToSlug(acteName).toUpperCase();
  if (normalized.includes('HEMATOLOGIE') || normalized.includes('NFS')) {
    return ACTE_RESULT_MODELS.HEMATOLOGIE;
  }
  return ACTE_RESULT_MODELS.DEFAULT;
}

function buildActesMapFromAnalysis(analysis, catalog = []) {
  const map = {};
  (Array.isArray(catalog) ? catalog : []).forEach((acte) => {
    if (acte?.id) {
      map[acte.id] = acte.name || acte.id;
    }
  });
  const analyseBlocks = Array.isArray(analysis?.analyse) ? analysis.analyse : [];
  analyseBlocks.forEach((entry) => {
    if (entry?.id && entry?.name) {
      map[entry.id] = entry.name;
    }
    if (entry?.actes_biologies && entry?.acteBiologieName) {
      map[entry.actes_biologies] = entry.acteBiologieName;
    }
    if (entry?.actes_biologies?.id && entry?.actes_biologies?.name) {
      map[entry.actes_biologies.id] = entry.actes_biologies.name;
    }
  });
  return map;
}

function groupResultsByActe(results, actNamesById = {}) {
  const groups = {};
  const ensureGroup = (acteBiologieId, acteName) => {
    const key = acteBiologieId || 'ACTE_NON_RENSEIGNE';
    if (!groups[key]) {
      groups[key] = {
        acteBiologieId: key,
        acteBiologieName: acteName || 'Acte non renseigne',
        rows: [],
      };
    }
    return groups[key];
  };

  (Array.isArray(results) ? results : []).forEach((entry) => {
    const acteBiologieId =
      entry?.acteBiologieId || entry?.actes_biologies || entry?.acte_biologie_id || entry?.acteBiologie?.id || null;
    const acteBiologieName =
      entry?.acteBiologieName || entry?.acteBiologie?.name || (acteBiologieId ? actNamesById[acteBiologieId] : '');

    if (Array.isArray(entry?.resultats)) {
      const group = ensureGroup(acteBiologieId, acteBiologieName);
      entry.resultats.forEach((item) => {
        group.rows.push({
          slug: item?.input || '',
          label: item?.name || item?.input || 'Parametre',
          result: item?.resultat ?? item?.value ?? '',
          reference: item?.reference || '—',
        });
      });
      return;
    }

    const group = ensureGroup(acteBiologieId, acteBiologieName);
    group.rows.push({
      slug: entry?.input || normalizeToSlug(entry?.parameter || ''),
      label: entry?.parameter || entry?.name || entry?.input || 'Parametre',
      result: entry?.resultat ?? entry?.value ?? '',
      reference:
        entry?.reference ||
        ((entry?.referenceValueMin || entry?.referenceValueMax)
          ? `${entry.referenceValueMin || ''}${entry.referenceValueMin || entry.referenceValueMax ? ' - ' : ''}${entry.referenceValueMax || ''} ${entry.unit || ''}`.trim()
          : '—'),
    });
  });

  return Object.values(groups);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function evaluateRangeStatus(value, min, max) {
  if (Number.isNaN(value)) return 'normal';
  if (value < min) return 'bas';
  if (value > max) return 'eleve';
  return 'normal';
}

function getStatusUi(status) {
  if (status === 'eleve') return { label: 'Élevé', color: 'error' };
  if (status === 'bas') return { label: 'Bas', color: 'warning' };
  return { label: 'Normal', color: 'success' };
}

function transformHematologyResults(results) {
  const resultMap = extractResultMap(results);
  return Object.entries(HEMATOLOGY_CONFIG).map(([input, config]) => {
    const rawValue = resultMap[input];
    const parsedValue = Number.parseFloat(rawValue);
    const hasValue = rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '';
    const status = hasValue
      ? evaluateRangeStatus(parsedValue, config.normeMin, config.normeMax)
      : 'normal';

    return {
      key: input,
      label: config.label,
      result: hasValue ? `${rawValue} ${config.unite}` : '—',
      reference: `${config.normeMin} - ${config.normeMax} ${config.unite}`,
      status,
    };
  });
}

function isHematologyResults(results) {
  const knownKeys = new Set(Object.keys(HEMATOLOGY_CONFIG));
  const values = Array.isArray(results) ? results : [];
  for (const entry of values) {
    if (Array.isArray(entry?.resultats)) {
      for (const row of entry.resultats) {
        const key = normalizeToSlug(String(row?.input || row?.parameter || row?.name || ''));
        if (knownKeys.has(key)) return true;
      }
      continue;
    }
    const key = normalizeToSlug(String(entry?.input || entry?.parameter || entry?.name || ''));
    if (knownKeys.has(key)) return true;
  }
  return false;
}

export default function LaboratoryAnalysesView() {
  const { contextHolder, showError, showSuccess, showApiResponse } = useNotification();
  const clinicLogoUrl = `${window.location.origin}/assets/logo.jpeg`;

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, analysis: null, loading: false });
  const [paymentStatus, setPaymentStatus] = useState({
    loading: false,
    invoiceId: null,
    paid: null,
    message: '',
  });
  const [resultsDialog, setResultsDialog] = useState({
    open: false,
    analysisId: null,
    results: [],
    loading: false,
  });
  const [actesBiologiesCatalog, setActesBiologiesCatalog] = useState([]);
  const [prescribedActes, setPrescribedActes] = useState([]);
  const [inputResults, setInputResults] = useState({});

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter) {
        filters.status = statusFilter;
      }
      if (typeFilter) {
        filters.analysisType = typeFilter;
      }
      if (search.trim()) {
        filters.search = search.trim();
      }

      const result = await ConsumApi.getLaboratoryAnalysesPaginated(page + 1, rowsPerPage, filters);

      if (result.success) {
        const analysesData = result.data || [];
        setAnalyses(analysesData);
        setTotal(result.pagination?.total ?? analysesData.length);
      } else {
        setAnalyses([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
      setAnalyses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, typeFilter]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  useEffect(() => {
    const loadActesCatalog = async () => {
      try {
        const actesResult = await ConsumApi.getActesBiologies();
        const actesList = Array.isArray(actesResult?.data) ? actesResult.data : [];
        setActesBiologiesCatalog(actesList);
      } catch (error) {
        console.error('Error loading actes biologies catalog:', error);
        setActesBiologiesCatalog([]);
      }
    };
    loadActesCatalog();
  }, []);

  const handleViewDetails = async (analysis) => {
    setDetailsDialog({ open: true, analysis, loading: true });
    setPaymentStatus({ loading: true, invoiceId: null, paid: null, message: '' });
    try {
      const result = await ConsumApi.getLaboratoryAnalysisComplete(analysis.id);
      const analysisData = result.success ? result.data : analysis;
      const invoiceId = extractBillingInvoiceIdFromObservations(analysisData?.observations);
      if (!invoiceId) {
        setPaymentStatus({
          loading: false,
          invoiceId: null,
          paid: null,
          message: 'Aucune facture liée',
        });
      } else {
        const invoiceRes = await ConsumApi.getBillingInvoiceById(invoiceId);
        if (invoiceRes.success && invoiceRes.data) {
          setPaymentStatus({
            loading: false,
            invoiceId,
            paid: isBillingInvoicePaid(invoiceRes.data),
            message: '',
          });
        } else {
          setPaymentStatus({
            loading: false,
            invoiceId,
            paid: null,
            message: invoiceRes.message || 'Impossible de vérifier le paiement',
          });
        }
      }
      if (result.success) {
        setDetailsDialog({ open: true, analysis: analysisData, loading: false });
      } else {
        setDetailsDialog({ open: true, analysis: analysisData, loading: false });
      }
    } catch (error) {
      console.error('Error loading analysis details:', error);
      setDetailsDialog({ open: true, analysis, loading: false });
      setPaymentStatus({
        loading: false,
        invoiceId: null,
        paid: null,
        message: 'Erreur lors de la vérification du paiement',
      });
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, analysis: null, loading: false });
    setPaymentStatus({ loading: false, invoiceId: null, paid: null, message: '' });
  };

  const handleViewResults = async (analysisId) => {
    setResultsDialog({ open: true, analysisId, results: [], loading: true });
    setPrescribedActes([]);
    setInputResults({});
    try {
      const [result, analysisRes, actesResult] = await Promise.all([
        ConsumApi.getLaboratoryAnalysisResults(analysisId),
        ConsumApi.getLaboratoryAnalysisComplete(analysisId),
        ConsumApi.getActesBiologies(),
      ]);
      const resultRows = result.success ? result.data || [] : [];
      const actesList = Array.isArray(actesResult?.data) ? actesResult.data : [];
      const analysisData = analysisRes.success ? analysisRes.data : null;
      const actNamesMap = buildActesMapFromAnalysis(analysisData, actesList);

      const analyseBlocks = Array.isArray(analysisData?.analyse) ? analysisData.analyse : [];
      const prescribedBase = [];
      analyseBlocks.forEach((block) => {
        const acteBiologieId =
          typeof block?.actes_biologies === 'string'
            ? block.actes_biologies
            : block?.actes_biologies?.id || null;
        if (!acteBiologieId) return;
        const itemIds = Array.isArray(block?.actes_biologies_items)
          ? block.actes_biologies_items
              .map((item) => (typeof item === 'string' ? item : item?.id))
              .filter(Boolean)
          : [];
        prescribedBase.push({
          acteBiologieId,
          acteBiologieName:
            block?.actes_biologies?.name || block?.acteBiologieName || actNamesMap[acteBiologieId] || 'Acte biologie',
          itemIds,
        });
      });

      const dedupMap = {};
      prescribedBase.forEach((entry) => {
        if (!dedupMap[entry.acteBiologieId]) {
          dedupMap[entry.acteBiologieId] = { ...entry };
          return;
        }
        dedupMap[entry.acteBiologieId].itemIds = Array.from(
          new Set([...(dedupMap[entry.acteBiologieId].itemIds || []), ...(entry.itemIds || [])])
        );
      });
      const prescribedEntries = Object.values(dedupMap);

      const prescribedDetails = await Promise.all(
        prescribedEntries.map(async (entry) => {
          const [itemsRes, inputsRes] = await Promise.all([
            ConsumApi.getActesBiologieItems(entry.acteBiologieId),
            ConsumApi.getActesBiologieInputs(entry.acteBiologieId),
          ]);
          const itemsList = Array.isArray(itemsRes?.data)
            ? itemsRes.data
            : Array.isArray(itemsRes?.data?.items)
              ? itemsRes.data.items
              : [];
          const inputsList = Array.isArray(inputsRes?.data?.inputs)
            ? inputsRes.data.inputs
            : Array.isArray(inputsRes?.data)
              ? inputsRes.data
              : [];
          const selectedItems =
            entry.itemIds.length > 0
              ? entry.itemIds.map((id) => itemsList.find((item) => item?.id === id)).filter(Boolean)
              : itemsList;
          return {
            ...entry,
            items: selectedItems,
            inputs: inputsList,
          };
        })
      );

      const groupedExisting = groupResultsByActe(resultRows, actNamesMap);
      const prefilledValues = {};
      groupedExisting.forEach((group) => {
        group.rows.forEach((row) => {
          if (!row?.slug) return;
          prefilledValues[`${group.acteBiologieId}::${row.slug}`] = row.result ?? '';
        });
      });

      setPrescribedActes(prescribedDetails);
      setInputResults(prefilledValues);
      setResultsDialog({ open: true, analysisId, results: resultRows, loading: false });
    } catch (error) {
      console.error('Error loading results:', error);
      setResultsDialog({ open: true, analysisId, results: [], loading: false });
    }
  };

  const handleCloseResults = () => {
    setResultsDialog({ open: false, analysisId: null, results: [], loading: false });
    setPrescribedActes([]);
    setInputResults({});
  };

  const handleAddResult = async () => {
    if (!resultsDialog.analysisId) {
      showError('Erreur', 'Analyse introuvable');
      return;
    }
    if (prescribedActes.length === 0) {
      showError('Erreur', 'Aucun acte biologie prescrit pour cette analyse');
      return;
    }

    try {
      const payloads = prescribedActes
        .map((acte) => {
          const resultats = (Array.isArray(acte.inputs) ? acte.inputs : [])
            .map((input) => ({
              input: input.slug,
              resultat: String(inputResults[`${acte.acteBiologieId}::${input.slug}`] ?? '').trim(),
            }))
            .filter((row) => row.resultat !== '');
          if (resultats.length === 0) return null;
          return { acteBiologieId: acte.acteBiologieId, resultats };
        })
        .filter(Boolean);

      if (payloads.length === 0) {
        showError('Erreur', 'Veuillez renseigner au moins une valeur');
        return;
      }

      for (const payload of payloads) {
        const result = await ConsumApi.addLaboratoryAnalysisResult(resultsDialog.analysisId, payload);
        const processed = showApiResponse(result, {
          successTitle: 'Résultat ajouté',
          errorTitle: 'Erreur',
        });
        if (!processed.success) {
          return;
        }
      }

      showSuccess('Succès', 'Résultats enregistrés avec succès');
      await loadAnalyses();
      handleCloseResults();
    } catch (error) {
      console.error('Error adding result:', error);
      showError('Erreur', 'Erreur lors de l\'ajout du résultat');
    }
  };

  const handlePrintResultsDialog = async () => {
    const { analysisId, results } = resultsDialog;
    if (!analysisId || !Array.isArray(results) || results.length === 0) {
      showError('Erreur', 'Aucun résultat à imprimer');
      return;
    }

    let analysisDetails = null;
    try {
      const completeRes = await ConsumApi.getLaboratoryAnalysisComplete(analysisId);
      if (completeRes.success) {
        analysisDetails = completeRes.data?.analyse || completeRes.data;
      }
    } catch (error) {
      console.error('Error loading analysis details for print:', error);
    }

    const isHema = isHematologyResults(results);
    const hemaRows = transformHematologyResults(results).filter((row) => row.result !== '—');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError('Erreur', 'Impossible d’ouvrir la fenêtre d’impression');
      return;
    }

    const printContent = isHema
      ? `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hématologie - Résultats</title>
          <style>
            @media print { @page { size: A4; margin: 1.2cm; } }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; max-width: 900px; margin: 0 auto; padding: 10px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 auto 6px auto; display: block; }
            .header h1 { margin: 2px 0; font-size: 18px; letter-spacing: 0.4px; }
            .header h2 { margin: 2px 0; font-size: 15px; }
            .meta-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px 24px; margin: 8px 0 10px 0; }
            .meta-item { min-width: 260px; }
            .label { font-weight: bold; }
            .section { margin-top: 10px; }
            .subtitle { font-weight: bold; margin: 8px 0 4px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .status-normal { color: #1f7a1f; font-weight: bold; }
            .status-high { color: #c62828; font-weight: bold; }
            .status-low { color: #ef6c00; font-weight: bold; }
            .signature { margin-top: 20px; text-align: right; font-weight: bold; }
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
            ${analysisDetails?.patient?.lastName ? `<div class="meta-item"><span class="label">NOM:</span> ${analysisDetails.patient.lastName}</div>` : ''}
            ${analysisDetails?.patient?.firstName ? `<div class="meta-item"><span class="label">PRENOMS:</span> ${analysisDetails.patient.firstName}</div>` : ''}
            ${analysisDetails?.patient?.gender ? `<div class="meta-item"><span class="label">SEXE:</span> ${analysisDetails.patient.gender}</div>` : ''}
            ${analysisDetails?.patient?.dateOfBirth ? `<div class="meta-item"><span class="label">AGE:</span> ${Math.max(0, new Date().getFullYear() - new Date(analysisDetails.patient.dateOfBirth).getFullYear())} ANS</div>` : ''}
            ${(analysisDetails?.prescribingDoctor?.firstName || analysisDetails?.prescribingDoctor?.lastName) ? `<div class="meta-item"><span class="label">PRESCRIPTEUR:</span> DR ${analysisDetails?.prescribingDoctor?.firstName || ''} ${analysisDetails?.prescribingDoctor?.lastName || ''}</div>` : ''}
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
                ${hemaRows
                  .filter((row) =>
                    ['globules_blancs', 'globules_rouges', 'hemoglobine', 'hematocrite', 'vgm', 'tcmh', 'ccmh', 'plaquettes'].includes(row.key)
                  )
                  .map((row) => {
                    const statusClass = row.status === 'eleve' ? 'status-high' : row.status === 'bas' ? 'status-low' : 'status-normal';
                    const statusLabel = getStatusUi(row.status).label;
                    const [norme, unite] = String(row.reference || '').split(' ').reduce(
                      (acc, part, index, arr) => (index < arr.length - 1 ? [`${acc[0]}${index ? ' ' : ''}${part}`, acc[1]] : [acc[0], part]),
                      ['', '']
                    );
                    return `<tr>
                      <td>${row.label}</td>
                      <td>${row.result}</td>
                      <td>${norme || row.reference}</td>
                      <td>${unite || ''}</td>
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
                ${hemaRows
                  .filter((row) => ['lymphocytes', 'monocytes', 'granulocytes'].includes(row.key))
                  .map((row) => {
                    const statusClass = row.status === 'eleve' ? 'status-high' : row.status === 'bas' ? 'status-low' : 'status-normal';
                    const statusLabel = getStatusUi(row.status).label;
                    const [norme, unite] = String(row.reference || '').split(' ').reduce(
                      (acc, part, index, arr) => (index < arr.length - 1 ? [`${acc[0]}${index ? ' ' : ''}${part}`, acc[1]] : [acc[0], part]),
                      ['', '']
                    );
                    return `<tr>
                      <td>${row.label}</td>
                      <td>${row.result}</td>
                      <td>${norme || row.reference}</td>
                      <td>${unite || ''}</td>
                      <td class="${statusClass}">${statusLabel}</td>
                    </tr>`;
                  }).join('')}
              </tbody>
            </table>
          </div>

          <div class="signature">SIGNATURE BIOLOGISTE</div>
        </body>
      </html>
    `
      : `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Résultats d'analyse</title>
          <style>
            @media print { @page { size: A4; margin: 2cm; } }
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 auto 8px auto; display: block; }
            h1 { margin: 0 0 10px 0; font-size: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header"><img src="${clinicLogoUrl}" alt="Logo clinique" /><h1>RÉSULTATS D'ANALYSE</h1></div>
          <table>
            <thead>
              <tr>
                <th>Paramètre</th>
                <th>Valeur</th>
                <th>Référence</th>
              </tr>
            </thead>
            <tbody>
              ${results.map((result) => `
                <tr>
                  <td>${result.parameter || result.input || 'N/A'}</td>
                  <td>${result.value ?? result.resultat ?? 'N/A'} ${result.unit || ''}</td>
                  <td>${result.referenceValueMin && result.referenceValueMax ? `${result.referenceValueMin} - ${result.referenceValueMax} ${result.unit || ''}` : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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

  const handleCompleteAnalysis = async (analysisId) => {
    try {
      const completeResult = await ConsumApi.completeLaboratoryAnalysis(analysisId);
      const completeProcessed = showApiResponse(completeResult, {
        successTitle: 'Analyse terminée',
        errorTitle: 'Erreur',
      });

      if (!completeProcessed.success) return;

      const validateResult = await ConsumApi.validateLaboratoryAnalysis(
        analysisId,
        getCurrentStaffDisplayName()
      );
      const validateProcessed = showApiResponse(validateResult, {
        successTitle: 'Résultats validés',
        errorTitle: 'Erreur',
      });

      if (validateProcessed.success) {
        showSuccess('Succès', 'Analyse terminée et validée automatiquement');
        await loadAnalyses();
        handleCloseDetails();
      }
    } catch (error) {
      console.error('Error completing analysis:', error);
      showError('Erreur', 'Erreur lors de la finalisation de l\'analyse');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const ensureLabBillingPaid = async (analysis) => {
    const invoiceId = extractBillingInvoiceIdFromObservations(analysis?.observations);
    if (!invoiceId) return true;
    const res = await ConsumApi.getBillingInvoiceById(invoiceId);
    if (!res.success || !res.data) {
      showError('Erreur', 'Impossible de vérifier le paiement lié à cette analyse.');
      return false;
    }
    if (!isBillingInvoicePaid(res.data)) {
      showError(
        'Paiement requis',
        'La facture liée à cette analyse n’est pas réglée. Le patient doit payer à la secrétaire avant toute prise en charge au laboratoire.'
      );
      return false;
    }
    return true;
  };

  const handlePrintResultByActe = (analysis, groupedActe) => {
    if (!groupedActe) return;
    const model = getResultModelByActeName(groupedActe.acteBiologieName);
    const resultMap = {};
    groupedActe.rows.forEach((row) => {
      if (row?.slug) resultMap[row.slug] = row.result;
    });
    const tableRows =
      model.label === 'Hématologie'
        ? transformHematologyResults(groupedActe.rows).map((row) => ({
            label: row.label,
            result: row.result,
            reference: row.reference,
            status: getStatusUi(row.status).label,
          }))
        : model.rows.length > 0
        ? model.rows.map((row) => ({
            label: row.label,
            result: resultMap[row.slug] || '—',
            reference: row.reference || '—',
          }))
        : groupedActe.rows.map((row) => ({
            label: row.label || row.slug || 'Parametre',
            result: row.result || '—',
            reference: row.reference || '—',
          }));

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      showError('Erreur', 'Impossible d’ouvrir la fenetre d’impression');
      return;
    }

    const patientName = analysis?.patient
      ? `${analysis.patient.firstName || ''} ${analysis.patient.lastName || ''}`.trim() || 'N/A'
      : 'N/A';

    const tableHtml = tableRows
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.result)}</td><td>${escapeHtml(row.reference)}</td>${
            model.label === 'Hématologie' ? `<td>${escapeHtml(row.status || '')}</td>` : ''
          }</tr>`
      )
      .join('');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Resultats ${escapeHtml(groupedActe.acteBiologieName)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
    h1, h2, p { margin: 0 0 8px 0; }
    .meta { margin-bottom: 16px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
    th { background: #f5f5f5; }
    .template { margin-top: 8px; font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <h1>Resultats d'analyse</h1>
  <h2>${escapeHtml(groupedActe.acteBiologieName || 'Acte biologie')}</h2>
  <div class="meta">
    <p><strong>Patient:</strong> ${escapeHtml(patientName)}</p>
    <p><strong>Numero analyse:</strong> ${escapeHtml(analysis?.analyseNumber || 'N/A')}</p>
    <p><strong>Modele PDF associe:</strong> ${escapeHtml(model.pdfTemplateName)}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(model.columns[0].header)}</th>
        <th>${escapeHtml(model.columns[1].header)}</th>
        <th>${escapeHtml(model.columns[2].header)}</th>
        ${model.label === 'Hématologie' ? `<th>${escapeHtml(model.columns[3].header)}</th>` : ''}
      </tr>
    </thead>
    <tbody>${tableHtml}</tbody>
  </table>
  <p class="template">Document genere selon le modele: ${escapeHtml(model.pdfTemplateName)}</p>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Gestion des Analyses | PREVENTIC </title>
      </Helmet>

      <Stack spacing={3}>
        <Typography variant="h4">Gestion des Analyses</Typography>

        <Card>
          <Stack spacing={2} sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Statut</InputLabel>
                <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="EN_ATTENTE">En attente</MenuItem>
                  <MenuItem value="EN_COURS">En cours</MenuItem>
                  <MenuItem value="TERMINE">Terminé</MenuItem>
                  <MenuItem value="VALIDE">Validé</MenuItem>
                  <MenuItem value="VALIDEE">Validée</MenuItem>
                  <MenuItem value="ANNULE">Annulé</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="HEMATOLOGIE">Hématologie</MenuItem>
                  <MenuItem value="BIOCHIMIE">Biochimie</MenuItem>
                  <MenuItem value="IMMUNOLOGIE">Immunologie</MenuItem>
                  <MenuItem value="MICROBIOLOGIE">Microbiologie</MenuItem>
                  <MenuItem value="SEROLOGIE">Sérologie</MenuItem>
                  <MenuItem value="PARASITOLOGIE">Parasitologie</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TableContainer>
              <Scrollbar>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Numéro</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Analyse</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Échantillon</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (loading) {
                        return (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                              <LoadingButton loading>Chargement...</LoadingButton>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (analyses.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Aucune analyse trouvée
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return analyses.map((analysis) => (
                        <TableRow key={analysis.id} hover>
                          <TableCell>{analysis.analyseNumber || 'N/A'}</TableCell>
                          <TableCell>{fDate(analysis.samplingDate || analysis.createdAt)}</TableCell>
                          <TableCell>
                            {(() => {
                              if (!analysis.patient) return 'N/A';
                              const firstName = analysis.patient.firstName || '';
                              const lastName = analysis.patient.lastName || '';
                              const fullName = `${firstName} ${lastName}`.trim();
                              return fullName || 'N/A';
                            })()}
                          </TableCell>
                          <TableCell>{analysis.analysisName || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={ANALYSIS_TYPES[analysis.analysisType] || analysis.analysisType}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>{SAMPLE_TYPES[analysis.sampleType] || analysis.sampleType}</TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[analysis.status] || analysis.status}
                              size="small"
                              color={STATUS_COLORS[analysis.status] || 'default'}
                            />
                            {analysis.urgent && (
                              <Chip label="Urgent" color="error" size="small" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleViewDetails(analysis)}
                              >
                                Détails
                              </Button>
                              {(analysis.status === 'EN_COURS' || analysis.status === 'TERMINE') && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleViewResults(analysis.id)}
                                >
                                  Voir
                                </Button>
                              )}
                              {analysis.status === 'EN_COURS' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleCompleteAnalysis(analysis.id)}
                                >
                                  Terminer et valider
                                </Button>
                              )}
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
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Stack>
        </Card>
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Détails de l&apos;analyse</DialogTitle>
        <DialogContent>
          {(() => {
            if (detailsDialog.loading) {
              return (
                <Typography variant="body2" color="text.secondary">
                  Chargement...
                </Typography>
              );
            }
            if (!detailsDialog.analysis) {
              return (
                <Typography variant="body2" color="text.secondary">
                  Aucune information disponible
                </Typography>
              );
            }
            return (
              <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Numéro
                </Typography>
                <Typography variant="body1">{detailsDialog.analysis.analyseNumber || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1">
                  {detailsDialog.analysis.patient
                    ? `${detailsDialog.analysis.patient.firstName || ''} ${detailsDialog.analysis.patient.lastName || ''}`.trim()
                    : 'N/A'}
                </Typography>
                {detailsDialog.analysis.patient?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    Téléphone: {detailsDialog.analysis.patient.phone}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Analyse
                </Typography>
                <Typography variant="body1">{detailsDialog.analysis.analysisName || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">
                  {ANALYSIS_TYPES[detailsDialog.analysis.analysisType] || detailsDialog.analysis.analysisType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Échantillon
                </Typography>
                <Typography variant="body1">
                  {SAMPLE_TYPES[detailsDialog.analysis.sampleType] || detailsDialog.analysis.sampleType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Statut
                </Typography>
                <Chip
                  label={STATUS_LABELS[detailsDialog.analysis.status] || detailsDialog.analysis.status}
                  color={STATUS_COLORS[detailsDialog.analysis.status] || 'default'}
                  size="small"
                />
                {detailsDialog.analysis.urgent && (
                  <Chip label="Urgent" color="error" size="small" sx={{ ml: 1 }} />
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Statut paiement
                </Typography>
                {paymentStatus.loading ? (
                  <Typography variant="body2" color="text.secondary">
                    Vérification...
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={
                        paymentStatus.paid === true
                          ? 'Payé'
                          : paymentStatus.paid === false
                            ? 'Non payé'
                            : 'Inconnu'
                      }
                      color={
                        paymentStatus.paid === true
                          ? 'success'
                          : paymentStatus.paid === false
                            ? 'warning'
                            : 'default'
                      }
                      size="small"
                    />
                    {paymentStatus.invoiceId && (
                      <Typography variant="caption" color="text.secondary">
                        Facture: {paymentStatus.invoiceId}
                      </Typography>
                    )}
                    {paymentStatus.message && (
                      <Typography variant="caption" color="text.secondary">
                        {paymentStatus.message}
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
              {(() => {
                const cleanObservations = sanitizeAnalysisObservations(detailsDialog.analysis.observations);
                if (!cleanObservations) return null;
                return (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Observations
                    </Typography>
                    <Typography variant="body1">{cleanObservations}</Typography>
                  </Box>
                );
              })()}
              {detailsDialog.analysis.conclusion && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Conclusion
                  </Typography>
                  <Typography variant="body1">{detailsDialog.analysis.conclusion}</Typography>
                </Box>
              )}
              {detailsDialog.analysis.price && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prix
                  </Typography>
                  <Typography variant="body1">{detailsDialog.analysis.price} FCFA</Typography>
                </Box>
              )}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
          {detailsDialog.analysis?.status === 'EN_ATTENTE' && (
            <Button
              variant="contained"
              color="info"
              onClick={async () => {
                if (!(await ensureLabBillingPaid(detailsDialog.analysis))) return;
                const result = await ConsumApi.receiveLaboratoryAnalysis(
                  detailsDialog.analysis.id,
                  getCurrentStaffDisplayName()
                );
                const processed = showApiResponse(result, {
                  successTitle: 'Échantillon réceptionné',
                  errorTitle: 'Erreur',
                });
                if (processed.success) {
                  showSuccess('Succès', 'Échantillon réceptionné avec succès');
                  loadAnalyses();
                  handleCloseDetails();
                }
              }}
            >
              Réceptionner
            </Button>
          )}
          {detailsDialog.analysis?.status === 'EN_COURS' && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  if (!(await ensureLabBillingPaid(detailsDialog.analysis))) return;
                  const result = await ConsumApi.performLaboratoryAnalysis(
                    detailsDialog.analysis.id,
                    getCurrentStaffDisplayName()
                  );
                  const processed = showApiResponse(result, {
                    successTitle: 'Analyse réalisée',
                    errorTitle: 'Erreur',
                  });
                  if (processed.success) {
                    showSuccess('Succès', 'Analyse marquée comme réalisée');
                    loadAnalyses();
                    handleCloseDetails();
                  }
                }}
              >
                Marquer comme réalisée
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleCompleteAnalysis(detailsDialog.analysis.id)}
              >
                Terminer et valider
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsDialog.open} onClose={handleCloseResults} maxWidth="md" fullWidth>
        <DialogTitle>Données de l&apos;analyse</DialogTitle>
        <DialogContent>
          {resultsDialog.loading ? (
            <Typography variant="body2" color="text.secondary">
              Chargement...
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {resultsDialog.results.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Aucun résultat
                </Typography>
              ) : (
                isHematologyResults(resultsDialog.results) ? (
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
                        {transformHematologyResults(resultsDialog.results)
                          .filter((item) => item.result !== '—')
                          .map((item) => (
                            <TableRow key={item.key}>
                              <TableCell>{item.label}</TableCell>
                              <TableCell>{item.result}</TableCell>
                              <TableCell>{item.reference}</TableCell>
                              <TableCell>{getStatusUi(item.status).label}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Stack spacing={1}>
                    {resultsDialog.results.map((result, index) => (
                      <Card key={result.id || index} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">{result.parameter}</Typography>
                            <Stack direction="row" spacing={1}>
                              {result.abnormal && <Chip label="Anormal" color="error" size="small" />}
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={async () => {
                                  if (window.confirm('Êtes-vous sûr de vouloir supprimer ce résultat ?')) {
                                    const deleteResult = await ConsumApi.deleteLaboratoryResult(result.id);
                                    const processed = showApiResponse(deleteResult, {
                                      successTitle: 'Résultat supprimé',
                                      errorTitle: 'Erreur',
                                    });
                                    if (processed.success) {
                                      showSuccess('Succès', 'Résultat supprimé avec succès');
                                      await handleViewResults(resultsDialog.analysisId);
                                    }
                                  }
                                }}
                              >
                                Supprimer
                              </Button>
                            </Stack>
                          </Box>
                          <Typography variant="body2">
                            <strong>Valeur:</strong> {result.value} {result.unit}
                          </Typography>
                          {result.referenceValueMin && result.referenceValueMax && (
                            <Typography variant="body2">
                              <strong>Référence:</strong> {result.referenceValueMin} - {result.referenceValueMax} {result.unit}
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
                )
              )}

              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Ajouter ou remplacer les résultats (par acte biologie)
                </Typography>
                <Stack spacing={2}>
                  {prescribedActes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Aucun acte biologie prescrit trouvé.
                    </Typography>
                  ) : (
                    prescribedActes.map((acte) => (
                      <Card key={acte.acteBiologieId} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                        <Stack spacing={1.5}>
                          <Typography variant="subtitle2">{acte.acteBiologieName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Examens prescrits:{' '}
                            {Array.isArray(acte.items) && acte.items.length > 0
                              ? acte.items.map((item) => item?.name).filter(Boolean).join(', ')
                              : 'Aucun item précisé'}
                          </Typography>
                          {!Array.isArray(acte.inputs) || acte.inputs.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              Aucun input disponible pour cet acte.
                            </Typography>
                          ) : (
                            acte.inputs.map((input) => (
                              <TextField
                                key={`${acte.acteBiologieId}-${input.id || input.slug}`}
                                fullWidth
                                label={input.name || input.slug}
                                value={inputResults[`${acte.acteBiologieId}::${input.slug}`] || ''}
                                onChange={(e) =>
                                  setInputResults((prev) => ({
                                    ...prev,
                                    [`${acte.acteBiologieId}::${input.slug}`]: e.target.value,
                                  }))
                                }
                              />
                            ))
                          )}
                        </Stack>
                      </Card>
                    ))
                  )}
                  <LoadingButton variant="contained" onClick={handleAddResult}>
                    Enregistrer les résultats
                  </LoadingButton>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResults}>Fermer</Button>
          {resultsDialog.results.length > 0 && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:printer-bold" />}
              onClick={handlePrintResultsDialog}
            >
              Imprimer
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
