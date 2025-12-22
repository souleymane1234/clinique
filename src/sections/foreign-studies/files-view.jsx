import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import {
  Card,
  Chip, Table,
  Stack,
  Button,
  Dialog,
  Select,
  Popover,
  Checkbox,
  TableRow,
  MenuItem,
  TableHead,
  TableBody,
  TableCell,
  Container,
  TextField,
  Typography,
  IconButton,
  InputLabel, DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
  TablePagination
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'student', label: 'Étudiant', align: 'left' },
  { id: 'targetCountry', label: 'Pays de destination', align: 'left' },
  { id: 'status', label: 'Statut', align: 'center' },
  { id: 'applicationsCount', label: 'Candidatures', align: 'center' },
  { id: 'createdAt', label: 'Créé le', align: 'center' },
  { id: 'actions', label: 'Actions', align: 'center' },
];

const STATUS_OPTIONS = [
  { value: 'BROUILLON', label: 'Brouillon', color: 'default' },
  { value: 'SOUMIS', label: 'Soumis', color: 'info' },
  { value: 'ACCEPTE', label: 'Accepté', color: 'success' },
  { value: 'REFUSE', label: 'Refusé', color: 'error' },
];

// ----------------------------------------------------------------------

export default function FilesView() {
  const navigate = useNavigate();
  const { showApiResponse } = useNotification();

  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetCountryFilter, setTargetCountryFilter] = useState('');
  const [selected, setSelected] = useState([]);
  const [openPopover, setOpenPopover] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', file: null });

  const handleOpenMenu = (event, file) => {
    setOpenPopover(event.currentTarget);
    setActionDialog({ ...actionDialog, file });
  };

  const handleCloseMenu = () => {
    setOpenPopover(null);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = files.map((file) => file.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleTargetCountryFilter = (event) => {
    setTargetCountryFilter(event.target.value);
    setPage(0);
  };

  const handleAction = (type) => {
    setActionDialog({ open: true, type, file: actionDialog.file });
    handleCloseMenu();
  };

  const handleActionConfirm = async () => {
    const { type, file } = actionDialog;

    try {
      let result;
      switch (type) {
        case 'delete':
          result = await ConsumApi.deleteForeignStudiesFile(file.id);
          break;
        default:
          return;
      }

      showApiResponse(result, {
        successTitle: 'Succès',
        errorTitle: 'Erreur',
      });

      if (result.success) {
        fetchFiles();
      }
    } catch (error) {
      showApiResponse(
        {
          success: false,
          message: "Erreur lors de l'action",
        },
        {
          errorTitle: 'Erreur',
        }
      );
    }

    setActionDialog({ open: false, type: '', file: null });
  };

  const fetchFiles = async () => {
    try {
      const result = await ConsumApi.getForeignStudiesFiles({
        page: page + 1,
        limit: rowsPerPage,
        search,
        status: statusFilter,
        targetCountry: targetCountryFilter,
      });

      if (result.success) {
        setFiles(result.data.data || []);
        setTotal(result.data.total || 0);
      } else {
        showApiResponse(result, {
          errorTitle: 'Erreur de chargement',
        });
      }
    } catch (error) {
      showApiResponse(
        {
          success: false,
          message: 'Erreur lors du chargement des dossiers',
        },
        {
          errorTitle: 'Erreur',
        }
      );
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [page, rowsPerPage, search, statusFilter, targetCountryFilter]);

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - total) : 0;

  const getStatusColor = (status) => {
    const statusOption = STATUS_OPTIONS.find((option) => option.value === status);
    return statusOption?.color || 'default';
  };

  const getStatusLabel = (status) => {
    const statusOption = STATUS_OPTIONS.find((option) => option.value === status);
    return statusOption?.label || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <>
      <Helmet>
        <title> Dossiers Études à l&apos;Étranger | AnnourTravel</title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Dossiers Études à l&apos;Étranger</Typography>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:bar-chart-fill" />}
            onClick={() => navigate(routesName.adminForeignStudiesFileStats)}
          >
            Statistiques
          </Button>
        </Stack>

        <Card>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2.5 }}
          >
            <TextField
              fullWidth
              placeholder="Rechercher par nom d&apos;étudiant ou email..."
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select value={statusFilter} label="Statut" onChange={handleStatusFilter}>
                <MenuItem value="">Tous les statuts</MenuItem>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Pays de destination</InputLabel>
              <Select
                value={targetCountryFilter}
                label="Pays de destination"
                onChange={handleTargetCountryFilter}
              >
                <MenuItem value="">Tous les pays</MenuItem>
                <MenuItem value="France">France</MenuItem>
                <MenuItem value="Canada">Canada</MenuItem>
                <MenuItem value="Allemagne">Allemagne</MenuItem>
                <MenuItem value="Belgique">Belgique</MenuItem>
                <MenuItem value="Suisse">Suisse</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < files.length}
                      checked={files.length > 0 && selected.length === files.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  {TABLE_HEAD.map((headCell) => (
                    <TableCell key={headCell.id} align={headCell.align}>
                      {headCell.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Stack spacing={2} alignItems="center">
                        <Iconify icon="eva:file-remove-outline" width={64} sx={{ color: 'text.disabled' }} />
                        <Typography variant="h6" color="text.secondary">
                          Aucun dossier trouvé
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {search || statusFilter || targetCountryFilter
                            ? 'Aucun dossier ne correspond à vos critères de recherche.'
                            : 'Aucun dossier d\'études à l\'étranger n\'a été créé pour le moment.'}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {files.map((row) => {
                      const isItemSelected = isSelected(row.id);
                      return (
                        <TableRow
                          hover
                          key={row.id}
                          tabIndex={-1}
                          role="checkbox"
                          selected={isItemSelected}
                          aria-checked={isItemSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isItemSelected}
                              onChange={(event) => handleClick(event, row.id)}
                            />
                          </TableCell>

                          <TableCell component="th" scope="row" padding="none">
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 2 }}>
                              <Typography variant="subtitle2" noWrap>
                                {row.student?.email || 'Étudiant'}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell align="left">{row.targetCountry}</TableCell>

                          <TableCell align="center">
                            <Chip
                              label={getStatusLabel(row.status)}
                              color={getStatusColor(row.status)}
                              size="small"
                            />
                          </TableCell>

                          <TableCell align="center">{row.applicationsCount || 0}</TableCell>

                          <TableCell align="center">{formatDate(row.createdAt)}</TableCell>

                          <TableCell align="right">
                            <IconButton
                              size="large"
                              color="inherit"
                              onClick={(event) => handleOpenMenu(event, row)}
                            >
                              <Iconify icon="eva:more-vertical-fill" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {emptyRows > 0 && (
                      <TableRow style={{ height: 53 * emptyRows }}>
                        <TableCell colSpan={7} />
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>

        <Popover
          open={Boolean(openPopover)}
          anchorEl={openPopover}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              p: 1,
              width: 140,
              '& .MuiMenuItem-root': {
                px: 1,
                typography: 'body2',
                borderRadius: 0.75,
              },
            },
          }}
        >
          <MenuItem
            onClick={() =>
              navigate(
                `${routesName.adminForeignStudiesFileDetails.replace(':id', actionDialog.file?.id)}`
              )
            }
          >
            <Iconify icon="eva:eye-fill" sx={{ mr: 2 }} />
            Voir
          </MenuItem>

          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => handleAction('delete')}
          >
            <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
            Supprimer
          </MenuItem>
        </Popover>

        <Dialog
          open={actionDialog.open}
          onClose={() => setActionDialog({ open: false, type: '', file: null })}
        >
          <DialogTitle>
            {actionDialog.type === 'delete' && 'Supprimer le dossier'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {actionDialog.type === 'delete' &&
                'Êtes-vous sûr de vouloir supprimer ce dossier ?'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialog({ open: false, type: '', file: null })}>
              Annuler
            </Button>
            <Button onClick={handleActionConfirm} color="error" variant="contained">
              Confirmer
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

