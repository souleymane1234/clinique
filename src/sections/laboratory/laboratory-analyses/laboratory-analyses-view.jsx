import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Menu,
  Table,
  Stack,
  Button,
  Dialog,
  Select,
  Divider,
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
  isBillingInvoicePaid,
  BILLING_INVOICE_ID_REGEX,
  extractBillingInvoiceIdFromObservations,
} from 'src/utils/billing-utils';
import {
  getStatusUi,
  groupResultsByActe,
  isHematologyResults,
  buildActesMapFromAnalysis,
  transformHematologyResults,
  resolveActeBiologieInputsList,
  extractPrescribedActeSummaries,
  filterLaboratoryResultsForActe,
  printLaboratoryAnalysisResults,
  immunologieLastPrefillPairFromRows,
  extractImmunologieGeneraleValuesFromRows,
  immunologieGeneraleResultRowsLookLikeInputs,
} from 'src/utils/laboratory-analysis-print-results';

import { QUERY_KEYS } from 'src/constants/query-keys';
import ConsumApi from 'src/services_workers/consum_api';
import { invalidateLaboratoryAnalysisLists } from 'src/libs/laboratory-query';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

function resolveActeBiologieItemsList(itemsRes) {
  if (Array.isArray(itemsRes?.data)) return itemsRes.data;
  if (Array.isArray(itemsRes?.data?.items)) return itemsRes.data.items;
  return [];
}

function sanitizeAnalysisObservations(observations) {
  if (!observations || typeof observations !== 'string') return '';
  return observations.replace(BILLING_INVOICE_ID_REGEX, '').trim();
}

/** Libellés des items d'un bloc analyse (détails labo) : objets enrichis ou IDs résolus via le catalogue API. */
function getLaboratoryAnalyseBlockDetailRows(block, actNamesMap, itemsCatalogByActeId = {}) {
  const acteBiologieId =
    typeof block?.actes_biologies === 'string'
      ? block.actes_biologies
      : block?.actes_biologies?.id || null;
  const acteName =
    block?.actes_biologies?.name ||
    block?.acteBiologieName ||
    block?.actes_biologies_name ||
    block?.name ||
    (acteBiologieId ? actNamesMap[acteBiologieId] : '') ||
    'Acte biologie';

  const detailsFirst = Array.isArray(block?.actes_biologies_items_details)
    ? block.actes_biologies_items_details
    : null;
  let rawItems = [];
  if (detailsFirst && detailsFirst.length > 0) {
    rawItems = detailsFirst;
  } else if (Array.isArray(block?.actes_biologies_items)) {
    rawItems = block.actes_biologies_items;
  }

  const catalog =
    acteBiologieId && itemsCatalogByActeId[acteBiologieId]
      ? itemsCatalogByActeId[acteBiologieId]
      : [];

  const itemLabels = rawItems
    .map((item, idx) => {
      if (item != null && typeof item === 'object') {
        const label = String(
          item.name || item.label || item.itemName || item.title || item.description || ''
        ).trim();
        if (label) return label;
        if (item.id) return String(item.id);
        return `Item ${idx + 1}`;
      }
      const id = String(item ?? '').trim();
      if (!id) return null;
      const found = catalog.find((x) => String(x?.id) === id);
      const name = found?.name || found?.label || found?.itemName;
      return name ? String(name) : id;
    })
    .filter(Boolean);

  return { acteBiologieId, acteName, itemLabels };
}

const IMMUNOLOGIE_GENERALE_ACTE_ID = '5657bed3-b080-4f06-a245-2f00941671b1';

function paymentTriStateChipProps(paid) {
  if (paid === true) return { label: 'Payé', color: 'success' };
  if (paid === false) return { label: 'Non payé', color: 'warning' };
  return { label: 'Inconnu', color: 'default' };
}

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

