import { Helmet } from 'react-helmet-async';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

function safeList(result) {
  if (!result) return [];
  const data = result.data ?? result;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function InsuranceTypesView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();
  const notifRef = useRef({ showApiResponse, showError, showSuccess });
  useEffect(() => {
    notifRef.current = { showApiResponse, showError, showSuccess };
  }, [showApiResponse, showError, showSuccess]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const [dialog, setDialog] = useState({ open: false, mode: 'create', loading: false, item: null });
  const [form, setForm] = useState({ name: '', isActive: true });

  const [deleteDialog, setDeleteDialog] = useState({ open: false, loading: false, item: null });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ConsumApi.getInsuranceTypes();
      if (res?.success) setItems(safeList(res));
      else setItems([]);
    } catch (e) {
      console.error('Error loading insurance types:', e);
      notifRef.current.showError('Erreur', "Impossible de charger les types d'assurance");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchesSearch = !q || (it?.name || '').toLowerCase().includes(q);
      const matchesActive = !activeOnly || it?.isActive === true;
      return matchesSearch && matchesActive;
    });
  }, [items, search, activeOnly]);

  const openCreate = () => {
    setForm({ name: '', isActive: true });
    setDialog({ open: true, mode: 'create', loading: false, item: null });
  };

  const openEdit = (item) => {
    setForm({ name: item?.name || '', isActive: item?.isActive !== false });
    setDialog({ open: true, mode: 'edit', loading: false, item });
  };

  const submit = async () => {
    if (!form.name.trim()) {
      showError('Erreur', 'Veuillez renseigner un nom');
      return;
    }
    setDialog((p) => ({ ...p, loading: true }));
    try {
      const payload = { name: form.name.trim(), isActive: form.isActive };
      const res =
        dialog.mode === 'create'
          ? await ConsumApi.createInsuranceType({ name: payload.name })
          : await ConsumApi.updateInsuranceType(dialog.item?.id, payload);
      const processed = showApiResponse(res, { successTitle: 'Enregistré', errorTitle: 'Erreur' });
      if (processed.success) {
        showSuccess('Succès', dialog.mode === 'create' ? "Type d'assurance créé" : "Type d'assurance mis à jour");
        setDialog({ open: false, mode: 'create', loading: false, item: null });
        await loadAll();
      }
    } catch (e) {
      console.error('submit insurance type error:', e);
      showError('Erreur', "Impossible d'enregistrer");
    } finally {
      setDialog((p) => ({ ...p, loading: false }));
    }
  };

  const toggleActive = async (item) => {
    try {
      const payload = { name: item?.name, isActive: !item?.isActive };
      const res = await ConsumApi.updateInsuranceType(item?.id, payload);
      const processed = showApiResponse(res, { successTitle: 'Mis à jour', errorTitle: 'Erreur' });
      if (processed.success) await loadAll();
    } catch (e) {
      console.error('toggle insurance type error:', e);
      showError('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const confirmDelete = (item) => {
    setDeleteDialog({ open: true, loading: false, item });
  };

  const doDelete = async () => {
    if (!deleteDialog.item?.id) return;
    setDeleteDialog((p) => ({ ...p, loading: true }));
    try {
      const res = await ConsumApi.deleteInsuranceType(deleteDialog.item.id);
      const processed = showApiResponse(res, { successTitle: 'Supprimé', errorTitle: 'Erreur' });
      if (processed.success) {
        showSuccess('Succès', "Type d'assurance supprimé");
        setDeleteDialog({ open: false, loading: false, item: null });
        await loadAll();
      }
    } catch (e) {
      console.error('delete insurance type error:', e);
      showError('Erreur', 'Impossible de supprimer');
    } finally {
      setDeleteDialog((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <>
      <Helmet>
        <title> Types d&apos;assurance | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Types d&apos;assurance</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gérer les assureurs / types d&apos;assurance disponibles.
          </Typography>
        </Box>

        <Card sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
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
            <Button variant="contained" onClick={openCreate} startIcon={<Iconify icon="eva:plus-fill" />}>
              Nouveau
            </Button>
          </Stack>
        </Card>

        <Card>
          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <Scrollbar>
              <Table size="small" sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <LoadingButton loading>Chargement...</LoadingButton>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        Aucun type d&apos;assurance
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    filtered.map((it) => (
                      <TableRow key={it.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{it.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={it.isActive ? 'Actif' : 'Inactif'}
                            color={it.isActive ? 'success' : 'default'}
                            variant={it.isActive ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => openEdit(it)} title="Modifier">
                              <Iconify icon="eva:edit-fill" />
                            </IconButton>
                            <IconButton size="small" onClick={() => toggleActive(it)} title={it.isActive ? 'Désactiver' : 'Activer'}>
                              <Iconify icon={it.isActive ? 'eva:slash-fill' : 'eva:checkmark-circle-2-fill'} />
                            </IconButton>
                            <IconButton size="small" onClick={() => confirmDelete(it)} title="Supprimer" color="error">
                              <Iconify icon="eva:trash-2-fill" />
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

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', loading: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? "Nouveau type d'assurance" : "Modifier le type d'assurance"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Nom" fullWidth value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            {dialog.mode === 'edit' && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Switch checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                <Typography variant="body2">Actif</Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, mode: 'create', loading: false, item: null })}>Annuler</Button>
          <LoadingButton variant="contained" loading={dialog.loading} onClick={submit}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, loading: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Supprimer</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Supprimer le type d&apos;assurance <b>{deleteDialog.item?.name}</b> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, loading: false, item: null })}>Annuler</Button>
          <LoadingButton color="error" variant="contained" loading={deleteDialog.loading} onClick={doDelete}>
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

