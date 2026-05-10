import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

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

const BIOCHIMIE_SUBSTRATS_ACTE_ID = '6e614045-9257-436d-a2db-0bef80ca39be';
const BIOCHIMIE_ELECTROLYTES_ACTE_ID = '41ff3122-d862-46ef-9506-2f7c278a8b1f';
const ELECTROPHORESE_HEMOGLOBINE_ACTE_ID = '6ccbdee0-2dc6-4249-b225-3643d737b252';
const HEMATOLOGIE_SERODIAGNOSTIQUE_ACTE_ID = '94204d94-b46b-4d92-80f3-609d2a391402';
const SEROLOGIE_HEPATITE_B_ACTE_ID = 'cd73efb6-ed4b-4b53-9e42-33b168a90e22';
const IMMUNOLOGIE_GENERALE_ACTE_ID = '5657bed3-b080-4f06-a245-2f00941671b1';
const BIOCHIMIE_URINE_SLUGS = new Set(['acetone', 'albumine', 'sucre', 'proteiurie_24_h']);
const ELECTROPHORESE_SLUGS = new Set([
  'profil_electrophorese_1',
  'profil_electrophorese_2',
  'profil_electrophorese_3',
]);
const SERODIAGNOSTIQUE_SLUGS = new Set([
  'to_choix',
  'to_titre',
  'ao_choix',
  'ao_titre',
  'bo_choix',
  'bo_titre',
  'co_choix',
  'co_titre',
  'th_choix',
  'th_titre',
  'ah_choix',
  'ah_titre',
  'bh_choix',
  'bh_titre',
  'ch_choix',
  'ch_titre',
  'interpretation',
]);
const SEROLOGIE_HEPATITE_B_SLUGS = new Set([
  'syphilis',
  'rubeole',
  'toxoplasmose',
  'ac_anti_hbc_totaux',
  'ag_anti_hbs',
  'an_anti_vc',
  'ac_anti_vc',
  'resultat_choix',
]);
const SEROLOGIE_HEPATITE_B_UNITS = ['IgM + / IgG +', 'IgM - / IgG +', 'IgM + / IgG -', 'IgM - / IgG -'];
const IMMUNOLOGIE_GENERALE_ROWS = [
  {
    key: 'goutte',
    label: 'Goutte épaisse',
    technique: '(diagnostique microscopique)',
    unit: 'P/μl',
  },
  {
    key: 'crp',
    label: 'CRP',
    technique: '(Agglutination sur plaques)',
    unit: 'mg/dl',
  },
];
const BIOCHIMIE_REFERENCE_BY_SLUG = {
  uree: '0,15 - 0,45 g/l',
  glycemie: '0,70 - 1,10 g/l',
  creatinine: '6 - 14 mg/l',
  acide_urique: '30 - 70 mg/l',
  cholesterol_total: '< 2 g/l',
  cholesterol_hdl: '0,4 - 0,7 g/l',
  cholesterol_ldl: '< 1,60 mg/l',
  triglycerides: '0,4 - 1,60 g/l',
  bilirubine_totale: '< 12,0 mg/l',
  bilirubine_conjuguee: '< 2,5 mg/l',
  proteines_totales: '65 - 80 g/l',
  crp: '< 5 mg/l',
  sodium: '137 - 145 mEq/l',
  potassium: '3,5 - 5,00 mEq/l',
  chlorures: '95 - 110 mEq/l',
  calcium: '88 - 110 mg/l',
  magnesium_globulaire: '16 - 26 mg/l',
  phosphore: 'A: 25 - 50 mg/l / E: 40 - 60 mg/l',
  fer_serique: '0,60 - 1,6 mg/l',
  ldh: '140 - 330 UI/l',
  cpk: '15 - 200 UI/l',
  hb_glyquee_hba1c: '< 6 %',
  tgo_asat: '6 - 30 UI/l',
  tgp_alat: '6 - 40 UI/l',
  gamma_gt: '15 - 60 UI/l',
  acetone: 'Néant',
  albumine: '0,10 g/l',
  sucre: 'Néant',
  proteiurie_24_h: '—',
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

function resolveHematologyKey(value) {
  const normalized = normalizeToSlug(String(value || ''));
  if (!normalized) return '';
  if (HEMATOLOGY_CONFIG[normalized]) return normalized;
  return (
    Object.keys(HEMATOLOGY_CONFIG).find(
      (key) => normalized === key || normalized.startsWith(`${key}_`)
    ) || ''
  );
}

function extractResultMap(results) {
  const out = {};
  if (!Array.isArray(results)) return out;
  results.forEach((entry) => {
    if (entry?.input) {
      const inputKey = normalizeToSlug(String(entry.input));
      out[inputKey] = entry.resultat ?? entry.value ?? '';
      const canonicalKey = resolveHematologyKey(inputKey);
      if (canonicalKey) out[canonicalKey] = entry.resultat ?? entry.value ?? '';
    }
    if (entry?.parameter) {
      const paramKey = normalizeToSlug(String(entry.parameter));
      out[paramKey] = entry.value ?? entry.resultat ?? '';
      const canonicalKey = resolveHematologyKey(paramKey);
      if (canonicalKey) out[canonicalKey] = entry.value ?? entry.resultat ?? '';
    }
    if (Array.isArray(entry?.resultats)) {
      entry.resultats.forEach((r) => {
        if (r?.input) {
          const rowKey = normalizeToSlug(String(r.input));
          out[rowKey] = r.resultat ?? '';
          const canonicalKey = resolveHematologyKey(rowKey);
          if (canonicalKey) out[canonicalKey] = r.resultat ?? '';
        }
      });
    }
  });
  return out;
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

/** Libellés des items d’un bloc analyse (détails labo) : objets enrichis ou IDs résolus via le catalogue API. */
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

/** Actes biologiques prescrits sur l’analyse (pour menu d’impression par acte). */
function extractPrescribedActeSummaries(analysisData, actNamesById = {}) {
  const analyseBlocks = Array.isArray(analysisData?.analyse) ? analysisData.analyse : [];
  const dedup = {};
  analyseBlocks.forEach((block) => {
    const acteBiologieId =
      typeof block?.actes_biologies === 'string'
        ? block.actes_biologies
        : block?.actes_biologies?.id || null;
    if (!acteBiologieId) return;
    const name =
      block?.actes_biologies?.name ||
      block?.acteBiologieName ||
      actNamesById[acteBiologieId] ||
      'Acte biologie';
    if (!dedup[acteBiologieId]) {
      dedup[acteBiologieId] = { acteBiologieId, acteBiologieName: name };
    }
  });
  return Object.values(dedup);
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

function getLaboratoryResultEntryActeId(entry) {
  if (!entry || typeof entry !== 'object') return null;
  return (
    entry.acteBiologieId ||
    entry.actes_biologies ||
    entry.acte_biologie_id ||
    entry.acteBiologie?.id ||
    null
  );
}

/** Filtre les entrées API des résultats pour un acte biologique (impression / affichage par acte). */
function filterLaboratoryResultsForActe(results, acteBiologieId) {
  if (!acteBiologieId || !Array.isArray(results)) return Array.isArray(results) ? [...results] : [];
  return results.filter((entry) => getLaboratoryResultEntryActeId(entry) === acteBiologieId);
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

function hemRowStatusClass(status) {
  if (status === 'eleve') return 'status-high';
  if (status === 'bas') return 'status-low';
  return 'status-normal';
}

function resolveActeBiologieItemsList(itemsRes) {
  if (Array.isArray(itemsRes?.data)) return itemsRes.data;
  if (Array.isArray(itemsRes?.data?.items)) return itemsRes.data.items;
  return [];
}

function resolveActeBiologieInputsList(inputsRes) {
  if (Array.isArray(inputsRes?.data?.inputs)) return inputsRes.data.inputs;
  if (Array.isArray(inputsRes?.data)) return inputsRes.data;
  return [];
}

function paymentTriStateChipProps(paid) {
  if (paid === true) return { label: 'Payé', color: 'success' };
  if (paid === false) return { label: 'Non payé', color: 'warning' };
  return { label: 'Inconnu', color: 'default' };
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

async function buildHematologyPrintSections(analysisDetails, results, onlyActeBiologieId = null) {
  const analyseBlocks = Array.isArray(analysisDetails?.analyse) ? analysisDetails.analyse : [];
  const prescribedEntries = [];

  analyseBlocks.forEach((block) => {
    const acteBiologieId =
      typeof block?.actes_biologies === 'string'
        ? block.actes_biologies
        : block?.actes_biologies?.id || null;
    if (!acteBiologieId) return;
    prescribedEntries.push({
      acteBiologieId,
      acteBiologieName: block?.actes_biologies?.name || block?.acteBiologieName || 'Acte biologie',
    });
  });

  let dedupEntries = Object.values(
    prescribedEntries.reduce((acc, entry) => {
      if (!acc[entry.acteBiologieId]) {
        acc[entry.acteBiologieId] = entry;
      }
      return acc;
    }, {})
  );

  if (onlyActeBiologieId) {
    dedupEntries = dedupEntries.filter((e) => e.acteBiologieId === onlyActeBiologieId);
  }

  if (dedupEntries.length === 0) {
    if (onlyActeBiologieId) {
      return [];
    }
    return [
      {
        acteBiologieName: 'Hématologie',
        rows: transformHematologyResults(results),
      },
    ];
  }

  const groupedResults = groupResultsByActe(results);
  const valueMap = {};
  const globalValueBySlug = {};
  groupedResults.forEach((group) => {
    group.rows.forEach((row) => {
      if (!row?.slug) return;
      const normalizedSlug = normalizeToSlug(String(row.slug));
      valueMap[`${group.acteBiologieId}::${normalizedSlug}`] = row.result ?? '';
      const canonicalSlug = resolveHematologyKey(normalizedSlug);
      if (canonicalSlug) {
        valueMap[`${group.acteBiologieId}::${canonicalSlug}`] = row.result ?? '';
      }
      if (!(normalizedSlug in globalValueBySlug) || String(globalValueBySlug[normalizedSlug] || '').trim() === '') {
        globalValueBySlug[normalizedSlug] = row.result ?? '';
      }
      if (
        canonicalSlug &&
        (!(canonicalSlug in globalValueBySlug) || String(globalValueBySlug[canonicalSlug] || '').trim() === '')
      ) {
        globalValueBySlug[canonicalSlug] = row.result ?? '';
      }
    });
  });

  const sections = await Promise.all(
    dedupEntries.map(async (entry) => {
      const inputsRes = await ConsumApi.getActesBiologieInputs(entry.acteBiologieId);
      const inputsList = resolveActeBiologieInputsList(inputsRes);

      const rows = inputsList.map((input) => {
        const rawSlug = input?.slug || normalizeToSlug(input?.name || '');
        const canonicalSlug = resolveHematologyKey(rawSlug);
        const slug = canonicalSlug || normalizeToSlug(rawSlug);
        const config = HEMATOLOGY_CONFIG[slug];
        const byActeValue = valueMap[`${entry.acteBiologieId}::${slug}`] ?? valueMap[`${entry.acteBiologieId}::${normalizeToSlug(rawSlug)}`];
        const fallbackValue = globalValueBySlug[slug] ?? globalValueBySlug[normalizeToSlug(rawSlug)];
        const rawValue = String(byActeValue ?? fallbackValue ?? '').trim();
        const hasValue = rawValue !== '';
        const parsedValue = Number.parseFloat(rawValue);
        const status =
          config && hasValue
            ? evaluateRangeStatus(parsedValue, config.normeMin, config.normeMax)
            : 'normal';
        const unit = input?.unit || config?.unite || '';
        let reference = input?.reference || '';
        if (!reference) {
          if (input?.referenceValueMin || input?.referenceValueMax) {
            const sep = input.referenceValueMin || input.referenceValueMax ? ' - ' : '';
            reference = `${input.referenceValueMin || ''}${sep}${input.referenceValueMax || ''} ${unit}`.trim();
          } else if (config) {
            reference = `${config.normeMin} - ${config.normeMax} ${config.unite}`;
          } else {
            reference = '—';
          }
        }

        return {
          label: input?.name || slug || 'Paramètre',
          result: rawValue,
          reference,
          unit,
          status,
        };
      });

      return {
        acteBiologieName: entry.acteBiologieName,
        rows,
      };
    })
  );

  return sections;
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

function analysisHasActeBiologie(analysisDetails, acteBiologieId) {
  const analyseBlocks = Array.isArray(analysisDetails?.analyse) ? analysisDetails.analyse : [];
  return analyseBlocks.some((block) => {
    const blockActeId =
      typeof block?.actes_biologies === 'string'
        ? block.actes_biologies
        : block?.actes_biologies?.id || null;
    return blockActeId === acteBiologieId;
  });
}

function resolveBiochimieSubstratsActeId(analysisDetails) {
  const analyseBlocks = Array.isArray(analysisDetails?.analyse) ? analysisDetails.analyse : [];

  const explicitMatch = analyseBlocks.find((block) => {
    const blockActeId =
      typeof block?.actes_biologies === 'string'
        ? block.actes_biologies
        : block?.actes_biologies?.id || null;
    return blockActeId === BIOCHIMIE_SUBSTRATS_ACTE_ID;
  });
  if (explicitMatch) {
    return BIOCHIMIE_SUBSTRATS_ACTE_ID;
  }

  const byName = analyseBlocks.find((block) => {
    const acteName = block?.actes_biologies?.name || block?.acteBiologieName || '';
    const normalized = normalizeToSlug(acteName);
    return normalized.includes('biochimie') && normalized.includes('substrats');
  });
  if (!byName) return null;

  return typeof byName?.actes_biologies === 'string'
    ? byName.actes_biologies
    : byName?.actes_biologies?.id || null;
}

function isBiochimieSubstratsResults(results) {
  const knownSlugs = new Set(Object.keys(BIOCHIMIE_REFERENCE_BY_SLUG));
  const values = Array.isArray(results) ? results : [];
  return values.some((entry) => {
    if (entry?.acteBiologieId === BIOCHIMIE_SUBSTRATS_ACTE_ID || entry?.actes_biologies === BIOCHIMIE_SUBSTRATS_ACTE_ID) {
      return true;
    }
    if (Array.isArray(entry?.resultats)) {
      return entry.resultats.some((row) => {
        const slug = normalizeToSlug(String(row?.input || row?.parameter || row?.name || ''));
        return knownSlugs.has(slug);
      });
    }
    const slug = normalizeToSlug(String(entry?.input || entry?.parameter || entry?.name || ''));
    return knownSlugs.has(slug);
  });
}

function isBiochimieElectrolytesResults(results, analysisDetails) {
  if (analysisHasActeBiologie(analysisDetails, BIOCHIMIE_ELECTROLYTES_ACTE_ID)) return true;
  const analyseBlocks = Array.isArray(analysisDetails?.analyse) ? analysisDetails.analyse : [];
  const byName = analyseBlocks.some((block) => {
    const acteName = block?.actes_biologies?.name || block?.acteBiologieName || '';
    const normalized = normalizeToSlug(acteName);
    return normalized.includes('biochimie') && normalized.includes('electrolyte');
  });
  if (byName) return true;
  const values = Array.isArray(results) ? results : [];
  return values.some(
    (entry) =>
      entry?.acteBiologieId === BIOCHIMIE_ELECTROLYTES_ACTE_ID ||
      entry?.actes_biologies === BIOCHIMIE_ELECTROLYTES_ACTE_ID
  );
}

function isElectrophoreseHemoglobineResults(results, analysisDetails) {
  if (analysisHasActeBiologie(analysisDetails, ELECTROPHORESE_HEMOGLOBINE_ACTE_ID)) return true;
  const values = Array.isArray(results) ? results : [];
  return values.some((entry) => {
    if (
      entry?.acteBiologieId === ELECTROPHORESE_HEMOGLOBINE_ACTE_ID ||
      entry?.actes_biologies === ELECTROPHORESE_HEMOGLOBINE_ACTE_ID
    ) {
      return true;
    }
    if (Array.isArray(entry?.resultats)) {
      return entry.resultats.some((row) => {
        const slug = normalizeToSlug(String(row?.input || row?.parameter || row?.name || ''));
        return ELECTROPHORESE_SLUGS.has(slug);
      });
    }
    const slug = normalizeToSlug(String(entry?.input || entry?.parameter || entry?.name || ''));
    return ELECTROPHORESE_SLUGS.has(slug);
  });
}

function isSerodiagnostiqueResults(results, analysisDetails) {
  if (analysisHasActeBiologie(analysisDetails, HEMATOLOGIE_SERODIAGNOSTIQUE_ACTE_ID)) return true;
  const values = Array.isArray(results) ? results : [];
  return values.some((entry) => {
    if (
      entry?.acteBiologieId === HEMATOLOGIE_SERODIAGNOSTIQUE_ACTE_ID ||
      entry?.actes_biologies === HEMATOLOGIE_SERODIAGNOSTIQUE_ACTE_ID
    ) {
      return true;
    }
    if (Array.isArray(entry?.resultats)) {
      return entry.resultats.some((row) => {
        const slug = normalizeToSlug(String(row?.input || row?.parameter || row?.name || ''));
        return SERODIAGNOSTIQUE_SLUGS.has(slug);
      });
    }
    const slug = normalizeToSlug(String(entry?.input || entry?.parameter || entry?.name || ''));
    return SERODIAGNOSTIQUE_SLUGS.has(slug);
  });
}

function isSerologieHepatiteBResults(results, analysisDetails) {
  if (analysisHasActeBiologie(analysisDetails, SEROLOGIE_HEPATITE_B_ACTE_ID)) return true;
  const values = Array.isArray(results) ? results : [];
  return values.some((entry) => {
    if (
      entry?.acteBiologieId === SEROLOGIE_HEPATITE_B_ACTE_ID ||
      entry?.actes_biologies === SEROLOGIE_HEPATITE_B_ACTE_ID
    ) {
      return true;
    }
    if (Array.isArray(entry?.resultats)) {
      return entry.resultats.some((row) => {
        const slug = normalizeToSlug(String(row?.input || row?.parameter || row?.name || ''));
        return SEROLOGIE_HEPATITE_B_SLUGS.has(slug);
      });
    }
    const slug = normalizeToSlug(String(entry?.input || entry?.parameter || entry?.name || ''));
    return SEROLOGIE_HEPATITE_B_SLUGS.has(slug);
  });
}

function isImmunologieGeneraleResults(results, analysisDetails) {
  if (analysisHasActeBiologie(analysisDetails, IMMUNOLOGIE_GENERALE_ACTE_ID)) return true;
  const values = Array.isArray(results) ? results : [];
  return values.some(
    (entry) =>
      entry?.acteBiologieId === IMMUNOLOGIE_GENERALE_ACTE_ID ||
      entry?.actes_biologies === IMMUNOLOGIE_GENERALE_ACTE_ID
  );
}

function resolveImmunologieGeneraleSelectionKey(paramRaw) {
  const raw = String(paramRaw || '').trim();
  if (!raw) return '';
  const n = normalizeToSlug(raw);
  if (n.includes('goutte') && n.includes('epaisse')) return 'goutte';
  if (n === 'crp' || raw.toUpperCase() === 'CRP') return 'crp';
  return '';
}

function extractImmunologieGeneraleValuesFromRows(rows) {
  let goutte = '';
  let crp = '';
  if (!Array.isArray(rows)) return { goutte, crp };
  for (let i = 0; i < rows.length; i += 1) {
    const slug = normalizeToSlug(String(rows[i]?.slug || rows[i]?.label || ''));
    if (slug === 'paramettres' || slug === 'parametres') {
      const paramVal = String(rows[i]?.result || '').trim();
      let resVal = '';
      for (let j = i + 1; j < rows.length; j += 1) {
        const sj = normalizeToSlug(String(rows[j]?.slug || rows[j]?.label || ''));
        if (sj === 'paramettres' || sj === 'parametres') break;
        if (sj === 'resultat') {
          resVal = String(rows[j]?.result || '').trim();
          break;
        }
      }
      const key = resolveImmunologieGeneraleSelectionKey(paramVal);
      if (key === 'goutte') goutte = resVal;
      if (key === 'crp') crp = resVal;
    }
  }
  return { goutte, crp };
}

/** Dernière paire paramètres/résultat (ex. données historiques avec les deux examens). */
function immunologieLastPrefillPairFromRows(rows) {
  let paramOption = '';
  let resText = '';
  if (!Array.isArray(rows)) return { paramOption, resText };
  for (let i = 0; i < rows.length; i += 1) {
    const slug = normalizeToSlug(String(rows[i]?.slug || rows[i]?.label || ''));
    if (slug === 'paramettres' || slug === 'parametres') {
      const paramVal = String(rows[i]?.result || '').trim();
      let resVal = '';
      for (let j = i + 1; j < rows.length; j += 1) {
        const sj = normalizeToSlug(String(rows[j]?.slug || rows[j]?.label || ''));
        if (sj === 'paramettres' || sj === 'parametres') break;
        if (sj === 'resultat') {
          resVal = String(rows[j]?.result || '').trim();
          break;
        }
      }
      const key = resolveImmunologieGeneraleSelectionKey(paramVal);
      if (key === 'goutte' && resVal) {
        paramOption = 'Goutte épaisse';
        resText = resVal;
      }
      if (key === 'crp' && resVal) {
        paramOption = 'CRP';
        resText = resVal;
      }
    }
  }
  return { paramOption, resText };
}

function immunologieGeneraleResultRowsLookLikeInputs(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) => {
    const s = normalizeToSlug(String(row?.slug || row?.label || ''));
    return s === 'paramettres' || s === 'parametres' || s === 'resultat';
  });
}

/** Résultats labo sans acteBiologieId → groupe ACTE_NON_RENSEIGNE ; il faut quand même lire les paires paramètres/résultat. */
function collectImmunologieGeneraleRowsForPrint(results) {
  const grouped = groupResultsByActe(results);
  const byId = grouped.filter((g) => g.acteBiologieId === IMMUNOLOGIE_GENERALE_ACTE_ID);
  if (byId.length > 0) {
    return byId.flatMap((g) => g.rows);
  }
  const orphan = grouped.find((g) => g.acteBiologieId === 'ACTE_NON_RENSEIGNE');
  if (orphan?.rows?.length && immunologieGeneraleResultRowsLookLikeInputs(orphan.rows)) {
    return orphan.rows;
  }
  return [];
}

function formatImmunologieGeneraleResultDisplay(value, unit) {
  const v = String(value || '').trim();
  if (!v) return '—';
  const u = String(unit || '').trim();
  if (!u) return v;
  const vn = v.normalize('NFC');
  const un = u.normalize('NFC');
  if (vn.includes(un)) return v;
  return `${v} ${u}`;
}

async function buildImmunologieGeneraleDataForPrint(results) {
  const mergedRows = collectImmunologieGeneraleRowsForPrint(results);
  let { goutte, crp } = extractImmunologieGeneraleValuesFromRows(mergedRows);

  if (!goutte && !crp) {
    const rows = await buildActeInputRowsForPrint(results, IMMUNOLOGIE_GENERALE_ACTE_ID);
    const valuesBySlug = rows.reduce((acc, row) => {
      acc[normalizeToSlug(row.slug)] = String(row.result || '').trim();
      return acc;
    }, {});
    const paramRaw = valuesBySlug.paramettres || valuesBySlug.parametres || '';
    const resultat = valuesBySlug.resultat || '';
    const selectedKey = resolveImmunologieGeneraleSelectionKey(paramRaw);
    if (selectedKey === 'goutte') goutte = resultat;
    if (selectedKey === 'crp') crp = resultat;
  }

  const tableRows = IMMUNOLOGIE_GENERALE_ROWS.map((def) => {
    const raw = def.key === 'goutte' ? goutte : crp;
    return {
      ...def,
      result: raw ? formatImmunologieGeneraleResultDisplay(raw, def.unit) : '—',
    };
  });

  return { tableRows };
}

async function buildActeInputRowsForPrint(results, acteBiologieId) {
  const groupedResults = groupResultsByActe(results);
  const valuesBySlug = {};

  groupedResults.forEach((group) => {
    group.rows.forEach((row) => {
      const slug = normalizeToSlug(String(row?.slug || ''));
      if (!slug) return;
      if (group.acteBiologieId === acteBiologieId) {
        valuesBySlug[slug] = row.result ?? '';
      } else if (!(slug in valuesBySlug) || String(valuesBySlug[slug] || '').trim() === '') {
        valuesBySlug[slug] = row.result ?? '';
      }
    });
  });

  const inputsRes = await ConsumApi.getActesBiologieInputs(acteBiologieId);
  const inputsList = resolveActeBiologieInputsList(inputsRes);
  const inputRows = inputsList
    .slice()
    .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
    .map((input) => {
      const slug = normalizeToSlug(input?.slug || input?.name || '');
      return {
        slug,
        label: input?.name || slug || 'Paramètre',
        result: String(valuesBySlug[slug] ?? '').trim(),
        reference: BIOCHIMIE_REFERENCE_BY_SLUG[slug] || '—',
      };
    });

  if (inputRows.length > 0) return inputRows;

  // Fallback: éviter un tableau vide si l'API des inputs ne renvoie rien
  return Object.entries(valuesBySlug).map(([slug, result]) => ({
    slug,
    label: slug.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    result: String(result ?? '').trim(),
    reference: BIOCHIMIE_REFERENCE_BY_SLUG[slug] || '—',
  }));
}

async function buildElectrophoreseRowsForPrint(results) {
  const rows = await buildActeInputRowsForPrint(results, ELECTROPHORESE_HEMOGLOBINE_ACTE_ID);
  return rows.filter((row) => ELECTROPHORESE_SLUGS.has(normalizeToSlug(row.slug)));
}

async function buildSerodiagnostiqueDataForPrint(results) {
  const rows = await buildActeInputRowsForPrint(results, HEMATOLOGIE_SERODIAGNOSTIQUE_ACTE_ID);
  const valuesBySlug = rows.reduce((acc, row) => {
    acc[normalizeToSlug(row.slug)] = String(row.result || '').trim();
    return acc;
  }, {});
  const interpretation = valuesBySlug.interpretation || '';
  const entries = [
    { code: 'TO', choix: valuesBySlug.to_choix || '', titre: valuesBySlug.to_titre || '', designation: 'S. typhi' },
    { code: 'AO', choix: valuesBySlug.ao_choix || '', titre: valuesBySlug.ao_titre || '', designation: 'S. paratyphi A' },
    { code: 'BO', choix: valuesBySlug.bo_choix || '', titre: valuesBySlug.bo_titre || '', designation: 'S. paratyphi B' },
    { code: 'CO', choix: valuesBySlug.co_choix || '', titre: valuesBySlug.co_titre || '', designation: 'S. paratyphi C' },
    { code: 'TH', choix: valuesBySlug.th_choix || '', titre: valuesBySlug.th_titre || '', designation: 'S. typhi (H)' },
    { code: 'AH', choix: valuesBySlug.ah_choix || '', titre: valuesBySlug.ah_titre || '', designation: 'S. paratyphi A (H)' },
    { code: 'BH', choix: valuesBySlug.bh_choix || '', titre: valuesBySlug.bh_titre || '', designation: 'S. paratyphi B (H)' },
    { code: 'CH', choix: valuesBySlug.ch_choix || '', titre: valuesBySlug.ch_titre || '', designation: 'S. paratyphi C (H)' },
  ];
  return { entries, interpretation };
}

async function buildSerologieHepatiteBDataForPrint(results) {
  const rows = await buildActeInputRowsForPrint(results, SEROLOGIE_HEPATITE_B_ACTE_ID);
  const valuesBySlug = rows.reduce((acc, row) => {
    acc[normalizeToSlug(row.slug)] = String(row.result || '').trim();
    return acc;
  }, {});

  const parameters = [
    { label: 'SYPHILIS', value: valuesBySlug.syphilis || '' },
    { label: 'RUBEOLE', value: valuesBySlug.rubeole || '' },
    { label: 'TOXOPLASMOSE', value: valuesBySlug.toxoplasmose || '' },
    { label: 'AC ANTI HBC TOTAUX', value: valuesBySlug.ac_anti_hbc_totaux || '' },
    { label: 'Ag ANTI HBS', value: valuesBySlug.ag_anti_hbs || '' },
    { label: 'AC ANTI VC', value: valuesBySlug.ac_anti_vc || valuesBySlug.an_anti_vc || '' },
  ];

  return {
    parameters,
    resultatChoix: valuesBySlug.resultat_choix || '',
  };
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
  /** Catalogue actes + items API pour résoudre les noms dans le dialogue Détails */
  const [detailsSupportData, setDetailsSupportData] = useState({ actesCatalog: [], itemsByActeId: {} });
  const [paymentStatus, setPaymentStatus] = useState({
    loading: false,
    invoiceId: null,
    paid: null,
    message: '',
  });
  const [paymentStatusByAnalysisId, setPaymentStatusByAnalysisId] = useState({});
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
        setPaymentStatusByAnalysisId(Object.fromEntries(paymentEntries));
      } else {
        setAnalyses([]);
        setTotal(0);
        setPaymentStatusByAnalysisId({});
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
      setAnalyses([]);
      setTotal(0);
      setPaymentStatusByAnalysisId({});
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, typeFilter]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

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

  const handleAddResult = async (scope = 'all') => {
    if (!resultsDialog.analysisId) {
      showError('Erreur', 'Analyse introuvable');
      return;
    }
    if (prescribedActes.length === 0) {
      showError('Erreur', 'Aucun acte biologie prescrit pour cette analyse');
      return;
    }

    const safeIdx = Math.min(activeActeIndex, Math.max(prescribedActes.length - 1, 0));
    const actesToSave =
      scope === 'current' && prescribedActes[safeIdx] ? [prescribedActes[safeIdx]] : prescribedActes;

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
      await loadAnalyses();
    } catch (error) {
      console.error('Error adding result:', error);
      showError('Erreur', 'Erreur lors de l\'ajout du résultat');
    }
  };

  const printAnalysisResults = async (analysisId, results, printOptions = {}) => {
    if (!analysisId || !Array.isArray(results) || results.length === 0) {
      showError('Erreur', 'Aucun résultat à imprimer');
      return;
    }

    const filterActeId = printOptions?.acteBiologieId || null;
    const filterActeName = printOptions?.acteBiologieName || '';
    const rowsForPrint = filterActeId ? filterLaboratoryResultsForActe(results, filterActeId) : results;
    if (filterActeId && rowsForPrint.length === 0) {
      showError('Erreur', 'Aucun résultat enregistré pour cet acte biologique');
      return;
    }

    const acteMetaHtml =
      filterActeName && String(filterActeName).trim()
        ? `<div class="meta-item" style="flex-basis:100%"><span class="label">Acte biologique :</span> ${String(filterActeName).trim()}</div>`
        : '';

    let analysisDetails = null;
    try {
      const completeRes = await ConsumApi.getLaboratoryAnalysisComplete(analysisId);
      if (completeRes.success) {
        analysisDetails = completeRes.data?.analyse || completeRes.data;
      }
    } catch (error) {
      console.error('Error loading analysis details for print:', error);
    }

    const isHema = isHematologyResults(rowsForPrint);
    const hemaSections = isHema
      ? await buildHematologyPrintSections(analysisDetails, rowsForPrint, filterActeId)
      : [];
    const isBiochimieElectrolytes = isBiochimieElectrolytesResults(rowsForPrint, analysisDetails);
    const biochimieSubstratsActeId = resolveBiochimieSubstratsActeId(analysisDetails);
    const isBiochimieSubstrats =
      !isBiochimieElectrolytes &&
      (Boolean(biochimieSubstratsActeId) ||
        analysisHasActeBiologie(analysisDetails, BIOCHIMIE_SUBSTRATS_ACTE_ID) ||
        isBiochimieSubstratsResults(rowsForPrint) ||
        analysisDetails?.analysisType === 'BIOCHIMIE');
    const printBiochimieBicolumn = isBiochimieElectrolytes || isBiochimieSubstrats;
    let biochimieSangRows = [];
    let biochimieUrinesRows = [];
    if (isBiochimieElectrolytes) {
      const bioRows = await buildActeInputRowsForPrint(rowsForPrint, BIOCHIMIE_ELECTROLYTES_ACTE_ID);
      biochimieSangRows = bioRows.filter((row) => !BIOCHIMIE_URINE_SLUGS.has(row.slug));
      biochimieUrinesRows = bioRows.filter((row) => BIOCHIMIE_URINE_SLUGS.has(row.slug));
    } else if (isBiochimieSubstrats) {
      const bioRows = await buildActeInputRowsForPrint(
        rowsForPrint,
        biochimieSubstratsActeId || BIOCHIMIE_SUBSTRATS_ACTE_ID
      );
      biochimieSangRows = bioRows.filter((row) => !BIOCHIMIE_URINE_SLUGS.has(row.slug));
      biochimieUrinesRows = bioRows.filter((row) => BIOCHIMIE_URINE_SLUGS.has(row.slug));
    }
    const isElectrophorese = isElectrophoreseHemoglobineResults(rowsForPrint, analysisDetails);
    const electrophoreseRows = isElectrophorese ? await buildElectrophoreseRowsForPrint(rowsForPrint) : [];
    const isSerodiagnostique = isSerodiagnostiqueResults(rowsForPrint, analysisDetails);
    const serodiagnostiqueData = isSerodiagnostique ? await buildSerodiagnostiqueDataForPrint(rowsForPrint) : null;
    const isSerologieHepB = isSerologieHepatiteBResults(rowsForPrint, analysisDetails);
    const serologieHepBData = isSerologieHepB ? await buildSerologieHepatiteBDataForPrint(rowsForPrint) : null;
    const isImmunologieGenerale = isImmunologieGeneraleResults(rowsForPrint, analysisDetails);
    const immunologieGeneraleData = isImmunologieGenerale
      ? await buildImmunologieGeneraleDataForPrint(rowsForPrint)
      : null;

    if (isHema && hemaSections.length === 0) {
      showError('Erreur', 'Aucune donnée à imprimer pour cet acte');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError('Erreur', 'Impossible d’ouvrir la fenêtre d’impression');
      return;
    }

    let printContent;
    if (isHema) {
      printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hématologie - Résultats</title>
          <style>
            @media print { @page { size: A4; margin: 1.2cm; } }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; max-width: 900px; margin: 0 auto; padding: 10px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 0 6px 0; display: block; }
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
            ${acteMetaHtml}
            ${analysisDetails?.patient?.lastName ? `<div class="meta-item"><span class="label">NOM:</span> ${analysisDetails.patient.lastName}</div>` : ''}
            ${analysisDetails?.patient?.firstName ? `<div class="meta-item"><span class="label">PRENOMS:</span> ${analysisDetails.patient.firstName}</div>` : ''}
            ${analysisDetails?.patient?.gender ? `<div class="meta-item"><span class="label">SEXE:</span> ${analysisDetails.patient.gender}</div>` : ''}
            ${analysisDetails?.patient?.dateOfBirth ? `<div class="meta-item"><span class="label">AGE:</span> ${Math.max(0, new Date().getFullYear() - new Date(analysisDetails.patient.dateOfBirth).getFullYear())} ANS</div>` : ''}
            ${(analysisDetails?.prescribingDoctor?.firstName || analysisDetails?.prescribingDoctor?.lastName) ? `<div class="meta-item"><span class="label">PRESCRIPTEUR:</span> DR ${analysisDetails?.prescribingDoctor?.firstName || ''} ${analysisDetails?.prescribingDoctor?.lastName || ''}</div>` : ''}
            <div class="meta-item"><span class="label">DATE:</span> ${analysisDetails?.samplingDate ? new Date(analysisDetails.samplingDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</div>
            ${analysisDetails?.analyseNumber ? `<div class="meta-item"><span class="label">NUMERO DE DOSSIER:</span> ${analysisDetails.analyseNumber}</div>` : ''}
          </div>

          ${hemaSections.map((section) => `
            <div class="section">
              <div class="subtitle">${section.acteBiologieName}</div>
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
                  ${section.rows.map((row) => {
                    const statusClass = hemRowStatusClass(row.status);
                    const statusLabel = getStatusUi(row.status).label;
                    return `<tr>
                      <td>${row.label}</td>
                      <td>${row.result}</td>
                      <td>${row.reference || '—'}</td>
                      <td>${row.unit || ''}</td>
                      <td class="${statusClass}">${statusLabel}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}

          <div class="signature">SIGNATURE BIOLOGISTE</div>
        </body>
      </html>
    `;
    } else if (printBiochimieBicolumn) {
      printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Biochimie - Résultats</title>
          <style>
            @media print { @page { size: A4; margin: 1.2cm; } }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; max-width: 900px; margin: 0 auto; padding: 10px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 0 6px 0; display: block; }
            .header h1 { margin: 2px 0; font-size: 18px; letter-spacing: 0.4px; }
            .header h2 { margin: 2px 0; font-size: 15px; }
            .meta-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px 24px; margin: 8px 0 10px 0; }
            .meta-item { min-width: 260px; }
            .label { font-weight: bold; }
            .subtitle { font-weight: bold; margin: 10px 0 6px 0; }
            .two-col { display: flex; gap: 12px; align-items: flex-start; }
            .col { width: 50%; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .signature { margin-top: 20px; text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${clinicLogoUrl}" alt="Logo clinique" />
            <div>LABORATOIRE D&apos;ANALYSES MEDICALES - TEL 89 63 26 46 / 40 88 44 00</div>
            <div>Soigner avec amour</div>
            <h1>RESULTATS BIOCHIMIE</h1>
            <h2>RESULTATS D&apos;ANALYSE</h2>
          </div>

          <div class="meta-grid">
            ${acteMetaHtml}
            ${analysisDetails?.patient?.lastName ? `<div class="meta-item"><span class="label">NOM:</span> ${analysisDetails.patient.lastName}</div>` : ''}
            ${analysisDetails?.patient?.firstName ? `<div class="meta-item"><span class="label">PRENOMS:</span> ${analysisDetails.patient.firstName}</div>` : ''}
            ${analysisDetails?.patient?.gender ? `<div class="meta-item"><span class="label">SEXE:</span> ${analysisDetails.patient.gender}</div>` : ''}
            ${analysisDetails?.patient?.dateOfBirth ? `<div class="meta-item"><span class="label">AGE:</span> ${Math.max(0, new Date().getFullYear() - new Date(analysisDetails.patient.dateOfBirth).getFullYear())} ANS</div>` : ''}
            ${(analysisDetails?.prescribingDoctor?.firstName || analysisDetails?.prescribingDoctor?.lastName) ? `<div class="meta-item"><span class="label">PRESCRIPTEUR:</span> DR ${analysisDetails?.prescribingDoctor?.firstName || ''} ${analysisDetails?.prescribingDoctor?.lastName || ''}</div>` : ''}
            <div class="meta-item"><span class="label">DATE:</span> ${analysisDetails?.samplingDate ? new Date(analysisDetails.samplingDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</div>
            ${analysisDetails?.analyseNumber ? `<div class="meta-item"><span class="label">NUMERO DE DOSSIER:</span> ${analysisDetails.analyseNumber}</div>` : ''}
          </div>

          <div class="subtitle">ANALYSE DE SANG / ANALYSE D&apos;URINES</div>
          <div class="two-col">
            <div class="col">
              <table>
                <thead>
                  <tr>
                    <th>EXAMENS</th>
                    <th>RESULTATS</th>
                    <th>VAL NORMALES</th>
                  </tr>
                </thead>
                <tbody>
                  ${biochimieSangRows.map((row) => `
                    <tr>
                      <td>${row.label}</td>
                      <td>${row.result}</td>
                      <td>${row.reference}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="col">
              <table>
                <thead>
                  <tr>
                    <th>EXAMENS</th>
                    <th>RESULTATS</th>
                    <th>VAL NORMALES</th>
                  </tr>
                </thead>
                <tbody>
                  ${biochimieUrinesRows.map((row) => `
                    <tr>
                      <td>${row.label}</td>
                      <td>${row.result}</td>
                      <td>${row.reference}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="signature">SIGNATURE BIOLOGISTE</div>
        </body>
      </html>
    `;
    } else if (isSerodiagnostique) {
      printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fiche Widal & Felix - Résultats</title>
          <style>
            @media print { @page { size: A4; margin: 1.2cm; } }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; max-width: 900px; margin: 0 auto; padding: 10px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 0 6px 0; display: block; }
            .header h1 { margin: 2px 0; font-size: 18px; letter-spacing: 0.4px; }
            .header h2 { margin: 2px 0; font-size: 15px; }
            .meta-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px 24px; margin: 8px 0 10px 0; }
            .meta-item { min-width: 260px; }
            .label { font-weight: bold; }
            .section-title { font-weight: bold; margin: 8px 0 4px 0; }
            .sub-text { margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .interpretation { margin-top: 10px; border: 1px solid #000; padding: 8px; }
            .signature { margin-top: 20px; text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${clinicLogoUrl}" alt="Logo clinique" />
            <div>LABORATOIRE D&apos;ANALYSES MEDICALES - TEL 89 63 26 46 / 40 88 44 00</div>
            <div>Soigner avec amour</div>
            <h1>SERODIAGNOSTIQUE DE WIDAL ET FELIX</h1>
            <h2>RESULTATS D&apos;ANALYSE</h2>
          </div>

          <div class="meta-grid">
            ${acteMetaHtml}
            ${analysisDetails?.patient?.lastName ? `<div class="meta-item"><span class="label">NOM:</span> ${analysisDetails.patient.lastName}</div>` : ''}
            ${analysisDetails?.patient?.firstName ? `<div class="meta-item"><span class="label">PRENOMS:</span> ${analysisDetails.patient.firstName}</div>` : ''}
            ${analysisDetails?.patient?.gender ? `<div class="meta-item"><span class="label">SEXE:</span> ${analysisDetails.patient.gender}</div>` : ''}
            ${analysisDetails?.patient?.dateOfBirth ? `<div class="meta-item"><span class="label">AGE:</span> ${Math.max(0, new Date().getFullYear() - new Date(analysisDetails.patient.dateOfBirth).getFullYear())} ANS</div>` : ''}
            ${(analysisDetails?.prescribingDoctor?.firstName || analysisDetails?.prescribingDoctor?.lastName) ? `<div class="meta-item"><span class="label">PRESCRIPTEUR:</span> DR ${analysisDetails?.prescribingDoctor?.firstName || ''} ${analysisDetails?.prescribingDoctor?.lastName || ''}</div>` : ''}
            <div class="meta-item"><span class="label">DATE:</span> ${analysisDetails?.samplingDate ? new Date(analysisDetails.samplingDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</div>
            ${analysisDetails?.analyseNumber ? `<div class="meta-item"><span class="label">NUMERO DE DOSSIER:</span> ${analysisDetails.analyseNumber}</div>` : ''}
          </div>

          <div class="section-title">Technique</div>
          <div class="sub-text">Agglutination directe</div>
          <div class="sub-text"><strong>NB:</strong> Résultats (Réaction négative: Titre >= 1/160 ; Réaction positive: Titre < 1/160)</div>

          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Code</th>
                <th>Résultat</th>
                <th>Titre</th>
              </tr>
            </thead>
            <tbody>
              ${serodiagnostiqueData?.entries?.map((row) => `
                <tr>
                  <td>${row.designation}</td>
                  <td>${row.code}</td>
                  <td>${row.choix || '—'}</td>
                  <td>${row.titre || '—'}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>

          <div class="interpretation">
            <strong>INTERPRETATION / CONCLUSION :</strong><br />
            ${serodiagnostiqueData?.interpretation || '—'}
          </div>

          <div class="signature">SIGNATURE BIOLOGISTE</div>
        </body>
      </html>
    `;
    } else if (isSerologieHepB) {
      printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sérologie marqueurs de l'hépatite B - Résultats</title>
          <style>
            @media print { @page { size: A4; margin: 1.2cm; } }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; max-width: 900px; margin: 0 auto; padding: 10px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 0 6px 0; display: block; }
            .header h1 { margin: 2px 0; font-size: 18px; letter-spacing: 0.4px; }
            .header h2 { margin: 2px 0; font-size: 15px; }
            .meta-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px 24px; margin: 8px 0 10px 0; }
            .meta-item { min-width: 260px; }
            .label { font-weight: bold; }
            .subtitle { font-weight: bold; margin: 10px 0 6px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .result-box { margin-top: 10px; border: 1px solid #000; padding: 8px; }
            .signature { margin-top: 20px; text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${clinicLogoUrl}" alt="Logo clinique" />
            <div>LABORATOIRE D&apos;ANALYSES MEDICALES - TEL 89 63 26 46 / 40 88 44 00</div>
            <div>Soigner avec amour</div>
            <h1>SÉROLOGIE</h1>
            <h2>RESULTATS D&apos;ANALYSES</h2>
          </div>

          <div class="meta-grid">
            ${acteMetaHtml}
            ${analysisDetails?.patient?.lastName ? `<div class="meta-item"><span class="label">NOM:</span> ${analysisDetails.patient.lastName}</div>` : ''}
            ${analysisDetails?.patient?.firstName ? `<div class="meta-item"><span class="label">PRENOMS:</span> ${analysisDetails.patient.firstName}</div>` : ''}
            ${analysisDetails?.patient?.gender ? `<div class="meta-item"><span class="label">SEXE:</span> ${analysisDetails.patient.gender}</div>` : ''}
            ${analysisDetails?.patient?.dateOfBirth ? `<div class="meta-item"><span class="label">AGE:</span> ${Math.max(0, new Date().getFullYear() - new Date(analysisDetails.patient.dateOfBirth).getFullYear())} ANS</div>` : ''}
            ${(analysisDetails?.prescribingDoctor?.firstName || analysisDetails?.prescribingDoctor?.lastName) ? `<div class="meta-item"><span class="label">PRESCRIPTEUR:</span> DR ${analysisDetails?.prescribingDoctor?.firstName || ''} ${analysisDetails?.prescribingDoctor?.lastName || ''}</div>` : ''}
            <div class="meta-item"><span class="label">DATE:</span> ${analysisDetails?.samplingDate ? new Date(analysisDetails.samplingDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</div>
            ${analysisDetails?.analyseNumber ? `<div class="meta-item"><span class="label">NUMERO DE DOSSIER:</span> ${analysisDetails.analyseNumber}</div>` : ''}
          </div>

          <div class="subtitle">Paramètres / Résultats</div>
          <table>
            <thead>
              <tr>
                <th>Paramètres</th>
                <th>Résultats</th>
              </tr>
            </thead>
            <tbody>
              ${serologieHepBData?.parameters?.map((row, index) => `
                <tr>
                  <td>${row.label}</td>
                  <td>${row.value ? `${row.value}${SEROLOGIE_HEPATITE_B_UNITS[index] ? ` (${SEROLOGIE_HEPATITE_B_UNITS[index]})` : ''}` : '—'}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>

          <div class="result-box">
            <strong>Résultat choix:</strong> ${serologieHepBData?.resultatChoix || '—'}<br />
            <strong>Unités de mesure:</strong> voir colonne Résultats
          </div>

          <div class="signature">SIGNATURE BIOLOGISTE</div>
        </body>
      </html>
    `;
    } else if (isImmunologieGenerale) {
      printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Immunologie générale - Goutte épaisse / CRP</title>
          <style>
            @media print { @page { size: A4; margin: 1.2cm; } }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; max-width: 900px; margin: 0 auto; padding: 10px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 0 6px 0; display: block; }
            .header h1 { margin: 2px 0; font-size: 18px; letter-spacing: 0.4px; }
            .header h2 { margin: 2px 0; font-size: 14px; font-weight: normal; }
            .meta-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px 24px; margin: 8px 0 10px 0; }
            .meta-item { min-width: 260px; }
            .label { font-weight: bold; }
            .subtitle { font-weight: bold; margin: 12px 0 6px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .param-main { font-weight: bold; }
            .param-tech { font-size: 11px; color: #222; margin-top: 2px; }
            .footer-acte { margin-top: 14px; text-align: center; font-weight: bold; }
            .signature { margin-top: 20px; text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${clinicLogoUrl}" alt="Logo clinique" />
            <div>LABORATOIRE D&apos;ANALYSES MEDICALES - TEL 89 63 26 46 / 40 88 44 00</div>
            <div>Soigner avec amour</div>
            <h1>RESULTATS D&apos;ANALYSE</h1>
            <h2>IMMUNOLOGIE GÉNÉRALE — GOUTTE ÉPAISSE / CRP</h2>
          </div>

          <div class="meta-grid">
            ${acteMetaHtml}
            ${analysisDetails?.patient?.lastName ? `<div class="meta-item"><span class="label">NOM:</span> ${analysisDetails.patient.lastName}</div>` : ''}
            ${analysisDetails?.patient?.firstName ? `<div class="meta-item"><span class="label">PRENOMS:</span> ${analysisDetails.patient.firstName}</div>` : ''}
            ${analysisDetails?.patient?.gender ? `<div class="meta-item"><span class="label">SEXE:</span> ${analysisDetails.patient.gender}</div>` : ''}
            ${analysisDetails?.patient?.dateOfBirth ? `<div class="meta-item"><span class="label">AGE:</span> ${Math.max(0, new Date().getFullYear() - new Date(analysisDetails.patient.dateOfBirth).getFullYear())} ANS</div>` : ''}
            ${(analysisDetails?.prescribingDoctor?.firstName || analysisDetails?.prescribingDoctor?.lastName) ? `<div class="meta-item"><span class="label">PRESCRIPTEUR:</span> DR ${analysisDetails?.prescribingDoctor?.firstName || ''} ${analysisDetails?.prescribingDoctor?.lastName || ''}</div>` : ''}
            <div class="meta-item"><span class="label">DATE:</span> ${analysisDetails?.samplingDate ? new Date(analysisDetails.samplingDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</div>
            ${analysisDetails?.analyseNumber ? `<div class="meta-item"><span class="label">NUMERO DE DOSSIER:</span> ${analysisDetails.analyseNumber}</div>` : ''}
          </div>

          <div class="subtitle">PARAMETTRES — RESULTATS</div>
          <table>
            <thead>
              <tr>
                <th>Paramètres</th>
                <th>Résultats</th>
              </tr>
            </thead>
            <tbody>
              ${immunologieGeneraleData?.tableRows?.map((row) => `
                <tr>
                  <td>
                    <div class="param-main">${row.label}</div>
                    <div class="param-tech">${row.technique}</div>
                  </td>
                  <td>${row.result}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>

          <div class="footer-acte">GOUTTE ÉPAISSE / CRP</div>
          <div class="signature">SIGNATURE BIOLOGISTE</div>
        </body>
      </html>
    `;
    } else if (isElectrophorese) {
      printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Electrophorèse de l'hémoglobine - Résultats</title>
          <style>
            @media print { @page { size: A4; margin: 1.2cm; } }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; max-width: 900px; margin: 0 auto; padding: 10px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 0 6px 0; display: block; }
            .header h1 { margin: 2px 0; font-size: 18px; letter-spacing: 0.4px; }
            .header h2 { margin: 2px 0; font-size: 15px; }
            .meta-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px 24px; margin: 8px 0 10px 0; }
            .meta-item { min-width: 260px; }
            .label { font-weight: bold; }
            .result-card { border: 1px solid #000; padding: 10px; margin-top: 12px; }
            .result-title { font-weight: bold; margin-bottom: 8px; }
            .result-row { margin: 6px 0; display: flex; gap: 10px; align-items: center; }
            .result-name { min-width: 220px; font-weight: bold; }
            .result-value { border-bottom: 1px solid #000; min-width: 200px; padding: 2px 4px; }
            .signature { margin-top: 24px; text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${clinicLogoUrl}" alt="Logo clinique" />
            <div>LABORATOIRE D&apos;ANALYSES MEDICALES - TEL 89 63 26 46 / 40 88 44 00</div>
            <div>Soigner avec amour</div>
            <h1>ELECTROPHORESE DE L&apos;HEMOGLOBINE</h1>
            <h2>RESULTATS D&apos;ANALYSE</h2>
          </div>

          <div class="meta-grid">
            ${acteMetaHtml}
            ${analysisDetails?.patient?.lastName ? `<div class="meta-item"><span class="label">NOM:</span> ${analysisDetails.patient.lastName}</div>` : ''}
            ${analysisDetails?.patient?.firstName ? `<div class="meta-item"><span class="label">PRENOMS:</span> ${analysisDetails.patient.firstName}</div>` : ''}
            ${analysisDetails?.patient?.gender ? `<div class="meta-item"><span class="label">SEXE:</span> ${analysisDetails.patient.gender}</div>` : ''}
            ${analysisDetails?.patient?.dateOfBirth ? `<div class="meta-item"><span class="label">AGE:</span> ${Math.max(0, new Date().getFullYear() - new Date(analysisDetails.patient.dateOfBirth).getFullYear())} ANS</div>` : ''}
            ${(analysisDetails?.prescribingDoctor?.firstName || analysisDetails?.prescribingDoctor?.lastName) ? `<div class="meta-item"><span class="label">PRESCRIPTEUR:</span> DR ${analysisDetails?.prescribingDoctor?.firstName || ''} ${analysisDetails?.prescribingDoctor?.lastName || ''}</div>` : ''}
            <div class="meta-item"><span class="label">DATE:</span> ${analysisDetails?.samplingDate ? new Date(analysisDetails.samplingDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</div>
            ${analysisDetails?.analyseNumber ? `<div class="meta-item"><span class="label">NUMERO DE DOSSIER:</span> ${analysisDetails.analyseNumber}</div>` : ''}
          </div>

          <div class="result-card">
            <div class="result-title">ELECTROPHORESE DE L&apos;HEMOGLOBINE</div>
            ${electrophoreseRows.length > 0
              ? electrophoreseRows.map((row) => `
                <div class="result-row">
                  <div class="result-name">${row.label}</div>
                  <div class="result-value">${row.result || '—'}</div>
                </div>
              `).join('')
              : `<div class="result-row"><div class="result-name">Résultat</div><div class="result-value">—</div></div>`}
          </div>

          <div class="signature">SIGNATURE BIOLOGISTE</div>
        </body>
      </html>
    `;
    } else {
      printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Résultats d'analyse</title>
          <style>
            @media print { @page { size: A4; margin: 2cm; } }
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header img { max-width: 320px; width: 100%; height: auto; margin: 0 0 8px 0; display: block; }
            h1 { margin: 0 0 10px 0; font-size: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header"><img src="${clinicLogoUrl}" alt="Logo clinique" /><h1>RÉSULTATS D'ANALYSE</h1></div>
          ${filterActeName && String(filterActeName).trim() ? `<p style="text-align:center;font-weight:bold;margin:10px 0">Acte biologique : ${String(filterActeName).trim()}</p>` : ''}
          <table>
            <thead>
              <tr>
                <th>Paramètre</th>
                <th>Valeur</th>
                <th>Référence</th>
              </tr>
            </thead>
            <tbody>
              ${rowsForPrint.map((result) => `
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
    }

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

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
                    {prescribedActes.length > 1 ? (
                      <>
                        <LoadingButton variant="contained" onClick={() => handleAddResult('current')}>
                          Enregistrer cet acte
                        </LoadingButton>
                        <LoadingButton variant="outlined" onClick={() => handleAddResult('all')}>
                          Enregistrer tous les actes
                        </LoadingButton>
                      </>
                    ) : (
                      <LoadingButton variant="contained" onClick={() => handleAddResult('all')}>
                        Enregistrer les résultats
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
