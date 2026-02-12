import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { RouterLink } from 'src/routes/components';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { ConfirmDeleteDialog, ConfirmActionDialog } from 'src/components/confirm-dialog';

// ----------------------------------------------------------------------

export default function AdminNewsView() {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, news: null, loading: false });
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', news: null, loading: false });

  const loadCategories = async () => {
    try {
      const result = await ConsumApi.getNewsCategories();
      if (result.success) {
        console.log('Categories:', result.data?.data);
        setCategories(result.data?.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadNews = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getNews({
        page: page + 1,
        limit: rowsPerPage,
        isPublished: publishedFilter === 'all' ? undefined : publishedFilter === 'published',
        categoryId: categoryFilter || undefined,
        search: searchTerm || undefined,
      });

      if (result.success) {
        setNews(result.data?.data || []);
        setTotal(result.data?.total || 0);
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadNews();
  }, [page, rowsPerPage, publishedFilter, categoryFilter]);

  const handleSearch = () => {
    setPage(0);
    loadNews();
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = news.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleMenuOpen = (event, newsItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedNews(newsItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNews(null);
  };

  const handleDeleteClick = (newsItem) => {
    setDeleteDialog({ open: true, news: newsItem, loading: false });
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    const { news: newsItem } = deleteDialog;
    setDeleteDialog({ ...deleteDialog, loading: true });
    
    try {
      const result = await ConsumApi.deleteNews(newsItem.id);
      showApiResponse(result, {
        successTitle: 'Actualité supprimée',
        errorTitle: 'Erreur de suppression',
      });

      if (result.success) {
        setDeleteDialog({ open: false, news: null, loading: false });
        loadNews();
      } else {
        setDeleteDialog({ ...deleteDialog, loading: false });
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      showError('Erreur', 'Une erreur est survenue lors de la suppression');
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  const handleDeleteNews = async (id) => {
    const newsItem = news.find(n => n.id === id);
    if (newsItem) {
      handleDeleteClick(newsItem);
    }
  };

  const handleActionClick = (type, newsItem) => {
    setActionDialog({ open: true, type, news: newsItem, loading: false });
  };

  const handleActionConfirm = async () => {
    const { type, news: newsItem } = actionDialog;
    setActionDialog({ ...actionDialog, loading: true });
    
    try {
      let result;
      switch (type) {
        case 'publish':
          result = await ConsumApi.moderateNews(newsItem.id, 'PUBLISH');
          break;
        case 'unpublish':
          result = await ConsumApi.moderateNews(newsItem.id, 'UNPUBLISH');
          break;
        default:
          return;
      }
      
      const actionText = type === 'publish' ? 'publiée' : 'dépubliée';
      showApiResponse(result, {
        successTitle: `Actualité ${actionText}`,
        errorTitle: 'Erreur de modération',
      });
      
      if (result.success) {
        setActionDialog({ open: false, type: '', news: null, loading: false });
        loadNews();
      } else {
        setActionDialog({ ...actionDialog, loading: false });
      }
    } catch (error) {
      console.error('Error moderating news:', error);
      showApiResponse({ 
        success: false, 
        message: 'Erreur lors de la modération' 
      }, {
        errorTitle: 'Erreur'
      });
      setActionDialog({ ...actionDialog, loading: false });
    }
  };

  const getActionMessage = (type, newsItem) => {
    switch (type) {
      case 'publish': return `Êtes-vous sûr de vouloir publier l'actualité "${newsItem.title}" ?`;
      case 'unpublish': return `Êtes-vous sûr de vouloir dépublier l'actualité "${newsItem.title}" ?`;
      default: return 'Êtes-vous sûr de vouloir effectuer cette action ?';
    }
  };

  const getActionTitle = (type) => {
    switch (type) {
      case 'publish': return 'Publier l\'actualité';
      case 'unpublish': return 'Dépublier l\'actualité';
      default: return 'Confirmer l\'action';
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'publish': return 'success';
      case 'unpublish': return 'warning';
      default: return 'primary';
    }
  };

  const getConfirmText = (type) => {
    switch (type) {
      case 'publish': return 'Publier';
      case 'unpublish': return 'Dépublier';
      default: return 'Confirmer';
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'publish': return 'eva:checkmark-circle-2-fill';
      case 'unpublish': return 'eva:close-circle-fill';
      default: return 'eva:settings-2-fill';
    }
  };

  const handleModerateNews = (action) => {
    if (!selectedNews) return;
    const type = action === 'PUBLISH' ? 'publish' : 'unpublish';
    handleActionClick(type, selectedNews);
    handleMenuClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isNotFound = !news.length && !loading;

  return (
    <>
      {contextHolder}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4">Gestion des Actualités</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Créez et gérez les actualités de la plateforme
            </Typography>
          </Box>
           <Box sx={{ display: 'flex', gap: 2 }}>
             <Button
               component={RouterLink}
               href={`${routesName.adminNews}/scheduled`}
               variant="outlined"
               startIcon={<Iconify icon="solar:calendar-bold" />}
             >
               Programmées
             </Button>
             <Button
               component={RouterLink}
               href={routesName.adminNewsCategories}
               variant="outlined"
               startIcon={<Iconify icon="solar:folder-with-files-bold" />}
             >
               Catégories
             </Button>
             <Button
               component={RouterLink}
               href={routesName.adminNewsStats}
               variant="outlined"
               startIcon={<Iconify icon="solar:chart-bold" />}
             >
               Statistiques
             </Button>
             <Button
               component={RouterLink}
               href={routesName.adminNewsCreate}
               variant="contained"
               startIcon={<Iconify icon="solar:add-circle-bold" />}
             >
               Créer une actualité
             </Button>
           </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              sx={{ minWidth: 300 }}
              placeholder="Rechercher par titre ou contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
              }}
            />
            
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Statut de publication</InputLabel>
              <Select
                value={publishedFilter}
                label="Statut de publication"
                onChange={(e) => setPublishedFilter(e.target.value)}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="published">Publiées</MenuItem>
                <MenuItem value="draft">Brouillons</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={categoryFilter}
                label="Catégorie"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">Toutes</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="small"
              onClick={handleSearch}
              startIcon={<Iconify icon="eva:search-fill" />}
              sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
            >
              Rechercher
            </Button>
          </Box>
        </Card>
      </Box>

      <Card>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size="medium" sx={{ minWidth: 1400 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < news.length}
                      checked={news.length > 0 && selected.length === news.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell sx={{ width: '45%' }}>Titre</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Vues</TableCell>
                  <TableCell>Date de publication</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {news.map((newsItem) => (
                  <TableRow
                    hover
                    key={newsItem.id}
                    selected={selected.indexOf(newsItem.id) !== -1}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.indexOf(newsItem.id) !== -1}
                        onChange={(event) => handleClick(event, newsItem.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {newsItem.mainImage && (
                          <Box
                            component="img"
                            src={newsItem.mainImage}
                            sx={{
                              width: 60,
                              height: 45,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                        )}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography 
                            variant="subtitle2" 
                            noWrap 
                            sx={{ 
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={newsItem.title}
                          >
                            {newsItem.title}
                          </Typography>
                          {newsItem.summary && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              noWrap 
                              sx={{ 
                                maxWidth: 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}
                              title={newsItem.summary}
                            >
                              {newsItem.summary}
                            </Typography>
                          )}
                          {newsItem.author && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                display: 'block',
                                mt: 0.5,
                                fontStyle: 'italic'
                              }}
                            >
                              Par {newsItem.author}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      {newsItem.category?.name ? (
                        <Chip label={newsItem.category.name} size="small" color="primary" variant="outlined" />
                      ) : (
                        '-'
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={newsItem.isPublished ? 'Publiée' : 'Brouillon'}
                        size="small"
                        color={newsItem.isPublished ? 'success' : 'default'}
                      />
                    </TableCell>

                    <TableCell>{newsItem.views || 0}</TableCell>

                    <TableCell>{formatDate(newsItem.publishedAt)}</TableCell>

                    <TableCell align="right">
                      <Tooltip title="Modifier">
                        <IconButton
                          component={RouterLink}
                          href={`${routesName.adminNews}/${newsItem.id}/edit`}
                        >
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Plus d'actions">
                        <IconButton onClick={(e) => handleMenuOpen(e, newsItem)}>
                          <Iconify icon="eva:more-vertical-fill" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              {isNotFound && (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 3 }}>
                      <Typography variant="h6" sx={{ textAlign: 'center' }}>
                        Aucune actualité trouvée
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePagination
          page={page}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedNews && !selectedNews.isPublished && (
          <MenuItem onClick={() => handleModerateNews('PUBLISH')}>
            <Iconify icon="solar:check-circle-bold" sx={{ mr: 2 }} />
            Publier
          </MenuItem>
        )}
        {selectedNews && selectedNews.isPublished && (
          <MenuItem onClick={() => handleModerateNews('UNPUBLISH')}>
            <Iconify icon="solar:close-circle-bold" sx={{ mr: 2 }} />
            Dépublier
          </MenuItem>
        )}
        <MenuItem 
          component={RouterLink} 
          href={`${routesName.adminNews}/${selectedNews?.id}/media`}
          onClick={handleMenuClose}
        >
          <Iconify icon="solar:gallery-bold" sx={{ mr: 2 }} />
          Gérer les médias
        </MenuItem>
        <MenuItem 
          onClick={() => selectedNews && handleDeleteNews(selectedNews.id)}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 2 }} />
          Supprimer
        </MenuItem>
      </Menu>

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, news: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'actualité"
        message="Êtes-vous sûr de vouloir supprimer cette actualité ?"
        itemName={deleteDialog.news?.title}
        loading={deleteDialog.loading}
      />

      <ConfirmActionDialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ open: false, type: '', news: null, loading: false })}
        onConfirm={handleActionConfirm}
        title={getActionTitle(actionDialog.type)}
        message={actionDialog.news ? getActionMessage(actionDialog.type, actionDialog.news) : ''}
        itemName={actionDialog.news?.title}
        loading={actionDialog.loading}
        confirmText={getConfirmText(actionDialog.type)}
        confirmColor={getActionColor(actionDialog.type)}
        icon={getActionIcon(actionDialog.type)}
      />
    </>
  );
}

