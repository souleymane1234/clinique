import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Tab,
  Card,
  Grid,
  Chip,
  Tabs,
  List,
  Stack,
  Table,
  Button,
  Select,
  Dialog,
  Divider,
  Tooltip,
  MenuItem,
  TableRow,
  ListItem,
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
  Autocomplete,
  ListItemText,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
  ListItemSecondaryAction,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'categories', label: 'Catégories', icon: 'eva:folder-outline' },
  { value: 'tags', label: 'Tags', icon: 'eva:hash-outline' },
  { value: 'job-sheets', label: 'Fiches Métiers', icon: 'eva:file-text-outline' },
];

export default function AdminJobSheetsView() {
  const navigate = useNavigate();
  const { showApiResponse } = useNotification();
  const [currentTab, setCurrentTab] = useState('categories');
  const [loading, setLoading] = useState(false);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryRowsPerPage, setCategoryRowsPerPage] = useState(10);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategory, setEditCategory] = useState({ name: '' });
  const [categoryStats, setCategoryStats] = useState(null);
  const [categoryDialog, setCategoryDialog] = useState({ open: false, isEdit: false, editingId: null });

  // Tags state
  const [tags, setTags] = useState([]);
  const [tagPage, setTagPage] = useState(0);
  const [tagRowsPerPage, setTagRowsPerPage] = useState(10);
  const [tagTotal, setTagTotal] = useState(0);
  const [tagSearch, setTagSearch] = useState('');
  const [newTag, setNewTag] = useState({ name: '' });
  const [editingTagId, setEditingTagId] = useState(null);
  const [editTag, setEditTag] = useState({ name: '' });
  const [tagStats, setTagStats] = useState(null);
  const [tagDialog, setTagDialog] = useState({ open: false, isEdit: false, editingId: null });

  // Job Sheets state
  const [jobSheets, setJobSheets] = useState([]);
  const [jobSheetPage, setJobSheetPage] = useState(0);
  const [jobSheetRowsPerPage, setJobSheetRowsPerPage] = useState(10);
  const [jobSheetTotal, setJobSheetTotal] = useState(0);
  const [jobSheetFilters, setJobSheetFilters] = useState({ search: '', categoryId: '', premiumRequired: null });
  const [jobSheetStats, setJobSheetStats] = useState(null);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [schoolDialog, setSchoolDialog] = useState({ open: false, jobSheetId: null, jobSheetTitle: '' });
  const [associatedSchools, setAssociatedSchools] = useState([]);
  const [selectedSchoolsForAssociation, setSelectedSchoolsForAssociation] = useState([]);


  // ========== CATEGORIES ==========
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getJobSheetCategories({
        page: categoryPage + 1,
        limit: categoryRowsPerPage,
        search: categorySearch || undefined,
      });
      if (result.success) {
        setCategories(result.data?.data || []);
        setCategoryTotal(result.data?.meta?.total || 0);
      } else {
        showApiResponse(result, { errorTitle: 'Erreur de chargement' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const result = await ConsumApi.getJobSheetCategoriesStats();
      if (result.success) {
        setCategoryStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  useEffect(() => {
    if (currentTab === 'categories') {
      fetchCategories();
      fetchCategoryStats();
    }
  }, [categoryPage, categoryRowsPerPage, categorySearch, currentTab]);

  const handleOpenCategoryDialog = (category = null) => {
    if (category) {
      setCategoryDialog({ open: true, isEdit: true, editingId: category.id || category._id });
      setNewCategory({ name: category.name || '' });
    } else {
      setCategoryDialog({ open: true, isEdit: false, editingId: null });
      setNewCategory({ name: '' });
    }
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialog({ open: false, isEdit: false, editingId: null });
    setNewCategory({ name: '' });
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      showApiResponse({ success: false, message: 'Le nom de la catégorie est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }
    const res = await ConsumApi.createJobSheetCategory(newCategory);
    showApiResponse(res);
    if (res.success) {
      handleCloseCategoryDialog();
      fetchCategories();
      fetchCategoryStats();
    }
  };

  const handleUpdateCategory = async () => {
    if (!newCategory.name.trim()) {
      showApiResponse({ success: false, message: 'Le nom de la catégorie est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }
    const res = await ConsumApi.updateJobSheetCategory(categoryDialog.editingId, newCategory);
    showApiResponse(res);
    if (res.success) {
      handleCloseCategoryDialog();
      fetchCategories();
      fetchCategoryStats();
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      const res = await ConsumApi.deleteJobSheetCategory(id);
      showApiResponse(res);
      if (res.success) {
        fetchCategories();
        fetchCategoryStats();
      }
    }
  };

  const startEditCategory = (category) => {
    setEditingCategoryId(category.id || category._id);
    setEditCategory({ name: category.name || '' });
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditCategory({ name: '' });
  };

  // ========== TAGS ==========
  const fetchTags = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getJobSheetTags({
        page: tagPage + 1,
        limit: tagRowsPerPage,
        search: tagSearch || undefined,
      });
      if (result.success) {
        setTags(result.data?.data || []);
        setTagTotal(result.data?.meta?.total || 0);
      } else {
        showApiResponse(result, { errorTitle: 'Erreur de chargement' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTagStats = async () => {
    try {
      const result = await ConsumApi.getJobSheetTagsStats();
      if (result.success) {
        setTagStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching tag stats:', error);
    }
  };

  useEffect(() => {
    if (currentTab === 'tags') {
      fetchTags();
      fetchTagStats();
    }
  }, [tagPage, tagRowsPerPage, tagSearch, currentTab]);

  const handleOpenTagDialog = (tag = null) => {
    if (tag) {
      setTagDialog({ open: true, isEdit: true, editingId: tag.id || tag._id });
      setNewTag({ name: tag.name || '' });
    } else {
      setTagDialog({ open: true, isEdit: false, editingId: null });
      setNewTag({ name: '' });
    }
  };

  const handleCloseTagDialog = () => {
    setTagDialog({ open: false, isEdit: false, editingId: null });
    setNewTag({ name: '' });
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      showApiResponse({ success: false, message: 'Le nom du tag est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }
    const res = await ConsumApi.createJobSheetTag(newTag);
    showApiResponse(res);
    if (res.success) {
      handleCloseTagDialog();
      fetchTags();
      fetchTagStats();
    }
  };

  const handleUpdateTag = async () => {
    if (!newTag.name.trim()) {
      showApiResponse({ success: false, message: 'Le nom du tag est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }
    const res = await ConsumApi.updateJobSheetTag(tagDialog.editingId, newTag);
    showApiResponse(res);
    if (res.success) {
      handleCloseTagDialog();
      fetchTags();
      fetchTagStats();
    }
  };

  const handleDeleteTag = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) {
      const res = await ConsumApi.deleteJobSheetTag(id);
      showApiResponse(res);
      if (res.success) {
        fetchTags();
        fetchTagStats();
      }
    }
  };

  const startEditTag = (tag) => {
    setEditingTagId(tag.id || tag._id);
    setEditTag({ name: tag.name || '' });
  };

  const cancelEditTag = () => {
    setEditingTagId(null);
    setEditTag({ name: '' });
  };

  // ========== JOB SHEETS ==========
  const fetchJobSheets = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getJobSheets({
        page: jobSheetPage + 1,
        limit: jobSheetRowsPerPage,
        search: jobSheetFilters.search || undefined,
        categoryId: jobSheetFilters.categoryId || undefined,
        premiumRequired: jobSheetFilters.premiumRequired !== null ? jobSheetFilters.premiumRequired : undefined,
      });
      if (result.success) {
        setJobSheets(result.data?.data || []);
        setJobSheetTotal(result.data?.meta?.total || 0);
      } else {
        showApiResponse(result, { errorTitle: 'Erreur de chargement' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchJobSheetStats = async () => {
    try {
      const result = await ConsumApi.getJobSheetsStats();
      if (result.success) {
        setJobSheetStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching job sheet stats:', error);
    }
  };


  const fetchAvailableSchools = async () => {
    try {
      const result = await ConsumApi.getSchools({ page: 1, limit: 100 });
      if (result.success) {
        setAvailableSchools(result.data?.schools || []);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchAssociatedSchools = async (jobSheetId) => {
    try {
      const result = await ConsumApi.getJobSheetSchools(jobSheetId);
      if (result.success) {
        setAssociatedSchools(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('Error fetching associated schools:', error);
      setAssociatedSchools([]);
    }
  };

  const handleOpenSchoolDialog = async (jobSheet) => {
    const jobSheetId = jobSheet.id || jobSheet._id;
    setSchoolDialog({ open: true, jobSheetId, jobSheetTitle: jobSheet.title || '' });
    setSelectedSchoolsForAssociation([]);
    await fetchAssociatedSchools(jobSheetId);
    if (availableSchools.length === 0) {
      await fetchAvailableSchools();
    }
  };

  const handleCloseSchoolDialog = () => {
    setSchoolDialog({ open: false, jobSheetId: null, jobSheetTitle: '' });
    setAssociatedSchools([]);
    setSelectedSchoolsForAssociation([]);
  };

  const handleBulkAssociateSchools = async () => {
    if (!schoolDialog.jobSheetId || selectedSchoolsForAssociation.length === 0) return;
    const res = await ConsumApi.bulkAssociateJobSheetSchools(schoolDialog.jobSheetId, {
      schoolIds: selectedSchoolsForAssociation,
    });
    showApiResponse(res);
    if (res.success) {
      setSelectedSchoolsForAssociation([]);
      await fetchAssociatedSchools(schoolDialog.jobSheetId);
      fetchJobSheets();
    }
  };

  const handleRemoveSchool = async (schoolId) => {
    if (!schoolDialog.jobSheetId) return;
    if (window.confirm('Êtes-vous sûr de vouloir dissocier cette école ?')) {
      const res = await ConsumApi.removeJobSheetSchool(schoolDialog.jobSheetId, schoolId);
      showApiResponse(res);
      if (res.success) {
        await fetchAssociatedSchools(schoolDialog.jobSheetId);
        fetchJobSheets();
      }
    }
  };

  useEffect(() => {
    if (currentTab === 'job-sheets') {
      fetchJobSheets();
      fetchJobSheetStats();
      fetchAvailableSchools();
      // Also fetch categories for filters
      if (categories.length === 0) {
        ConsumApi.getJobSheetCategories({ page: 1, limit: 100 }).then((result) => {
          if (result.success) {
            setCategories(result.data?.data || []);
          }
        });
      }
    }
  }, [jobSheetPage, jobSheetRowsPerPage, jobSheetFilters, currentTab]);

  // Navigation handlers instead of form handlers
  const handleCreateJobSheet = () => {
    navigate(routesName.adminJobSheetCreate);
  };

  const handleEditJobSheet = (jobSheet) => {
    const jobSheetId = jobSheet.id || jobSheet._id;
    navigate(routesName.adminJobSheetEdit.replace(':id', jobSheetId));
  };

  const handleDeleteJobSheet = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche métier ?')) {
      const res = await ConsumApi.deleteJobSheet(id);
      showApiResponse(res);
      if (res.success) {
        fetchJobSheets();
        fetchJobSheetStats();
      }
    }
  };


  // Render Categories Tab
  const renderCategoriesTab = () => (
    <>
      {categoryStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {categoryStats.totalCategories || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Catégories
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={9}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Catégorie la plus populaire
              </Typography>
              <Typography variant="h6">{categoryStats.mostPopularCategory || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {categoryStats.mostPopularCount || 0} fiches
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => handleOpenCategoryDialog()}
          >
            Ajouter une nouvelle catégorie
          </Button>
        </Box>
      </Card>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Rechercher une catégorie..."
            value={categorySearch}
            onChange={(e) => {
              setCategorySearch(e.target.value);
              setCategoryPage(0);
            }}
            InputProps={{
              startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
            }}
          />
        </Box>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Nombre de fiches</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucune catégorie enregistrée
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id || category._id} hover>
                    <TableCell>
                      {editingCategoryId === (category.id || category._id) ? (
                        <TextField
                          size="small"
                          value={editCategory.name}
                          onChange={(e) => setEditCategory({ name: e.target.value })}
                          sx={{ minWidth: 250 }}
                        />
                      ) : (
                        <Typography variant="subtitle2">{category.name}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={category.fichesCount || 0} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      {editingCategoryId === (category.id || category._id) ? (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton color="primary" size="small" onClick={handleUpdateCategory}>
                            <Iconify icon="eva:checkmark-fill" />
                          </IconButton>
                          <IconButton size="small" onClick={cancelEditCategory}>
                            <Iconify icon="eva:close-fill" />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => startEditCategory(category)}>
                            <Iconify icon="eva:edit-fill" />
                          </IconButton>
                          <IconButton color="error" size="small" onClick={() => handleDeleteCategory(category.id || category._id)}>
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={categoryTotal}
          rowsPerPage={categoryRowsPerPage}
          page={categoryPage}
          onPageChange={(e, newPage) => setCategoryPage(newPage)}
          onRowsPerPageChange={(e) => {
            setCategoryPage(0);
            setCategoryRowsPerPage(parseInt(e.target.value, 10));
          }}
        />
      </Card>
    </>
  );

  // Render Tags Tab
  const renderTagsTab = () => (
    <>
      {tagStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {tagStats.totalTags || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tags
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={9}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Tag le plus utilisé
              </Typography>
              <Typography variant="h6">{tagStats.mostUsedTag || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {tagStats.mostUsedCount || 0} fiches
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => handleOpenTagDialog()}
          >
            Ajouter un nouveau tag
          </Button>
        </Box>
      </Card>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Rechercher un tag..."
            value={tagSearch}
            onChange={(e) => {
              setTagSearch(e.target.value);
              setTagPage(0);
            }}
            InputProps={{
              startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
            }}
          />
        </Box>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Nombre de fiches</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucun tag enregistré
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tags.map((tag) => (
                  <TableRow key={tag.id || tag._id} hover>
                    <TableCell>
                      {editingTagId === (tag.id || tag._id) ? (
                        <TextField
                          size="small"
                          value={editTag.name}
                          onChange={(e) => setEditTag({ name: e.target.value })}
                          sx={{ minWidth: 250 }}
                        />
                      ) : (
                        <Chip label={tag.name} size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={tag.fichesCount || 0} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      {editingTagId === (tag.id || tag._id) ? (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton color="primary" size="small" onClick={handleUpdateTag}>
                            <Iconify icon="eva:checkmark-fill" />
                          </IconButton>
                          <IconButton size="small" onClick={cancelEditTag}>
                            <Iconify icon="eva:close-fill" />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => startEditTag(tag)}>
                            <Iconify icon="eva:edit-fill" />
                          </IconButton>
                          <IconButton color="error" size="small" onClick={() => handleDeleteTag(tag.id || tag._id)}>
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tagTotal}
          rowsPerPage={tagRowsPerPage}
          page={tagPage}
          onPageChange={(e, newPage) => setTagPage(newPage)}
          onRowsPerPageChange={(e) => {
            setTagPage(0);
            setTagRowsPerPage(parseInt(e.target.value, 10));
          }}
        />
      </Card>
    </>
  );

  // Render Job Sheets Tab
  const renderJobSheetsTab = () => (
    <>
      {jobSheetStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {jobSheetStats.totalJobSheets || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Fiches
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {jobSheetStats.premiumJobSheets || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fiches Premium
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {jobSheetStats.publicJobSheets || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fiches Publiques
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Catégorie populaire
              </Typography>
              <Typography variant="body2">{jobSheetStats.mostPopularCategory || '-'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {jobSheetStats.mostPopularCategoryCount || 0} fiches
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleCreateJobSheet}
          >
            Créer une nouvelle fiche métier
          </Button>
        </Box>
      </Card>


      <Card sx={{ mb: 3 }}>
        <Grid container spacing={2} sx={{ p: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher..."
              value={jobSheetFilters.search}
              onChange={(e) => {
                setJobSheetFilters({ ...jobSheetFilters, search: e.target.value });
                setJobSheetPage(0);
              }}
              InputProps={{
                startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={jobSheetFilters.categoryId}
                onChange={(e) => {
                  setJobSheetFilters({ ...jobSheetFilters, categoryId: e.target.value });
                  setJobSheetPage(0);
                }}
                label="Catégorie"
              >
                <MenuItem value="">Toutes</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Premium</InputLabel>
              <Select
                value={
                  (() => {
                    if (jobSheetFilters.premiumRequired === null) return '';
                    return jobSheetFilters.premiumRequired ? 'true' : 'false';
                  })()
                }
                onChange={(e) => {
                  const value = e.target.value === '' ? null : e.target.value === 'true';
                  setJobSheetFilters({ ...jobSheetFilters, premiumRequired: value });
                  setJobSheetPage(0);
                }}
                label="Premium"
              >
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="true">Premium uniquement</MenuItem>
                <MenuItem value="false">Publiques uniquement</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Titre</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Écoles</TableCell>
                <TableCell>Premium</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobSheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucune fiche métier enregistrée
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                jobSheets.map((jobSheet) => (
                  <TableRow key={jobSheet.id || jobSheet._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{jobSheet.title}</Typography>
                    </TableCell>
                    <TableCell>
                      {jobSheet.category && <Chip label={jobSheet.category.name} size="small" />}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {(jobSheet.tags || []).slice(0, 3).map((tag, idx) => (
                          <Chip key={idx} label={tag.name || tag} size="small" variant="outlined" />
                        ))}
                        {(jobSheet.tags || []).length > 3 && (
                          <Chip label={`+${(jobSheet.tags || []).length - 3}`} size="small" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                        {(jobSheet.schools || []).slice(0, 2).map((school, idx) => (
                          <Chip
                            key={idx}
                            label={school.schoolName || school.name || school}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                        {(jobSheet.schools || []).length > 2 && (
                          <Chip label={`+${(jobSheet.schools || []).length - 2}`} size="small" />
                        )}
                        {(jobSheet.schools || []).length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Aucune
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {jobSheet.premiumRequired ? (
                        <Chip label="Premium" size="small" color="warning" />
                      ) : (
                        <Chip label="Publique" size="small" color="success" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Gérer les écoles">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenSchoolDialog(jobSheet)}
                          >
                            <Iconify icon="eva:home-fill" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => handleEditJobSheet(jobSheet)}>
                          <Iconify icon="eva:edit-fill" />
                        </IconButton>
                        <IconButton color="error" size="small" onClick={() => handleDeleteJobSheet(jobSheet.id || jobSheet._id)}>
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={jobSheetTotal}
          rowsPerPage={jobSheetRowsPerPage}
          page={jobSheetPage}
          onPageChange={(e, newPage) => setJobSheetPage(newPage)}
          onRowsPerPageChange={(e) => {
            setJobSheetPage(0);
            setJobSheetRowsPerPage(parseInt(e.target.value, 10));
          }}
        />
      </Card>
    </>
  );

  return (
    <>
      <Helmet>
        <title> Gestion Fiches Métiers | AnnourTravel </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Gestion Fiches Métiers</Typography>
          <Button variant="outlined" startIcon={<Iconify icon="eva:refresh-fill" />} onClick={() => {
            if (currentTab === 'categories') fetchCategories();
            else if (currentTab === 'tags') fetchTags();
            else if (currentTab === 'job-sheets') fetchJobSheets();
          }} disabled={loading}>
            Actualiser
          </Button>
        </Stack>

        <Card sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ px: 2.5, pt: 1 }}>
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={<Iconify icon={tab.icon} />}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Card>

        {currentTab === 'categories' && renderCategoriesTab()}
        {currentTab === 'tags' && renderTagsTab()}
        {currentTab === 'job-sheets' && renderJobSheetsTab()}

        {/* Category Dialog */}
        <Dialog open={categoryDialog.open} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {categoryDialog.isEdit ? 'Modifier la catégorie' : 'Ajouter une nouvelle catégorie'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Nom de la catégorie *"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ name: e.target.value })}
                placeholder="Ex: Informatique"
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCategoryDialog}>Annuler</Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon={categoryDialog.isEdit ? 'eva:checkmark-fill' : 'eva:plus-fill'} />}
              onClick={categoryDialog.isEdit ? handleUpdateCategory : handleCreateCategory}
              disabled={loading || !newCategory.name.trim()}
            >
              {categoryDialog.isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Tag Dialog */}
        <Dialog open={tagDialog.open} onClose={handleCloseTagDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {tagDialog.isEdit ? 'Modifier le tag' : 'Ajouter un nouveau tag'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Nom du tag *"
                value={newTag.name}
                onChange={(e) => setNewTag({ name: e.target.value })}
                placeholder="Ex: développement web"
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTagDialog}>Annuler</Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon={tagDialog.isEdit ? 'eva:checkmark-fill' : 'eva:plus-fill'} />}
              onClick={tagDialog.isEdit ? handleUpdateTag : handleCreateTag}
              disabled={loading || !newTag.name.trim()}
            >
              {tagDialog.isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* School Association Dialog */}
        <Dialog open={schoolDialog.open} onClose={handleCloseSchoolDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="eva:home-fill" />
              <Typography variant="h6">Gérer les écoles associées</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {schoolDialog.jobSheetTitle}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Écoles associées ({associatedSchools.length})
                </Typography>
                {associatedSchools.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aucune école associée
                  </Typography>
                ) : (
                  <List>
                    {associatedSchools.map((association, index) => (
                      <Box key={association.id || association.schoolId || index}>
                        <ListItem>
                          <ListItemText
                            primary={association.schoolName || 'École sans nom'}
                            secondary={association.schoolCity ? `Ville: ${association.schoolCity}` : ''}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              size="small"
                              color="error"
                              onClick={() => handleRemoveSchool(association.schoolId || association.id)}
                            >
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < associatedSchools.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                )}
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Associer de nouvelles écoles
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={availableSchools.filter(
                    (school) =>
                      !associatedSchools.some(
                        (as) => (as.schoolId || as.id) === (school.id || school._id)
                      )
                  )}
                  getOptionLabel={(option) => option.name || option}
                  value={availableSchools.filter((s) =>
                    selectedSchoolsForAssociation.includes(s.id || s._id)
                  )}
                  onChange={(event, newValue) => {
                    const schoolIds = newValue.map((s) => s.id || s._id);
                    setSelectedSchoolsForAssociation(schoolIds);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Sélectionner des écoles"
                      placeholder="Choisissez les écoles à associer"
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
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="eva:plus-fill" />}
                    onClick={handleBulkAssociateSchools}
                    disabled={selectedSchoolsForAssociation.length === 0}
                  >
                    Associer les écoles sélectionnées
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSchoolDialog}>Fermer</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

