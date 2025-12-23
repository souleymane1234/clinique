import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Chip,
  Tabs,
  Table,
  Stack,
  Alert,
  Button,
  Dialog,
  Select,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';

import { routesName } from 'src/constants/routes';
import ConsumApi from 'src/services_workers/consum_api';
import { useAdminStore } from 'src/store/useAdminStore';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  lead: 'info',
  prospect: 'warning',
  client: 'success',
  archived: 'default',
};

const SERVICE_OPTIONS = [
  { value: 'VisaCanada', label: 'Visa Canada' },
  { value: 'VisaArabieSaoudite', label: 'Visa Arabie Saoudite' },
  { value: 'VisaDubai', label: 'Visa Dubai' },
  { value: 'VisaChine', label: 'Visa Chine' },
  { value: 'VisaMaroc', label: 'Visa Maroc' },
  { value: 'VisaTurquie', label: 'Visa Turquie' },
  { value: 'VisaSchengen', label: 'Visa Schengen (France, Espagne)' },
  { value: 'BilletAvion', label: 'Billet d\'avion' },
  { value: 'ReservationHotel', label: 'Réservation d\'hôtel' },
  { value: 'CircuitDubai', label: 'Package circuit Touristique Dubaï' },
  { value: 'OUMRA', label: 'Package OUMRA Arabie Saoudite' },
  { value: 'AttestationReservationBillet', label: 'Attestation de réservation de billet d\'avion' },
  { value: 'AttestationReservationHotel', label: 'Attestation de réservation d\'hôtel' },
  { value: 'AssuranceVoyage', label: 'Assurance voyage' },
  { value: 'CargoEnvoiColis', label: 'Cargo et envoi de colis' },
  { value: 'TransfertArgent', label: 'Transfert d\'argent' },
];

