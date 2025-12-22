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
  TablePagination,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import ConfirmDeleteDialog from 'src/components/confirm-dialog/confirm-delete-dialog';

export default function EcoleFormationsView() {
  const { contextHolder, showApiResponse } = useNotification();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState([]);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({ programName: '', description: '', niveau: '', duree: '', diplomeObtenu: '', niveauId: '' });
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, loading: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getEcoleFormations({ page: page + 1, limit: rowsPerPage });
      if (result.success) {
        const { formations = [], total: totalCount = 0 } = result.data || {};
        setItems(formations);
        setTotal(totalCount);
      } else {
        showApiResponse(result, { errorTitle: 'Erreur de chargement' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await ConsumApi.getEcoleFormationsStatsOverview();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStats();
    // levels
    (async () => {
      const res = await ConsumApi.getEcoleFormationLevelsAvailable();
      if (res.success) setLevels(res.data || []);
    })();
  }, [page, rowsPerPage]);

  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ programName: '', description: '', niveau: '', duree: '', diplomeObtenu: '', niveauId: '' });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (row) => {
    setIsEditMode(true);
    setEditingId(row.id || row._id);
    setFormData({
      programName: row.programName || '',
      description: row.description || '',
      niveau: row.niveau || '',
      duree: row.duree || '',
      diplomeObtenu: row.diplomeObtenu || '',
      niveauId: row.niveauId || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ programName: '', description: '', niveau: '', duree: '', diplomeObtenu: '', niveauId: '' });
  };

  const handleSave = async () => {
    if (!formData.programName) {
      showApiResponse({ success: false, message: 'Le nom du programme est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }

    const res = isEditMode
      ? await ConsumApi.updateEcoleFormation(editingId, formData)
      : await ConsumApi.createEcoleFormation(formData);

    showApiResponse(res);
    if (res.success) {
      handleCloseDialog();
      fetchData();
      fetchStats();
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id, loading: false });
  };

  const handleDeleteConfirm = async () => {
    const idToDelete = deleteDialog.id;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    const res = await ConsumApi.deleteEcoleFormation(idToDelete);
    showApiResponse(res, {
      successTitle: 'Formation supprimée',
      errorTitle: 'Erreur de suppression',
    });
    if (res.success) {
      setDeleteDialog({ open: false, id: null, loading: false });
      fetchData();
      fetchStats();
    } else {
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, loading: false });
  };


  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Formations | AnnourTravel </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Formations & Filières</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Iconify icon="eva:refresh-fill" />} onClick={() => { fetchData(); fetchStats(); }} disabled={loading}>
              Actualiser
            </Button>
            <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={handleOpenAddDialog}>
              Ajouter une formation
            </Button>
          </Stack>
        </Stack>

        {/* Stats Overview */}
        {stats && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
            <Card sx={{ p: 3, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 12px)' }, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
                {stats.totalFormations || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Formations
              </Typography>
            </Card>
            <Card sx={{ p: 3, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 12px)' }, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
                {stats.totalJobSheets || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fiches Métiers
              </Typography>
            </Card>
            <Card sx={{ p: 3, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 12px)' }, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
                {Array.isArray(stats.formationsByLevel) ? stats.formationsByLevel.length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Niveaux Disponibles
              </Typography>
            </Card>
            <Card sx={{ p: 3, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 12px)' }, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
                {Array.isArray(stats.popularFormations) ? stats.popularFormations.length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Formations Populaires
              </Typography>
            </Card>
          </Box>
        )}

        {/* Formations List */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Programme</TableCell>
                  <TableCell>Niveau</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Durée</TableCell>
                  <TableCell>Diplôme</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucune formation enregistrée
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id || row._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{row.programName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          {row.niveauRelation?.label && (
                            <Chip label={row.niveauRelation.label} size="small" />
                          )}
                          {row.niveau && <Typography variant="body2">{row.niveau}</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {row.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.duree || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.diplomeObtenu || '-'}</Typography>
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
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setPage(0);
              setRowsPerPage(parseInt(e.target.value, 10));
            }}
          />
        </Card>

        {/* Formation Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Modifier la formation' : 'Ajouter une nouvelle formation'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                  label="Nom du programme *"
                  value={formData.programName}
                  onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                  placeholder="Ex: Informatique et Systèmes d'Information"
                  helperText="Nom complet de la formation"
                  required
                  fullWidth
                />
                <FormControl sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }} fullWidth>
                  <InputLabel>Niveau</InputLabel>
                  <Select
                    value={formData.niveauId}
                    onChange={(e) => setFormData({ ...formData, niveauId: e.target.value })}
                    label="Niveau"
                  >
                    <MenuItem value="">Sélectionner un niveau</MenuItem>
                    {levels.map((lv) => (
                      <MenuItem key={lv.id || lv._id} value={lv.id || lv._id}>
                        {lv.label || lv.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez la formation en détail..."
                helperText="Description complète de la formation, ses objectifs et son contenu"
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 11px)' } }}
                  label="Niveau (texte)"
                  value={formData.niveau}
                  onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                  placeholder="Ex: Bac+3"
                  fullWidth
                />
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 11px)' } }}
                  label="Durée"
                  value={formData.duree}
                  onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                  placeholder="Ex: 3 ans"
                  fullWidth
                />
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 11px)' } }}
                  label="Diplôme obtenu"
                  value={formData.diplomeObtenu}
                  onChange={(e) => setFormData({ ...formData, diplomeObtenu: e.target.value })}
                  placeholder="Ex: Licence en Informatique"
                  fullWidth
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || !formData.programName}
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
          title="Supprimer la formation"
          message="Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible."
          loading={deleteDialog.loading}
        />
      </Container>
    </>
  );
}


