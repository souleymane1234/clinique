/**
 * Filtre les analyses retournées par l’API (les query params peuvent être ignorés côté serveur).
 * Si l’objet n’a pas d’id prescripteur, on ne l’exclut pas sur ce critère (l’API omet parfois prescribingDoctor).
 */

/** patientId en racine d’abord (souvent renvoyé ainsi), puis snake_case, puis l’objet embarqué. */
export function getPatientIdFromConsultation(consultation) {
  if (!consultation || typeof consultation !== 'object') return undefined;
  const v =
    consultation.patientId ??
    consultation.patient_id ??
    consultation.patient?.id;
  if (v == null || v === '') return undefined;
  return v;
}

export function getConsultationIdValue(consultation) {
  if (!consultation || typeof consultation !== 'object') return undefined;
  return consultation.id ?? consultation._id ?? consultation.consultationId;
}

/** Médecin assigné à la consultation (prescripteur attendu côté analyse). */
export function getPrescribingDoctorIdFromConsultation(consultation) {
  if (!consultation || typeof consultation !== 'object') return undefined;
  const v = consultation.medecinId ?? consultation.medecin_id ?? consultation.medecin?.id;
  if (v == null || v === '') return undefined;
  return v;
}

function idEquals(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/** Sous-objet `analyse` (ressource Nest) — à ne pas confondre avec `analyse[]` (lignes d’examens). */
function nestedAnalyseResource(analysis) {
  const a = analysis?.analyse;
  if (a && typeof a === 'object' && !Array.isArray(a)) return a;
  return null;
}

function prescribingDoctorIdFromAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object') return undefined;
  const inner = nestedAnalyseResource(analysis);
  return (
    analysis.prescribingDoctorId ??
    analysis.prescribing_doctor_id ??
    analysis.prescribingDoctor?.id ??
    inner?.prescribingDoctorId ??
    inner?.prescribing_doctor_id ??
    inner?.prescribingDoctor?.id ??
    undefined
  );
}

function laboratoryAnalysisConsultationId(analysis) {
  if (!analysis || typeof analysis !== 'object') return undefined;
  const inner = nestedAnalyseResource(analysis);
  return (
    analysis.consultationId ??
    analysis.consultation_id ??
    analysis.consultation?.id ??
    inner?.consultationId ??
    inner?.consultation_id ??
    inner?.consultation?.id ??
    undefined
  );
}

function laboratoryAnalysisPatientId(analysis) {
  if (!analysis || typeof analysis !== 'object') return undefined;
  const inner = nestedAnalyseResource(analysis);
  return (
    analysis.patientId ??
    analysis.patient_id ??
    analysis.patient?.id ??
    inner?.patientId ??
    inner?.patient_id ??
    inner?.patient?.id ??
    undefined
  );
}

/**
 * Aplatit une ligne liste / détail pour l’UI (id, status, patientId, consultationId à la racine).
 */
export function flattenLaboratoryAnalysisRow(row) {
  if (!row || typeof row !== 'object') return row;
  const inner = nestedAnalyseResource(row);
  if (!inner) return row;
  return {
    ...inner,
    ...row,
    id: row.id ?? inner.id,
    status: row.status ?? inner.status,
    patientId: laboratoryAnalysisPatientId(row),
    consultationId: laboratoryAnalysisConsultationId(row),
    patient: row.patient ?? inner.patient,
    consultation: row.consultation ?? inner.consultation,
    prescribingDoctorId: prescribingDoctorIdFromAnalysis(row),
    analyse: (() => {
      if (Array.isArray(row.analyse)) return row.analyse;
      if (Array.isArray(inner.analyse)) return inner.analyse;
      return row.analyse;
    })(),
  };
}

export function filterLaboratoryAnalysesForConsultation(
  analysesList,
  { consultationId, patientId, medecinId }
) {
  if (!Array.isArray(analysesList)) return [];
  return analysesList.filter((analysis) => {
    if (medecinId) {
      const pDoc = prescribingDoctorIdFromAnalysis(analysis);
      if (pDoc != null && pDoc !== '' && !idEquals(pDoc, medecinId)) {
        return false;
      }
    }
    const ap = laboratoryAnalysisPatientId(analysis);
    if (patientId != null && patientId !== '' && ap != null && ap !== '' && !idEquals(ap, patientId)) {
      return false;
    }
    const ac = laboratoryAnalysisConsultationId(analysis);
    if (consultationId != null && consultationId !== '' && ac != null && ac !== '' && !idEquals(ac, consultationId)) {
      return false;
    }
    if (consultationId != null && consultationId !== '' && ac != null && ac !== '' && idEquals(ac, consultationId)) {
      return true;
    }
    if (patientId != null && patientId !== '' && ap != null && ap !== '' && idEquals(ap, patientId)) {
      return true;
    }
    return false;
  });
}