async function fetchLaboratoryAnalysesTable({ page, rowsPerPage, search, statusFilter, typeFilter }) {
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

  if (!result.success) {
    return { analyses: [], total: 0, paymentStatusByAnalysisId: {} };
  }

  const analysesData = result.data || [];
  const paymentEntries = await Promise.all(
    analysesData.map(async (analysis) => {
      const invoiceId = extractBillingInvoiceIdFromObservations(analysis?.observations);
      if (!invoiceId) {
        return [analysis.id, { paid: null, invoiceId: null }];
      }
      try {
        const invoiceRes = await ConsumApi.getBillingInvoiceById(invoiceId);
        if (invoiceRes.success && invoiceRes.data) {
          return [analysis.id, { paid: isBillingInvoicePaid(invoiceRes.data), invoiceId }];
        }
        return [analysis.id, { paid: null, invoiceId }];
      } catch (error) {
        console.error('Error checking invoice payment status:', error);
        return [analysis.id, { paid: null, invoiceId }];
      }
    })
  );

  return {
    analyses: analysesData,
    total: result.pagination?.total ?? analysesData.length,
    paymentStatusByAnalysisId: Object.fromEntries(paymentEntries),
  };
}


export default function LaboratoryAnalysesView() {
  const { contextHolder, showError, showSuccess, showApiResponse } = useNotification();
  const clinicLogoUrl = `${window.location.origin}/assets/logo.jpeg`;

  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, analysis: null, loading: false });
  /** Catalogue actes + items API pour résoudre les noms dans le dialogue Détails */
  const [detailsSupportData, setDetailsSupportData] = useState({ actesCatalog: [], itemsByActeId: {} });
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
  const [prescribedActes, setPrescribedActes] = useState([]);
  const [activeActeIndex, setActiveActeIndex] = useState(0);
  const [inputResults, setInputResults] = useState({});
  const [printMenu, setPrintMenu] = useState({
    anchorEl: null,
    analysisId: null,
    results: [],
    actes: [],
    loading: false,
  });

  const analysesQuery = useQuery({
    queryKey: [
      ...QUERY_KEYS.laboratory.analysesPaginated,
      { page, rowsPerPage, search, statusFilter, typeFilter },
    ],
    queryFn: () =>
      fetchLaboratoryAnalysesTable({
        page,
        rowsPerPage,
        search,
        statusFilter,
        typeFilter,
      }),
  });

  const analyses = analysesQuery.data?.analyses ?? [];
  const total = analysesQuery.data?.total ?? 0;
  const paymentStatusByAnalysisId = analysesQuery.data?.paymentStatusByAnalysisId ?? {};
  const loading =
    analysesQuery.isPending ||
    (analysesQuery.isFetching && analyses.length === 0 && !analysesQuery.data);

  const handleViewDetails = async (analysis) => {
    setDetailsSupportData({ actesCatalog: [], itemsByActeId: {} });
    setDetailsDialog({ open: true, analysis, loading: true });
    setPaymentStatus({ loading: true, invoiceId: null, paid: null, message: '' });
    try {
      const result = await ConsumApi.getLaboratoryAnalysisComplete(analysis.id);
      const analysisData = result.success ? result.data : analysis;

      let actesCatalog = [];
      const itemsByActeId = {};
      try {
        const actesRes = await ConsumApi.getActesBiologies();
        actesCatalog = Array.isArray(actesRes?.data) ? actesRes.data : [];
        const analyseBlocks = Array.isArray(analysisData?.analyse) ? analysisData.analyse : [];
        const acteIds = [
          ...new Set(
            analyseBlocks
              .map((b) =>
                typeof b?.actes_biologies === 'string' ? b.actes_biologies : b?.actes_biologies?.id || null
              )
              .filter(Boolean)
          ),
        ];
        await Promise.all(
          acteIds.map(async (acteId) => {
            const itemsRes = await ConsumApi.getActesBiologieItems(acteId);
            itemsByActeId[acteId] = resolveActeBiologieItemsList(itemsRes);
          })
        );
      } catch (err) {
        console.error('Error loading catalog for analysis details:', err);
      }
      setDetailsSupportData({ actesCatalog, itemsByActeId });
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
      setDetailsSupportData({ actesCatalog: [], itemsByActeId: {} });
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
    setDetailsSupportData({ actesCatalog: [], itemsByActeId: {} });
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
          const itemsList = resolveActeBiologieItemsList(itemsRes);
          const inputsList = resolveActeBiologieInputsList(inputsRes);
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
        if (
          group.acteBiologieId === IMMUNOLOGIE_GENERALE_ACTE_ID ||
          (group.acteBiologieId === 'ACTE_NON_RENSEIGNE' &&
            immunologieGeneraleResultRowsLookLikeInputs(group.rows))
        ) {
          const { goutte, crp } = extractImmunologieGeneraleValuesFromRows(group.rows);
          let paramOption = '';
          let resText = '';
          if (goutte && crp) {
            ({ paramOption, resText } = immunologieLastPrefillPairFromRows(group.rows));
          } else if (goutte) {
            paramOption = 'Goutte épaisse';
            resText = goutte;
          } else if (crp) {
            paramOption = 'CRP';
            resText = crp;
          }
          if (!paramOption || !resText) {
            const gid = group.acteBiologieId;
            const slugParam =
              prefilledValues[`${gid}::paramettres`] ?? prefilledValues[`${gid}::parametres`];
            const slugRes = prefilledValues[`${gid}::resultat`];
            if (!paramOption) paramOption = String(slugParam || '').trim();
            if (!resText) resText = String(slugRes || '').trim();
          }
          if (paramOption) {
            prefilledValues[`${IMMUNOLOGIE_GENERALE_ACTE_ID}::paramettres`] = paramOption;
          }
          if (resText) {
            prefilledValues[`${IMMUNOLOGIE_GENERALE_ACTE_ID}::resultat`] = resText;
          }
        }
      });

      setPrescribedActes(prescribedDetails);
      setActiveActeIndex(0);
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
    setActiveActeIndex(0);
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

    const actesToSave = prescribedActes;

    try {
      const payloads = actesToSave
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

      const allOk = await payloads.reduce(async (prevOk, payload) => {
        const stillOk = await prevOk;
        if (!stillOk) return false;
        const result = await ConsumApi.addLaboratoryAnalysisResult(resultsDialog.analysisId, payload);
        const processed = showApiResponse(result, {
          successTitle: 'Résultat ajouté',
          errorTitle: 'Erreur',
        });
        return processed.success;
      }, Promise.resolve(true));

      if (!allOk) {
        return;
      }

      showSuccess('Succès', 'Résultats enregistrés avec succès');
      // Fermer immédiatement le modal après enregistrement réussi
      handleCloseResults();
      await invalidateLaboratoryAnalysisLists(queryClient);
    } catch (error) {
      console.error('Error adding result:', error);
      showError('Erreur', 'Erreur lors de l\'ajout du résultat');
    }
  };

  const printAnalysisResults = async (analysisId, results, printOptions = {}) =>
    printLaboratoryAnalysisResults({
      analysisId,
      results,
      printOptions,
      clinicLogoUrl,
      showError,
    });


  const handlePrintResultsDialog = async () => {
    const { analysisId, results } = resultsDialog;
    await printAnalysisResults(analysisId, results);
  };

  const handlePrintCurrentActeResultsOnly = async () => {
    const { analysisId, results } = resultsDialog;
    const safeIdx = Math.min(activeActeIndex, Math.max(prescribedActes.length - 1, 0));
    const acte = prescribedActes[safeIdx];
    if (!analysisId || !acte) return;
    await printAnalysisResults(analysisId, results, {
      acteBiologieId: acte.acteBiologieId,
      acteBiologieName: acte.acteBiologieName,
    });
  };

  const handleClosePrintMenu = () => {
    setPrintMenu({ anchorEl: null, analysisId: null, results: [], actes: [], loading: false });
  };

  const handleOpenPrintMenu = async (event, analysisId) => {
    if (!analysisId) {
      showError('Erreur', 'Analyse introuvable');
      return;
    }
    const anchorEl = event.currentTarget;
    setPrintMenu({ anchorEl, analysisId, results: [], actes: [], loading: true });
    try {
      const [resRes, completeRes, actesRes] = await Promise.all([
        ConsumApi.getLaboratoryAnalysisResults(analysisId),
        ConsumApi.getLaboratoryAnalysisComplete(analysisId),
        ConsumApi.getActesBiologies(),
      ]);
      const rows = resRes.success ? resRes.data || [] : [];
      const analysisData = completeRes.success ? completeRes.data : null;
      const catalog = Array.isArray(actesRes?.data) ? actesRes.data : [];
      const actNamesMap = buildActesMapFromAnalysis(analysisData, catalog);
      const summaries = extractPrescribedActeSummaries(analysisData, actNamesMap);
      const actesWithFlags = summaries.map((s) => ({
        ...s,
        hasResults: filterLaboratoryResultsForActe(rows, s.acteBiologieId).length > 0,
      }));
      setPrintMenu((prev) => ({
        ...prev,
        results: rows,
        actes: actesWithFlags,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading analysis results for print:', error);
      showError('Erreur', 'Impossible de charger les résultats pour impression');
      handleClosePrintMenu();
    }
  };

  const handlePrintMenuFull = async () => {
    const { analysisId, results } = printMenu;
    handleClosePrintMenu();
    if (!analysisId || !Array.isArray(results) || results.length === 0) {
      showError('Erreur', 'Aucun résultat à imprimer');
      return;
    }
    await printAnalysisResults(analysisId, results);
  };

  const handlePrintMenuActe = async (acte) => {
    const { analysisId, results } = printMenu;
    handleClosePrintMenu();
    if (!analysisId || !acte?.acteBiologieId) return;
    if (!Array.isArray(results) || results.length === 0) {
      showError('Erreur', 'Aucun résultat à imprimer');
      return;
    }
    await printAnalysisResults(analysisId, results, {
      acteBiologieId: acte.acteBiologieId,
      acteBiologieName: acte.acteBiologieName,
    });
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
        await invalidateLaboratoryAnalysisLists(queryClient);
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
                      <TableCell>Statut paiement</TableCell>
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
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              <LoadingButton loading>Chargement...</LoadingButton>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (analyses.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
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
                          <TableCell>
                            {(() => {
                              const pay = paymentStatusByAnalysisId[analysis.id]?.paid;
                              const chip = paymentTriStateChipProps(pay);
                              return <Chip label={chip.label} size="small" color={chip.color} />;
                            })()}
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
                                  Résultats
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
                              {(analysis.status === 'VALIDE' || analysis.status === 'VALIDEE') && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Iconify icon="solar:printer-bold" />}
                                  onClick={(e) => handleOpenPrintMenu(e, analysis.id)}
                                >
                                  Imprimer
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
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
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
                  Type
                </Typography>
                <Typography variant="body1">
                  {ANALYSIS_TYPES[detailsDialog.analysis.analysisType] || detailsDialog.analysis.analysisType}
                </Typography>
              </Box>
              {detailsDialog.analysis.samplingDate && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date de prélèvement
                  </Typography>
                  <Typography variant="body1">{fDate(detailsDialog.analysis.samplingDate)}</Typography>
                </Box>
              )}
              {detailsDialog.analysis.createdAt && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date de création
                  </Typography>
                  <Typography variant="body1">{fDate(detailsDialog.analysis.createdAt)}</Typography>
                </Box>
              )}
              {detailsDialog.analysis.updatedAt &&
                String(detailsDialog.analysis.updatedAt) !== String(detailsDialog.analysis.createdAt) && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Dernière mise à jour
                    </Typography>
                    <Typography variant="body1">{fDate(detailsDialog.analysis.updatedAt)}</Typography>
                  </Box>
                )}
              {detailsDialog.analysis.sampledBy && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prélèvement / réception
                  </Typography>
                  <Typography variant="body1">{detailsDialog.analysis.sampledBy}</Typography>
                </Box>
              )}
              {(detailsDialog.analysis.prescribingDoctor?.firstName ||
                detailsDialog.analysis.prescribingDoctor?.lastName) && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prescripteur
                  </Typography>
                  <Typography variant="body1">
                    Dr. {detailsDialog.analysis.prescribingDoctor?.firstName || ''}{' '}
                    {detailsDialog.analysis.prescribingDoctor?.lastName || ''}
                    {detailsDialog.analysis.prescribingDoctor?.speciality
                      ? ` — ${detailsDialog.analysis.prescribingDoctor.speciality}`
                      : ''}
                  </Typography>
                </Box>
              )}
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
                      {...paymentTriStateChipProps(paymentStatus.paid)}
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
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Actes biologiques prescrits
                </Typography>
                {(() => {
                  const a = detailsDialog.analysis;
                  const actNamesMap = buildActesMapFromAnalysis(a, detailsSupportData.actesCatalog);
                  const blocks = Array.isArray(a?.analyse) ? a.analyse : [];
                  if (blocks.length === 0) {
                    return (
                      <Typography variant="body2" color="text.secondary">
                        Aucun acte renseigné sur cette analyse.
                      </Typography>
                    );
                  }
                  return (
                    <Stack spacing={2}>
                      {blocks.map((block, idx) => {
                        const { acteName, itemLabels } = getLaboratoryAnalyseBlockDetailRows(
                          block,
                          actNamesMap,
                          detailsSupportData.itemsByActeId
                        );
                        return (
                          <Card key={block?.id || idx} variant="outlined" sx={{ p: 1.5 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {acteName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              Items biologiques
                            </Typography>
                            {itemLabels.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                Aucun item listé (acte seul)
                              </Typography>
                            ) : (
                              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                                {itemLabels.map((label, i) => (
                                  <Typography key={`${label}-${i}`} component="li" variant="body2">
                                    {label}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Card>
                        );
                      })}
                    </Stack>
                  );
                })()}
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
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
          {(detailsDialog.analysis?.status === 'VALIDE' ||
            detailsDialog.analysis?.status === 'VALIDEE') && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:printer-bold" />}
              onClick={(e) => handleOpenPrintMenu(e, detailsDialog.analysis.id)}
            >
              Imprimer
            </Button>
          )}
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
                  await invalidateLaboratoryAnalysisLists(queryClient);
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
                    await invalidateLaboratoryAnalysisLists(queryClient);
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

      <Menu
        anchorEl={printMenu.anchorEl}
        open={Boolean(printMenu.anchorEl)}
        onClose={handleClosePrintMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {printMenu.loading ? (
          <MenuItem disabled>Chargement…</MenuItem>
        ) : (
          <>
            <MenuItem onClick={handlePrintMenuFull} disabled={printMenu.results.length === 0}>
              Fiche complète (tous les actes)
            </MenuItem>
            {printMenu.actes.length > 1 && (
              <>
                <Divider />
                {printMenu.actes.map((a) => (
                  <MenuItem
                    key={a.acteBiologieId}
                    disabled={!a.hasResults}
                    onClick={() => handlePrintMenuActe(a)}
                  >
                    Imprimer — {a.acteBiologieName}
                  </MenuItem>
                ))}
              </>
            )}
          </>
        )}
      </Menu>

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
              {(() => {
                const safeIdx = Math.min(activeActeIndex, Math.max(prescribedActes.length - 1, 0));
                const currentActeIdForFilter =
                  prescribedActes.length > 1 ? prescribedActes[safeIdx]?.acteBiologieId : null;
                const displayResults =
                  currentActeIdForFilter && resultsDialog.results.length > 0
                    ? filterLaboratoryResultsForActe(resultsDialog.results, currentActeIdForFilter)
                    : resultsDialog.results;

                return (
                  <>
                    {prescribedActes.length > 1 && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        spacing={2}
                        sx={{ flexWrap: 'wrap', py: 1, bgcolor: 'action.hover', borderRadius: 1, px: 1 }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={activeActeIndex <= 0}
                          onClick={() => setActiveActeIndex((i) => Math.max(0, i - 1))}
                          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                        >
                          Acte précédent
                        </Button>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                          <strong>{prescribedActes[safeIdx]?.acteBiologieName || '—'}</strong>
                          {' · '}
                          Acte {safeIdx + 1} / {prescribedActes.length}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={activeActeIndex >= prescribedActes.length - 1}
                          onClick={() =>
                            setActiveActeIndex((i) => Math.min(prescribedActes.length - 1, i + 1))
                          }
                          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                        >
                          Acte suivant
                        </Button>
                      </Stack>
                    )}

                    {resultsDialog.results.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Aucun résultat
                      </Typography>
                    )}
                    {resultsDialog.results.length > 0 &&
                      displayResults.length === 0 &&
                      prescribedActes.length > 1 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          Aucun résultat enregistré pour cet acte biologique. Utilisez le formulaire ci-dessous
                          pour saisir les valeurs.
                        </Typography>
                      )}
                    {displayResults.length > 0 && isHematologyResults(displayResults) && (
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
                            {transformHematologyResults(displayResults)
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
                    )}
                    {displayResults.length > 0 && !isHematologyResults(displayResults) && (
                      <Stack spacing={1}>
                        {displayResults.map((result, index) => (
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
                                  <strong>Référence:</strong> {result.referenceValueMin} -{' '}
                                  {result.referenceValueMax} {result.unit}
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
                    )}
                  </>
                );
              })()}

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
                    (() => {
                      const safeIndex = Math.min(activeActeIndex, Math.max(prescribedActes.length - 1, 0));
                      const acte = prescribedActes[safeIndex];
                      if (!acte) return null;
                      return (
                        <Card key={acte.acteBiologieId} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2">{acte.acteBiologieName}</Typography>
                              <Chip
                                size="small"
                                label={`Acte ${safeIndex + 1}/${prescribedActes.length}`}
                                color="info"
                                variant="outlined"
                              />
                            </Stack>
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
                              acte.inputs.map((input) => {
                                const fieldKey = `${acte.acteBiologieId}::${input.slug}`;
                                const isSelectField =
                                  input?.fieldType === 'SELECT' &&
                                  Array.isArray(input?.options) &&
                                  input.options.length > 0;
                                return (
                                  <TextField
                                    key={`${acte.acteBiologieId}-${input.id || input.slug}`}
                                    fullWidth
                                    select={isSelectField}
                                    label={input.name || input.slug}
                                    value={inputResults[fieldKey] || ''}
                                    onChange={(e) =>
                                      setInputResults((prev) => ({
                                        ...prev,
                                        [fieldKey]: e.target.value,
                                      }))
                                    }
                                  >
                                    {isSelectField &&
                                      input.options.map((option) => (
                                        <MenuItem key={`${fieldKey}-${option}`} value={option}>
                                          {option}
                                        </MenuItem>
                                      ))}
                                  </TextField>
                                );
                              })
                            )}
                          </Stack>
                        </Card>
                      );
                    })()
                  )}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {prescribedActes.length > 0 && (
                      <LoadingButton variant="contained" onClick={() => handleAddResult()}>
                        {prescribedActes.length > 1 ? 'Enregistrer tous les actes' : 'Enregistrer les résultats'}
                      </LoadingButton>
                    )}
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResults}>Fermer</Button>
          {resultsDialog.results.length > 0 && (
            <>
              {prescribedActes.length > 1 &&
                (() => {
                  const si = Math.min(activeActeIndex, Math.max(prescribedActes.length - 1, 0));
                  const aid = prescribedActes[si]?.acteBiologieId;
                  const hasForActe =
                    aid && filterLaboratoryResultsForActe(resultsDialog.results, aid).length > 0;
                  return (
                    <Button
                      variant="outlined"
                      disabled={!hasForActe}
                      startIcon={<Iconify icon="solar:printer-bold" />}
                      onClick={handlePrintCurrentActeResultsOnly}
                    >
                      Imprimer cet acte
                    </Button>
                  );
                })()}
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:printer-bold" />}
                onClick={handlePrintResultsDialog}
              >
                {prescribedActes.length > 1 ? 'Imprimer tout' : 'Imprimer'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
