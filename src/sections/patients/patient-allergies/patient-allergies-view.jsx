import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Stack,
  Alert,
  Button,
  Dialog,
  Select,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
  TablePagination,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

function PatientAllergiesView({ patientId }) {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });
  const [createAllergyDialog, setCreateAllergyDialog] = useState({ open: false, loading: false });
  const [editAllergyDialog, setEditAllergyDialog] = useState({ open: false, allergy: null, loading: false });
  const [deleteAllergyDialog, setDeleteAllergyDialog] = useState({ open: false, allergy: null, loading: false });
  const [allergyFormData, setAllergyFormData] = useState({
    allergen: '',
    type: 'Médicament',
    severity: 'Sévère',
    reaction: '',
    discoveredDate: '',
    isActive: true,
  });

  const loadItems = useCallback(async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      const allergiesResult = await ConsumApi.getPatientAllergies(patientId).catch(() => ({ success: false, data: [] }));
      const allergies = Array.isArray(allergiesResult.data) ? allergiesResult.data : [];

      let filteredItems = allergies.map((item) => ({
        ...item,
        patientId,
        category: 'allergy',
        date: item.discoveredDate || item.createdAt,
      }));

      // Filtrage par recherche
      if (search) {
        const searchLower = search.toLowerCase();
        filteredItems = filteredItems.filter(
          (item) =>
            (item.allergen || '').toLowerCase().includes(searchLower) ||
            (item.reaction || '').toLowerCase().includes(searchLower) ||
            (item.type || '').toLowerCase().includes(searchLower)
        );
      }

      // Pagination
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      const paginatedItems = filteredItems.slice(start, end);

      setItems(paginatedItems);
    } catch (error) {
      console.error('Error loading allergies:', error);
      showError('Erreur', 'Impossible de charger les allergies');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, patientId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreateAllergy = async () => {
    if (!patientId) {
      showError('Erreur', 'Patient ID requis');
      return;
    }
    if (!allergyFormData.allergen) {
      showError('Erreur', 'Veuillez remplir le champ allergène');
      return;
    }

    setCreateAllergyDialog({ ...createAllergyDialog, loading: true });
    try {
      const result = await ConsumApi.createAllergy({
        ...allergyFormData,
        patientId,
      });
      const processed = showApiResponse(result, {
        successTitle: 'Allergie créée',
        errorTitle: 'Erreur lors de la création',
      });

      if (processed.success) {
        setCreateAllergyDialog({ open: false, loading: false });
        setAllergyFormData({
          allergen: '',
          type: 'Médicament',
          severity: 'Sévère',
          reaction: '',
          discoveredDate: '',
          isActive: true,
        });
        await loadItems();
      } else {
        setCreateAllergyDialog({ ...createAllergyDialog, loading: false });
      }
    } catch (error) {
      console.error('Error creating allergy:', error);
      showError('Erreur', 'Impossible de créer l\'allergie');
      setCreateAllergyDialog({ ...createAllergyDialog, loading: false });
    }
  };

  const handleEditAllergy = async () => {
    if (!editAllergyDialog.allergy || !allergyFormData.allergen) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setEditAllergyDialog({ ...editAllergyDialog, loading: true });
    try {
      const result = await ConsumApi.updateAllergy(editAllergyDialog.allergy.id, allergyFormData);
      const processed = showApiResponse(result, {
        successTitle: 'Allergie modifiée',
        errorTitle: 'Erreur lors de la modification',
      });

      if (processed.success) {
        setEditAllergyDialog({ open: false, allergy: null, loading: false });
        await loadItems();
      } else {
        setEditAllergyDialog({ ...editAllergyDialog, loading: false });
      }
    } catch (error) {
      console.error('Error updating allergy:', error);
      showError('Erreur', 'Impossible de modifier l\'allergie');
      setEditAllergyDialog({ ...editAllergyDialog, loading: false });
    }
  };

  const handleDeleteAllergy = async () => {
    if (!deleteAllergyDialog.allergy) return;

    setDeleteAllergyDialog({ ...deleteAllergyDialog, loading: true });
    try {
      const result = await ConsumApi.deleteAllergy(deleteAllergyDialog.allergy.id);
      const processed = showApiResponse(result, {
        successTitle: 'Allergie supprimée',
        errorTitle: 'Erreur lors de la suppression',
      });

      if (processed.success) {
        setDeleteAllergyDialog({ open: false, allergy: null, loading: false });
        await loadItems();
      } else {
        setDeleteAllergyDialog({ ...deleteAllergyDialog, loading: false });
      }
    } catch (error) {
      console.error('Error deleting allergy:', error);
      showError('Erreur', 'Impossible de supprimer l\'allergie');
      setDeleteAllergyDialog({ ...deleteAllergyDialog, loading: false });
    }
  };

  const handleOpenEditAllergy = (allergy) => {
    setAllergyFormData({
      allergen: allergy.allergen || '',
      type: allergy.type || 'Médicament',
      severity: allergy.severity || 'Sévère',
      reaction: allergy.reaction || '',
      discoveredDate: allergy.discoveredDate || '',
      isActive: allergy.isActive !== undefined ? allergy.isActive : true,
    });
    setEditAllergyDialog({ open: true, allergy, loading: false });
  };

  return (
    <>
      <Helmet>
        <title> Allergies | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4">Allergies</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gestion des allergies du patient
              </Typography>
            </Box>
            {patientId && (
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => setCreateAllergyDialog({ open: true, loading: false })}
              >
                Ajouter une allergie
              </Button>
            )}
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par allergène, réaction..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadItems();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                }}
              />

              <LoadingButton
                variant="outlined"
                size="small"
                onClick={loadItems}
                loading={loading}
                startIcon={<Iconify icon="eva:search-fill" />}
                sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
              >
                Rechercher
              </LoadingButton>
            </Stack>
          </Card>

          {/* Allergies Table */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Allergène</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Réaction</TableCell>
                      <TableCell>Date de découverte</TableCell>
                      <TableCell>Sévérité</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (loading && items.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              Chargement...
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (items.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              Aucune allergie trouvée
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return items.map((item, index) => (
                        <TableRow
                          key={`${item.patientId}-${item.id}-${index}`}
                          hover
                          onClick={() => setDetailsDialog({ open: true, item })}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Typography variant="body2" color="error.main" fontWeight="bold">
                              {item.allergen || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.type || 'N/A'} color="error" size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.reaction || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            {item.discoveredDate ? fDate(item.discoveredDate) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.severity && (
                              <Chip
                                label={(() => {
                                  if (item.severity === 'Légère' || item.severity === 'mild') return 'Légère';
                                  if (item.severity === 'Modérée' || item.severity === 'moderate') return 'Modérée';
                                  return 'Sévère';
                                })()}
                                size="small"
                                variant="outlined"
                                color={(() => {
                                  if (item.severity === 'Sévère' || item.severity === 'severe') return 'error';
                                  if (item.severity === 'Modérée' || item.severity === 'moderate') return 'warning';
                                  return 'info';
                                })()}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                startIcon={<Iconify icon="eva:eye-fill" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailsDialog({ open: true, item });
                                }}
                              >
                                Détails
                              </Button>
                              {patientId && (
                                <>
                                  <Button
                                    size="small"
                                    color="primary"
                                    startIcon={<Iconify icon="eva:edit-fill" />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditAllergy(item);
                                    }}
                                  >
                                    Modifier
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    startIcon={<Iconify icon="eva:trash-2-fill" />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteAllergyDialog({ open: true, allergy: item, loading: false });
                                    }}
                                  >
                                    Supprimer
                                  </Button>
                                </>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>

            <TablePagination
              page={page}
              component="div"
              count={-1}
              rowsPerPage={rowsPerPage}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to }) => `${from}-${to}`}
            />
          </Card>
        </Stack>
      </Container>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onClose={() => setDetailsDialog({ open: false, item: null })} maxWidth="md" fullWidth>
        <DialogTitle>Détails de l&apos;allergie</DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Allergène
                </Typography>
                <Alert severity="error" icon={<Iconify icon="eva:alert-triangle-fill" />} sx={{ mt: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    {detailsDialog.item.allergen || 'N/A'}
                  </Typography>
                </Alert>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Chip label={detailsDialog.item.type || 'N/A'} color="error" size="small" />
                </Grid>
                {detailsDialog.item.severity && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Sévérité
                    </Typography>
                    <Chip
                      label={(() => {
                        if (detailsDialog.item.severity === 'Légère' || detailsDialog.item.severity === 'mild') return 'Légère';
                        if (detailsDialog.item.severity === 'Modérée' || detailsDialog.item.severity === 'moderate') return 'Modérée';
                        return 'Sévère';
                      })()}
                      size="small"
                      variant="outlined"
                      color={(() => {
                        if (detailsDialog.item.severity === 'Sévère' || detailsDialog.item.severity === 'severe') return 'error';
                        if (detailsDialog.item.severity === 'Modérée' || detailsDialog.item.severity === 'moderate') return 'warning';
                        return 'info';
                      })()}
                    />
                  </Grid>
                )}
              </Grid>

              {detailsDialog.item.reaction && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Réaction observée
                  </Typography>
                  <Typography variant="body1">{detailsDialog.item.reaction}</Typography>
                </Box>
              )}

              {detailsDialog.item.discoveredDate && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date de découverte
                  </Typography>
                  <Typography variant="body1">{fDate(detailsDialog.item.discoveredDate)}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, item: null })}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Create Allergy Dialog */}
      <Dialog open={createAllergyDialog.open} onClose={() => setCreateAllergyDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter une allergie</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Allergène *"
              value={allergyFormData.allergen}
              onChange={(e) => setAllergyFormData({ ...allergyFormData, allergen: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={allergyFormData.type}
                label="Type"
                onChange={(e) => setAllergyFormData({ ...allergyFormData, type: e.target.value })}
              >
                <MenuItem value="Médicament">Médicament</MenuItem>
                <MenuItem value="Aliment">Aliment</MenuItem>
                <MenuItem value="Environnement">Environnement</MenuItem>
                <MenuItem value="Autre">Autre</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Sévérité</InputLabel>
              <Select
                value={allergyFormData.severity}
                label="Sévérité"
                onChange={(e) => setAllergyFormData({ ...allergyFormData, severity: e.target.value })}
              >
                <MenuItem value="Légère">Légère</MenuItem>
                <MenuItem value="Modérée">Modérée</MenuItem>
                <MenuItem value="Sévère">Sévère</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Réaction"
              value={allergyFormData.reaction}
              onChange={(e) => setAllergyFormData({ ...allergyFormData, reaction: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              type="date"
              label="Date de découverte"
              value={allergyFormData.discoveredDate}
              onChange={(e) => setAllergyFormData({ ...allergyFormData, discoveredDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAllergyDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleCreateAllergy} loading={createAllergyDialog.loading}>
            Créer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Edit Allergy Dialog */}
      <Dialog open={editAllergyDialog.open} onClose={() => setEditAllergyDialog({ open: false, allergy: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l&apos;allergie</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Allergène *"
              value={allergyFormData.allergen}
              onChange={(e) => setAllergyFormData({ ...allergyFormData, allergen: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={allergyFormData.type}
                label="Type"
                onChange={(e) => setAllergyFormData({ ...allergyFormData, type: e.target.value })}
              >
                <MenuItem value="Médicament">Médicament</MenuItem>
                <MenuItem value="Aliment">Aliment</MenuItem>
                <MenuItem value="Environnement">Environnement</MenuItem>
                <MenuItem value="Autre">Autre</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Sévérité</InputLabel>
              <Select
                value={allergyFormData.severity}
                label="Sévérité"
                onChange={(e) => setAllergyFormData({ ...allergyFormData, severity: e.target.value })}
              >
                <MenuItem value="Légère">Légère</MenuItem>
                <MenuItem value="Modérée">Modérée</MenuItem>
                <MenuItem value="Sévère">Sévère</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Réaction"
              value={allergyFormData.reaction}
              onChange={(e) => setAllergyFormData({ ...allergyFormData, reaction: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              type="date"
              label="Date de découverte"
              value={allergyFormData.discoveredDate}
              onChange={(e) => setAllergyFormData({ ...allergyFormData, discoveredDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAllergyDialog({ open: false, allergy: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleEditAllergy} loading={editAllergyDialog.loading}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Allergy Dialog */}
      <Dialog open={deleteAllergyDialog.open} onClose={() => setDeleteAllergyDialog({ open: false, allergy: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer l&apos;allergie</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l&apos;allergie &quot;{deleteAllergyDialog.allergy?.allergen}&quot; ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllergyDialog({ open: false, allergy: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" color="error" onClick={handleDeleteAllergy} loading={deleteAllergyDialog.loading}>
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

PatientAllergiesView.propTypes = {
  patientId: PropTypes.string,
};

export default PatientAllergiesView;
