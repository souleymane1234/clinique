import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Select,
  Checkbox,
  MenuItem,
  Container,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  Autocomplete,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function JobSheetFormView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { showApiResponse } = useNotification();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableSchools, setAvailableSchools] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    tagNames: [],
    schoolIds: [],
    premiumRequired: false,
  });

  useEffect(() => {
    loadInitialData();
    if (isEdit) {
      loadJobSheet();
    }
  }, [id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [categoriesResult, tagsResult, schoolsResult] = await Promise.all([
        ConsumApi.getJobSheetCategories({ page: 1, limit: 100 }),
        ConsumApi.getJobSheetTags({ page: 1, limit: 100 }),
        ConsumApi.getSchools({ page: 1, limit: 100 }),
      ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data?.data || []);
      }
      if (tagsResult.success) {
        setAvailableTags(tagsResult.data?.data || []);
      }
      if (schoolsResult.success) {
        setAvailableSchools(schoolsResult.data?.schools || []);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobSheet = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getJobSheetById(id);
      if (result.success) {
        const jobSheet = result.data;
        setFormData({
          title: jobSheet.title || '',
          description: jobSheet.description || '',
          categoryId: jobSheet.category?.id || jobSheet.categoryId || '',
          tagNames: (jobSheet.tags || []).map((t) => t.name || t),
          schoolIds: (jobSheet.schools || []).map((s) => s.schoolId || s.id || s),
          premiumRequired: jobSheet.premiumRequired || false,
        });
      } else {
        showApiResponse(result, { errorTitle: 'Erreur de chargement' });
        navigate(routesName.adminJobSheets);
      }
    } catch (err) {
      console.error('Error loading job sheet:', err);
      showApiResponse({ success: false, message: 'Erreur lors du chargement de la fiche métier' }, { errorTitle: 'Erreur' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = field === 'premiumRequired' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (event, newValue) => {
    setFormData((prev) => ({ ...prev, tagNames: newValue }));
  };

  const handleSchoolsChange = (event, newValue) => {
    const schoolIds = newValue.map((s) => s.id || s._id);
    setFormData((prev) => ({ ...prev, schoolIds }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.categoryId) {
      showApiResponse(
        { success: false, message: 'Le titre et la catégorie sont obligatoires' },
        { errorTitle: 'Validation' }
      );
      return;
    }

    setSaving(true);
    try {
      const result = isEdit
        ? await ConsumApi.updateJobSheet(id, formData)
        : await ConsumApi.createJobSheet(formData);

      showApiResponse(result);
      if (result.success) {
        navigate(routesName.adminJobSheets);
      }
    } catch (err) {
      console.error('Error saving job sheet:', err);
      showApiResponse(
        { success: false, message: 'Erreur lors de l\'enregistrement' },
        { errorTitle: 'Erreur' }
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title> {isEdit ? 'Modifier' : 'Créer'} Fiche Métier | AnnourTravel </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">{isEdit ? 'Modifier la fiche métier' : 'Créer une nouvelle fiche métier'}</Typography>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={() => navigate(routesName.adminJobSheets)}
          >
            Retour
          </Button>
        </Stack>

        <Card>
          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Titre *"
                value={formData.title}
                onChange={handleChange('title')}
                placeholder="Ex: Développeur Full-Stack"
                helperText="Titre de la fiche métier"
              />
              <FormControl fullWidth>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={formData.categoryId}
                  onChange={handleChange('categoryId')}
                  label="Catégorie *"
                >
                  <MenuItem value="">Sélectionner une catégorie</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Description de la fiche métier..."
                helperText="Description complète du métier, ses missions, compétences requises, etc."
              />
              <Autocomplete
                multiple
                options={availableTags.map((tag) => tag.name)}
                value={formData.tagNames}
                onChange={handleTagsChange}
                renderInput={(params) => (
                  <TextField {...params} label="Tags" placeholder="Sélectionner des tags" helperText="Tags associés à cette fiche métier" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip {...getTagProps({ index })} key={option} label={option} size="small" />
                  ))
                }
              />
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox checked={formData.premiumRequired} onChange={handleChange('premiumRequired')} />
                  }
                  label="Fiche premium requise"
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  Les fiches premium sont accessibles uniquement aux utilisateurs premium
                </Typography>
              </Box>
              <Autocomplete
                multiple
                options={availableSchools}
                getOptionLabel={(option) => option.name || option}
                value={availableSchools.filter((s) => formData.schoolIds.includes(s.id || s._id))}
                onChange={handleSchoolsChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Écoles associées"
                    placeholder="Sélectionner des écoles"
                    helperText="Écoles qui proposent des formations pour ce métier"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id || option._id || index}
                      label={option.name || option}
                      size="small"
                    />
                  ))
                }
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => navigate(routesName.adminJobSheets)}>
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon={isEdit ? 'eva:checkmark-fill' : 'eva:plus-fill'} />}
                  onClick={handleSubmit}
                  disabled={saving || !formData.title.trim() || !formData.categoryId}
                >
                  {(() => {
                    if (saving) return 'Enregistrement...';
                    return isEdit ? 'Enregistrer' : 'Créer';
                  })()}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Card>
      </Container>
    </>
  );
}

