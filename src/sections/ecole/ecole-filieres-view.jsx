import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  MenuItem,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import ConfirmDeleteDialog from 'src/components/confirm-dialog/confirm-delete-dialog';

export default function EcoleFilieresView() {
  const { contextHolder, showApiResponse } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState([]);
  const [formData, setFormData] = useState({ nomFormation: '', niveauId: '', typeEtablissementId: '' });
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, loading: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getEcoleOrientationList();
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
    (async () => {
      const res = await ConsumApi.getEcoleFormationLevelsAvailable();
      if (res.success) setLevels(res.data || []);
    })();
  }, []);

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id, loading: false });
  };

  const handleDeleteConfirm = async () => {
    const idToDelete = deleteDialog.id;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    const res = await ConsumApi.deleteEcoleOrientation(idToDelete);
    showApiResponse(res, {
      successTitle: 'Filière supprimée',
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
    setFormData({ nomFormation: '', niveauId: '', typeEtablissementId: '' });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (row) => {
    setIsEditMode(true);
    setEditingId(row.id || row._id);
    setFormData({
      nomFormation: row.nomFormation || '',
      niveauId: row.niveauId || '',
      typeEtablissementId: row.typeEtablissementId || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ nomFormation: '', niveauId: '', typeEtablissementId: '' });
  };

  const handleSave = async () => {
    if (!formData.nomFormation || !formData.niveauId || !formData.typeEtablissementId) {
      showApiResponse({ success: false, message: 'Veuillez remplir tous les champs obligatoires' }, { errorTitle: 'Validation' });
      return;
    }

    const res = isEditMode
      ? await ConsumApi.updateEcoleOrientation(editingId, formData)
      : await ConsumApi.createEcoleOrientation(formData);

    showApiResponse(res);
    if (res.success) {
      handleCloseDialog();
      fetchData();
    }
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Filières d&apos;orientation | AnnourTravel </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Filières d&apos;orientation</Typography>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<Iconify icon="eva:refresh-fill" />} 
              onClick={fetchData} 
              disabled={loading}
            >
              Actualiser
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Iconify icon="eva:plus-fill" />} 
              onClick={handleOpenAddDialog}
            >
              Ajouter une filière
            </Button>
          </Stack>
        </Stack>

        {/* Orientation Formations List */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom de la formation</TableCell>
                  <TableCell>Niveau</TableCell>
                  <TableCell>Type d&apos;établissement</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucune filière d&apos;orientation enregistrée
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id || row._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{row.nomFormation}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          {row.level?.label && (
                            <Chip label={row.level.label} size="small" />
                          )}
                          {row.level?.name && !row.level?.label && (
                            <Chip label={row.level.name} size="small" />
                          )}
                          {!row.level && <Typography variant="body2" color="text.secondary">-</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.institutionType?.label || row.institutionType?.name || row.typeEtablissementId || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(row)}>
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Filière Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Modifier la filière d\'orientation' : 'Ajouter une nouvelle filière d\'orientation'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Nom de la formation *"
                value={formData.nomFormation}
                onChange={(e) => setFormData({ ...formData, nomFormation: e.target.value })}
                placeholder="Ex: Formation en Informatique"
                required
              />
              <FormControl fullWidth>
                <InputLabel>Niveau *</InputLabel>
                <Select
                  value={formData.niveauId}
                  onChange={(e) => setFormData({ ...formData, niveauId: e.target.value })}
                  label="Niveau *"
                >
                  <MenuItem value="">Sélectionner un niveau</MenuItem>
                  {levels.map((lv) => (
                    <MenuItem key={lv.id || lv._id} value={lv.id || lv._id}>
                      {lv.label || lv.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Type d'établissement ID *"
                value={formData.typeEtablissementId}
                onChange={(e) => setFormData({ ...formData, typeEtablissementId: e.target.value })}
                placeholder="UUID du type d'établissement"
                helperText="Entrez l'identifiant du type d'établissement"
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
              disabled={loading || !formData.nomFormation || !formData.niveauId || !formData.typeEtablissementId}
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
          title="Supprimer la filière d'orientation"
          message="Êtes-vous sûr de vouloir supprimer cette filière d'orientation ?"
          loading={deleteDialog.loading}
        />
      </Container>
    </>
  );
}
