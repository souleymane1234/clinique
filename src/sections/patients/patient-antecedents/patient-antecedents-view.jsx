import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Stack,
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
  Alert,
  Divider,
  TablePagination,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

const ANTECEDENT_TYPE_COLORS = {
  medical: 'error',
  chirurgical: 'warning',
  familial: 'info',
  allergie: 'error',
};

function PatientAntecedentsView({ patientId }) {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });
  const [createAntecedentDialog, setCreateAntecedentDialog] = useState({ open: false, loading: false });
  const [editAntecedentDialog, setEditAntecedentDialog] = useState({ open: false, antecedent: null, loading: false });
  const [deleteAntecedentDialog, setDeleteAntecedentDialog] = useState({ open: false, antecedent: null, loading: false });
  const [antecedentFormData, setAntecedentFormData] = useState({
    type: 'Médical',
    description: '',
    diagnosedDate: '',
    notes: '',
    isActive: true,
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      let allItems = [];

      if (patientId) {
        // Si un patientId est fourni, charger uniquement ses antécédents (pas les allergies)
        const antecedentsResult = await ConsumApi.getPatientAntecedents(patientId).catch(() => ({ success: false, data: [] }));
        const antecedents = Array.isArray(antecedentsResult.data) ? antecedentsResult.data : [];

        allItems = antecedents.map((item) => ({
          ...item,
          patientId,
          category: 'antecedent',
          date: item.diagnosedDate || item.date || item.createdAt,
        }));
      } else {
        // Mode global : charger tous les antécédents et allergies de tous les patients
        const allItemsPromises = await Promise.all(
          Array.from({ length: 20 }, async (_, i) => {
            const randomPatientId = String(Math.floor(Math.random() * 50) + 1);
            const [antecedentsResult, allergiesResult] = await Promise.all([
              ConsumApi.getPatientAntecedents(randomPatientId).catch(() => ({ success: false, data: [] })),
              ConsumApi.getPatientAllergies(randomPatientId).catch(() => ({ success: false, data: [] })),
            ]);

            const antecedents = Array.isArray(antecedentsResult.data) ? antecedentsResult.data : [];
            const allergies = Array.isArray(allergiesResult.data) ? allergiesResult.data : [];

            return [
              ...antecedents.map((item) => ({
                ...item,
                patientId: randomPatientId,
                patientName: `Patient ${randomPatientId}`,
                category: 'antecedent',
                date: item.diagnosedDate || item.date || item.createdAt,
              })),
              ...allergies.map((item) => ({
                ...item,
                patientId: randomPatientId,
                patientName: `Patient ${randomPatientId}`,
                category: 'allergy',
                type: 'allergie',
                date: item.discoveredDate || item.createdAt,
              })),
            ];
          })
        );
        allItems = allItemsPromises.flat();
      }

      // Filtrage par recherche
      if (search) {
        const searchLower = search.toLowerCase();
        allItems = allItems.filter(
          (item) =>
            (item.patientName || '').toLowerCase().includes(searchLower) ||
            (item.description || '').toLowerCase().includes(searchLower) ||
            (item.allergen || '').toLowerCase().includes(searchLower) ||
            (item.reaction || '').toLowerCase().includes(searchLower)
        );
      }

      // Filtrage par type (seulement pour les antécédents)
      if (typeFilter && typeFilter !== 'allergie') {
        allItems = allItems.filter((item) => item.type === typeFilter && item.category === 'antecedent');
      }

      // Pagination
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      const paginatedItems = allItems.slice(start, end);

      setItems(paginatedItems);
    } catch (error) {
      console.error('Error loading antecedents:', error);
      showError('Erreur', 'Impossible de charger les antécédents');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter, patientId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreateAntecedent = async () => {
    if (!patientId) {
      showError('Erreur', 'Patient ID requis');
      return;
    }
    if (!antecedentFormData.description) {
      showError('Erreur', 'Veuillez remplir le champ description');
      return;
    }

    setCreateAntecedentDialog({ ...createAntecedentDialog, loading: true });
    try {
      const result = await ConsumApi.createAntecedent({
        ...antecedentFormData,
        patientId,
      });
      const processed = showApiResponse(result, {
        successTitle: 'Antécédent créé',
        errorTitle: 'Erreur lors de la création',
      });

      if (processed.success) {
        setCreateAntecedentDialog({ open: false, loading: false });
        setAntecedentFormData({
          type: 'Médical',
          description: '',
          diagnosedDate: '',
          notes: '',
          isActive: true,
        });
        await loadItems();
      } else {
        setCreateAntecedentDialog({ ...createAntecedentDialog, loading: false });
      }
    } catch (error) {
      console.error('Error creating antecedent:', error);
      showError('Erreur', 'Impossible de créer l\'antécédent');
      setCreateAntecedentDialog({ ...createAntecedentDialog, loading: false });
    }
  };

  const handleEditAntecedent = async () => {
    if (!editAntecedentDialog.antecedent || !antecedentFormData.description) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setEditAntecedentDialog({ ...editAntecedentDialog, loading: true });
    try {
      const result = await ConsumApi.updateAntecedent(editAntecedentDialog.antecedent.id, antecedentFormData);
      const processed = showApiResponse(result, {
        successTitle: 'Antécédent modifié',
        errorTitle: 'Erreur lors de la modification',
      });

      if (processed.success) {
        setEditAntecedentDialog({ open: false, antecedent: null, loading: false });
        await loadItems();
      } else {
        setEditAntecedentDialog({ ...editAntecedentDialog, loading: false });
      }
    } catch (error) {
      console.error('Error updating antecedent:', error);
      showError('Erreur', 'Impossible de modifier l\'antécédent');
      setEditAntecedentDialog({ ...editAntecedentDialog, loading: false });
    }
  };

  const handleDeleteAntecedent = async () => {
    if (!deleteAntecedentDialog.antecedent) return;

    setDeleteAntecedentDialog({ ...deleteAntecedentDialog, loading: true });
    try {
      const result = await ConsumApi.deleteAntecedent(deleteAntecedentDialog.antecedent.id);
      const processed = showApiResponse(result, {
        successTitle: 'Antécédent supprimé',
        errorTitle: 'Erreur lors de la suppression',
      });

      if (processed.success) {
        setDeleteAntecedentDialog({ open: false, antecedent: null, loading: false });
        await loadItems();
      } else {
        setDeleteAntecedentDialog({ ...deleteAntecedentDialog, loading: false });
      }
    } catch (error) {
      console.error('Error deleting antecedent:', error);
      showError('Erreur', 'Impossible de supprimer l\'antécédent');
      setDeleteAntecedentDialog({ ...deleteAntecedentDialog, loading: false });
    }
  };

  const handleOpenEditAntecedent = (antecedent) => {
    setAntecedentFormData({
      type: antecedent.type || 'Médical',
      description: antecedent.description || '',
      diagnosedDate: antecedent.diagnosedDate || antecedent.date || '',
      notes: antecedent.notes || '',
      isActive: antecedent.isActive !== undefined ? antecedent.isActive : true,
    });
    setEditAntecedentDialog({ open: true, antecedent, loading: false });
  };

  return (
    <>
      <Helmet>
        <title> Antécédents &amp; Allergies | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4">Antécédents &amp; Allergies</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gestion des antécédents médicaux et des allergies des patients
              </Typography>
            </Box>
            {patientId && (
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => setCreateAntecedentDialog({ open: true, loading: false })}
              >
                Ajouter un antécédent
              </Button>
            )}
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par patient, description, allergène..."
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

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="medical">Médical</MenuItem>
                    <MenuItem value="chirurgical">Chirurgical</MenuItem>
                    <MenuItem value="familial">Familial</MenuItem>
                    <MenuItem value="allergie">Allergie</MenuItem>
                  </Select>
                </FormControl>

                <LoadingButton
                  variant="outlined"
                  onClick={loadItems}
                  loading={loading}
                  startIcon={<Iconify icon="eva:search-fill" />}
                >
                  Rechercher
                </LoadingButton>
              </Stack>
            </Stack>
          </Card>

          {/* Items Table */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      {!patientId && <TableCell>Patient</TableCell>}
                      <TableCell>Type</TableCell>
                      <TableCell>Description / Allergène</TableCell>
                      <TableCell>Date</TableCell>
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
                              Aucun antécédent ou allergie trouvé
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return items.map((item, index) => (
                        <TableRow
                          key={`${item.patientId}-${item.category}-${item.id}-${index}`}
                          hover
                          onClick={() => setDetailsDialog({ open: true, item })}
                          sx={{ cursor: 'pointer' }}
                        >
                          {!patientId && (
                            <TableCell>
                              <Typography variant="subtitle2">{item.patientName || `Patient ${item.patientId}`}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {item.patientId}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell>
                            <Chip
                              label={(() => {
                                if (item.type === 'Médical' || item.type === 'medical') return 'Médical';
                                if (item.type === 'Chirurgical' || item.type === 'chirurgical') return 'Chirurgical';
                                if (item.type === 'Familial' || item.type === 'familial') return 'Familial';
                                return item.type || 'N/A';
                              })()}
                              color={ANTECEDENT_TYPE_COLORS[item.type] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {item.category === 'allergy' ? (
                              <Typography variant="body2" color="error.main" fontWeight="bold">
                                {item.allergen || 'N/A'}
                              </Typography>
                            ) : (
                              <Typography variant="body2">{item.description || 'N/A'}</Typography>
                            )}
                            {item.category === 'allergy' && item.reaction && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Réaction: {item.reaction}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              if (item.category === 'allergy') {
                                return item.discoveredDate ? fDate(item.discoveredDate) : 'N/A';
                              }
                              return item.diagnosedDate || item.date ? fDate(item.diagnosedDate || item.date) : 'N/A';
                            })()}
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
                              {patientId && item.category === 'antecedent' && (
                                <>
                                  <Button
                                    size="small"
                                    color="primary"
                                    startIcon={<Iconify icon="eva:edit-fill" />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditAntecedent(item);
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
                                      setDeleteAntecedentDialog({ open: true, antecedent: item, loading: false });
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
        <DialogTitle>
          {detailsDialog.item?.category === 'allergy' ? 'Détails de l\'allergie' : 'Détails de l\'antécédent'}
        </DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {detailsDialog.item.patientName || `Patient ${detailsDialog.item.patientId}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {detailsDialog.item.patientId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Chip
                    label={(() => {
                      if (detailsDialog.item.category === 'allergy') return 'ALLERGIE';
                      if (detailsDialog.item.type === 'Médical' || detailsDialog.item.type === 'medical') return 'Médical';
                      if (detailsDialog.item.type === 'Chirurgical' || detailsDialog.item.type === 'chirurgical') return 'Chirurgical';
                      if (detailsDialog.item.type === 'Familial' || detailsDialog.item.type === 'familial') return 'Familial';
                      return detailsDialog.item.type || 'N/A';
                    })()}
                    color={(() => {
                      if (detailsDialog.item.category === 'allergy') return 'error';
                      return ANTECEDENT_TYPE_COLORS[detailsDialog.item.type] || 'default';
                    })()}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Divider />

              {detailsDialog.item.category === 'allergy' ? (
                <>
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

                  {detailsDialog.item.reaction && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Réaction observée
                      </Typography>
                      <Typography variant="body1">{detailsDialog.item.reaction}</Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{detailsDialog.item.description || 'N/A'}</Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                {(detailsDialog.item.date || detailsDialog.item.diagnosedDate || detailsDialog.item.discoveredDate) && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {fDate(detailsDialog.item.discoveredDate || detailsDialog.item.diagnosedDate || detailsDialog.item.date)}
                    </Typography>
                  </Grid>
                )}
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
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, item: null })}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Create Antecedent Dialog */}
      <Dialog open={createAntecedentDialog.open} onClose={() => setCreateAntecedentDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un antécédent</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type *</InputLabel>
              <Select
                value={antecedentFormData.type}
                label="Type *"
                onChange={(e) => setAntecedentFormData({ ...antecedentFormData, type: e.target.value })}
                required
              >
                <MenuItem value="Médical">Médical</MenuItem>
                <MenuItem value="Chirurgical">Chirurgical</MenuItem>
                <MenuItem value="Familial">Familial</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description *"
              value={antecedentFormData.description}
              onChange={(e) => setAntecedentFormData({ ...antecedentFormData, description: e.target.value })}
              required
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              type="date"
              label="Date de diagnostic"
              value={antecedentFormData.diagnosedDate}
              onChange={(e) => setAntecedentFormData({ ...antecedentFormData, diagnosedDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Notes"
              value={antecedentFormData.notes}
              onChange={(e) => setAntecedentFormData({ ...antecedentFormData, notes: e.target.value })}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAntecedentDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleCreateAntecedent} loading={createAntecedentDialog.loading}>
            Créer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Edit Antecedent Dialog */}
      <Dialog open={editAntecedentDialog.open} onClose={() => setEditAntecedentDialog({ open: false, antecedent: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l&apos;antécédent</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type *</InputLabel>
              <Select
                value={antecedentFormData.type}
                label="Type *"
                onChange={(e) => setAntecedentFormData({ ...antecedentFormData, type: e.target.value })}
                required
              >
                <MenuItem value="Médical">Médical</MenuItem>
                <MenuItem value="Chirurgical">Chirurgical</MenuItem>
                <MenuItem value="Familial">Familial</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description *"
              value={antecedentFormData.description}
              onChange={(e) => setAntecedentFormData({ ...antecedentFormData, description: e.target.value })}
              required
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              type="date"
              label="Date de diagnostic"
              value={antecedentFormData.diagnosedDate}
              onChange={(e) => setAntecedentFormData({ ...antecedentFormData, diagnosedDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Notes"
              value={antecedentFormData.notes}
              onChange={(e) => setAntecedentFormData({ ...antecedentFormData, notes: e.target.value })}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAntecedentDialog({ open: false, antecedent: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleEditAntecedent} loading={editAntecedentDialog.loading}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Antecedent Dialog */}
      <Dialog open={deleteAntecedentDialog.open} onClose={() => setDeleteAntecedentDialog({ open: false, antecedent: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer l&apos;antécédent</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l&apos;antécédent &quot;{deleteAntecedentDialog.antecedent?.description}&quot; ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAntecedentDialog({ open: false, antecedent: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" color="error" onClick={handleDeleteAntecedent} loading={deleteAntecedentDialog.loading}>
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

PatientAntecedentsView.propTypes = {
  patientId: PropTypes.string,
};

export default PatientAntecedentsView;
