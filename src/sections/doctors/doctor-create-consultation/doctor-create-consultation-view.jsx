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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function DoctorCreateConsultationView() {
  const router = useRouter();
  const { contextHolder, showSuccess, showError } = useNotification();

  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });

  const [formData, setFormData] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getPatients({ limit: 100 });
      if (result.success) {
        setPatients(result.data?.patients || []);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { page: page + 1, limit: rowsPerPage };
      if (search) filters.search = search;

      const result = await ConsumApi.getPatientConsultations(null, filters);

      if (result.success) {
        setConsultations(result.data?.consultations || []);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadPatients();
    loadConsultations();
  }, [page, rowsPerPage, search]);

  const handleCreateConsultation = async () => {
    setCreateDialog((prev) => ({ ...prev, loading: true }));
    try {
      // Simuler la création d'une consultation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess('Succès', 'Consultation créée avec succès');
      setCreateDialog({ open: false, loading: false });
      setFormData({
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        reason: '',
      });
      loadConsultations();
    } catch (error) {
      showError('Erreur', 'Impossible de créer la consultation');
      setCreateDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      <Helmet>
        <title> Création de Consultations | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Création de Consultations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Créer de nouvelles consultations pour les patients
          </Typography>
        </Box>

        {/* Create Button */}
        <Card sx={{ p: 2 }}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => setCreateDialog({ open: true, loading: false })}
          >
            Nouvelle Consultation
          </Button>
        </Card>

        {/* Search */}
        <Card sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher une consultation..."
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
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Raison</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (consultations.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            Aucune consultation trouvée
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return consultations.map((consultation, index) => (
                      <TableRow key={`${consultation.patientId}-${consultation.id}-${index}`} hover>
                        <TableCell>{fDateTime(consultation.date)}</TableCell>
                        <TableCell>Patient {consultation.patientId}</TableCell>
                        <TableCell>{consultation.reason || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={consultation.status || 'completed'}
                            size="small"
                            color={consultation.status === 'completed' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Iconify icon="eva:eye-fill" />}
                            onClick={() => router.push(`/doctors/consultations/${consultation.id}`)}
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

      {/* Create Dialog */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle Consultation</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Patient</InputLabel>
              <Select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                label="Patient"
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Raison de consultation"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              multiline
              rows={3}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton
            variant="contained"
            loading={createDialog.loading}
            onClick={handleCreateConsultation}
          >
            Créer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