export default function ClientsView() {
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();
  const { admin } = useAdminStore();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState([]);
  const [commerciaux, setCommerciaux] = useState([]);

  // Vérifier si l'utilisateur est un commercial
  const isCommercial = admin?.service === 'Commercial' || admin?.service === 'commercial';

  // Onglet pour les commerciaux
  const [commercialTab, setCommercialTab] = useState(0); // 0 = Mes clients, 1 = Clients disponibles

  // Filters
  const [viewFilter, setViewFilter] = useState('all'); // all, unassigned, withCommercial
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Dialog pour assigner un client (pour les commerciaux)
  const [assignDialog, setAssignDialog] = useState({
    open: false,
    loading: false,
    client: null,
  });

  // Dialogs
  const [createDialog, setCreateDialog] = useState({
    open: false,
    loading: false,
    formData: {
      nom: '',
      numero: '',
      email: '',
      service: '',
      commentaire: '',
      status: 'lead',
    },
  });

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      
      // Si c'est un commercial, charger selon l'onglet actif
      if (isCommercial && admin?.id) {
        if (commercialTab === 0) {
          // Mes clients assignés
          result = await ConsumApi.getClientsAssignedToUser(admin.id);
        } else {
          // Clients disponibles (non assignés)
          result = await ConsumApi.getUnassignedClients();
        }
      } else if (viewFilter === 'unassigned') {
        // Pour les non-commerciaux, utiliser les filtres existants
        result = await ConsumApi.getUnassignedClients();
      } else if (viewFilter === 'withCommercial') {
        result = await ConsumApi.getClientsWithCommercial();
      } else {
        result = await ConsumApi.getClients();
      }

      if (result.success) {
        setClients(Array.isArray(result.data) ? result.data : []);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [viewFilter, isCommercial, admin?.id, commercialTab]);

  const loadStats = useCallback(async () => {
    try {
      const result = await ConsumApi.getClientsCountByStatus();
      if (result.success) {
        // S'assurer que result.data est un tableau
        const statsData = result.data;
        if (Array.isArray(statsData)) {
          setStats(statsData);
        } else if (statsData && typeof statsData === 'object') {
          // Si c'est un objet, le convertir en tableau
          setStats([]);
        } else {
          setStats([]);
        }
      } else {
        setStats([]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats([]);
    }
  }, []);

  const loadCommerciaux = useCallback(async () => {
    try {
      // Obtenir tous les utilisateurs et filtrer par service "Commercial"
      const result = await ConsumApi.getUsers();
      if (result.success && Array.isArray(result.data)) {
        // Filtrer commerciaux + admins (rôle ou service)
        const commerciauxList = result.data
          .filter((user) => {
            const service = (user.service || '').trim().toLowerCase();
            const role = (user.role || '').trim().toUpperCase();
            return (
              service === 'commercial' ||
              service === 'commerciale' ||
              service.includes('commercial') ||
              service.includes('admin') ||
              role.startsWith('ADMIN') ||
              role === 'SUPERADMIN'
            );
          })
          .map((commercial) => {
            const firstName = commercial.firstname || commercial.firstName || '';
            const lastName = commercial.lastname || commercial.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            
            return {
              id: commercial.id,
              name: fullName || commercial.email || commercial.id,
              email: commercial.email || null,
              firstname: firstName,
              lastname: lastName,
            };
          });
        setCommerciaux(commerciauxList);
      } else {
        setCommerciaux([]);
      }
    } catch (error) {
      console.error('Error loading commerciaux:', error);
      setCommerciaux([]);
    }
  }, []);

  // Helper pour obtenir le nom d'un commercial à partir de assignedTo
  const getCommercialName = (assignedTo) => {
    if (!assignedTo) return '-';
    
    // Si c'est un objet, extraire le nom
    if (typeof assignedTo === 'object' && assignedTo !== null) {
      const firstName = assignedTo.firstname || assignedTo.firstName || '';
      const lastName = assignedTo.lastname || assignedTo.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName) return fullName;
      if (assignedTo.email) return assignedTo.email;
      // Chercher dans la liste des commerciaux chargés
      const commercialId = assignedTo.id || assignedTo.userId;
      if (commercialId) {
        const commercial = commerciaux.find((c) => c.id === commercialId);
        if (commercial && commercial.name) return commercial.name;
      }
      return 'Commercial inconnu';
    }
    
    // Si c'est une string (ID), chercher dans la liste des commerciaux
    const commercial = commerciaux.find((c) => c.id === assignedTo);
    if (commercial && commercial.name) return commercial.name;
    
    // Ne pas afficher l'ID, retourner un message générique
    return 'Commercial inconnu';
  };

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadCommerciaux();
  }, [loadCommerciaux]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openCreateDialog = () => {
    setCreateDialog({
      open: true,
      loading: false,
      formData: {
        nom: '',
        numero: '',
        email: '',
        service: '',
        commentaire: '',
        status: 'lead',
      },
    });
  };

  const closeCreateDialog = () => {
    setCreateDialog({
      open: false,
      loading: false,
      formData: {
        nom: '',
        numero: '',
        email: '',
        service: '',
        commentaire: '',
        status: 'lead',
      },
    });
  };

  const handleCreateClient = async () => {
    if (!createDialog.formData.nom || !createDialog.formData.numero) {
      showError('Erreur', 'Le nom et le numéro sont obligatoires');
      return;
    }

    setCreateDialog({ ...createDialog, loading: true });
    try {
      // Vérifier d'abord si le client existe déjà
      const checkResult = await ConsumApi.checkClientByNumber(createDialog.formData.numero);
      
      if (checkResult.success && checkResult.data) {
        showError('Client existant', 'Un client avec ce numéro existe déjà', 'Vous pouvez le rechercher dans la liste des clients');
        setCreateDialog({ ...createDialog, loading: false });
        return;
      }

      const result = await ConsumApi.createClient(createDialog.formData);
      const processed = showApiResponse(result, {
        successTitle: 'Client créé',
        errorTitle: 'Erreur de création',
      });

      if (processed.success) {
        showSuccess('Succès', result.data?.isExisting ? 'Client existant trouvé' : 'Client créé avec succès');
        closeCreateDialog();
        loadClients();
        loadStats();
      } else {
        setCreateDialog({ ...createDialog, loading: false });
      }
    } catch (error) {
      console.error('Error creating client:', error);
      showError('Erreur', 'Impossible de créer le client');
      setCreateDialog({ ...createDialog, loading: false });
    }
  };

  const getStatusCount = (status) => {
    if (!stats || !Array.isArray(stats)) return 0;
    const stat = stats.find((s) => s && s.status === status);
    if (!stat) return 0;
    // S'assurer qu'on retourne un nombre
    const count = stat._count || stat.count || 0;
    return typeof count === 'number' ? count : 0;
  };

  // Filtrer les clients selon le terme de recherche et le service
  const filteredClients = clients.filter((client) => {
    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const nom = (client.nom || '').toLowerCase();
      const numero = (client.numero || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      
      if (!nom.includes(searchLower) && !numero.includes(searchLower) && !email.includes(searchLower)) {
        return false;
      }
    }
    
    // Filtre par service - comparaison flexible
    if (serviceFilter) {
      const clientService = (client.service || '').trim().toLowerCase();
      const filterService = serviceFilter.trim().toLowerCase();
      
      // Trouver l'option de service correspondante
      const serviceOption = SERVICE_OPTIONS.find(opt => opt.value.toLowerCase() === filterService);
      
      // Debug: Afficher les valeurs pour comprendre le problème
      if (clients.length > 0 && clients.indexOf(client) < 3) {
        console.log('🔍 Debug filtre service:', {
          clientService,
          filterService,
          serviceOption: serviceOption ? { value: serviceOption.value, label: serviceOption.label } : null,
          matchValue: clientService === filterService,
          matchLabel: serviceOption ? clientService === serviceOption.label.toLowerCase() : false,
        });
      }
      
      // Comparer avec la value (ex: "VisaCanada")
      if (clientService === filterService) {
        return true;
      }
      
      // Comparer avec le label (ex: "Visa Canada")
      if (serviceOption && clientService === serviceOption.label.toLowerCase()) {
        return true;
      }
      
      // Comparer partiellement (au cas où il y aurait des variations)
      if (serviceOption) {
        const labelLower = serviceOption.label.toLowerCase();
        if (clientService.includes(labelLower) || labelLower.includes(clientService)) {
          return true;
        }
      }
      
      return false;
    }
    
    return true;
  });

  // Réinitialiser la page quand le terme de recherche ou le filtre de service change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, serviceFilter]);

  // Recharger les clients quand l'onglet change (pour les commerciaux)
  useEffect(() => {
    if (isCommercial) {
      loadClients();
    }
  }, [commercialTab, isCommercial, loadClients]);

  // Fonction pour ouvrir le dialog de confirmation d'assignation
  const handleOpenAssignDialog = (client) => {
    setAssignDialog({ open: true, loading: false, client });
  };

  // Fonction pour assigner un client à soi-même (pour les commerciaux)
  const handleAssignToSelf = async (client) => {
    if (!admin?.id) {
      showError('Erreur', 'Impossible de déterminer votre identité');
      setAssignDialog({ open: false, loading: false, client: null });
      return;
    }

    if (!client) {
      setAssignDialog({ open: false, loading: false, client: null });
      return;
    }

    setAssignDialog(prev => ({ ...prev, loading: true }));
    try {
      const result = await ConsumApi.assignClient(client.id, admin.id);
      const processed = showApiResponse(result, {
        successTitle: 'Client assigné',
        errorTitle: 'Erreur',
      });

      if (processed.success) {
        showSuccess('Succès', 'Client assigné avec succès');
        setAssignDialog({ open: false, loading: false, client: null });
        loadClients(); // Recharger la liste
      } else {
        setAssignDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error assigning client:', error);
      showError('Erreur', 'Impossible d\'assigner le client');
      setAssignDialog(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Clients | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Clients</Typography>
          {!isCommercial && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:person-add-fill" />}
                onClick={() => router.push(routesName.unassignedClients)}
              >
                Clients non assignés
              </Button>
              <Button
                variant="contained"
                color="inherit"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={openCreateDialog}
              >
                Nouveau Client
              </Button>
            </Stack>
          )}
        </Stack>

        {/* Onglets pour les commerciaux */}
        {isCommercial && (
          <Card sx={{ mb: 3 }}>
            <Tabs value={commercialTab} onChange={(e, newValue) => setCommercialTab(newValue)}>
              <Tab label="Mes clients" icon={<Iconify icon="solar:user-bold" />} iconPosition="start" />
              <Tab label="Clients disponibles" icon={<Iconify icon="solar:user-plus-bold" />} iconPosition="start" />
            </Tabs>
          </Card>
        )}

        {/* Statistiques - Masquées pour les commerciaux */}
        {!isCommercial && (
          <Stack direction="row" spacing={2} mb={3}>
            <Card sx={{ p: 2, minWidth: 150 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Leads
              </Typography>
              <Typography variant="h4">{String(getStatusCount('lead'))}</Typography>
            </Card>
            <Card sx={{ p: 2, minWidth: 150 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Prospects
              </Typography>
              <Typography variant="h4">{String(getStatusCount('prospect'))}</Typography>
            </Card>
            <Card sx={{ p: 2, minWidth: 150 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Clients
              </Typography>
              <Typography variant="h4">{String(getStatusCount('client'))}</Typography>
            </Card>
            <Card sx={{ p: 2, minWidth: 150 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total {(searchTerm || serviceFilter) ? '(filtrés)' : ''}
              </Typography>
              <Typography variant="h4">{filteredClients.length}</Typography>
            </Card>
          </Stack>
        )}

        {/* Filtres - Masqués pour les commerciaux */}
        {!isCommercial && (
          <Card sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} p={2}>
              <TextField
                sx={{ flexGrow: 1, maxWidth: 400 }}
                placeholder="Rechercher par nom, numéro ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
                }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Service</InputLabel>
                <Select
                  value={serviceFilter}
                  label="Service"
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('🔍 Service filter changed:', newValue);
                    setServiceFilter(newValue);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">Tous les services</MenuItem>
                  {SERVICE_OPTIONS.map((service) => (
                    <MenuItem key={service.value} value={service.value}>
                      {service.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Vue</InputLabel>
                <Select
                  value={viewFilter}
                  label="Vue"
                  onChange={(e) => {
                    setViewFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">Tous les clients</MenuItem>
                  <MenuItem value="unassigned">Non assignés</MenuItem>
                  <MenuItem value="withCommercial">Avec commercial</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Card>
        )}

        {/* Filtre de recherche pour les commerciaux */}
        {isCommercial && (
          <Card sx={{ mb: 3 }}>
            <Box p={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, numéro ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
                }}
              />
            </Box>
          </Card>
        )}

        {/* Table */}
        <Card>
          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Statut</TableCell>
                    {!isCommercial && <TableCell>Assigné à</TableCell>}
                    <TableCell>Date de création</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={isCommercial ? 7 : 8} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && filteredClients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isCommercial ? 7 : 8} align="center">
                        <Typography variant="body2" color="text.secondary">
                          {(() => {
                            if (searchTerm) return 'Aucun client ne correspond à la recherche';
                            if (isCommercial && commercialTab === 0) return 'Aucun client assigné';
                            if (isCommercial && commercialTab === 1) return 'Aucun client disponible';
                            return 'Aucun client trouvé';
                          })()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && filteredClients.length > 0 && (
                    filteredClients
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((client) => (
                        <TableRow key={client.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{client.nom}</Typography>
                          </TableCell>
                          <TableCell>{client.numero}</TableCell>
                          <TableCell>{client.email || '-'}</TableCell>
                          <TableCell>{client.service || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={client.status || 'lead'}
                              color={STATUS_COLORS[client.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          {!isCommercial && <TableCell>{getCommercialName(client.assignedTo)}</TableCell>}
                          <TableCell>{client.createdAt ? fDate(client.createdAt) : '-'}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {isCommercial && commercialTab === 1 && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Iconify icon="solar:user-plus-bold" />}
                                  onClick={() => handleOpenAssignDialog(client)}
                                >
                                  S&apos;assigner
                                </Button>
                              )}
                              <IconButton
                                onClick={() => {
                                  router.push(`/clients/${client.id}`);
                                }}
                              >
                                <Iconify icon="solar:eye-bold" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            page={page}
            component="div"
            count={filteredClients.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>

        {/* Dialog de confirmation d'assignation (pour les commerciaux) */}
        {isCommercial && (
          <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false, loading: false, client: null })} maxWidth="sm" fullWidth>
            <DialogTitle>Assigner le client</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Alert severity="info">
                  Vous êtes sur le point de vous assigner le client <strong>{assignDialog.client?.nom}</strong>.
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Une fois assigné, ce client apparaîtra dans votre liste de clients.
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAssignDialog({ open: false, loading: false, client: null })} disabled={assignDialog.loading}>
                Annuler
              </Button>
              <LoadingButton
                variant="contained"
                onClick={() => handleAssignToSelf(assignDialog.client)}
                loading={assignDialog.loading}
                disabled={!assignDialog.client}
              >
                Confirmer
              </LoadingButton>
            </DialogActions>
          </Dialog>
        )}

        {/* Dialog de création */}
        {!isCommercial && (
          <Dialog open={createDialog.open} onClose={closeCreateDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Nouveau Client</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField
                  label="Nom *"
                  fullWidth
                  value={createDialog.formData.nom}
                  onChange={(e) =>
                    setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, nom: e.target.value },
                    })
                  }
                />
                <TextField
                  label="Numéro *"
                  fullWidth
                  value={createDialog.formData.numero}
                  onChange={(e) =>
                    setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, numero: e.target.value },
                    })
                  }
                />
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={createDialog.formData.email}
                  onChange={(e) =>
                    setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, email: e.target.value },
                    })
                  }
                />
                <Autocomplete
                  freeSolo
                  options={SERVICE_OPTIONS}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                      return option;
                    }
                    return option.label || option.value || '';
                  }}
                  inputValue={createDialog.formData.service || ''}
                  value={
                    createDialog.formData.service
                      ? SERVICE_OPTIONS.find((opt) => opt.value === createDialog.formData.service) || createDialog.formData.service
                      : null
                  }
                  onInputChange={(event, newInputValue) => {
                    setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, service: newInputValue },
                    });
                  }}
                  onChange={(event, newValue) => {
                    const serviceValue = typeof newValue === 'string' 
                      ? newValue 
                      : newValue?.value || '';
                    setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, service: serviceValue },
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Service" fullWidth />
                  )}
                />
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={createDialog.formData.status}
                    label="Statut"
                    onChange={(e) =>
                      setCreateDialog({
                        ...createDialog,
                        formData: { ...createDialog.formData, status: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="lead">Lead à confirmer</MenuItem>
                    <MenuItem value="prospect">Prospect</MenuItem>
                    <MenuItem value="client">Client confirmer</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Commentaire"
                  fullWidth
                  multiline
                  rows={3}
                  value={createDialog.formData.commentaire}
                  onChange={(e) =>
                    setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, commentaire: e.target.value },
                    })
                  }
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeCreateDialog}>Annuler</Button>
              <LoadingButton
                variant="contained"
                onClick={handleCreateClient}
                loading={createDialog.loading}
              >
                Créer
              </LoadingButton>
            </DialogActions>
          </Dialog>
        )}
      </Container>
    </>
  );
}

