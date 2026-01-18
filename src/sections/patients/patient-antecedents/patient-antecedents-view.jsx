import { useState, useEffect, useCallback } from 'react';
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

export default function PatientAntecedentsView() {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      // Charger tous les antécédents et allergies de tous les patients
      const allItems = await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const patientId = String(Math.floor(Math.random() * 50) + 1);
          const [antecedentsResult, allergiesResult] = await Promise.all([
            ConsumApi.getPatientAntecedents(patientId),
            ConsumApi.getPatientAllergies(patientId),
          ]);

          const antecedents = Array.isArray(antecedentsResult.data) ? antecedentsResult.data : [];
          const allergies = Array.isArray(allergiesResult.data) ? allergiesResult.data : [];

          return [
            ...antecedents.map((item) => ({
              ...item,
              patientId,
              patientName: `Patient ${patientId}`,
              category: 'antecedent',
            })),
            ...allergies.map((item) => ({
              ...item,
              patientId,
              patientName: `Patient ${patientId}`,
              category: 'allergy',
              type: 'allergie',
            })),
          ];
        })
      );

      let flatItems = allItems.flat();

      if (search) {
        const searchLower = search.toLowerCase();
        flatItems = flatItems.filter(
          (item) =>
            (item.patientName || '').toLowerCase().includes(searchLower) ||
            (item.description || '').toLowerCase().includes(searchLower) ||
            (item.allergen || '').toLowerCase().includes(searchLower)
        );
      }

      if (typeFilter) {
        if (typeFilter === 'allergie') {
          flatItems = flatItems.filter((item) => item.category === 'allergy');
        } else {
          flatItems = flatItems.filter((item) => item.type === typeFilter && item.category === 'antecedent');
        }
      }

      // Pagination
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      const paginatedItems = flatItems.slice(start, end);

      setItems(paginatedItems);
    } catch (error) {
      console.error('Error loading antecedents:', error);
      showError('Erreur', 'Impossible de charger les antécédents');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadItems();
  }, [page, rowsPerPage, search, typeFilter]);

  return (
    <>
      <Helmet>
        <title> Antécédents &amp; Allergies | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Antécédents &amp; Allergies</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gestion des antécédents médicaux et des allergies des patients
            </Typography>
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
                      <TableCell>Patient</TableCell>
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
                          <TableCell>
                            <Typography variant="subtitle2">{item.patientName || `Patient ${item.patientId}`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {item.patientId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={(() => {
                                if (item.category === 'allergy') return 'ALLERGIE';
                                if (item.type === 'medical') return 'Médical';
                                if (item.type === 'chirurgical') return 'Chirurgical';
                                return 'Familial';
                              })()}
                              color={(() => {
                                if (item.category === 'allergy') return 'error';
                                return ANTECEDENT_TYPE_COLORS[item.type] || 'default';
                              })()}
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
                          <TableCell>{item.date ? fDate(item.date) : 'N/A'}</TableCell>
                          <TableCell>
                            {item.severity && (
                              <Chip
                                label={(() => {
                                  if (item.severity === 'mild') return 'Légère';
                                  if (item.severity === 'moderate') return 'Modérée';
                                  return 'Sévère';
                                })()}
                                size="small"
                                variant="outlined"
                                color={(() => {
                                  if (item.severity === 'severe') return 'error';
                                  if (item.severity === 'moderate') return 'warning';
                                  return 'info';
                                })()}
                              />
                            )}
                          </TableCell>
                          <TableCell>
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
                      if (detailsDialog.item.type === 'medical') return 'Médical';
                      if (detailsDialog.item.type === 'chirurgical') return 'Chirurgical';
                      return 'Familial';
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
                {detailsDialog.item.date && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">{fDate(detailsDialog.item.date)}</Typography>
                  </Grid>
                )}
                {detailsDialog.item.severity && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Sévérité
                    </Typography>
                    <Chip
                      label={(() => {
                        if (detailsDialog.item.severity === 'mild') return 'Légère';
                        if (detailsDialog.item.severity === 'moderate') return 'Modérée';
                        return 'Sévère';
                      })()}
                      size="small"
                      variant="outlined"
                      color={(() => {
                        if (detailsDialog.item.severity === 'severe') return 'error';
                        if (detailsDialog.item.severity === 'moderate') return 'warning';
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
    </>
  );
}
