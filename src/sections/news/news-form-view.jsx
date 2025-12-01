import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useNotification } from 'src/hooks/useNotification';

import { uploadImage, formatFileSize } from 'src/utils/upload-media';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';
import { AdminStorage } from 'src/storages/admins_storage';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function NewsFormView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [mainImageMode, setMainImageMode] = useState('url'); // 'url' or 'upload'
  const [selectedMainImageFile, setSelectedMainImageFile] = useState(null);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState(null);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mainImage: '',
    author: '',
    sourceUrl: '',
    slug: '',
    summary: '',
    categoryId: '',
    authorId: '',
    publishedAt: '',
    isPublished: false,
  });

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadNews();
    }
  }, [id]);

  // Nettoyer l'URL de prévisualisation lors du démontage
  useEffect(() => {
    const currentPreviewUrl = mainImagePreviewUrl;
    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [mainImagePreviewUrl]);

  const loadCategories = async () => {
    try {
      const result = await ConsumApi.getNewsCategories();
      if (result.success) {
        setCategories(result.data?.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadNews = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getNewsById(id);
      if (result.success) {
        const newsData = result.data;
        setFormData({
          title: newsData.title || '',
          content: newsData.content || '',
          mainImage: newsData.mainImage || '',
          author: newsData.author || '',
          sourceUrl: newsData.sourceUrl || '',
          slug: newsData.slug || '',
          summary: newsData.summary || '',
          categoryId: newsData.categoryId || '',
          authorId: newsData.authorId || '',
          publishedAt: newsData.publishedAt ? new Date(newsData.publishedAt).toISOString().slice(0, 16) : '',
          isPublished: newsData.isPublished || false,
        });
      }
    } catch (err) {
      console.error('Error loading news:', err);
      showError('Erreur', 'Erreur lors du chargement de l\'actualité');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = field === 'isPublished' ? event.target.checked : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from title
    if (field === 'title' && !isEdit) {
      const slug = event.target.value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData((prev) => ({
        ...prev,
        slug,
      }));
    }
  };

  const handleMainImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        showError('Format invalide', 'Veuillez sélectionner un fichier image');
        return;
      }
      
      // Nettoyer l'ancienne URL de prévisualisation si elle existe
      if (mainImagePreviewUrl) {
        URL.revokeObjectURL(mainImagePreviewUrl);
      }
      
      // Créer une nouvelle URL de prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setMainImagePreviewUrl(previewUrl);
      setSelectedMainImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalMainImage = formData.mainImage;

      // Si un fichier image principale est sélectionné, on doit d'abord l'uploader
      if (mainImageMode === 'upload' && selectedMainImageFile) {
        setUploadingMainImage(true);
        try {
          const uploadResult = await uploadImage(selectedMainImageFile);
          
          if (!uploadResult.success) {
            showApiResponse(uploadResult, {
              errorTitle: 'Erreur d\'upload de l\'image principale',
            });
            setUploadingMainImage(false);
            setSaving(false);
            return;
          }
          
          if (!uploadResult.url) {
            showError('Erreur d\'upload', 'L\'URL de l\'image principale n\'a pas été retournée');
            setUploadingMainImage(false);
            setSaving(false);
            return;
          }

          // Utiliser l'URL retournée par l'upload
          finalMainImage = uploadResult.url;
        } catch (error) {
          console.error('Error uploading main image:', error);
          showError('Erreur d\'upload', 'Une erreur est survenue lors de l\'upload de l\'image principale');
          setUploadingMainImage(false);
          setSaving(false);
          return;
        } finally {
          setUploadingMainImage(false);
        }
      }

      // Get current user info
      const adminInfo = AdminStorage.getInfoAdmin();
      
      const payload = {
        ...formData,
        mainImage: finalMainImage,
        authorId: adminInfo?.id || formData.authorId,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : undefined,
      };

      let result;
      if (isEdit) {
        result = await ConsumApi.updateNews(id, payload);
        showApiResponse(result, {
          successTitle: 'Actualité modifiée',
          errorTitle: 'Erreur de modification',
        });
      } else {
        result = await ConsumApi.createNews(payload);
        showApiResponse(result, {
          successTitle: 'Actualité créée',
          errorTitle: 'Erreur de création',
        });
      }

      if (result.success) {
        // Nettoyer l'URL de prévisualisation si elle existe
        if (mainImagePreviewUrl) {
          URL.revokeObjectURL(mainImagePreviewUrl);
          setMainImagePreviewUrl(null);
        }
        setSelectedMainImageFile(null);
        navigate(routesName.adminNews);
      }
    } catch (err) {
      console.error('Error saving news:', err);
      showError('Erreur', 'Erreur lors de l\'enregistrement de l\'actualité');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }


  return (
    <>
      {contextHolder}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">
            {isEdit ? 'Modifier l\'actualité' : 'Créer une actualité'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {isEdit ? 'Modifiez les informations de l\'actualité' : 'Remplissez le formulaire pour créer une nouvelle actualité'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
          onClick={() => navigate(routesName.adminNews)}
        >
          Retour
        </Button>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Informations générales
            </Typography>

            <Stack spacing={3}>
              <TextField
                fullWidth
                required
                label="Titre"
                value={formData.title}
                onChange={handleChange('title')}
                placeholder="Ex: Nouvelle bourse d'études disponible"
              />

              <TextField
                fullWidth
                required
                label="Résumé"
                value={formData.summary}
                onChange={handleChange('summary')}
                multiline
                rows={2}
                placeholder="Bref résumé de l'actualité..."
              />

              <TextField
                fullWidth
                required
                label="Contenu"
                value={formData.content}
                onChange={handleChange('content')}
                multiline
                rows={8}
                placeholder="Contenu complet de l'actualité..."
              />

              <TextField
                fullWidth
                label="Slug"
                value={formData.slug}
                onChange={handleChange('slug')}
                placeholder="nouvelle-bourse-etudes-2024"
                helperText="URL-friendly identifier (généré automatiquement depuis le titre)"
              />
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Médias et sources
            </Typography>

            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Image principale
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Mode d&apos;ajout</InputLabel>
                  <Select
                    value={mainImageMode}
                    label="Mode d'ajout"
                    onChange={(e) => {
                      setMainImageMode(e.target.value);
                      setFormData({ ...formData, mainImage: '' });
                      setSelectedMainImageFile(null);
                      if (mainImagePreviewUrl) {
                        URL.revokeObjectURL(mainImagePreviewUrl);
                        setMainImagePreviewUrl(null);
                      }
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

                {mainImageMode === 'url' ? (
                  <TextField
                    fullWidth
                    label="URL de l'image principale"
                    value={formData.mainImage}
                    onChange={handleChange('mainImage')}
                    placeholder="https://example.com/image.jpg"
                    helperText="Entrez l'URL complète de l'image"
                  />
                ) : (
                  <Box>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Iconify icon="solar:upload-minimalistic-bold" />}
                      disabled={uploadingMainImage}
                      fullWidth
                    >
                      {selectedMainImageFile ? selectedMainImageFile.name : 'Choisir une image'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleMainImageFileChange}
                      />
                    </Button>
                    {selectedMainImageFile && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box
                            component="img"
                            src={mainImagePreviewUrl}
                            alt="Preview"
                            sx={{
                              width: 100,
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {selectedMainImageFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Taille: {formatFileSize(selectedMainImageFile.size)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              L&apos;upload se fera automatiquement lors de l&apos;enregistrement
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )}
                    {formData.mainImage && !selectedMainImageFile && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Image actuelle:
                        </Typography>
                        <Box
                          component="img"
                          src={formData.mainImage}
                          alt="Current image"
                          sx={{
                            maxWidth: 200,
                            maxHeight: 200,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              <TextField
                fullWidth
                label="Source (URL)"
                value={formData.sourceUrl}
                onChange={handleChange('sourceUrl')}
                placeholder="https://example.com/source"
              />
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Classification et publication
            </Typography>

            <Stack spacing={3}>
              <FormControl fullWidth required>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={formData.categoryId}
                  label="Catégorie"
                  onChange={handleChange('categoryId')}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Auteur"
                value={formData.author}
                onChange={handleChange('author')}
                placeholder="Nom de l'auteur"
              />

              <TextField
                fullWidth
                label="Date de publication"
                type="datetime-local"
                value={formData.publishedAt}
                onChange={handleChange('publishedAt')}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Laissez vide pour publier immédiatement"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublished}
                    onChange={handleChange('isPublished')}
                  />
                }
                label="Publier l'actualité"
              />
            </Stack>
          </Card>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              size="large"
              variant="outlined"
              onClick={() => navigate(routesName.adminNews)}
            >
              Annuler
            </Button>
            <Button
              size="large"
              type="submit"
              variant="contained"
              disabled={saving || uploadingMainImage}
              startIcon={saving || uploadingMainImage ? <CircularProgress size={20} /> : <Iconify icon="eva:save-fill" />}
            >
              {(() => {
                if (uploadingMainImage) return 'Upload en cours...';
                if (saving) return 'Enregistrement...';
                if (isEdit) return 'Mettre à jour';
                return 'Créer';
              })()}
            </Button>
          </Box>
        </Stack>
      </form>
    </>
  );
}

