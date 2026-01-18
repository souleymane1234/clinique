import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Grid,
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
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
  InputAdornment,
  Chip,
  Table,
  Divider,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

const DOCUMENT_TYPE_COLORS = {
  prescription: 'primary',
  ordonnance: 'success',
  rapport: 'info',
  certificat: 'warning',
  radiologie: 'error',
  laboratoire: 'secondary',
  other: 'default',
};

export default function PatientDocumentsView() {
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, document: null });
  const [uploadDialog, setUploadDialog] = useState({ open: false, loading: false });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'other',
    file: null,
    patientId: '',
  });

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      // Charger tous les documents de tous les patients
      const allDocuments = await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const patientId = String(Math.floor(Math.random() * 50) + 1);
          const result = await ConsumApi.getPatientDocuments(patientId);
          if (result.success && Array.isArray(result.data)) {
            return result.data.map((doc) => ({
              ...doc,
              patientId,
              patientName: `Patient ${patientId}`,
            }));
          }
          return [];
        })
      );

      let allItems = allDocuments.flat();

      if (search) {
        const searchLower = search.toLowerCase();
        allItems = allItems.filter(
          (doc) =>
            (doc.patientName || '').toLowerCase().includes(searchLower) ||
            (doc.title || '').toLowerCase().includes(searchLower) ||
            (doc.name || '').toLowerCase().includes(searchLower)
        );
      }

      if (typeFilter) {
        allItems = allItems.filter((doc) => doc.type === typeFilter);
      }

      // Pagination
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      const paginatedItems = allItems.slice(start, end);

      setDocuments(paginatedItems);
    } catch (error) {
      console.error('Error loading documents:', error);
      showError('Erreur', 'Impossible de charger les documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter]);

  useEffect(() => {
    loadDocuments();
  }, [page, rowsPerPage, search, typeFilter]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / (k ** i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleDownload = async (document, e) => {
    e?.stopPropagation();
    try {
      const result = await ConsumApi.downloadPatientDocument(document.id);
      if (result.success && result.data?.url) {
        window.open(result.data.url, '_blank');
        showSuccess('Téléchargement', 'Document téléchargé');
      } else {
        showError('Erreur', 'Impossible de télécharger le document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Erreur', 'Impossible de télécharger le document');
    }
  };

  return (
    <>
      <Helmet>
        <title> Documents Médicaux | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Documents Médicaux</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gestion des documents médicaux des patients
            </Typography>
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par patient, titre de document..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadDocuments();
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
                <TextField
                  fullWidth
                  select
                  label="Type de document"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="prescription">Prescription</MenuItem>
                  <MenuItem value="ordonnance">Ordonnance</MenuItem>
                  <MenuItem value="rapport">Rapport médical</MenuItem>
                  <MenuItem value="certificat">Certificat médical</MenuItem>
                  <MenuItem value="radiologie">Radiologie</MenuItem>
                  <MenuItem value="laboratoire">Laboratoire</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </TextField>

                <LoadingButton
                  variant="outlined"
                  onClick={loadDocuments}
                  loading={loading}
                  startIcon={<Iconify icon="eva:search-fill" />}
                >
                  Rechercher
                </LoadingButton>
              </Stack>
            </Stack>
          </Card>

          {/* Documents Table */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Titre</TableCell>
                      <TableCell>Date d&apos;upload</TableCell>
                      <TableCell>Taille</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (loading && documents.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              Chargement...
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (documents.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              Aucun document trouvé
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return documents.map((doc, index) => (
                        <TableRow
                          key={`${doc.patientId}-${doc.id}-${index}`}
                          hover
                          onClick={() => setDetailsDialog({ open: true, document: doc })}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Typography variant="subtitle2">{doc.patientName || `Patient ${doc.patientId}`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {doc.patientId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={doc.type || 'Autre'}
                              color={DOCUMENT_TYPE_COLORS[doc.type] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{doc.title || doc.name || 'Document sans nom'}</Typography>
                          </TableCell>
                          <TableCell>{fDateTime(doc.uploadedAt || doc.createdAt)}</TableCell>
                          <TableCell>{formatFileSize(doc.size)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDownload(doc, e)}
                                color="primary"
                                title="Télécharger"
                              >
                                <Iconify icon="eva:download-fill" />
                              </IconButton>
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
      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, document: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Détails du document médical</DialogTitle>
        <DialogContent>
          {detailsDialog.document && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {detailsDialog.document.patientName || `Patient ${detailsDialog.document.patientId}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {detailsDialog.document.patientId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type de document
                  </Typography>
                  <Chip
                    label={detailsDialog.document.type || 'Autre'}
                    color={DOCUMENT_TYPE_COLORS[detailsDialog.document.type] || 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Titre
                </Typography>
                <Typography variant="body1">{detailsDialog.document.title || detailsDialog.document.name || 'Document sans nom'}</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date d&apos;upload
                  </Typography>
                  <Typography variant="body1">{fDateTime(detailsDialog.document.uploadedAt || detailsDialog.document.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Taille
                  </Typography>
                  <Typography variant="body1">{formatFileSize(detailsDialog.document.size)}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:download-fill" />}
                  onClick={() => handleDownload(detailsDialog.document)}
                >
                  Télécharger le document
                </Button>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, document: null })}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
