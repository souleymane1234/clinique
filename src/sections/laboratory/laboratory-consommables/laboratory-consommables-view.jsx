import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Chip,
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

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';
import { getCurrentStaffDisplayName } from 'src/utils/lab-user';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const emptyForm = () => ({
  name: '',
  reference: '',
  description: '',
  stockQuantity: 0,
  alertThreshold: 10,
  unit: '',
  expirationDate: '',
  supplier: '',
  unitPrice: 0,
  isActive: true,
});

export default function LaboratoryConsommablesView() {
  const { contextHolder, showError, showApiResponse } = useNotification();

  const [tab, setTab] = useState(0);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [mouvOpen, setMouvOpen] = useState(false);
  const [mouvConsommableId, setMouvConsommableId] = useState(null);
  const [mouv, setMouv] = useState({
    type: 'ENTREE',
    quantity: 1,
    reason: '',
    analyseId: '',
  });
  const [mouvSaving, setMouvSaving] = useState(false);

  const loadMainList = async () => {
    setLoading(true);
    try {
      if (tab === 0) {
        const filters = {};
        if (search.trim()) filters.search = search.trim();
        const res = await ConsumApi.getLaboratoryConsommablesPaginated(page + 1, rowsPerPage, filters);
        if (res.success) {
          setList(res.data || []);
          setTotal(res.pagination?.total ?? (res.data || []).length);
        } else {
          setList([]);
          setTotal(0);
          showError('Erreur', res.message || 'Chargement impossible');
        }
      } else if (tab === 1) {
        const res = await ConsumApi.getLaboratoryConsommablesRupture();
        if (res.success) {
          const data = Array.isArray(res.data) ? res.data : [];
          setList(data);
          setTotal(data.length);
        } else {
          setList([]);
          setTotal(0);
        }
      } else {
        const res = await ConsumApi.getLaboratoryConsommablesPerimes();
        if (res.success) {
          const data = Array.isArray(res.data) ? res.data : [];
          setList(data);
          setTotal(data.length);
        } else {
          setList([]);
          setTotal(0);
        }
      }
    } catch (e) {
      showError('Erreur', e?.message || 'Erreur réseau');
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMainList();
  }, [tab, page, rowsPerPage, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setEditOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || '',
      reference: row.reference || '',
      description: row.description || '',
      stockQuantity: Number(row.stockQuantity) || 0,
      alertThreshold: Number(row.alertThreshold) || 0,
      unit: row.unit || '',
      expirationDate: row.expirationDate ? String(row.expirationDate).slice(0, 10) : '',
      supplier: row.supplier || '',
      unitPrice: Number(row.unitPrice) || 0,
      isActive: row.isActive !== false,
    });
    setEditOpen(true);
  };

  const handleSaveConsommable = async () => {
    if (!form.name.trim()) {
      showError('Erreur', 'Le nom est obligatoire');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        stockQuantity: Number(form.stockQuantity),
        alertThreshold: Number(form.alertThreshold),
        unitPrice: Number(form.unitPrice),
      };
      const result = editingId
        ? await ConsumApi.updateLaboratoryConsommable(editingId, payload)
        : await ConsumApi.createLaboratoryConsommable(payload);
      const ok = showApiResponse(result, {
        successTitle: editingId ? 'Mis à jour' : 'Créé',
        errorTitle: 'Erreur',
      });
      if (ok.success) {
        setEditOpen(false);
        loadMainList();
      }
    } catch (e) {
      showError('Erreur', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce consommable ?')) return;
    const result = await ConsumApi.deleteLaboratoryConsommable(id);
    const ok = showApiResponse(result, { successTitle: 'Supprimé', errorTitle: 'Erreur' });
    if (ok.success) {
      loadMainList();
    }
  };

  const openMouvement = (id) => {
    setMouvConsommableId(id);
    setMouv({ type: 'ENTREE', quantity: 1, reason: '', analyseId: '' });
    setMouvOpen(true);
  };

  const submitMouvement = async () => {
    if (!mouvConsommableId) return;
    setMouvSaving(true);
    try {
      const payload = {
        consommableId: mouvConsommableId,
        type: mouv.type,
        quantity: Number(mouv.quantity),
        reason: mouv.reason || undefined,
        analyseId: mouv.analyseId || undefined,
        performedBy: getCurrentStaffDisplayName(),
      };
      const result = await ConsumApi.createLaboratoryConsommableMouvement(payload);
      const ok = showApiResponse(result, { successTitle: 'Mouvement enregistré', errorTitle: 'Erreur' });
      if (ok.success) {
        setMouvOpen(false);
        loadMainList();
      }
    } catch (e) {
      showError('Erreur', e?.message);
    } finally {
      setMouvSaving(false);
    }
  };

  const stockChip = (row) => {
    const q = Number(row.stockQuantity) || 0;
    const th = Number(row.alertThreshold) || 0;
    if (q <= th) return <Chip label="Rupture / faible" color="error" size="small" />;
    return <Chip label="OK" color="success" size="small" />;
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
            <LoadingButton loading>Chargement…</LoadingButton>
          </TableCell>
        </TableRow>
      );
    }
    if (list.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
            <Typography color="text.secondary">Aucun consommable</Typography>
          </TableCell>
        </TableRow>
      );
    }
    return list.map((row) => (
      <TableRow key={row.id} hover>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.reference || '—'}</TableCell>
        <TableCell>{row.stockQuantity}</TableCell>
        <TableCell>{row.alertThreshold}</TableCell>
        <TableCell>{row.unit || '—'}</TableCell>
        <TableCell>{row.expirationDate ? fDate(row.expirationDate) : '—'}</TableCell>
        <TableCell>{stockChip(row)}</TableCell>
        <TableCell align="right">
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={() => openMouvement(row.id)}>
              Mouvement
            </Button>
            <Button size="small" variant="outlined" onClick={() => openEdit(row)}>
              Modifier
            </Button>
            <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(row.id)}>
              Supprimer
            </Button>
          </Stack>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <Helmet>
        <title> Consommables laboratoire | Clinique </title>
      </Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4">Gestion des consommables</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Stock, ruptures, périmés et mouvements (API <code>/laboratory/consommables</code>)
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={openCreate}>
            Nouveau consommable
          </Button>
        </Stack>

        <Card>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ px: 2, pt: 1 }}>
            <Tab label="Liste paginée" />
            <Tab label="En rupture" />
            <Tab label="Périmés" />
          </Tabs>
          {tab === 0 && (
            <Stack spacing={2} sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder="Rechercher…"
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
            </Stack>
          )}
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 960 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Réf.</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Seuil</TableCell>
                    <TableCell>Unité</TableCell>
                    <TableCell>Péremption</TableCell>
                    <TableCell>Statut stock</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{renderTableBody()}</TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>
          {tab === 0 && (
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Lignes par page :"
            />
          )}
        </Card>
      </Stack>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Modifier le consommable' : 'Nouveau consommable'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nom"
              fullWidth
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Référence"
              fullWidth
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Quantité en stock"
                type="number"
                fullWidth
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
              />
              <TextField
                label="Seuil d’alerte"
                type="number"
                fullWidth
                value={form.alertThreshold}
                onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Unité"
                fullWidth
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
              <TextField
                label="Prix unitaire"
                type="number"
                fullWidth
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              />
            </Stack>
            <TextField
              label="Date de péremption"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.expirationDate}
              onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
            />
            <TextField
              label="Fournisseur"
              fullWidth
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Actif"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Annuler</Button>
          <LoadingButton variant="contained" loading={saving} onClick={handleSaveConsommable}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={mouvOpen} onClose={() => setMouvOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Mouvement de stock</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={mouv.type}
                onChange={(e) => setMouv({ ...mouv, type: e.target.value })}
              >
                <MenuItem value="ENTREE">Entrée</MenuItem>
                <MenuItem value="SORTIE">Sortie</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Quantité"
              type="number"
              fullWidth
              value={mouv.quantity}
              onChange={(e) => setMouv({ ...mouv, quantity: e.target.value })}
            />
            <TextField
              label="Motif"
              fullWidth
              value={mouv.reason}
              onChange={(e) => setMouv({ ...mouv, reason: e.target.value })}
            />
            <TextField
              label="ID analyse (optionnel)"
              fullWidth
              value={mouv.analyseId}
              onChange={(e) => setMouv({ ...mouv, analyseId: e.target.value })}
              helperText="Lier la sortie à une analyse si besoin"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMouvOpen(false)}>Annuler</Button>
          <LoadingButton variant="contained" loading={mouvSaving} onClick={submitMouvement}>
            Valider
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
