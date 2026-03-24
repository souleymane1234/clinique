import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Tabs,
  Stack,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';

import { usePathname } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

function formatDuration(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return 'N/A';
  const total = Math.max(0, Math.round(Number(minutes)));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m}min`;
}

function getList(res) {
  const raw = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
  return Array.isArray(raw) ? raw : [];
}

function normalizeUsersList(result) {
  const d = result?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.users)) return d.users;
  return [];
}

function normalizePatientsList(result) {
  const d = result?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.patients)) return d.patients;
  if (Array.isArray(d?.items)) return d.items;
  return [];
}

function userDisplayName(u) {
  const fn = u.first_name || u.firstName || '';
  const ln = u.last_name || u.lastName || '';
  const name = `${fn} ${ln}`.trim();
  return name || u.email || String(u.id || '') || '—';
}

function patientDisplayName(p) {
  const name = `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim();
  return name || p.patientNumber || String(p.id || '') || '—';
}

async function mapInBatches(items, batchSize, iteratee) {
  const out = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    /* Traitement par lots pour ne pas surcharger l'API */
    // eslint-disable-next-line no-await-in-loop
    const part = await Promise.all(chunk.map((item) => iteratee(item)));
    out.push(...part.flat());
  }
  return out;
}

export default function PatientTimeTrackingView() {
  const { contextHolder, showError } = useNotification();
  const pathname = usePathname();

  const [currentTab, setCurrentTab] = useState('visits');

  const [, setLoadingAggregates] = useState(false);
  const [, setLoadingAllUserRows] = useState(false);
  const [loadingAllVisitRows, setLoadingAllVisitRows] = useState(false);

  const [, setServiceAggregates] = useState([]);
  const [, setAllUserStatsRows] = useState([]);
  const [allPatientVisitRows, setAllPatientVisitRows] = useState([]);

  const [startDate] = useState('');
  const [endDate] = useState('');

  const [searchVisits, setSearchVisits] = useState('');

  const toIsoOrUndefined = (value, endOfDay = false) => {
    if (!value) return undefined;
    const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
    return `${value}${suffix}`;
  };

  const buildDateFilters = useCallback(
    () => ({
      startDate: toIsoOrUndefined(startDate),
      endDate: toIsoOrUndefined(endDate, true),
    }),
    [startDate, endDate]
  );

  const fetchUsersList = async () => {
    let r = await ConsumApi.getUsersNew();
    let users = normalizeUsersList(r);
    if (!users.length) {
      r = await ConsumApi.getUsers();
      users = normalizeUsersList(r);
    }
    return users;
  };

  const loadAllUsersServiceTimes = async () => {
    setLoadingAllUserRows(true);
    try {
      const users = await fetchUsersList();
      const filters = buildDateFilters();

      const rows = await mapInBatches(users, 6, async (u) => {
        const uid = u.id || u.userId;
        if (!uid) return [];
        const res = await ConsumApi.getServiceTimesByUser(String(uid), filters);
        const list = getList(res);
        return list.map((s, idx) => ({
          key: `${uid}-${s.serviceType || s.service || idx}`,
          userId: String(uid),
          userName: userDisplayName(u),
          serviceType: s.serviceType || s.service || '—',
          passagesCount: s.passagesCount ?? s.count ?? s.totalPassages ?? 0,
          averageMinutes: s.averageMinutes ?? s.avgMinutes ?? s.avg,
          minMinutes: s.minMinutes ?? s.min,
          maxMinutes: s.maxMinutes ?? s.max,
        }));
      });

      setAllUserStatsRows(rows);
    } catch (e) {
      console.error('Error loading all users service times:', e);
      showError('Erreur', 'Impossible de charger les statistiques par utilisateur');
      setAllUserStatsRows([]);
    } finally {
      setLoadingAllUserRows(false);
    }
  };

  const loadAllPatientsVisits = async () => {
    setLoadingAllVisitRows(true);
    try {
      const pres = await ConsumApi.getPatients({ limit: 200 });
      const patients = normalizePatientsList(pres);

      const rows = await mapInBatches(patients, 8, async (p) => {
        const pid = p.id;
        if (!pid) return [];
        const res = await ConsumApi.getPatientVisitsWithDurations(String(pid));
        const visits = getList(res);
        const pname = patientDisplayName(p);
        return visits.map((v) => ({
          key: `${pid}-${v.id}`,
          patientId: String(pid),
          patientName: pname,
          ...v,
        }));
      });

      setAllPatientVisitRows(rows);
    } catch (e) {
      console.error('Error loading all patient visits:', e);
      showError('Erreur', 'Impossible de charger les visites des patients');
      setAllPatientVisitRows([]);
    } finally {
      setLoadingAllVisitRows(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoadingAggregates(true);
      try {
        const res = await ConsumApi.getServiceAggregates();
        setServiceAggregates(getList(res));
      } catch (e) {
        console.error('Error loading aggregates:', e);
        showError('Erreur', 'Impossible de charger les statistiques par service');
        setServiceAggregates([]);
      } finally {
        setLoadingAggregates(false);
      }

      await loadAllUsersServiceTimes();
      await loadAllPatientsVisits();
    };
    init();
  }, []);

  useEffect(() => {
    if (pathname === '/patients/time-tracking') {
      loadAllPatientsVisits();
    }
  }, [pathname]);

  const filteredVisitRows = useMemo(() => {
    const q = searchVisits.trim().toLowerCase();
    if (!q) return allPatientVisitRows;
    return allPatientVisitRows.filter(
      (r) =>
        String(r.patientId || '')
          .toLowerCase()
          .includes(q) ||
        String(r.patientName || '')
          .toLowerCase()
          .includes(q)
    );
  }, [allPatientVisitRows, searchVisits]);

  const totalFilteredVisitsMinutes = useMemo(
    () => filteredVisitRows.reduce((sum, r) => sum + Number(r.durationMinutes || 0), 0),
    [filteredVisitRows]
  );

  const handleTabChange = (_e, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <Helmet>
        <title> Time Tracking | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Time Tracking</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Données chargées par défaut — utilisez la recherche pour filtrer l&apos;affichage.
          </Typography>
        </Box>

        <Card>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ px: 2, pt: 1, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Visites d'un patient" value="visits" />
            {/* <Tab label="Temps par service (global)" value="global" />
            <Tab label="Temps par service d'un utilisateur" value="user" /> */}
          </Tabs>

          <Box sx={{ p: 3 }}>
          <Stack spacing={2}>
                <LoadingButton variant="outlined" onClick={loadAllPatientsVisits} loading={loadingAllVisitRows}>
                  Actualiser la liste des visites
                </LoadingButton>

                <TextField
                  size="small"
                  fullWidth
                  placeholder="Rechercher par nom de patient ou ID patient..."
                  value={searchVisits}
                  onChange={(e) => setSearchVisits(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {filteredVisitRows.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Lignes affichées : <strong>{filteredVisitRows.length}</strong> — Durée totale (sélection filtrée) :{' '}
                    <strong>{formatDuration(totalFilteredVisitsMinutes)}</strong>
                  </Typography>
                )}

                {loadingAllVisitRows && allPatientVisitRows.length === 0 ? (
                  <LoadingButton loading>Chargement...</LoadingButton>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Patient</TableCell>
                        <TableCell>Arrivée</TableCell>
                        <TableCell>Sortie</TableCell>
                        <TableCell align="right">Durée</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredVisitRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            Aucune visite
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVisitRows.map((r) => (
                          <TableRow key={r.key}>
                            <TableCell>{r.patientName}</TableCell>
                            <TableCell>{r.arriveAt ? new Date(r.arriveAt).toLocaleString() : '—'}</TableCell>
                            <TableCell>{r.leaveAt ? new Date(r.leaveAt).toLocaleString() : 'En cours'}</TableCell>
                            <TableCell align="right">{formatDuration(r.durationMinutes)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </Stack>
            {/* {currentTab === 'global' && (
              <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap">
                  <TextField
                    type="date"
                    label="Date début"
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    size="small"
                  />
                  <TextField
                    type="date"
                    label="Date fin"
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    size="small"
                  />
                  <LoadingButton variant="contained" onClick={loadAggregates} loading={loadingAggregates}>
                    Actualiser
                  </LoadingButton>
                </Stack>

                <TextField
                  size="small"
                  fullWidth
                  placeholder="Rechercher par type de service..."
                  value={searchGlobal}
                  onChange={(e) => setSearchGlobal(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {loadingAggregates && serviceAggregates.length === 0 ? (
                  <LoadingButton loading>Chargement...</LoadingButton>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell align="right">Passages</TableCell>
                        <TableCell align="right">Moyenne</TableCell>
                        <TableCell align="right">Min</TableCell>
                        <TableCell align="right">Max</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAggregates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            Aucune donnée
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAggregates.map((s, idx) => (
                          <TableRow key={`${s.serviceType || s.service || 'service'}-${idx}`}>
                            <TableCell>{s.serviceType || s.service || '—'}</TableCell>
                            <TableCell align="right">{s.passagesCount ?? s.count ?? s.totalPassages ?? 0}</TableCell>
                            <TableCell align="right">{formatDuration(s.averageMinutes ?? s.avgMinutes ?? s.avg)}</TableCell>
                            <TableCell align="right">{formatDuration(s.minMinutes ?? s.min)}</TableCell>
                            <TableCell align="right">{formatDuration(s.maxMinutes ?? s.max)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </Stack>
            )}

            {currentTab === 'user' && (
              <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap">
                  <TextField
                    type="date"
                    label="Date début"
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    size="small"
                  />
                  <TextField
                    type="date"
                    label="Date fin"
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    size="small"
                  />
                  <LoadingButton variant="contained" onClick={loadAllUsersServiceTimes} loading={loadingAllUserRows}>
                    Actualiser
                  </LoadingButton>
                </Stack>

                <TextField
                  size="small"
                  fullWidth
                  placeholder="Rechercher par nom, ID utilisateur ou service..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Divider />

                {loadingAllUserRows && allUserStatsRows.length === 0 ? (
                  <LoadingButton loading>Chargement...</LoadingButton>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Utilisateur</TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell align="right">Passages</TableCell>
                        <TableCell align="right">Moyenne</TableCell>
                        <TableCell align="right">Min</TableCell>
                        <TableCell align="right">Max</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUserRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            Aucune donnée
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUserRows.map((r) => (
                          <TableRow key={r.key}>
                            <TableCell>{r.userName}</TableCell>
                            <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.userId}>
                              {r.userId}
                            </TableCell>
                            <TableCell>{r.serviceType}</TableCell>
                            <TableCell align="right">{r.passagesCount}</TableCell>
                            <TableCell align="right">{formatDuration(r.averageMinutes)}</TableCell>
                            <TableCell align="right">{formatDuration(r.minMinutes)}</TableCell>
                            <TableCell align="right">{formatDuration(r.maxMinutes)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </Stack>
            )}

            {currentTab === 'visits' && (
              <Stack spacing={2}>
                <LoadingButton variant="outlined" onClick={loadAllPatientsVisits} loading={loadingAllVisitRows}>
                  Actualiser la liste des visites
                </LoadingButton>

                <TextField
                  size="small"
                  fullWidth
                  placeholder="Rechercher par nom de patient ou ID patient..."
                  value={searchVisits}
                  onChange={(e) => setSearchVisits(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {filteredVisitRows.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Lignes affichées : <strong>{filteredVisitRows.length}</strong> — Durée totale (sélection filtrée) :{' '}
                    <strong>{formatDuration(totalFilteredVisitsMinutes)}</strong>
                  </Typography>
                )}

                {loadingAllVisitRows && allPatientVisitRows.length === 0 ? (
                  <LoadingButton loading>Chargement...</LoadingButton>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Patient</TableCell>
                        <TableCell>Arrivée</TableCell>
                        <TableCell>Sortie</TableCell>
                        <TableCell align="right">Durée</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredVisitRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            Aucune visite
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVisitRows.map((r) => (
                          <TableRow key={r.key}>
                            <TableCell>{r.patientName}</TableCell>
                            <TableCell>{r.arriveAt ? new Date(r.arriveAt).toLocaleString() : '—'}</TableCell>
                            <TableCell>{r.leaveAt ? new Date(r.leaveAt).toLocaleString() : 'En cours'}</TableCell>
                            <TableCell align="right">{formatDuration(r.durationMinutes)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </Stack>
            )} */}
          </Box>
        </Card>
      </Stack>
    </>
  );
}
