import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { RouterLink } from 'src/routes/components';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { ConfirmDeleteDialog, ConfirmActionDialog } from 'src/components/confirm-dialog';

// ----------------------------------------------------------------------

export default function AdminSchoolsView() {
  const { showApiResponse } = useNotification();
  
  const [schools, setSchools] = useState([]);
  const [pendingSchools, setPendingSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [hasPaidFilter, setHasPaidFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' ou 'pending'
  const [deleteDialog, setDeleteDialog] = useState({ open: false, school: null, loading: false });
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', school: null, loading: false, reason: '' });

  const loadSchools = async () => {
    setLoading(true);
    try {
      // Utiliser l'API admin pour les écoles
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
      };
      
      if (verifiedFilter !== '') filters.verified = verifiedFilter === 'true';
      if (hasPaidFilter !== '') filters.hasPaid = hasPaidFilter === 'true';
      if (regionFilter) filters.region = regionFilter;

      const result = await ConsumApi.getSchools(filters);
      
      if (result.success) {
        setSchools(result.data.schools || []);
        setTotal(result.data.total || 0);
      } else {
        // Fallback vers des données mockées si l'API n'est pas disponible
        const mockSchools = [
          {
            id: 1,
            name: 'École Supérieure de Commerce',
            slogan: 'Excellence et Innovation',
            region: 'Abidjan',
            city: 'Cocody',
            Url: null,
            isVerified: true,
            hasPaid: true,
            createdAt: '2024-01-15T10:00:00Z'
          },
          {
            id: 2,
            name: 'Institut de Technologie',
            slogan: 'Technologie et Avenir',
            region: 'Bouaké',
            city: 'Centre',
            Url: null,
            isVerified: false,
            hasPaid: false,
            createdAt: '2024-02-20T14:30:00Z'
          },
          {
            id: 3,
            name: 'Université des Sciences',
            slogan: 'Science et Recherche',
            region: 'San-Pédro',
            city: 'Port',
            Url: null,
            isVerified: true,
            hasPaid: false,
            createdAt: '2024-03-10T09:15:00Z'
          }
        ];

        // Appliquer les filtres
        let filteredSchools = mockSchools;
        
        if (verifiedFilter !== '') {
          const isVerified = verifiedFilter === 'true';
          filteredSchools = filteredSchools.filter(school => school.isVerified === isVerified);
        }
        
        if (hasPaidFilter !== '') {
          const hasPaid = hasPaidFilter === 'true';
          filteredSchools = filteredSchools.filter(school => school.hasPaid === hasPaid);
        }
        
        if (regionFilter) {
          filteredSchools = filteredSchools.filter(school => 
            school.region.toLowerCase().includes(regionFilter.toLowerCase())
          );
        }

        // Pagination côté client
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedSchools = filteredSchools.slice(startIndex, endIndex);
        
        setSchools(paginatedSchools);
        setTotal(filteredSchools.length);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      setSchools([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingSchools = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getPendingSchools({
        page: page + 1,
        limit: rowsPerPage,
      });

      if (result.success) {
        setPendingSchools(result.data.schools || []);
        setTotal(result.data.total || 0);
      } else {
        // Fallback vers des données mockées
        const mockPendingSchools = [
          {
            id: 4,
            name: 'École Polytechnique',
            slogan: 'Ingénierie et Innovation',
            region: 'Bouaké',
            city: 'Centre',
            Url: null,
            isVerified: false,
            hasPaid: false,
            createdAt: '2024-02-01T08:00:00Z',
            status: 'pending',
          },
          {
            id: 5,
            name: 'Institut Supérieur de Management',
            slogan: 'Management et Leadership',
            region: 'San-Pédro',
            city: 'Port',
            Url: null,
            isVerified: false,
            hasPaid: false,
            createdAt: '2024-02-05T12:30:00Z',
            status: 'pending',
          },
        ];
        setPendingSchools(mockPendingSchools);
        setTotal(mockPendingSchools.length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des écoles en attente:', error);
      // Données mockées en cas d'erreur
      const mockPendingSchools = [
        {
          id: 4,
          name: 'École Polytechnique',
          slogan: 'Ingénierie et Innovation',
          region: 'Bouaké',
          city: 'Centre',
          Url: null,
          isVerified: false,
          hasPaid: false,
          createdAt: '2024-02-01T08:00:00Z',
          status: 'pending',
        },
        {
          id: 5,
          name: 'Institut Supérieur de Management',
          slogan: 'Management et Leadership',
          region: 'San-Pédro',
          city: 'Port',
          Url: null,
          isVerified: false,
          hasPaid: false,
          createdAt: '2024-02-05T12:30:00Z',
          status: 'pending',
        },
      ];
      setPendingSchools(mockPendingSchools);
      setTotal(mockPendingSchools.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'all') {
      loadSchools();
    } else if (activeTab === 'pending') {
      loadPendingSchools();
    }
  }, [page, rowsPerPage, verifiedFilter, hasPaidFilter, regionFilter, activeTab]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = currentSchools.map((n) => n.id);
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

  const handleActionClick = (type, school) => {
    setActionDialog({ open: true, type, school, loading: false, reason: '' });
  };

  const handleActionConfirm = async () => {
    const { type, school } = actionDialog;
    setActionDialog({ ...actionDialog, loading: true });
    
    try {
      let result;
      switch (type) {
        case 'validate':
          result = await ConsumApi.validateSchool(school.id);
          break;
        case 'reject':
          result = await ConsumApi.rejectSchool(school.id);
          break;
        case 'togglePremium':
          if (school.hasPaid) {
            result = await ConsumApi.deactivateSchoolPremium(school.id);
          } else {
            result = await ConsumApi.activateSchoolPremium(school.id);
          }
          break;
        default:
          return;
      }
      
      showApiResponse(result, {
        successTitle: getActionText(type),
        errorTitle: 'Erreur lors de l\'action',
      });
      
      if (result.success) {
        setActionDialog({ open: false, type: '', school: null, loading: false, reason: '' });
        loadSchools();
      } else {
        setActionDialog({ ...actionDialog, loading: false });
      }
    } catch (error) {
      console.error('Error performing action:', error);
      showApiResponse({ 
        success: false, 
        message: 'Erreur lors de l\'action' 
      }, {
        errorTitle: 'Erreur'
      });
      setActionDialog({ ...actionDialog, loading: false });
    }
  };

  const getActionText = (type) => {
    switch (type) {
      case 'validate': return 'École validée';
      case 'reject': return 'École rejetée';
      case 'togglePremium': return 'Statut premium modifié';
      default: return 'Action effectuée';
    }
  };

  const getActionMessage = (type, school) => {
    switch (type) {
      case 'validate': return `Êtes-vous sûr de vouloir valider l'école "${school.name}" ?`;
      case 'reject': return `Êtes-vous sûr de vouloir rejeter l'école "${school.name}" ?`;
      case 'togglePremium': 
        return school.hasPaid 
          ? `Êtes-vous sûr de vouloir désactiver le statut premium pour "${school.name}" ?`
          : `Êtes-vous sûr de vouloir activer le statut premium pour "${school.name}" ?`;
      default: return 'Êtes-vous sûr de vouloir effectuer cette action ?';
    }
  };

  const getActionTitle = (type) => {
    switch (type) {
      case 'validate': return 'Valider l\'école';
      case 'reject': return 'Rejeter l\'école';
      case 'togglePremium': return 'Modifier le statut premium';
      default: return 'Confirmer l\'action';
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'validate': return 'success';
      case 'reject': return 'error';
      case 'togglePremium': return 'warning';
      default: return 'primary';
    }
  };

  const getConfirmText = (type) => {
    switch (type) {
      case 'validate': return 'Valider';
      case 'reject': return 'Rejeter';
      case 'togglePremium': return 'Confirmer';
      default: return 'Confirmer';
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'validate': return 'eva:checkmark-circle-2-fill';
      case 'reject': return 'eva:close-circle-fill';
      case 'togglePremium': return 'eva:settings-2-fill';
      default: return 'eva:settings-2-fill';
    }
  };

  const handleValidateSchool = (schoolId) => {
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      handleActionClick('validate', school);
    }
  };

  const handleRejectSchool = (schoolId) => {
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      handleActionClick('reject', school);
    }
  };

  const handleTogglePremium = (schoolId, currentStatus) => {
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      handleActionClick('togglePremium', school);
    }
  };

  const handleDeleteClick = (school) => {
    setDeleteDialog({ open: true, school, loading: false });
  };

  const handleDeleteConfirm = async () => {
    const { school } = deleteDialog;
    setDeleteDialog({ ...deleteDialog, loading: true });
    
    try {
      const result = await ConsumApi.deleteSchool(school.id);
      showApiResponse(result, {
        successTitle: 'École supprimée',
        errorTitle: 'Erreur de suppression',
      });
      
      if (result.success) {
        setDeleteDialog({ open: false, school: null, loading: false });
        if (activeTab === 'all') {
          loadSchools();
        } else {
          loadPendingSchools();
        }
      } else {
        setDeleteDialog({ ...deleteDialog, loading: false });
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      showApiResponse({ 
        success: false, 
        message: 'Erreur lors de la suppression' 
      }, {
        errorTitle: 'Erreur'
      });
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  const handleDeleteSchool = async (schoolId) => {
    const school = currentSchools.find(s => s.id === schoolId);
    if (school) {
      handleDeleteClick(school);
    }
  };

  const currentSchools = activeTab === 'all' ? schools : pendingSchools;
  const isNotFound = !currentSchools.length && !loading;

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Gestion des Écoles</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Gérez les écoles de la plateforme
        </Typography>
        
        {/* Onglets */}
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1}>
            <Chip
              label={`Toutes les écoles (${total})`}
              color={activeTab === 'all' ? 'primary' : 'default'}
              onClick={() => setActiveTab('all')}
              clickable
            />
            <Chip
              label={`En attente (${activeTab === 'pending' ? total : pendingSchools.length})`}
              color={activeTab === 'pending' ? 'primary' : 'default'}
              onClick={() => setActiveTab('pending')}
              clickable
            />
          </Stack>
        </Box>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Vérification</InputLabel>
            <Select
              value={verifiedFilter}
              label="Vérification"
              onChange={(e) => setVerifiedFilter(e.target.value)}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="true">Vérifiées</MenuItem>
              <MenuItem value="false">Non vérifiées</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Premium</InputLabel>
            <Select
              value={hasPaidFilter}
              label="Premium"
              onChange={(e) => setHasPaidFilter(e.target.value)}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="true">Payant</MenuItem>
              <MenuItem value="false">Gratuit</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Région"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            placeholder="Filtrer par région"
            sx={{ minWidth: 200 }}
          />
        </Stack>
      </Card>

      <Card>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size="medium" sx={{ minWidth: 960 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < schools.length}
                      checked={schools.length > 0 && selected.length === schools.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell>École</TableCell>
                  <TableCell>Région</TableCell>
                  <TableCell>Vérification</TableCell>
                  <TableCell>Premium</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {currentSchools.map((school) => (
                  <TableRow
                    hover
                    key={school.id}
                    selected={selected.indexOf(school.id) !== -1}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.indexOf(school.id) !== -1}
                        onChange={(event) => handleClick(event, school.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {school.Url && (
                          <Box
                            component="img"
                            src={school.Url}
                            sx={{ width: 40, height: 40, borderRadius: 1, mr: 2 }}
                          />
                        )}
                        <Box>
                          <Typography variant="subtitle2" noWrap>
                            {school.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {school.slogan}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {school.region}, {school.city}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={school.isVerified ? 'Vérifiée' : 'En attente'}
                        color={school.isVerified ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={school.hasPaid ? 'Premium' : 'Gratuit'}
                        color={school.hasPaid ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        Créée le {new Date(school.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      {!school.isVerified && (
                        <>
                          <Tooltip title="Valider">
                            <IconButton
                              color="success"
                              onClick={() => handleValidateSchool(school.id)}
                            >
                              <Iconify icon="solar:check-circle-bold" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rejeter">
                            <IconButton
                              color="error"
                              onClick={() => handleRejectSchool(school.id)}
                            >
                              <Iconify icon="solar:close-circle-bold" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip title="Toggle Premium">
                        <IconButton
                          color={school.hasPaid ? 'warning' : 'success'}
                          onClick={() => handleTogglePremium(school.id, school.hasPaid)}
                        >
                          <Iconify icon={school.hasPaid ? 'solar:star-bold' : 'solar:star-outline'} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Voir détails">
                        <IconButton
                          component={RouterLink}
                          href={`/admin/schools/${school.id}`}
                        >
                          <Iconify icon="solar:eye-bold" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Modifier">
                        <IconButton
                          component={RouterLink}
                          href={`/admin/schools/${school.id}/edit`}
                        >
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Supprimer">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteSchool(school.id)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              {isNotFound && (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 3 }}>
                      <Typography variant="h6" sx={{ textAlign: 'center' }}>
                        Aucune école trouvée
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePagination
          page={page}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, school: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'école"
        message="Êtes-vous sûr de vouloir supprimer cette école ?"
        itemName={deleteDialog.school?.name}
        loading={deleteDialog.loading}
      />

      <ConfirmActionDialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ open: false, type: '', school: null, loading: false, reason: '' })}
        onConfirm={handleActionConfirm}
        title={getActionTitle(actionDialog.type)}
        message={actionDialog.school ? getActionMessage(actionDialog.type, actionDialog.school) : ''}
        itemName={actionDialog.school?.name}
        loading={actionDialog.loading}
        confirmText={getConfirmText(actionDialog.type)}
        confirmColor={getActionColor(actionDialog.type)}
        icon={getActionIcon(actionDialog.type)}
        showReason={actionDialog.type === 'reject'}
        reason={actionDialog.reason}
        onReasonChange={(reason) => setActionDialog({ ...actionDialog, reason })}
        reasonLabel="Raison du rejet"
        reasonPlaceholder="Expliquez pourquoi cette école est rejetée..."
      />
    </>
  );
}