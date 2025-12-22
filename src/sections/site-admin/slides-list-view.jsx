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

export default function SlidesListView() {
  const { contextHolder, showApiResponse } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    imageUrl: '',
    thumbnailUrl: '',
    subtitle: '',
    title: '',
    description: '',
    thumbnailTitle: '',
    buttonText: '',
    buttonLink: '',
    slideOrder: 1,
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, loading: false });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getSiteAdminSlides(includeInactive);
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
    const res = await ConsumApi.deleteSiteAdminSlide(idToDelete);
    showApiResponse(res, {
      successTitle: 'Slide supprimé',
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
    const res = await ConsumApi.toggleSiteAdminSlideActive(id);
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
      imageUrl: '',
      thumbnailUrl: '',
      subtitle: '',
      title: '',
      description: '',
      thumbnailTitle: '',
      buttonText: '',
      buttonLink: '',
      slideOrder: 1,
      isActive: true,
    });
    setSelectedImageFile(null);
    setSelectedThumbnailFile(null);
    setImagePreview(null);
    setThumbnailPreview(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (row) => {
    setIsEditMode(true);
    setEditingId(row.id);
    setFormData({
      imageUrl: row.imageUrl || '',
      thumbnailUrl: row.thumbnailUrl || '',
      subtitle: row.subtitle || '',
      title: row.title || '',
      description: row.description || '',
      thumbnailTitle: row.thumbnailTitle || '',
      buttonText: row.buttonText || '',
      buttonLink: row.buttonLink || '',
      slideOrder: row.slideOrder || 1,
      isActive: row.isActive !== undefined ? row.isActive : true,
    });
    setImagePreview(row.imageUrl ? getImageUrl(row.imageUrl) : null);
    setThumbnailPreview(row.thumbnailUrl ? getImageUrl(row.thumbnailUrl) : null);
    setSelectedImageFile(null);
    setSelectedThumbnailFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      imageUrl: '',
      thumbnailUrl: '',
      subtitle: '',
      title: '',
      description: '',
      thumbnailTitle: '',
      buttonText: '',
      buttonLink: '',
      slideOrder: 1,
      isActive: true,
    });
    setSelectedImageFile(null);
    setSelectedThumbnailFile(null);
    setImagePreview(null);
    setThumbnailPreview(null);
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

  const handleThumbnailFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showApiResponse({ success: false, message: 'Veuillez sélectionner un fichier image valide' }, { errorTitle: 'Validation' });
        event.target.value = '';
        return;
      }
      setSelectedThumbnailFile(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      showApiResponse({ success: false, message: 'Le titre est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }

    setUploading(true);
    try {
      let finalImageUrl = formData.imageUrl;
      let finalThumbnailUrl = formData.thumbnailUrl;

      // Upload image principale si un fichier est sélectionné
      if (selectedImageFile) {
        const uploadResult = await ConsumApi.uploadSiteAdminSlideImage(selectedImageFile);
        if (!uploadResult.success) {
          showApiResponse(uploadResult, { errorTitle: 'Erreur d\'upload' });
          setUploading(false);
          return;
        }
        finalImageUrl = uploadResult.data?.imageUrl || uploadResult.data?.url || finalImageUrl;
      }

      // Upload thumbnail si un fichier est sélectionné
      if (selectedThumbnailFile) {
        const uploadResult = await ConsumApi.uploadSiteAdminSlideImage(selectedThumbnailFile);
        if (!uploadResult.success) {
          showApiResponse(uploadResult, { errorTitle: 'Erreur d\'upload' });
          setUploading(false);
          return;
        }
        finalThumbnailUrl = uploadResult.data?.thumbnailUrl || uploadResult.data?.url || finalThumbnailUrl;
      }

      const dataToSend = {
        ...formData,
        imageUrl: finalImageUrl,
        thumbnailUrl: finalThumbnailUrl,
      };

      const res = isEditMode
        ? await ConsumApi.updateSiteAdminSlide(editingId, dataToSend)
        : await ConsumApi.createSiteAdminSlide(dataToSend);

      showApiResponse(res, {
        successTitle: isEditMode ? 'Slide modifié' : 'Slide créé',
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
        <title> Slides | Administration du site </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Gestion des slides</Typography>
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
              Ajouter un slide
            </Button>
          </Stack>
        </Stack>

        {/* Slides List */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Titre</TableCell>
                  <TableCell>Sous-titre</TableCell>
                  <TableCell>Ordre</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucun slide enregistré
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
                        <Typography variant="subtitle2">{row.title || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {row.subtitle || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.slideOrder || '-'}</Typography>
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

        {/* Slide Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Modifier le slide' : 'Ajouter un nouveau slide'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {uploading && <LinearProgress />}
              
              <TextField
                fullWidth
                label="Titre *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Sous-titre"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <TextField
                fullWidth
                label="Titre du thumbnail"
                value={formData.thumbnailTitle}
                onChange={(e) => setFormData({ ...formData, thumbnailTitle: e.target.value })}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Texte du bouton"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Lien du bouton"
                  value={formData.buttonLink}
                  onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                />
              </Stack>

              <TextField
                fullWidth
                type="number"
                label="Ordre"
                value={formData.slideOrder}
                onChange={(e) => setFormData({ ...formData, slideOrder: parseInt(e.target.value, 10) || 1 })}
                inputProps={{ min: 1 }}
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Image principale</Typography>
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
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageFileChange}
                  />
                </Button>
                {!selectedImageFile && !imagePreview && (
                  <TextField
                    fullWidth
                    label="URL de l'image"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    sx={{ mt: 1 }}
                    placeholder="/uploads/slides/image.jpg"
                  />
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Image thumbnail</Typography>
                {thumbnailPreview && (
                  <Box sx={{ mb: 2 }}>
                    <Avatar
                      src={thumbnailPreview}
                      variant="rounded"
                      sx={{ width: 200, height: 100, mb: 1 }}
                    />
                  </Box>
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Iconify icon="eva:upload-fill" />}
                  fullWidth
                >
                  {selectedThumbnailFile ? selectedThumbnailFile.name : 'Sélectionner un thumbnail'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleThumbnailFileChange}
                  />
                </Button>
                {!selectedThumbnailFile && !thumbnailPreview && (
                  <TextField
                    fullWidth
                    label="URL du thumbnail"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    sx={{ mt: 1 }}
                    placeholder="/uploads/slides/thumbs/thumb.jpg"
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
              disabled={uploading || !formData.title}
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
          title="Supprimer le slide"
          message="Êtes-vous sûr de vouloir supprimer ce slide ? Cette action est irréversible."
          loading={deleteDialog.loading}
        />
      </Container>
    </>
  );
}

