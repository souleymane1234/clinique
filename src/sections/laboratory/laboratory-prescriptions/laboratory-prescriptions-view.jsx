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
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
  TablePagination,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fDateTime } from 'src/utils/format-time';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  VALIDE: 'Validé',
  VALIDEE: 'Validée',
  ANNULE: 'Annulé',
};

const STATUS_COLORS = {
  EN_ATTENTE: 'warning',
  EN_COURS: 'info',
  TERMINE: 'success',
  VALIDE: 'success',
  VALIDEE: 'success',
  ANNULE: 'error',
};

function patientLabel(p) {
  if (!p) return '—';
  const n = `${p.firstName || ''} ${p.lastName || ''}`.trim();
  return n || '—';
}

function doctorLabel(doc) {
  if (!doc) return '—';
  if (typeof doc === 'string') return doc;
  const n = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
  return n || doc.email || '—';
}

export default function LaboratoryPrescriptionsView() {
  const { contextHolder, showError } = useNotification();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null, loading: false });

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (search.trim()) filters.search = search.trim();

      const res = await ConsumApi.getLaboratoryAnalysesPaginated(page + 1, rowsPerPage, filters);
      if (!res.success) {
        setRows([]);
        setTotal(0);
        showError('Erreur', res.message || 'Chargement impossible');
        return;
      }
      const data = res.data || [];
      setRows(data);
      setTotal(res.pagination?.total ?? data.length);
    } catch (e) {
      setRows([]);
      setTotal(0);
      showError('Erreur', e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, showError]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const handleViewDetails = async (item) => {
    setDetailsDialog({ open: true, item: null, loading: true });
    try {
      const res = await ConsumApi.getLaboratoryAnalysisComplete(item.id);
      if (res.success) {
        setDetailsDialog({ open: true, item: res.data, loading: false });
      } else {
        setDetailsDialog({ open: true, item, loading: false });
      }
    } catch {
      setDetailsDialog({ open: true, item, loading: false });
    }
  };

  const { item, loading: detailsLoading } = detailsDialog;

  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
            <LoadingButton loading>Chargement…</LoadingButton>
          </TableCell>
        </TableRow>
      );
    }
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
            Aucune demande trouvée
          </TableCell>
        </TableRow>
      );
    }
    return rows.map((a) => (
      <TableRow key={a.id} hover>
        <TableCell>{a.prescriptionId || '—'}</TableCell>
        <TableCell>{fDateTime(a.samplingDate || a.createdAt)}</TableCell>
        <TableCell>{patientLabel(a.patient)}</TableCell>
        <TableCell>{doctorLabel(a.prescribingDoctor)}</TableCell>
        <TableCell>{a.analysisName || '—'}</TableCell>
        <TableCell>
          <Chip
            label={STATUS_LABELS[a.status] || a.status}
            size="small"
            color={STATUS_COLORS[a.status] || 'default'}
          />
        </TableCell>
        <TableCell align="right">
          <Button variant="outlined" size="small" onClick={() => handleViewDetails(a)}>
            Voir détails
          </Button>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <Helmet>
        <title> Prescriptions laboratoire | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Prescriptions & demandes d&apos;analyses</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Liste issue de <code>GET /laboratory/analyses/paginated</code> (prescription liée si présente dans les
            données)
          </Typography>
        </Box>

        <Card sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher…"
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
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  label="Statut"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="EN_ATTENTE">En attente</MenuItem>
                  <MenuItem value="EN_COURS">En cours</MenuItem>
                  <MenuItem value="TERMINE">Terminé</MenuItem>
                  <MenuItem value="VALIDE">Validé</MenuItem>
                  <MenuItem value="VALIDEE">Validée</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Card>

        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 960 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID prescription</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Médecin prescripteur</TableCell>
                    <TableCell>Analyse</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{renderTableBody()}</TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePagination
            page={page}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Lignes par page :"
          />
        </Card>
      </Stack>

      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, item: null, loading: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Détails de la demande</DialogTitle>
        <DialogContent>
          {detailsLoading && (
            <Typography sx={{ py: 2 }} color="text.secondary">
              Chargement…
            </Typography>
          )}
          {!detailsLoading && item && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2">ID prescription</Typography>
                <Typography variant="body2">{item.prescriptionId || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Date</Typography>
                <Typography variant="body2">{fDateTime(item.samplingDate || item.createdAt)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Patient</Typography>
                <Typography variant="body2">{patientLabel(item.patient)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Médecin prescripteur</Typography>
                <Typography variant="body2">{doctorLabel(item.prescribingDoctor)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Analyse</Typography>
                <Typography variant="body2">{item.analysisName || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Statut</Typography>
                <Chip
                  label={STATUS_LABELS[item.status] || item.status}
                  size="small"
                  color={STATUS_COLORS[item.status] || 'default'}
                />
              </Box>
              {item.observations && (
                <Box>
                  <Typography variant="subtitle2">Observations</Typography>
                  <Typography variant="body2">{item.observations}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, item: null, loading: false })}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
