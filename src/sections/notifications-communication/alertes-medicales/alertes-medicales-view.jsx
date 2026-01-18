import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Table, Stack, Alert, TextField, TableRow, TableBody, TableCell, TableHead, Typography, TableContainer, TablePagination, InputAdornment } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

export default function AlertesMedicalesView() {
  const { contextHolder, showError } = useNotification();
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const loadAlertes = useCallback(async () => {
    setLoading(true);
    try {
      const mockAlertes = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        patientId: Math.floor(Math.random() * 50) + 1,
        patientName: `Patient ${Math.floor(Math.random() * 50) + 1}`,
        type: ['vital', 'allergie', 'medication', 'resultat'][Math.floor(Math.random() * 4)],
        message: ['Signes vitaux anormaux', 'Allergie détectée', 'Médication manquée', 'Résultat critique'][Math.floor(Math.random() * 4)],
        severity: ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)],
        medecin: `Dr. ${['Martin', 'Dubois'][Math.floor(Math.random() * 2)]}`,
      }));

      let filtered = mockAlertes;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((a) => a.patientName.toLowerCase().includes(searchLower) || a.message.toLowerCase().includes(searchLower));
      }
      if (severityFilter) {
        filtered = filtered.filter((a) => a.severity === severityFilter);
      }

      setAlertes(filtered);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les alertes médicales');
      setAlertes([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, severityFilter]);

  useEffect(() => {
    loadAlertes();
  }, [page, rowsPerPage, search, severityFilter]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      default: return 'info';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'critical': return 'Critique';
      case 'high': return 'Haute';
      default: return 'Moyenne';
    }
  };

  return (
    <>
      <Helmet><title> Alertes Médicales | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Alertes Médicales</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Consulter les alertes médicales du système</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} /></InputAdornment> }} />
            <TextField select label="Gravité" value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
              <option value="">Toutes</option><option value="critical">Critique</option><option value="high">Haute</option><option value="medium">Moyenne</option>
            </TextField>
          </Stack>
        </Card>
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}><Scrollbar><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Patient</TableCell><TableCell>Type</TableCell><TableCell>Message</TableCell><TableCell>Gravité</TableCell><TableCell>Médecin</TableCell></TableRow></TableHead><TableBody>{(() => { if (loading) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><LoadingButton loading>Chargement...</LoadingButton></TableCell></TableRow>; if (alertes.length === 0) return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucune alerte trouvée</TableCell></TableRow>; return alertes.map((item, index) => (<TableRow key={`${item.patientId}-${item.id}-${index}`} hover sx={item.severity === 'critical' ? { bgcolor: 'error.lighter' } : {}}><TableCell>{fDateTime(item.date)}</TableCell><TableCell>{item.patientName}</TableCell><TableCell>{item.type}</TableCell><TableCell>{item.message}</TableCell><TableCell><Chip label={getSeverityLabel(item.severity)} size="small" color={getSeverityColor(item.severity)} /></TableCell><TableCell>{item.medecin}</TableCell></TableRow>)); })()}</TableBody></Table></Scrollbar></TableContainer>
          <TablePagination page={page} component="div" count={-1} rowsPerPage={rowsPerPage} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Lignes par page:" />
        </Card>
      </Stack>
    </>
  );
}
