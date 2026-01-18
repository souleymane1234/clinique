import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  Alert,
  TableContainer,
  TablePagination,
  InputAdornment,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function NurseAlertesView() {
  const { contextHolder, showError, showSuccess } = useNotification();

  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadAlertes = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des alertes et urgences
      const mockAlertes = Array.from({ length: 20 }, (_, i) => {
        const severities = ['critical', 'urgent', 'warning', 'info'];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        return {
          id: i + 1,
          patientId: Math.floor(Math.random() * 50) + 1,
          patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
          date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          type: ['vital', 'medication', 'allergy', 'fall', 'other'][Math.floor(Math.random() * 5)],
          message: [
            'Signes vitaux anormaux',
            'Médication manquée',
            'Réaction allergique',
            'Chute du patient',
            'Autre urgence',
          ][Math.floor(Math.random() * 5)],
          severity,
          infirmier: `Inf. ${['Dupont', 'Martin', 'Bernard'][Math.floor(Math.random() * 3)]}`,
        };
      });

      let filtered = mockAlertes;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.patientName.toLowerCase().includes(searchLower) ||
            a.message.toLowerCase().includes(searchLower) ||
            a.type.toLowerCase().includes(searchLower)
        );
      }
      if (severityFilter) {
        filtered = filtered.filter((a) => a.severity === severityFilter);
      }

      setAlertes(filtered);
    } catch (error) {
      console.error('Error loading alertes:', error);
      showError('Erreur', 'Impossible de charger les alertes');
      setAlertes([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, severityFilter]);

  useEffect(() => {
    loadAlertes();
  }, [page, rowsPerPage, search, severityFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
  };

  const handleAcknowledge = (item) => {
    showSuccess('Succès', 'Alerte prise en compte');
    // Marquer comme traitée
    setAlertes((prev) => prev.filter((a) => a.id !== item.id));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'urgent':
        return 'warning';
      case 'warning':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'critical':
        return 'Critique';
      case 'urgent':
        return 'Urgent';
      case 'warning':
        return 'Attention';
      default:
        return 'Information';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'vital':
        return 'Signes vitaux';
      case 'medication':
        return 'Médication';
      case 'allergy':
        return 'Allergie';
      case 'fall':
        return 'Chute';
      default:
        return 'Autre';
    }
  };

  return (
    <>
      <Helmet>
        <title> Alertes et Urgences | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Alertes et Urgences</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gérer les alertes et situations d&apos;urgence
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Gravité"
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 150 }}
              SelectProps={{ native: true }}
            >
              <option value="">Toutes</option>
              <option value="critical">Critique</option>
              <option value="urgent">Urgent</option>
              <option value="warning">Attention</option>
              <option value="info">Information</option>
            </TextField>
          </Stack>
        </Card>

        {/* Table */}
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Gravité</TableCell>
                    <TableCell>Infirmier</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (alertes.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            Aucune alerte trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return alertes.map((item, index) => (
                      <TableRow
                        key={`${item.patientId}-${item.id}-${index}`}
                        hover
                        sx={
                          item.severity === 'critical'
                            ? { bgcolor: 'error.lighter', '&:hover': { bgcolor: 'error.light' } }
                            : {}
                        }
                      >
                        <TableCell>{fDateTime(item.date)}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{getTypeLabel(item.type)}</TableCell>
                        <TableCell>{item.message}</TableCell>
                        <TableCell>
                          <Chip
                            label={getSeverityLabel(item.severity)}
                            size="small"
                            color={getSeverityColor(item.severity)}
                          />
                        </TableCell>
                        <TableCell>{item.infirmier}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" size="small" onClick={() => handleViewDetails(item)}>
                              Détails
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              color="success"
                              onClick={() => handleAcknowledge(item)}
                              startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                            >
                              Traiter
                            </Button>
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
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Lignes par page:"
          />
        </Card>
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onClose={() => setDetailsDialog({ open: false, item: null })} maxWidth="md" fullWidth>
        <DialogTitle>
          <Alert severity={detailsDialog.item?.severity || 'info'} sx={{ mb: 2 }}>
            {detailsDialog.item?.message}
          </Alert>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2">Patient</Typography>
                <Typography variant="body2">{detailsDialog.item.patientName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Date et Heure</Typography>
                <Typography variant="body2">{fDateTime(detailsDialog.item.date)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Type</Typography>
                <Typography variant="body2">{getTypeLabel(detailsDialog.item.type)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Message</Typography>
                <Typography variant="body2">{detailsDialog.item.message}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Gravité</Typography>
                <Chip
                  label={getSeverityLabel(detailsDialog.item.severity)}
                  size="small"
                  color={getSeverityColor(detailsDialog.item.severity)}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2">Infirmier</Typography>
                <Typography variant="body2">{detailsDialog.item.infirmier}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, item: null })}>Fermer</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              if (detailsDialog.item) handleAcknowledge(detailsDialog.item);
              setDetailsDialog({ open: false, item: null });
            }}
          >
            Traiter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
