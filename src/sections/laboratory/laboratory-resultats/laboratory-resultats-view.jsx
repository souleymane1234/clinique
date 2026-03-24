import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';

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

import { fDate } from 'src/utils/format-time';
import { getCurrentStaffDisplayName } from 'src/utils/lab-user';

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

export default function LaboratoryResultatsView() {
  const { contextHolder, showError, showApiResponse } = useNotification();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TERMINE');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (search.trim()) filters.search = search.trim();
      const res = await ConsumApi.getLaboratoryAnalysesPaginated(page + 1, rowsPerPage, filters);
      if (res.success) {
        setRows(res.data || []);
        setTotal(res.pagination?.total ?? (res.data || []).length);
      } else {
        setRows([]);
        setTotal(0);
        showError('Erreur', res.message || 'Chargement impossible');
      }
    } catch (e) {
      setRows([]);
      setTotal(0);
      showError('Erreur', e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [page, rowsPerPage, search, statusFilter]);

  const openDetail = async (analysis) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await ConsumApi.getLaboratoryAnalysisComplete(analysis.id);
      if (res.success) {
        setDetail(res.data);
      } else {
        setDetail(analysis);
        showError('Erreur', res.message || 'Détails indisponibles');
      }
    } catch (e) {
      setDetail(analysis);
      showError('Erreur', e?.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!detail?.id) return;
    const result = await ConsumApi.validateLaboratoryAnalysis(detail.id, getCurrentStaffDisplayName());
    const ok = showApiResponse(result, { successTitle: 'Validé', errorTitle: 'Erreur' });
    if (ok.success) {
      setDetailOpen(false);
      loadRows();
    }
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
            <LoadingButton loading>Chargement…</LoadingButton>
          </TableCell>
        </TableRow>
      );
    }
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
            <Typography color="text.secondary">Aucune analyse</Typography>
          </TableCell>
        </TableRow>
      );
    }
    return rows.map((a) => (
      <TableRow key={a.id} hover>
        <TableCell>{fDate(a.samplingDate || a.createdAt)}</TableCell>
        <TableCell>{patientLabel(a.patient)}</TableCell>
        <TableCell>{a.analysisName || '—'}</TableCell>
        <TableCell>
          <Chip
            size="small"
            label={STATUS_LABELS[a.status] || a.status}
            color={STATUS_COLORS[a.status] || 'default'}
          />
        </TableCell>
        <TableCell align="right">
          <Button size="small" variant="outlined" onClick={() => openDetail(a)}>
            Détails / résultats
          </Button>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <Helmet>
        <title> Résultats laboratoire | Clinique </title>
      </Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Résultats & validation</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Analyses terminées ou validées — saisie des résultats depuis &laquo; Gestion des analyses &raquo;
          </Typography>
        </Box>

        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Rechercher (n°, patient, analyse)…"
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
            <FormControl sx={{ minWidth: 220 }}>
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
                <MenuItem value="TERMINE">Terminé (à valider)</MenuItem>
                <MenuItem value="VALIDE">Validé</MenuItem>
                <MenuItem value="VALIDEE">Validée</MenuItem>
                <MenuItem value="EN_COURS">En cours</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 880 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
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
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Lignes par page :"
          />
        </Card>
      </Stack>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détail analyse & résultats</DialogTitle>
        <DialogContent>
          {detailLoading && (
            <Typography sx={{ py: 2 }} color="text.secondary">
              Chargement…
            </Typography>
          )}
          {!detailLoading && detail && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Patient :</strong> {patientLabel(detail.patient)}
              </Typography>
              <Typography variant="body2">
                <strong>Analyse :</strong> {detail.analysisName || '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Statut :</strong>{' '}
                <Chip
                  size="small"
                  label={STATUS_LABELS[detail.status] || detail.status}
                  color={STATUS_COLORS[detail.status] || 'default'}
                />
              </Typography>
              <Typography variant="subtitle2" sx={{ pt: 1 }}>
                Résultats
              </Typography>
              {(detail.results || []).length === 0 ? (
                <Typography color="text.secondary">Aucun résultat enregistré.</Typography>
              ) : (
                <Stack spacing={1}>
                  {(detail.results || []).map((r, i) => (
                    <Card key={r.id || i} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2">{r.parameter}</Typography>
                      <Typography variant="body2">
                        {r.value} {r.unit || ''}
                        {r.abnormal && (
                          <Chip label="Anormal" color="error" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      {r.referenceValueMin != null && r.referenceValueMax != null && (
                        <Typography variant="caption" color="text.secondary">
                          Réf. {r.referenceValueMin} – {r.referenceValueMax}
                        </Typography>
                      )}
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Fermer</Button>
          {!detailLoading && detail?.status === 'TERMINE' && (
            <Button variant="contained" color="success" onClick={handleValidate}>
              Valider les résultats
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
