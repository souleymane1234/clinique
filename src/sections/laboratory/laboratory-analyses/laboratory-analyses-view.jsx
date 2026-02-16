import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
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
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
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

const STATUS_COLORS = {
  EN_ATTENTE: 'warning',
  EN_COURS: 'info',
  TERMINE: 'success',
  VALIDE: 'success',
  ANNULE: 'error',
};

const STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  VALIDE: 'Validé',
  ANNULE: 'Annulé',
};

const ANALYSIS_TYPES = {
  HEMATOLOGIE: 'Hématologie',
  BIOCHIMIE: 'Biochimie',
  IMMUNOLOGIE: 'Immunologie',
  MICROBIOLOGIE: 'Microbiologie',
  SEROLOGIE: 'Sérologie',
  PARASITOLOGIE: 'Parasitologie',
};

const SAMPLE_TYPES = {
  SANG: 'Sang',
  URINE: 'Urine',
  SELLES: 'Selles',
  SALIVE: 'Salive',
  AUTRE: 'Autre',
};

export default function LaboratoryAnalysesView() {
  const { contextHolder, showError, showSuccess, showApiResponse } = useNotification();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, analysis: null, loading: false });
  const [resultsDialog, setResultsDialog] = useState({ open: false, analysisId: null, results: [], loading: false });
  const [newResultForm, setNewResultForm] = useState({
    parameter: '',
    value: '',
    unit: '',
    referenceValueMin: '',
    referenceValueMax: '',
    abnormal: false,
    comment: '',
    order: 0,
  });

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (statusFilter) {
        filters.status = statusFilter;
      }

      if (typeFilter) {
        filters.analysisType = typeFilter;
      }

      const result = await ConsumApi.getLaboratoryAnalysesPaginated(page + 1, rowsPerPage, filters);

      if (result.success) {
        let analysesData = result.data || [];

        // Filtrer par recherche si présente
        if (search) {
          const searchLower = search.toLowerCase();
          analysesData = analysesData.filter(
            (a) =>
              (a.analyseNumber || '').toLowerCase().includes(searchLower) ||
              (a.analysisName || '').toLowerCase().includes(searchLower) ||
              (a.patient?.firstName || '').toLowerCase().includes(searchLower) ||
              (a.patient?.lastName || '').toLowerCase().includes(searchLower) ||
              (a.patient?.phone || '').toLowerCase().includes(searchLower)
          );
        }

        setAnalyses(analysesData);
        setTotal(result.pagination?.total || analysesData.length);
      } else {
        setAnalyses([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
      setAnalyses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, typeFilter]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  const handleViewDetails = async (analysis) => {
    setDetailsDialog({ open: true, analysis, loading: true });
    try {
      const result = await ConsumApi.getLaboratoryAnalysisComplete(analysis.id);
      if (result.success) {
        setDetailsDialog({ open: true, analysis: result.data, loading: false });
      } else {
        setDetailsDialog({ open: true, analysis, loading: false });
      }
    } catch (error) {
      console.error('Error loading analysis details:', error);
      setDetailsDialog({ open: true, analysis, loading: false });
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, analysis: null, loading: false });
  };

  const handleViewResults = async (analysisId) => {
    setResultsDialog({ open: true, analysisId, results: [], loading: true });
    try {
      const result = await ConsumApi.getLaboratoryAnalysisResults(analysisId);
      if (result.success) {
        setResultsDialog({ open: true, analysisId, results: result.data || [], loading: false });
      } else {
        setResultsDialog({ open: true, analysisId, results: [], loading: false });
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setResultsDialog({ open: true, analysisId, results: [], loading: false });
    }
  };

  const handleCloseResults = () => {
    setResultsDialog({ open: false, analysisId: null, results: [], loading: false });
    setNewResultForm({
      parameter: '',
      value: '',
      unit: '',
      referenceValueMin: '',
      referenceValueMax: '',
      abnormal: false,
      comment: '',
      order: 0,
    });
  };

  const handleAddResult = async () => {
    if (!resultsDialog.analysisId || !newResultForm.parameter || !newResultForm.value) {
      showError('Erreur', 'Veuillez remplir au moins le paramètre et la valeur');
      return;
    }

    try {
      const result = await ConsumApi.addLaboratoryAnalysisResult(resultsDialog.analysisId, newResultForm);
      const processed = showApiResponse(result, {
        successTitle: 'Résultat ajouté',
        errorTitle: 'Erreur',
      });

      if (processed.success) {
        showSuccess('Succès', 'Résultat ajouté avec succès');
        // Recharger les résultats
        await handleViewResults(resultsDialog.analysisId);
        // Réinitialiser le formulaire
        setNewResultForm({
          parameter: '',
          value: '',
          unit: '',
          referenceValueMin: '',
          referenceValueMax: '',
          abnormal: false,
          comment: '',
          order: 0,
        });
      }
    } catch (error) {
      console.error('Error adding result:', error);
      showError('Erreur', 'Erreur lors de l\'ajout du résultat');
    }
  };

  const handleCompleteAnalysis = async (analysisId) => {
    try {
      const result = await ConsumApi.completeLaboratoryAnalysis(analysisId);
      const processed = showApiResponse(result, {
        successTitle: 'Analyse terminée',
        errorTitle: 'Erreur',
      });

      if (processed.success) {
        showSuccess('Succès', 'Analyse marquée comme terminée');
        loadAnalyses();
        handleCloseDetails();
      }
    } catch (error) {
      console.error('Error completing analysis:', error);
      showError('Erreur', 'Erreur lors de la finalisation de l\'analyse');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Gestion des Analyses | PREVENTIC </title>
      </Helmet>

      <Stack spacing={3}>
        <Typography variant="h4">Gestion des Analyses</Typography>

        <Card>
          <Stack spacing={2} sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Statut</InputLabel>
                <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="EN_ATTENTE">En attente</MenuItem>
                  <MenuItem value="EN_COURS">En cours</MenuItem>
                  <MenuItem value="TERMINE">Terminé</MenuItem>
                  <MenuItem value="VALIDE">Validé</MenuItem>
                  <MenuItem value="ANNULE">Annulé</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="HEMATOLOGIE">Hématologie</MenuItem>
                  <MenuItem value="BIOCHIMIE">Biochimie</MenuItem>
                  <MenuItem value="IMMUNOLOGIE">Immunologie</MenuItem>
                  <MenuItem value="MICROBIOLOGIE">Microbiologie</MenuItem>
                  <MenuItem value="SEROLOGIE">Sérologie</MenuItem>
                  <MenuItem value="PARASITOLOGIE">Parasitologie</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TableContainer>
              <Scrollbar>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Numéro</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Analyse</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Échantillon</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (loading) {
                        return (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                              <LoadingButton loading>Chargement...</LoadingButton>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (analyses.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Aucune analyse trouvée
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return analyses.map((analysis) => (
                        <TableRow key={analysis.id} hover>
                          <TableCell>{analysis.analyseNumber || 'N/A'}</TableCell>
                          <TableCell>{fDate(analysis.samplingDate || analysis.createdAt)}</TableCell>
                          <TableCell>
                            {(() => {
                              if (!analysis.patient) return 'N/A';
                              const firstName = analysis.patient.firstName || '';
                              const lastName = analysis.patient.lastName || '';
                              const fullName = `${firstName} ${lastName}`.trim();
                              return fullName || 'N/A';
                            })()}
                          </TableCell>
                          <TableCell>{analysis.analysisName || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={ANALYSIS_TYPES[analysis.analysisType] || analysis.analysisType}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>{SAMPLE_TYPES[analysis.sampleType] || analysis.sampleType}</TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[analysis.status] || analysis.status}
                              size="small"
                              color={STATUS_COLORS[analysis.status] || 'default'}
                            />
                            {analysis.urgent && (
                              <Chip label="Urgent" color="error" size="small" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleViewDetails(analysis)}
                              >
                                Détails
                              </Button>
                              {analysis.status === 'EN_COURS' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleViewResults(analysis.id)}
                                >
                                  Résultats
                                </Button>
                              )}
                              {analysis.status === 'EN_COURS' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleCompleteAnalysis(analysis.id)}
                                >
                                  Terminer
                                </Button>
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
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Stack>
        </Card>
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Détails de l&apos;analyse</DialogTitle>
        <DialogContent>
          {(() => {
            if (detailsDialog.loading) {
              return (
                <Typography variant="body2" color="text.secondary">
                  Chargement...
                </Typography>
              );
            }
            if (!detailsDialog.analysis) {
              return (
                <Typography variant="body2" color="text.secondary">
                  Aucune information disponible
                </Typography>
              );
            }
            return (
              <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Numéro
                </Typography>
                <Typography variant="body1">{detailsDialog.analysis.analyseNumber || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1">
                  {detailsDialog.analysis.patient
                    ? `${detailsDialog.analysis.patient.firstName || ''} ${detailsDialog.analysis.patient.lastName || ''}`.trim()
                    : 'N/A'}
                </Typography>
                {detailsDialog.analysis.patient?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    Téléphone: {detailsDialog.analysis.patient.phone}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Analyse
                </Typography>
                <Typography variant="body1">{detailsDialog.analysis.analysisName || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">
                  {ANALYSIS_TYPES[detailsDialog.analysis.analysisType] || detailsDialog.analysis.analysisType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Échantillon
                </Typography>
                <Typography variant="body1">
                  {SAMPLE_TYPES[detailsDialog.analysis.sampleType] || detailsDialog.analysis.sampleType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Statut
                </Typography>
                <Chip
                  label={STATUS_LABELS[detailsDialog.analysis.status] || detailsDialog.analysis.status}
                  color={STATUS_COLORS[detailsDialog.analysis.status] || 'default'}
                  size="small"
                />
                {detailsDialog.analysis.urgent && (
                  <Chip label="Urgent" color="error" size="small" sx={{ ml: 1 }} />
                )}
              </Box>
              {detailsDialog.analysis.observations && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Observations
                  </Typography>
                  <Typography variant="body1">{detailsDialog.analysis.observations}</Typography>
                </Box>
              )}
              {detailsDialog.analysis.conclusion && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Conclusion
                  </Typography>
                  <Typography variant="body1">{detailsDialog.analysis.conclusion}</Typography>
                </Box>
              )}
              {detailsDialog.analysis.price && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prix
                  </Typography>
                  <Typography variant="body1">{detailsDialog.analysis.price} FCFA</Typography>
                </Box>
              )}
              {detailsDialog.analysis.results && detailsDialog.analysis.results.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Résultats
                  </Typography>
                  <Stack spacing={1}>
                    {detailsDialog.analysis.results.map((result, index) => (
                      <Card key={result.id || index} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">{result.parameter}</Typography>
                            {result.abnormal && <Chip label="Anormal" color="error" size="small" />}
                          </Box>
                          <Typography variant="body2">
                            <strong>Valeur:</strong> {result.value} {result.unit}
                          </Typography>
                          {result.referenceValueMin && result.referenceValueMax && (
                            <Typography variant="body2">
                              <strong>Référence:</strong> {result.referenceValueMin} - {result.referenceValueMax} {result.unit}
                            </Typography>
                          )}
                          {result.comment && (
                            <Typography variant="body2">
                              <strong>Commentaire:</strong> {result.comment}
                            </Typography>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
          {detailsDialog.analysis?.status === 'EN_ATTENTE' && (
            <Button
              variant="contained"
              color="info"
              onClick={async () => {
                const result = await ConsumApi.receiveLaboratoryAnalysis(
                  detailsDialog.analysis.id,
                  'Utilisateur actuel'
                );
                const processed = showApiResponse(result, {
                  successTitle: 'Échantillon réceptionné',
                  errorTitle: 'Erreur',
                });
                if (processed.success) {
                  showSuccess('Succès', 'Échantillon réceptionné avec succès');
                  loadAnalyses();
                  handleCloseDetails();
                }
              }}
            >
              Réceptionner
            </Button>
          )}
          {detailsDialog.analysis?.status === 'EN_COURS' && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  const result = await ConsumApi.performLaboratoryAnalysis(
                    detailsDialog.analysis.id,
                    'Utilisateur actuel'
                  );
                  const processed = showApiResponse(result, {
                    successTitle: 'Analyse réalisée',
                    errorTitle: 'Erreur',
                  });
                  if (processed.success) {
                    showSuccess('Succès', 'Analyse marquée comme réalisée');
                    loadAnalyses();
                    handleCloseDetails();
                  }
                }}
              >
                Marquer comme réalisée
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleCompleteAnalysis(detailsDialog.analysis.id)}
              >
                Terminer l&apos;analyse
              </Button>
            </>
          )}
          {detailsDialog.analysis?.status === 'TERMINE' && (
            <Button
              variant="contained"
              color="success"
              onClick={async () => {
                const result = await ConsumApi.validateLaboratoryAnalysis(
                  detailsDialog.analysis.id,
                  'Utilisateur actuel'
                );
                const processed = showApiResponse(result, {
                  successTitle: 'Résultats validés',
                  errorTitle: 'Erreur',
                });
                if (processed.success) {
                  showSuccess('Succès', 'Résultats validés avec succès');
                  loadAnalyses();
                  handleCloseDetails();
                }
              }}
            >
              Valider les résultats
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsDialog.open} onClose={handleCloseResults} maxWidth="md" fullWidth>
        <DialogTitle>Résultats de l&apos;analyse</DialogTitle>
        <DialogContent>
          {resultsDialog.loading ? (
            <Typography variant="body2" color="text.secondary">
              Chargement...
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {resultsDialog.results.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Aucun résultat
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {resultsDialog.results.map((result, index) => (
                    <Card key={result.id || index} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">{result.parameter}</Typography>
                          <Stack direction="row" spacing={1}>
                            {result.abnormal && <Chip label="Anormal" color="error" size="small" />}
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={async () => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer ce résultat ?')) {
                                  const deleteResult = await ConsumApi.deleteLaboratoryResult(result.id);
                                  const processed = showApiResponse(deleteResult, {
                                    successTitle: 'Résultat supprimé',
                                    errorTitle: 'Erreur',
                                  });
                                  if (processed.success) {
                                    showSuccess('Succès', 'Résultat supprimé avec succès');
                                    await handleViewResults(resultsDialog.analysisId);
                                  }
                                }
                              }}
                            >
                              Supprimer
                            </Button>
                          </Stack>
                        </Box>
                        <Typography variant="body2">
                          <strong>Valeur:</strong> {result.value} {result.unit}
                        </Typography>
                        {result.referenceValueMin && result.referenceValueMax && (
                          <Typography variant="body2">
                            <strong>Référence:</strong> {result.referenceValueMin} - {result.referenceValueMax} {result.unit}
                          </Typography>
                        )}
                        {result.comment && (
                          <Typography variant="body2">
                            <strong>Commentaire:</strong> {result.comment}
                          </Typography>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}

              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Ajouter un résultat
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Paramètre"
                    value={newResultForm.parameter}
                    onChange={(e) => setNewResultForm({ ...newResultForm, parameter: e.target.value })}
                  />
                  <Stack direction="row" spacing={2}>
                    <TextField
                      fullWidth
                      label="Valeur"
                      value={newResultForm.value}
                      onChange={(e) => setNewResultForm({ ...newResultForm, value: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Unité"
                      value={newResultForm.unit}
                      onChange={(e) => setNewResultForm({ ...newResultForm, unit: e.target.value })}
                    />
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      fullWidth
                      label="Valeur min (référence)"
                      value={newResultForm.referenceValueMin}
                      onChange={(e) => setNewResultForm({ ...newResultForm, referenceValueMin: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Valeur max (référence)"
                      value={newResultForm.referenceValueMax}
                      onChange={(e) => setNewResultForm({ ...newResultForm, referenceValueMax: e.target.value })}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Commentaire"
                    value={newResultForm.comment}
                    onChange={(e) => setNewResultForm({ ...newResultForm, comment: e.target.value })}
                  />
                  <LoadingButton variant="contained" onClick={handleAddResult}>
                    Ajouter le résultat
                  </LoadingButton>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResults}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
