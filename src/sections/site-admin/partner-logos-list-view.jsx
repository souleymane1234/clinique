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

export default function PartnerLogosListView() {
  const { contextHolder, showApiResponse } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    websiteUrl: '',
    logoOrder: 1,
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, loading: false });
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getSiteAdminPartnerLogos(includeInactive);
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
    const res = await ConsumApi.deleteSiteAdminPartnerLogo(idToDelete);
    showApiResponse(res, {
      successTitle: 'Logo partenaire supprimé',
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
    const res = await ConsumApi.toggleSiteAdminPartnerLogoActive(id);
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
      logoUrl: '',
      websiteUrl: '',
      logoOrder: 1,
      isActive: true,
    });
    setSelectedLogoFile(null);
    setLogoPreview(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (row) => {
    setIsEditMode(true);
    setEditingId(row.id);
    setFormData({
      name: row.name || '',
      logoUrl: row.logoUrl || '',
      websiteUrl: row.websiteUrl || '',
      logoOrder: row.logoOrder || 1,
      isActive: row.isActive !== undefined ? row.isActive : true,
    });
    setLogoPreview(row.logoUrl ? getImageUrl(row.logoUrl) : null);
    setSelectedLogoFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      logoUrl: '',
      websiteUrl: '',
      logoOrder: 1,
      isActive: true,
    });
    setSelectedLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showApiResponse(
          { success: false, message: 'Veuillez sélectionner un fichier image valide' },
          { errorTitle: 'Validation' }
        );
        event.target.value = '';
        return;
      }
      setSelectedLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      showApiResponse(
        { success: false, message: 'Le nom du partenaire est obligatoire' },
        { errorTitle: 'Validation' }
      );
      return;
    }

    setUploading(true);
    try {
      let finalLogoUrl = formData.logoUrl;

      // Upload logo si un fichier est sélectionné
      if (selectedLogoFile) {
        const uploadResult = await ConsumApi.uploadSiteAdminPartnerLogo(selectedLogoFile);
        if (!uploadResult.success) {
          showApiResponse(uploadResult, { errorTitle: 'Erreur d\'upload' });
          setUploading(false);
          return;
        }
        finalLogoUrl = uploadResult.data?.logoUrl || uploadResult.data?.url || finalLogoUrl;
      }

      const dataToSend = {
        ...formData,
        logoUrl: finalLogoUrl,
      };

      const res = isEditMode
        ? await ConsumApi.updateSiteAdminPartnerLogo(editingId, dataToSend)
        : await ConsumApi.createSiteAdminPartnerLogo(dataToSend);

      showApiResponse(res, {
        successTitle: isEditMode ? 'Logo partenaire modifié' : 'Logo partenaire créé',
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
        <title> Logos partenaires | Administration du site </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Gestion des logos partenaires</Typography>
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
              Ajouter un logo
            </Button>
          </Stack>
        </Stack>

        {/* Partner Logos List */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Logo</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Site web</TableCell>
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
                        Aucun logo partenaire enregistré
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && items.length > 0 && items.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Avatar
                          src={row.logoUrl ? getImageUrl(row.logoUrl) : ''}
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
                        {row.websiteUrl ? (
                          <Typography
                            variant="body2"
                            component="a"
                            href={row.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'primary.main', textDecoration: 'none' }}
                          >
                            {row.websiteUrl}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.logoOrder || '-'}</Typography>
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

        {/* Partner Logo Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Modifier le logo partenaire' : 'Ajouter un nouveau logo partenaire'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {uploading && <LinearProgress />}

              <TextField
                fullWidth
                label="Nom du partenaire *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Air France"
                required
              />

              <TextField
                fullWidth
                label="Site web"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://www.example.com"
                helperText="URL du site web du partenaire"
              />

              <TextField
                fullWidth
                type="number"
                label="Ordre"
                value={formData.logoOrder}
                onChange={(e) => setFormData({ ...formData, logoOrder: parseInt(e.target.value, 10) || 1 })}
                inputProps={{ min: 1 }}
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Logo du partenaire
                </Typography>
                {logoPreview && (
                  <Box sx={{ mb: 2 }}>
                    <Avatar
                      src={logoPreview}
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
                  {selectedLogoFile ? selectedLogoFile.name : 'Sélectionner un logo'}
                  <input type="file" hidden accept="image/*" onChange={handleLogoFileChange} />
                </Button>
                {!selectedLogoFile && !logoPreview && (
                  <TextField
                    fullWidth
                    label="URL du logo"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    sx={{ mt: 1 }}
                    placeholder="/uploads/partners/logo.jpeg"
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
          title="Supprimer le logo partenaire"
          message="Êtes-vous sûr de vouloir supprimer ce logo partenaire ? Cette action est irréversible."
          loading={deleteDialog.loading}
        />
      </Container>
    </>
  );
}

