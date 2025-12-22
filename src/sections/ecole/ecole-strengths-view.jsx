import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Card,
  Stack,
  Table,
  Button,
  Dialog,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import ConfirmDeleteDialog from 'src/components/confirm-dialog/confirm-delete-dialog';

export default function EcoleStrengthsView() {
  const { contextHolder, showApiResponse } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '' });
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, loading: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getEcoleStrengths();
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
    const res = await ConsumApi.deleteEcoleStrength(idToDelete);
    showApiResponse(res, {
      successTitle: 'Point fort supprimé',
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

  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ title: '' });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (row) => {
    setIsEditMode(true);
    setEditingId(row.id || row._id);
    setFormData({
      title: row.title || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ title: '' });
  };

  const handleSave = async () => {
    if (!formData.title) {
      showApiResponse({ success: false, message: 'Le titre du point fort est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }

    const res = isEditMode
      ? await ConsumApi.updateEcoleStrength(editingId, formData)
      : await ConsumApi.createEcoleStrength(formData);

    showApiResponse(res, {
      successTitle: isEditMode ? 'Point fort modifié' : 'Point fort créé',
      errorTitle: isEditMode ? 'Erreur de modification' : 'Erreur de création',
    });
    if (res.success) {
      handleCloseDialog();
      fetchData();
    }
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Points forts | AnnourTravel </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Points forts de l&apos;école</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:refresh-fill" />}
              onClick={fetchData}
              disabled={loading}
            >
              Actualiser
            </Button>
            <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={handleOpenAddDialog}>
              Ajouter un point fort
            </Button>
          </Stack>
        </Stack>

        {/* Strengths List */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titre</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucun point fort enregistré
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id || row._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{row.title}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(row)}>
                            <Iconify icon="eva:edit-fill" />
                          </IconButton>
                          <IconButton color="error" size="small" onClick={() => handleDeleteClick(row.id || row._id)}>
                            <Iconify icon="eva:trash-2-outline" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Strength Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Modifier le point fort' : 'Ajouter un nouveau point fort'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Titre *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Excellence académique"
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || !formData.title}
              startIcon={<Iconify icon={isEditMode ? 'eva:save-fill' : 'eva:plus-fill'} />}
            >
              {isEditMode ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDeleteDialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Supprimer le point fort"
          message="Êtes-vous sûr de vouloir supprimer ce point fort ? Cette action est irréversible."
          loading={deleteDialog.loading}
        />
      </Container>
    </>
  );
}

