import { Helmet } from 'react-helmet-async';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

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
  Button,
  Dialog,
  Select,
  Switch,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';
import { AdminStorage } from 'src/storages/admins_storage';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

const SERVICE_CATEGORIES = [
  'CONSULTATION',
  'HOSPITALISATION',
  'IMAGERIE',
  'LABORATOIRE',
  'PHARMACIE',
  'URGENCE',
  'AUTRE',
];

const DAY_TYPES = ['JOUR_OUVRABLE', 'WEEKEND', 'FERIE'];

const EXAM_SECTIONS = [
  'HEMATOLOGIE',
  'BIOCHIMIE',
  'IMMUNOLOGIE',
  'BACTERIOLOGIE',
  'PARASITOLOGIE',
  'VIROLOGIE',
  'AUTRE',
];

function normalizeRole(admin) {
  return ((admin?.role ?? admin?.service) ?? '').toString().toUpperCase().trim();
}

function safeList(result) {
  if (!result) return [];
  const data = result.data ?? result;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
    const parts = raw.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

export default function PricingView() {
  const admin = AdminStorage.getInfoAdmin();
  const role = normalizeRole(admin);
  const canManage = role === 'ADMIN' || role === 'DIRECTEUR';

  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();
  const notifRef = useRef({ showApiResponse, showError, showSuccess });
  useEffect(() => {
    notifRef.current = { showApiResponse, showError, showSuccess };
  }, [showApiResponse, showError, showSuccess]);

  const [tab, setTab] = useState('services'); // services | exams
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const [services, setServices] = useState([]);
  const [exams, setExams] = useState([]);

  const [serviceDialog, setServiceDialog] = useState({ open: false, mode: 'create', loading: false, item: null });
  const [examDialog, setExamDialog] = useState({ open: false, mode: 'create', loading: false, item: null });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'CONSULTATION',
    dayType: 'JOUR_OUVRABLE',
    price: 0,
    isActive: true,
  });

  const [examForm, setExamForm] = useState({
    name: '',
    section: 'HEMATOLOGIE',
    coefficient: 1,
    baseUnitCost: 0,
    isActive: true,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [svcRes, exRes] = await Promise.all([ConsumApi.getPricingServices(), ConsumApi.getPricingExams()]);
      if (svcRes?.success) setServices(safeList(svcRes));
      else setServices([]);
      if (exRes?.success) setExams(safeList(exRes));
      else setExams([]);
    } catch (e) {
      console.error('Error loading pricing:', e);
      notifRef.current.showError('Erreur', 'Impossible de charger la tarification');
      setServices([]);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      const matchesSearch = !q || (s?.name || '').toLowerCase().includes(q) || (s?.category || '').toLowerCase().includes(q);
      const matchesActive = !activeOnly || s?.isActive === true;
      return matchesSearch && matchesActive;
    });
  }, [services, search, activeOnly]);

  const filteredExams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exams.filter((e) => {
      const matchesSearch =
        !q ||
        (e?.name || '').toLowerCase().includes(q) ||
        (e?.section || '').toLowerCase().includes(q);
      const matchesActive = !activeOnly || e?.isActive === true;
      return matchesSearch && matchesActive;
    });
  }, [exams, search, activeOnly]);

  const openCreateService = () => {
    setServiceForm({ name: '', category: 'CONSULTATION', dayType: 'JOUR_OUVRABLE', price: 0, isActive: true });
    setServiceDialog({ open: true, mode: 'create', loading: false, item: null });
  };

  const openEditService = (item) => {
    setServiceForm({
      name: item?.name || '',
      category: item?.category || 'CONSULTATION',
      dayType: item?.dayType || 'JOUR_OUVRABLE',
      price: Number(item?.price ?? 0),
      isActive: item?.isActive !== false,
    });
    setServiceDialog({ open: true, mode: 'edit', loading: false, item });
  };

  const openCreateExam = () => {
    setExamForm({ name: '', section: 'HEMATOLOGIE', coefficient: 1, baseUnitCost: 0, isActive: true });
    setExamDialog({ open: true, mode: 'create', loading: false, item: null });
  };

  const openEditExam = (item) => {
    setExamForm({
      name: item?.name || '',
      section: item?.section || 'HEMATOLOGIE',
      coefficient: Number(item?.coefficient ?? 1),
      baseUnitCost: Number(item?.baseUnitCost ?? 0),
      isActive: item?.isActive !== false,
    });
    setExamDialog({ open: true, mode: 'edit', loading: false, item });
  };

  const submitService = async () => {
    if (!canManage) return;
    if (!serviceForm.name.trim()) {
      showError('Erreur', 'Veuillez renseigner le nom du service');
      return;
    }
    setServiceDialog((prev) => ({ ...prev, loading: true }));
    try {
      const payload = { ...serviceForm, price: Number(serviceForm.price ?? 0) };
      const res =
        serviceDialog.mode === 'create'
          ? await ConsumApi.createPricingService(payload)
          : await ConsumApi.updatePricingService(serviceDialog.item?.id, payload);
      const processed = showApiResponse(res, {
        successTitle: 'Tarif enregistré',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'Tarif de service enregistré');
        setServiceDialog({ open: false, mode: 'create', loading: false, item: null });
        await loadAll();
      } else if ((processed.message || '').toLowerCase().includes('directeur') || (processed.message || '').toLowerCase().includes('administrateur')) {
        const payloadJwt = decodeJwtPayload(AdminStorage.getTokenAdmin());
        const tokenRole = payloadJwt?.role || payloadJwt?.roles || payloadJwt?.authorities || null;
        showError(
          'Autorisation',
          `Le backend refuse la modification. Rôle local: ${role || 'N/A'} ; rôle token: ${tokenRole ? JSON.stringify(tokenRole) : 'N/A'}`
        );
      }
    } catch (e) {
      console.error('submitService error:', e);
      showError('Erreur', 'Impossible d’enregistrer le tarif');
    } finally {
      setServiceDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const submitExam = async () => {
    if (!canManage) return;
    if (!examForm.name.trim()) {
      showError('Erreur', 'Veuillez renseigner le nom de l’examen');
      return;
    }
    setExamDialog((prev) => ({ ...prev, loading: true }));
    try {
      const payload = {
        ...examForm,
        coefficient: Number(examForm.coefficient ?? 1),
        baseUnitCost: Number(examForm.baseUnitCost ?? 0),
      };
      const res =
        examDialog.mode === 'create'
          ? await ConsumApi.createPricingExam(payload)
          : await ConsumApi.updatePricingExam(examDialog.item?.id, payload);
      const processed = showApiResponse(res, {
        successTitle: 'Tarif enregistré',
        errorTitle: 'Erreur',
      });
      if (processed.success) {
        showSuccess('Succès', 'Tarif d’examen enregistré');
        setExamDialog({ open: false, mode: 'create', loading: false, item: null });
        await loadAll();
      } else if ((processed.message || '').toLowerCase().includes('directeur') || (processed.message || '').toLowerCase().includes('administrateur')) {
        const payloadJwt = decodeJwtPayload(AdminStorage.getTokenAdmin());
        const tokenRole = payloadJwt?.role || payloadJwt?.roles || payloadJwt?.authorities || null;
        showError(
          'Autorisation',
          `Le backend refuse la modification. Rôle local: ${role || 'N/A'} ; rôle token: ${tokenRole ? JSON.stringify(tokenRole) : 'N/A'}`
        );
      }
    } catch (e) {
      console.error('submitExam error:', e);
      showError('Erreur', 'Impossible d’enregistrer le tarif');
    } finally {
      setExamDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const toggleServiceActive = async (item) => {
    if (!canManage) return;
    try {
      const payload = {
        name: item?.name,
        category: item?.category,
        dayType: item?.dayType,
        price: Number(item?.price ?? 0),
        isActive: !item?.isActive,
      };
      const res = await ConsumApi.updatePricingService(item?.id, payload);
      const processed = showApiResponse(res, { successTitle: 'Mis à jour', errorTitle: 'Erreur' });
      if (processed.success) await loadAll();
    } catch (e) {
      console.error('toggleServiceActive error:', e);
      showError('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const toggleExamActive = async (item) => {
    if (!canManage) return;
    try {
      const payload = {
        name: item?.name,
        section: item?.section,
        coefficient: Number(item?.coefficient ?? 1),
        baseUnitCost: Number(item?.baseUnitCost ?? 0),
        isActive: !item?.isActive,
      };
      const res = await ConsumApi.updatePricingExam(item?.id, payload);
      const processed = showApiResponse(res, { successTitle: 'Mis à jour', errorTitle: 'Erreur' });
      if (processed.success) await loadAll();
    } catch (e) {
      console.error('toggleExamActive error:', e);
      showError('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  return (
    <>
      <Helmet>
        <title> Tarification | Clinique </title>
      </Helmet>

      {contextHolder}

      <Box>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Tarification</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gérer les tarifs des services et des examens.
            </Typography>
          </Box>

          <Card sx={{ p: 2.5 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
            >
              <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                <Tab value="services" label="Services" />
                <Tab value="exams" label="Examens" />
              </Tabs>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Actifs uniquement
                  </Typography>
                  <Switch checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
                </Stack>
                <Button variant="outlined" onClick={loadAll} startIcon={<Iconify icon="eva:refresh-fill" />}>
                  Actualiser
                </Button>
                {canManage && tab === 'services' && (
                  <Button variant="contained" onClick={openCreateService} startIcon={<Iconify icon="eva:plus-fill" />}>
                    Nouveau service
                  </Button>
                )}
                {canManage && tab === 'exams' && (
                  <Button variant="contained" onClick={openCreateExam} startIcon={<Iconify icon="eva:plus-fill" />}>
                    Nouvel examen
                  </Button>
                )}
              </Stack>
            </Stack>
          </Card>

          {!canManage && (
            <Card sx={{ p: 2.5 }}>
              <Typography variant="body2" color="text.secondary">
                Vous pouvez consulter les tarifs. La création et la modification sont réservées à <b>ADMIN</b> et <b>DIRECTEUR</b>.
              </Typography>
            </Card>
          )}

          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>{tab === 'services' ? 'Catégorie' : 'Section'}</TableCell>
                      <TableCell>{tab === 'services' ? 'Type de jour' : 'Coefficient'}</TableCell>
                      <TableCell align="right">{tab === 'services' ? 'Prix' : 'Coût unitaire'}</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <LoadingButton loading>Chargement...</LoadingButton>
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading && tab === 'services' && filteredServices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          Aucun tarif de service
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading && tab === 'exams' && filteredExams.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          Aucun tarif d’examen
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading &&
                      tab === 'services' &&
                      filteredServices.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{s.name}</Typography>
                          </TableCell>
                          <TableCell>{s.category || '—'}</TableCell>
                          <TableCell>{s.dayType || '—'}</TableCell>
                          <TableCell align="right">{Number(s.price ?? 0).toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={s.isActive ? 'Actif' : 'Inactif'}
                              color={s.isActive ? 'success' : 'default'}
                              variant={s.isActive ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <IconButton size="small" onClick={() => openEditService(s)} disabled={!canManage} title="Modifier">
                                <Iconify icon="eva:edit-fill" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => toggleServiceActive(s)}
                                disabled={!canManage}
                                title={s.isActive ? 'Désactiver' : 'Activer'}
                              >
                                <Iconify icon={s.isActive ? 'eva:slash-fill' : 'eva:checkmark-circle-2-fill'} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}

                    {!loading &&
                      tab === 'exams' &&
                      filteredExams.map((e) => (
                        <TableRow key={e.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{e.name}</Typography>
                          </TableCell>
                          <TableCell>{e.section || '—'}</TableCell>
                          <TableCell>{Number(e.coefficient ?? 0)}</TableCell>
                          <TableCell align="right">{Number(e.baseUnitCost ?? 0).toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={e.isActive ? 'Actif' : 'Inactif'}
                              color={e.isActive ? 'success' : 'default'}
                              variant={e.isActive ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <IconButton size="small" onClick={() => openEditExam(e)} disabled={!canManage} title="Modifier">
                                <Iconify icon="eva:edit-fill" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => toggleExamActive(e)}
                                disabled={!canManage}
                                title={e.isActive ? 'Désactiver' : 'Activer'}
                              >
                                <Iconify icon={e.isActive ? 'eva:slash-fill' : 'eva:checkmark-circle-2-fill'} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          </Card>
        </Stack>
      </Box>

      {/* Dialog Service */}
      <Dialog open={serviceDialog.open} onClose={() => setServiceDialog({ open: false, mode: 'create', loading: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{serviceDialog.mode === 'create' ? 'Nouveau tarif de service' : 'Modifier le tarif de service'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Nom"
              fullWidth
              value={serviceForm.name}
              onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Catégorie</InputLabel>
                  <Select
                    label="Catégorie"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {SERVICE_CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type de jour</InputLabel>
                  <Select
                    label="Type de jour"
                    value={serviceForm.dayType}
                    onChange={(e) => setServiceForm((p) => ({ ...p, dayType: e.target.value }))}
                  >
                    {DAY_TYPES.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              label="Prix (FCFA)"
              type="number"
              fullWidth
              value={serviceForm.price}
              onChange={(e) => setServiceForm((p) => ({ ...p, price: e.target.value }))}
              inputProps={{ min: 0 }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Switch checked={serviceForm.isActive} onChange={(e) => setServiceForm((p) => ({ ...p, isActive: e.target.checked }))} />
              <Typography variant="body2">Actif</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialog({ open: false, mode: 'create', loading: false, item: null })}>Annuler</Button>
          <LoadingButton variant="contained" loading={serviceDialog.loading} onClick={submitService} disabled={!canManage}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog Exam */}
      <Dialog open={examDialog.open} onClose={() => setExamDialog({ open: false, mode: 'create', loading: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{examDialog.mode === 'create' ? 'Nouveau tarif d’examen' : 'Modifier le tarif d’examen'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Nom"
              fullWidth
              value={examForm.name}
              onChange={(e) => setExamForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select label="Section" value={examForm.section} onChange={(e) => setExamForm((p) => ({ ...p, section: e.target.value }))}>
                    {EXAM_SECTIONS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Coefficient"
                  type="number"
                  fullWidth
                  value={examForm.coefficient}
                  onChange={(e) => setExamForm((p) => ({ ...p, coefficient: e.target.value }))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Coût unitaire (FCFA)"
              type="number"
              fullWidth
              value={examForm.baseUnitCost}
              onChange={(e) => setExamForm((p) => ({ ...p, baseUnitCost: e.target.value }))}
              inputProps={{ min: 0 }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Switch checked={examForm.isActive} onChange={(e) => setExamForm((p) => ({ ...p, isActive: e.target.checked }))} />
              <Typography variant="body2">Actif</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExamDialog({ open: false, mode: 'create', loading: false, item: null })}>Annuler</Button>
          <LoadingButton variant="contained" loading={examDialog.loading} onClick={submitExam} disabled={!canManage}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

