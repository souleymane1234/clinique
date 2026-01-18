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
  TableContainer,
  InputAdornment,
  TablePagination,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import { fDateTime } from 'src/utils/format-time';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const ACTION_COLORS = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  LOGIN: 'primary',
  LOGOUT: 'default',
  VIEW: 'secondary',
  EXPORT: 'warning',
  IMPORT: 'warning',
};

const ACTION_LABELS = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  VIEW: 'Consultation',
  EXPORT: 'Export',
  IMPORT: 'Import',
};

export default function ActivityLogView() {
  const { contextHolder, showApiResponse, showError } = useNotification();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (search) filters.search = search;
      if (actionFilter) filters.action = actionFilter;
      if (userFilter) filters.userId = userFilter;
      if (moduleFilter) filters.module = moduleFilter;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const result = await ConsumApi.getActivityLogs(filters);
      const processed = showApiResponse(result, {
        successTitle: 'Journal chargé',
        errorTitle: 'Erreur de chargement',
        showNotification: false,
      });

      if (processed.success) {
        setActivities(Array.isArray(processed.data?.activities) ? processed.data.activities : processed.data || []);
        if (processed.data?.stats) {
          setStats(processed.data.stats);
        }
        if (processed.data?.pagination) {
          // Le pagination sera géré côté client pour l'instant
        }
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      showError('Erreur', 'Impossible de charger le journal d\'activité');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, actionFilter, userFilter, moduleFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleExport = async () => {
    try {
      const filters = {};
      if (search) filters.search = search;
      if (actionFilter) filters.action = actionFilter;
      if (userFilter) filters.userId = userFilter;
      if (moduleFilter) filters.module = moduleFilter;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const result = await ConsumApi.exportActivityLogs(filters);
      if (result.success && result.data?.url) {
        window.open(result.data.url, '_blank');
        showApiResponse({ success: true, message: 'Export réussi' });
      } else {
        showError('Erreur', 'Impossible d\'exporter le journal');
      }
    } catch (error) {
      console.error('Error exporting activities:', error);
      showError('Erreur', 'Impossible d\'exporter le journal');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setActionFilter('');
    setUserFilter('');
    setModuleFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  return (
    <>
      <Helmet>
        <title> Journal d&apos;activité | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Journal d&apos;activité</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Historique des actions effectuées dans le système
            </Typography>
          </Box>

          {/* Stats Cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Card sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total
              </Typography>
              <Typography variant="h4">{stats.total.toLocaleString()}</Typography>
            </Card>
            <Card sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Aujourd&apos;hui
              </Typography>
              <Typography variant="h4">{stats.today}</Typography>
            </Card>
            <Card sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Cette semaine
              </Typography>
              <Typography variant="h4">{stats.thisWeek}</Typography>
            </Card>
            <Card sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Ce mois
              </Typography>
              <Typography variant="h4">{stats.thisMonth}</Typography>
            </Card>
          </Stack>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par utilisateur, action, module..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadActivities();
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
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={actionFilter}
                    label="Action"
                    onChange={(e) => setActionFilter(e.target.value)}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {Object.entries(ACTION_LABELS).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Module</InputLabel>
                  <Select
                    value={moduleFilter}
                    label="Module"
                    onChange={(e) => setModuleFilter(e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="users">Utilisateurs</MenuItem>
                    <MenuItem value="clients">Clients</MenuItem>
                    <MenuItem value="factures">Facturation</MenuItem>
                    <MenuItem value="settings">Paramétrage</MenuItem>
                    <MenuItem value="roles">Rôles & Permissions</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  type="date"
                  label="Date début"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  type="date"
                  label="Date fin"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={handleClearFilters} startIcon={<Iconify icon="eva:refresh-fill" />}>
                  Réinitialiser
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={loadActivities}
                  loading={loading}
                  startIcon={<Iconify icon="eva:search-fill" />}
                >
                  Rechercher
                </LoadingButton>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleExport}
                  startIcon={<Iconify icon="eva:download-fill" />}
                >
                  Exporter
                </Button>
              </Stack>
            </Stack>
          </Card>

          {/* Activities Table */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date & Heure</TableCell>
                      <TableCell>Utilisateur</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Module</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>IP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          Chargement...
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading && activities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          Aucune activité trouvée
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading &&
                      activities.map((activity) => (
                        <TableRow key={activity.id} hover>
                          <TableCell>{fDateTime(activity.createdAt || activity.timestamp)}</TableCell>
                          <TableCell>
                            {activity.user?.firstName || activity.user?.firstname} {activity.user?.lastName || activity.user?.lastname}
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {activity.user?.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ACTION_LABELS[activity.action] || activity.action}
                              color={ACTION_COLORS[activity.action] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={activity.module || 'N/A'} variant="outlined" size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{activity.description || activity.message || 'N/A'}</Typography>
                            {activity.details && (
                              <Typography variant="caption" color="text.secondary">
                                {JSON.stringify(activity.details)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">{activity.ipAddress || 'N/A'}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
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
    </>
  );
}
