import ConsumApi from 'src/services_workers/consum_api';

import {
  getConsultationIdValue,
  getPatientIdFromConsultation,
  flattenLaboratoryAnalysisRow,
  filterLaboratoryAnalysesForConsultation,
} from './laboratory-analyses-consultation';

/**
 * Flux « consultation → analyses laboratoire » :
 * GET /laboratory/analyses?consultationId&patientId puis filtre client (réponses API parfois larges).
 * @param {object} consultation — ex. détail API
 * @param {object|null} [fallback] — ex. ligne liste si un id manque sur le détail
 */
export async function fetchLaboratoryAnalysesForConsultation(consultation, fallback = null) {
  const patientId =
    getPatientIdFromConsultation(consultation) || getPatientIdFromConsultation(fallback);
  const consultationId =
    getConsultationIdValue(consultation) || getConsultationIdValue(fallback);

  if (!patientId || !consultationId) {
    return { ok: true, analyses: [], patientId, consultationId };
  }

  const res = await ConsumApi.getLaboratoryAnalyses({ consultationId, patientId });
  if (!res.success) {
    return {
      ok: false,
      analyses: [],
      patientId,
      consultationId,
      message: res.message,
    };
  }

  const list = Array.isArray(res.data) ? res.data : [];
  const normalized = list.map((row) => flattenLaboratoryAnalysisRow(row));
  const analyses = filterLaboratoryAnalysesForConsultation(normalized, { consultationId, patientId });
  return { ok: true, analyses, patientId, consultationId };
}
