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
  TableContainer,
  TablePagination,
  InputAdornment,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';
import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function DoctorViewDossiersView() {
  const router = useRouter();
  const { contextHolder, showError } = useNotification();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, patient: null });

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (search) filters.search = search;

      const result = await ConsumApi.getPatients(filters);

      if (result.success) {
        setPatients(result.data?.patients || []);
      } else {
        showError('Erreur', result.message || 'Impossible de charger les dossiers patients');
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      showError('Erreur', 'Impossible de charger les dossiers patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadPatients();
  }, [page, rowsPerPage, search]);

  const handleViewDetails = (patient) => {
    setDetailsDialog({ open: true, patient });
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, patient: null });
  };

  return (
    <>
      <Helmet>
        <title> Consultation des Dossiers | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Consultation des Dossiers</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Consulter les dossiers patients complets
          </Typography>
        </Box>

        {/* Search */}
        <Card sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher un patient..."
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
        </Card>

        {/* Table */}
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Prénom</TableCell>
                    <TableCell>Date de naissance</TableCell>
                    <TableCell>Genre</TableCell>
                    <TableCell>Téléphone</TableCell>
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
                    if (patients.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            Aucun dossier trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return patients.map((patient, index) => (
                      <TableRow key={`${patient.id}-${index}`} hover>
                        <TableCell>{patient.id}</TableCell>
                        <TableCell>{patient.lastName}</TableCell>
                        <TableCell>{patient.firstName}</TableCell>
                        <TableCell>{fDate(patient.dateOfBirth)}</TableCell>
                        <TableCell>
                          <Chip
                            label={patient.gender === 'M' ? 'Masculin' : 'Féminin'}
                            size="small"
                            color={patient.gender === 'M' ? 'info' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewDetails(patient)}
                          >
                            Voir détails
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
            count={-1} // Total unknown
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
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Détails du Patient</DialogTitle>
        <DialogContent>
          {detailsDialog.patient && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2">Nom complet</Typography>
                <Typography variant="body2">
                  {detailsDialog.patient.firstName} {detailsDialog.patient.lastName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Date de naissance</Typography>
                <Typography variant="body2">{fDate(detailsDialog.patient.dateOfBirth)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Genre</Typography>
                <Typography variant="body2">
                  {detailsDialog.patient.gender === 'M' ? 'Masculin' : 'Féminin'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Téléphone</Typography>
                <Typography variant="body2">{detailsDialog.patient.phone}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Email</Typography>
                <Typography variant="body2">{detailsDialog.patient.email || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Adresse</Typography>
                <Typography variant="body2">{detailsDialog.patient.address || 'N/A'}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
