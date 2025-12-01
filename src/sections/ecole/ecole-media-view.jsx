import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  MenuItem,
  TableRow,
  TextField,
  TableHead,
  TableBody,
  TableCell,
  Container,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { uploadFile, getFileType, uploadImage, uploadVideo, formatFileSize } from 'src/utils/upload-media';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import ConfirmDeleteDialog from 'src/components/confirm-dialog/confirm-delete-dialog';

const MEDIA_TYPES = ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER'];

export default function EcoleMediaView() {
  const { contextHolder, showApiResponse } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({ url: '', type: 'IMAGE' });
  const [editingId, setEditingId] = useState(null);
  const [edits, setEdits] = useState({ url: '', type: 'IMAGE' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, loading: false });
  const [addDialog, setAddDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'upload'

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getEcoleMedia();
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
    const res = await ConsumApi.deleteEcoleMedia(idToDelete);
    showApiResponse(res, {
      successTitle: 'Média supprimé',
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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect media type from file
      const fileType = getFileType(file);
      if (fileType === 'image') {
        setNewItem({ ...newItem, type: 'IMAGE' });
      } else if (fileType === 'video') {
        setNewItem({ ...newItem, type: 'VIDEO' });
      } else {
        setNewItem({ ...newItem, type: 'DOCUMENT' });
      }
    }
  };


  const handleOpenAddDialog = () => {
    setAddDialog(true);
    setNewItem({ url: '', type: 'IMAGE' });
    setSelectedFile(null);
    setInputMode('url');
  };

  const handleCloseAddDialog = () => {
    setAddDialog(false);
    setNewItem({ url: '', type: 'IMAGE' });
    setSelectedFile(null);
    setInputMode('url');
  };

  const handleAdd = async () => {
    // Validation initiale
    if (!newItem.type) {
      showApiResponse({ success: false, message: 'Veuillez sélectionner le type de média' }, { errorTitle: 'Validation' });
      return;
    }

    let finalUrl = newItem.url;

    // Si on est en mode upload et qu'on a un fichier, on doit d'abord l'uploader
    if (inputMode === 'upload' && selectedFile) {
      setUploading(true);
      try {
        let uploadResult;
        if (newItem.type === 'IMAGE') {
          uploadResult = await uploadImage(selectedFile);
        } else if (newItem.type === 'VIDEO') {
          uploadResult = await uploadVideo(selectedFile);
        } else {
          uploadResult = await uploadFile(selectedFile);
        }
        
        if (!uploadResult.success) {
          showApiResponse(uploadResult, {
            errorTitle: 'Erreur d\'upload',
          });
          setUploading(false);
          return;
        }
        
        if (!uploadResult.url) {
          showApiResponse({
            success: false,
            message: 'L\'URL du fichier uploadé n\'a pas été retournée',
          }, { errorTitle: 'Erreur d\'upload' });
          setUploading(false);
          return;
        }

        // Utiliser l'URL retournée par l'upload
        finalUrl = uploadResult.url;
      } catch (error) {
        console.error('Error uploading file:', error);
        showApiResponse({
          success: false,
          message: 'Une erreur est survenue lors de l\'upload',
        }, { errorTitle: 'Erreur d\'upload' });
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }
    
    // Validation finale
    if (!finalUrl) {
      showApiResponse({ 
        success: false, 
        message: inputMode === 'upload' 
          ? 'Veuillez sélectionner un fichier' 
          : 'Veuillez entrer une URL' 
      }, { errorTitle: 'Validation' });
      return;
    }

    // Créer le média avec l'URL finale
    const mediaData = {
      url: finalUrl,
      type: newItem.type,
    };

    const res = await ConsumApi.createEcoleMedia(mediaData);
    showApiResponse(res);
    if (res.success) {
      handleCloseAddDialog();
      fetchData();
    }
  };

  const getAcceptType = (mediaType) => {
    if (mediaType === 'IMAGE') return 'image/*';
    if (mediaType === 'VIDEO') return 'video/*';
    return '*/*';
  };

  const startEdit = (row) => {
    setEditingId(row.id || row._id);
    setEdits({
      url: row.url || '',
      type: row.type || 'IMAGE',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdits({ url: '', type: 'IMAGE' });
  };

  const saveEdit = async () => {
    if (!edits.url || !edits.type) {
      showApiResponse({ success: false, message: 'Veuillez remplir tous les champs obligatoires' }, { errorTitle: 'Validation' });
      return;
    }
    const res = await ConsumApi.updateEcoleMedia(editingId, edits);
    showApiResponse(res);
    if (res.success) {
      setEditingId(null);
      fetchData();
    }
  };

  const getMediaTypeColor = (type) => {
    const colors = {
      IMAGE: 'primary',
      VIDEO: 'error',
      AUDIO: 'warning',
      DOCUMENT: 'info',
      OTHER: 'default',
    };
    return colors[type] || 'default';
  };

  const getMediaTypeIcon = (type) => {
    const icons = {
      IMAGE: 'solar:gallery-bold',
      VIDEO: 'solar:videocamera-bold',
      AUDIO: 'solar:music-note-bold',
      DOCUMENT: 'solar:document-text-bold',
      OTHER: 'solar:file-bold',
    };
    return icons[type] || 'solar:file-bold';
  };

  const renderMediaPreview = (media) => {
    if (media.type === 'IMAGE') {
      return (
        <Box
          sx={{
            width: 60,
            height: 60,
            position: 'relative',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.neutral',
          }}
        >
          <Box
            component="img"
            src={media.url}
            alt="Preview"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'relative',
              zIndex: 1,
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              const iconBox = e.target.nextElementSibling;
              if (iconBox) {
                iconBox.style.display = 'flex';
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.neutral',
              zIndex: 0,
            }}
          >
            <Iconify icon={getMediaTypeIcon(media.type)} width={32} sx={{ color: 'text.secondary' }} />
          </Box>
        </Box>
      );
    }
    return (
      <Box
        sx={{
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.neutral',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Iconify icon={getMediaTypeIcon(media.type)} width={32} sx={{ color: 'text.secondary' }} />
      </Box>
    );
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Médias | CarbuGo </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Médias de l&apos;école</Typography>
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
              Ajouter un média
            </Button>
          </Stack>
        </Stack>

        {/* Media List */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={80}>Preview</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucun média enregistré
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id || row._id} hover>
                      <TableCell>
                        {renderMediaPreview(row)}
                      </TableCell>
                      <TableCell>
                        {editingId === (row.id || row._id) ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={edits.url}
                            onChange={(e) => setEdits({ ...edits, url: e.target.value })}
                            sx={{ minWidth: 300 }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={row.url}
                          >
                            {row.url}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === (row.id || row._id) ? (
                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select
                              value={edits.type}
                              onChange={(e) => setEdits({ ...edits, type: e.target.value })}
                            >
                              {MEDIA_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={row.type}
                            size="small"
                            color={getMediaTypeColor(row.type)}
                          />
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

        {/* Add Media Dialog */}
        <Dialog open={addDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Ajouter un nouveau média</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Mode d&apos;ajout</InputLabel>
                <Select
                  value={inputMode}
                  label="Mode d'ajout"
                  onChange={(e) => {
                    setInputMode(e.target.value);
                    setNewItem({ url: '', type: 'IMAGE' });
                    setSelectedFile(null);
                  }}
                >
                  <MenuItem value="url">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Iconify icon="solar:link-bold" />
                      Via URL
                    </Box>
                  </MenuItem>
                  <MenuItem value="upload">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Iconify icon="solar:upload-minimalistic-bold" />
                      Upload de fichier
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              
              {inputMode === 'url' ? (
                <TextField
                  fullWidth
                  label="URL *"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  helperText="URL complète du média"
                />
              ) : (
                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Iconify icon="solar:upload-minimalistic-bold" />}
                    disabled={uploading}
                    fullWidth
                  >
                    {selectedFile ? selectedFile.name : 'Choisir un fichier'}
                    <input
                      type="file"
                      hidden
                      accept={getAcceptType(newItem.type)}
                      onChange={handleFileChange}
                    />
                  </Button>
                  {selectedFile && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Fichier sélectionné: {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Taille: {formatFileSize(selectedFile.size)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        L&apos;upload se fera automatiquement lors de la validation du formulaire
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              <FormControl fullWidth required>
                <InputLabel>Type de média *</InputLabel>
                <Select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                  label="Type de média *"
                  disabled={inputMode === 'upload' && selectedFile}
                >
                  {MEDIA_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>Annuler</Button>
            <Button
              onClick={handleAdd}
              variant="contained"
              disabled={
                (inputMode === 'url' && !newItem.url) ||
                (inputMode === 'upload' && !selectedFile) ||
                !newItem.type ||
                uploading
              }
              startIcon={uploading ? <CircularProgress size={20} /> : <Iconify icon="eva:plus-fill" />}
            >
              {uploading ? 'Upload en cours...' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDeleteDialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Supprimer le média"
          message="Êtes-vous sûr de vouloir supprimer ce média ? Cette action est irréversible."
          loading={deleteDialog.loading}
        />
      </Container>
    </>
  );
}

