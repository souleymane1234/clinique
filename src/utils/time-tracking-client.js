import ConsumApi from 'src/services_workers/consum_api';

const STORAGE_KEY = 'tt:active';

function nowIso() {
  return new Date().toISOString();
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (_) {
    // ignore
  }
}

function getPatientEntry(patientId) {
  const store = readStore();
  return store?.[patientId] || null;
}

function setPatientEntry(patientId, entry) {
  const store = readStore();
  store[patientId] = entry;
  writeStore(store);
}

function clearPatientEntry(patientId) {
  const store = readStore();
  if (store && Object.prototype.hasOwnProperty.call(store, patientId)) {
    delete store[patientId];
    writeStore(store);
  }
}

function pickVisitIdFromCreateResponse(result) {
  const visit = result?.data?.visit || result?.visit || result?.data;
  return visit?.id || null;
}

function listFromResult(result) {
  if (!result) return [];
  const data = result.data ?? result;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function pickPassageIdFromCreateResponse(result) {
  const passage = result?.data?.servicePassage || result?.data?.passage || result?.servicePassage || result?.passage || result?.data;
  return passage?.id || null;
}

export async function ensureOpenVisit(patientId, { reason = '', notes = '', arriveAt } = {}) {
  if (!patientId) return null;

  // 1) Store first (fast path)
  const entry = getPatientEntry(patientId);
  if (entry?.visitId) return entry.visitId;

  // 2) Backend: find open visit
  const visitsResult = await ConsumApi.getPatientVisitsWithDurations(patientId);
  if (visitsResult?.success) {
    const visits = listFromResult(visitsResult);
    const open = visits.find((v) => v && !v.leaveAt);
    if (open?.id) {
      setPatientEntry(patientId, { visitId: open.id, openPassageId: null, openServiceType: null });
      return open.id;
    }
  }

  // 3) Create visit
  const created = await ConsumApi.createPatientVisit({
    patientId,
    arriveAt: arriveAt || nowIso(),
    reason,
    notes,
  });
  if (created?.success) {
    const visitId = pickVisitIdFromCreateResponse(created);
    if (visitId) {
      setPatientEntry(patientId, { visitId, openPassageId: null, openServiceType: null });
      return visitId;
    }
  }

  return null;
}

export async function transitionService({
  patientId,
  serviceType,
  handledByUserId,
  reason = '',
  notes = '',
  enteredAt,
  leftAt,
}) {
  if (!patientId || !serviceType) return { visitId: null, passageId: null };

  const visitId = await ensureOpenVisit(patientId, { reason, notes });
  if (!visitId) return { visitId: null, passageId: null };

  const entry = getPatientEntry(patientId) || { visitId, openPassageId: null, openServiceType: null };

  // If already in same service, keep current passage
  if (entry.openPassageId && entry.openServiceType === serviceType) {
    return { visitId, passageId: entry.openPassageId };
  }

  // Close current passage if any
  if (entry.openPassageId) {
    await ConsumApi.closeServicePassage(entry.openPassageId, { leftAt: leftAt || nowIso() });
  }

  const started = await ConsumApi.startServicePassage({
    visitId,
    patientId,
    serviceType,
    handledByUserId: handledByUserId || undefined,
    enteredAt: enteredAt || nowIso(),
    notes,
  });

  const passageId = started?.success ? pickPassageIdFromCreateResponse(started) : null;
  setPatientEntry(patientId, { visitId, openPassageId: passageId, openServiceType: serviceType });

  return { visitId, passageId };
}

/**
 * Ferme uniquement le passage de service en cours (ex. fin infirmerie au transfert),
 * sans démarrer un nouveau passage ni clôturer la visite.
 */
export async function closeCurrentPassageOnly(patientId, { leftAt } = {}) {
  if (!patientId) return false;
  const entry = getPatientEntry(patientId);
  if (!entry?.openPassageId) return false;
  const res = await ConsumApi.closeServicePassage(entry.openPassageId, { leftAt: leftAt || nowIso() });
  if (res?.success === false) return false;
  setPatientEntry(patientId, {
    visitId: entry.visitId,
    openPassageId: null,
    openServiceType: null,
  });
  return true;
}

/**
 * Démarrage du passage MEDECIN (réception du patient par le médecin).
 * Synchronise la visite via l’API si le localStorage est vide (autre poste / autre session).
 */
export async function startMedecinServicePassage(patientId, { handledByUserId, notes = 'Réception médecin' } = {}) {
  if (!patientId) return { visitId: null, passageId: null };

  const visitId = await ensureOpenVisit(patientId, { reason: '', notes: '' });
  if (!visitId) return { visitId: null, passageId: null };

  const entry = getPatientEntry(patientId) || { visitId, openPassageId: null, openServiceType: null };

  if (entry.openPassageId && entry.openServiceType === 'MEDECIN') {
    return { visitId, passageId: entry.openPassageId };
  }

  if (entry.openPassageId) {
    await ConsumApi.closeServicePassage(entry.openPassageId, { leftAt: nowIso() });
  }

  const started = await ConsumApi.startServicePassage({
    visitId,
    patientId,
    serviceType: 'MEDECIN',
    handledByUserId: handledByUserId || undefined,
    enteredAt: nowIso(),
    notes,
  });

  const passageId = started?.success ? pickPassageIdFromCreateResponse(started) : null;
  setPatientEntry(patientId, { visitId, openPassageId: passageId, openServiceType: 'MEDECIN' });

  return { visitId, passageId };
}

export async function closeActiveTracking(patientId, { leaveAt } = {}) {
  if (!patientId) return false;

  let entry = getPatientEntry(patientId);
  let visitId = entry?.visitId;

  if (!visitId) {
    const visitsResult = await ConsumApi.getPatientVisitsWithDurations(patientId);
    if (visitsResult?.success) {
      const visits = listFromResult(visitsResult);
      const open = visits.find((v) => v && !v.leaveAt);
      if (open?.id) {
        visitId = open.id;
        setPatientEntry(patientId, {
          visitId,
          openPassageId: entry?.openPassageId ?? null,
          openServiceType: entry?.openServiceType ?? null,
        });
        entry = getPatientEntry(patientId);
      }
    }
  }

  if (!visitId) return false;

  if (entry?.openPassageId) {
    await ConsumApi.closeServicePassage(entry.openPassageId, { leftAt: leaveAt || nowIso() });
  }

  const closed = await ConsumApi.closePatientVisit(visitId, { leaveAt: leaveAt || nowIso() });
  if (closed?.success) {
    clearPatientEntry(patientId);
    return true;
  }
  return false;
}

