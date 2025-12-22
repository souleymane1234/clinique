import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import {
  Card, Table,
  Stack, Button,
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
  { id: 'name', label: 'Nom', align: 'left' },
  { id: 'country', label: 'Pays', align: 'left' },
  { id: 'website', label: 'Site web', align: 'left' },
  { id: 'applicationsCount', label: 'Candidatures', align: 'center' },
  { id: 'actions', label: 'Actions', align: 'center' },
];

// ----------------------------------------------------------------------

export default function PartnersView() {
  const navigate = useNavigate();
  const { showApiResponse } = useNotification();

  const [partners, setPartners] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [selected, setSelected] = useState([]);
  const [openPopover, setOpenPopover] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', partner: null });

  const handleOpenMenu = (event, partner) => {
    setOpenPopover(event.currentTarget);
    setActionDialog({ ...actionDialog, partner });
  };

  const handleCloseMenu = () => {
    setOpenPopover(null);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = partners.map((partner) => partner.id);
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

  const handleCountryFilter = (event) => {
    setCountryFilter(event.target.value);
    setPage(0);
  };

  const handleAction = (type) => {
    setActionDialog({ open: true, type, partner: actionDialog.partner });
    handleCloseMenu();
  };

  const handleActionConfirm = async () => {
    const { type, partner } = actionDialog;

    try {
      let result;
      switch (type) {
        case 'delete':
          result = await ConsumApi.deleteForeignStudiesPartner(partner.id);
          break;
        default:
          return;
      }

      showApiResponse(result, {
        successTitle: 'Succès',
        errorTitle: 'Erreur',
      });

      if (result.success) {
        fetchPartners();
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

    setActionDialog({ open: false, type: '', partner: null });
  };

  const fetchPartners = async () => {
    try {
      const result = await ConsumApi.getForeignStudiesPartners({
        page: page + 1,
        limit: rowsPerPage,
        search,
        country: countryFilter,
      });

      if (result.success) {
        setPartners(result.data.data || []);
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
          message: 'Erreur lors du chargement des partenaires',
        },
        {
          errorTitle: 'Erreur',
        }
      );
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [page, rowsPerPage, search, countryFilter]);

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - total) : 0;

  return (
    <>
      <Helmet>
        <title> Partenaires Étrangers | AnnourTravel</title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Partenaires Étrangers</Typography>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => navigate(routesName.adminForeignStudiesPartnerCreate)}
          >
            Nouveau partenaire
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
              placeholder="Rechercher par nom ou pays..."
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

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Pays</InputLabel>
              <Select
                value={countryFilter}
                label="Pays"
                onChange={handleCountryFilter}
              >
                <MenuItem value="">Tous les pays</MenuItem>
                <MenuItem value="France">France</MenuItem>
                <MenuItem value="Canada">Canada</MenuItem>
                <MenuItem value="Allemagne">Allemagne</MenuItem>
                <MenuItem value="Belgique">Belgique</MenuItem>
                <MenuItem value="Suisse">Suisse</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:bar-chart-fill" />}
              onClick={() => navigate(routesName.adminForeignStudiesPartnerStats)}
            >
              Statistiques
            </Button>
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < partners.length}
                      checked={partners.length > 0 && selected.length === partners.length}
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
                {partners.map((row) => {
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
                            {row.name}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell align="left">{row.country}</TableCell>

                      <TableCell align="left">
                        {row.website ? (
                          <a href={row.website} target="_blank" rel="noopener noreferrer">
                            {row.website}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>

                      <TableCell align="center">{row.applicationsCount || 0}</TableCell>

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
                    <TableCell colSpan={6} />
                  </TableRow>
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
          <MenuItem onClick={() => navigate(`${routesName.adminForeignStudiesPartnerDetails.replace(':id', actionDialog.partner?.id)}`)}>
            <Iconify icon="eva:eye-fill" sx={{ mr: 2 }} />
            Voir
          </MenuItem>

          <MenuItem onClick={() => navigate(`${routesName.adminForeignStudiesPartnerEdit.replace(':id', actionDialog.partner?.id)}`)}>
            <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
            Modifier
          </MenuItem>

          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => handleAction('delete')}
          >
            <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
            Supprimer
          </MenuItem>
        </Popover>

        <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: '', partner: null })}>
          <DialogTitle>
            {actionDialog.type === 'delete' && 'Supprimer le partenaire'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {actionDialog.type === 'delete' &&
                `Êtes-vous sûr de vouloir supprimer le partenaire "${actionDialog.partner?.name}" ?`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialog({ open: false, type: '', partner: null })}>
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

