import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Box,
  Card,
  Grid,
  Stack,
  Table,
  Button,
  TableRow,
  TextField,
  TableHead,
  TableBody,
  TableCell,
  Container,
  Typography,
  IconButton,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import ConfirmDeleteDialog from 'src/components/confirm-dialog/confirm-delete-dialog';

export default function EcoleStatisticsView() {
  const { contextHolder, showApiResponse } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({ keyKpi: '', value: '', unit: '' });
  const [editingId, setEditingId] = useState(null);
  const [edits, setEdits] = useState({ keyKpi: '', value: '', unit: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, loading: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getEcoleStatistics();
      if (result.success) {
        setItems(result.data || []);
      } else {
        showApiResponse(result, { errorTitle: 'Erreur de chargement' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id, loading: false });
  };

  const handleDeleteConfirm = async () => {
    const idToDelete = deleteDialog.id;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    const res = await ConsumApi.deleteEcoleStatistic(idToDelete);
    showApiResponse(res, {
      successTitle: 'Statistique supprimée',
      errorTitle: 'Erreur de suppression',
    });
    if (res.success) {
      setDeleteDialog({ open: false, id: null, loading: false });
      fetchData();
    } else {
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, loading: false });
  };

  const handleAdd = async () => {
    if (!newItem.keyKpi || !newItem.value || !newItem.unit) {
      showApiResponse({ success: false, message: 'Veuillez remplir tous les champs obligatoires' }, { errorTitle: 'Validation' });
      return;
    }
    const res = await ConsumApi.createEcoleStatistic(newItem);
    showApiResponse(res);
    if (res.success) {
      setNewItem({ keyKpi: '', value: '', unit: '' });
      fetchData();
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id || row._id);
    setEdits({
      keyKpi: row.keyKpi || '',
      value: row.value || '',
      unit: row.unit || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdits({ keyKpi: '', value: '', unit: '' });
  };

  const saveEdit = async () => {
    if (!edits.keyKpi || !edits.value || !edits.unit) {
      showApiResponse({ success: false, message: 'Veuillez remplir tous les champs obligatoires' }, { errorTitle: 'Validation' });
      return;
    }
    const res = await ConsumApi.updateEcoleStatistic(editingId, edits);
    showApiResponse(res);
    if (res.success) {
      setEditingId(null);
      fetchData();
    }
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Statistiques | AnnourTravel </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Statistiques de l&apos;école</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:refresh-fill" />}
              onClick={fetchData}
              disabled={loading}
            >
              Actualiser
            </Button>
          </Stack>
        </Stack>

        {/* Add New Statistic Form */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Ajouter une nouvelle statistique</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Indicateur KPI *"
                  value={newItem.keyKpi}
                  onChange={(e) => setNewItem({ ...newItem, keyKpi: e.target.value })}
                  placeholder="Ex: Nombre d&apos;étudiants"
                  helperText="Nom de l&apos;indicateur"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Valeur *"
                  value={newItem.value}
                  onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                  placeholder="Ex: 15000"
                  helperText="Valeur numérique"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Unité *"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="Ex: étudiants"
                  helperText="Unité de mesure"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:plus-fill" />}
                  disabled={loading || !newItem.keyKpi || !newItem.value || !newItem.unit}
                  onClick={handleAdd}
                >
                  Ajouter la statistique
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Statistics List */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Indicateur KPI</TableCell>
                  <TableCell>Valeur</TableCell>
                  <TableCell>Unité</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucune statistique enregistrée
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id || row._id} hover>
                      <TableCell>
                        {editingId === (row.id || row._id) ? (
                          <TextField
                            size="small"
                            value={edits.keyKpi}
                            onChange={(e) => setEdits({ ...edits, keyKpi: e.target.value })}
                            sx={{ minWidth: 200 }}
                          />
                        ) : (
                          <Typography variant="subtitle2">{row.keyKpi}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === (row.id || row._id) ? (
                          <TextField
                            size="small"
                            value={edits.value}
                            onChange={(e) => setEdits({ ...edits, value: e.target.value })}
                            sx={{ minWidth: 120 }}
                          />
                        ) : (
                          <Typography variant="body2" fontWeight="medium">
                            {row.value}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === (row.id || row._id) ? (
                          <TextField
                            size="small"
                            value={edits.unit}
                            onChange={(e) => setEdits({ ...edits, unit: e.target.value })}
                            sx={{ minWidth: 120 }}
                          />
                        ) : (
                          <Typography variant="body2">{row.unit}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingId === (row.id || row._id) ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton color="primary" size="small" onClick={saveEdit}>
                              <Iconify icon="eva:checkmark-fill" />
                            </IconButton>
                            <IconButton size="small" onClick={cancelEdit}>
                              <Iconify icon="eva:close-fill" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => startEdit(row)}>
                              <Iconify icon="eva:edit-fill" />
                            </IconButton>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteClick(row.id || row._id)}
                            >
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <ConfirmDeleteDialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Supprimer la statistique"
          message="Êtes-vous sûr de vouloir supprimer cette statistique ? Cette action est irréversible."
          loading={deleteDialog.loading}
        />
      </Container>
    </>
  );
}

