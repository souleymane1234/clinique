import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Box,
  Card,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
  Avatar,
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
  LinearProgress,
  FormControlLabel,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import ConfirmDeleteDialog from 'src/components/confirm-dialog/confirm-delete-dialog';

const base_url = 'http://localhost:3001';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${base_url}${url}`;
};

export default function ServicesListView() {
  const { contextHolder, showApiResponse } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    description: '',
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, loading: false });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getSiteAdminServices(includeInactive);
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
  }, [includeInactive]);

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id, loading: false });
  };

  const handleDeleteConfirm = async () => {
    const idToDelete = deleteDialog.id;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    const res = await ConsumApi.deleteSiteAdminService(idToDelete);
    showApiResponse(res, {
      successTitle: 'Service supprimé',
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

  const handleToggleActive = async (id) => {
    const res = await ConsumApi.toggleSiteAdminServiceActive(id);
    showApiResponse(res, {
      successTitle: 'Statut modifié',
      errorTitle: 'Erreur de modification',
    });
    if (res.success) {
      fetchData();
    }
  };

  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      imageUrl: '',
      description: '',
      isActive: true,
    });
    setSelectedImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (row) => {
    setIsEditMode(true);
    setEditingId(row.id);
    setFormData({
      name: row.name || '',
      imageUrl: row.imageUrl || '',
      description: row.description || '',
      isActive: row.isActive !== undefined ? row.isActive : true,
    });
    setImagePreview(row.imageUrl ? getImageUrl(row.imageUrl) : null);
    setSelectedImageFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      imageUrl: '',
      description: '',
      isActive: true,
    });
    setSelectedImageFile(null);
    setImagePreview(null);
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showApiResponse({ success: false, message: 'Veuillez sélectionner un fichier image valide' }, { errorTitle: 'Validation' });
        event.target.value = '';
        return;
      }
      setSelectedImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      showApiResponse({ success: false, message: 'Le nom du service est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }

    setUploading(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // Upload image si un fichier est sélectionné
      if (selectedImageFile) {
        const uploadResult = await ConsumApi.uploadSiteAdminServiceImage(selectedImageFile);
        if (!uploadResult.success) {
          showApiResponse(uploadResult, { errorTitle: 'Erreur d\'upload' });
          setUploading(false);
          return;
        }
        finalImageUrl = uploadResult.data?.imageUrl || uploadResult.data?.url || finalImageUrl;
      }

      const dataToSend = {
        ...formData,
        imageUrl: finalImageUrl,
      };

      const res = isEditMode
        ? await ConsumApi.updateSiteAdminService(editingId, dataToSend)
        : await ConsumApi.createSiteAdminService(dataToSend);

      showApiResponse(res, {
        successTitle: isEditMode ? 'Service modifié' : 'Service créé',
        errorTitle: isEditMode ? 'Erreur de modification' : 'Erreur de création',
      });
      if (res.success) {
        handleCloseDialog();
        fetchData();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Services | Administration du site </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Gestion des services</Typography>
          <Stack direction="row" spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
              }
              label="Inclure les inactifs"
            />
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:refresh-fill" />}
              onClick={fetchData}
              disabled={loading}
            >
              Actualiser
            </Button>
            <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={handleOpenAddDialog}>
              Ajouter un service
            </Button>
          </Stack>
        </Stack>

        {/* Services List */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucun service enregistré
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && items.length > 0 && items.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Avatar
                          src={row.imageUrl ? getImageUrl(row.imageUrl) : ''}
                          variant="rounded"
                          sx={{ width: 80, height: 50 }}
                        >
                          <Iconify icon="eva:image-fill" />
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{row.name || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {row.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={row.isActive}
                              onChange={() => handleToggleActive(row.id)}
                              size="small"
                            />
                          }
                          label={row.isActive ? 'Actif' : 'Inactif'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(row)}>
                            <Iconify icon="eva:edit-fill" />
                          </IconButton>
                          <IconButton color="error" size="small" onClick={() => handleDeleteClick(row.id)}>
                            <Iconify icon="eva:trash-2-outline" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Service Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Modifier le service' : 'Ajouter un nouveau service'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {uploading && <LinearProgress />}

              <TextField
                fullWidth
                label="Nom du service *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Voyages organisés"
                required
              />

              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du service..."
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Image du service
                </Typography>
                {imagePreview && (
                  <Box sx={{ mb: 2 }}>
                    <Avatar
                      src={imagePreview}
                      variant="rounded"
                      sx={{ width: '100%', height: 200, mb: 1 }}
                    />
                  </Box>
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Iconify icon="eva:upload-fill" />}
                  fullWidth
                >
                  {selectedImageFile ? selectedImageFile.name : 'Sélectionner une image'}
                  <input type="file" hidden accept="image/*" onChange={handleImageFileChange} />
                </Button>
                {!selectedImageFile && !imagePreview && (
                  <TextField
                    fullWidth
                    label="URL de l'image"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    sx={{ mt: 1 }}
                    placeholder="/uploads/services/service.jpg"
                  />
                )}
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Actif"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleCloseDialog} disabled={uploading}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={uploading || !formData.name}
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
          title="Supprimer le service"
          message="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
          loading={deleteDialog.loading}
        />
      </Container>
    </>
  );
}

