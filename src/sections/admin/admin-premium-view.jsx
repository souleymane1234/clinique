import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import {
    Box,
    Tab,
    Card,
    Grid,
    Chip,
    Tabs,
    Stack,
    Table,
    Button,
    Select,
    Dialog,
    Switch,
    Tooltip,
    MenuItem,
    TableRow,
    TextField,
    TableHead,
    TableBody,
    TableCell,
    Container,
    Typography,
    IconButton,
    InputLabel,
    FormControl,
    DialogTitle,
    DialogContent,
    DialogActions,
    TableContainer,
    TablePagination,
    FormControlLabel,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'offers', label: 'Offres Premium', icon: 'eva:gift-outline' },
  { value: 'subscriptions', label: 'Abonnements', icon: 'eva:people-outline' },
  { value: 'modules', label: 'Modules', icon: 'eva:settings-outline' },
  { value: 'payments', label: 'Paiements', icon: 'eva:credit-card-outline' },
  { value: 'stats', label: 'Statistiques', icon: 'eva:bar-chart-outline' },
];

export default function AdminPremiumView() {
  const { showApiResponse } = useNotification();
  const [currentTab, setCurrentTab] = useState('offers');
  const [loading, setLoading] = useState(false);

  // Offers state
  const [offers, setOffers] = useState([]);
  const [offerPage, setOfferPage] = useState(0);
  const [offerRowsPerPage, setOfferRowsPerPage] = useState(10);
  const [offerTotal, setOfferTotal] = useState(0);
  const [offerSearch, setOfferSearch] = useState('');
  const [offerActiveFilter, setOfferActiveFilter] = useState(null);
  const [offerDialog, setOfferDialog] = useState({ open: false, isEdit: false, editingId: null });
  const [newOffer, setNewOffer] = useState({
    name: '',
    description: '',
    price: 0,
    durationDays: 30,
    trialPeriodDays: 0,
    active: true,
  });

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionPage, setSubscriptionPage] = useState(0);
  const [subscriptionRowsPerPage, setSubscriptionRowsPerPage] = useState(10);
  const [subscriptionTotal, setSubscriptionTotal] = useState(0);
  const [subscriptionFilters, setSubscriptionFilters] = useState({
    search: '',
    subscriptionType: '',
    isActive: null,
    status: '',
  });

  // Modules state
  const [modules, setModules] = useState([]);

  // Payments state
  const [payments, setPayments] = useState([]);
  const [paymentPage, setPaymentPage] = useState(0);
  const [paymentRowsPerPage, setPaymentRowsPerPage] = useState(10);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentFilters, setPaymentFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
  });

  // Stats state
  const [stats, setStats] = useState(null);

  // ========== OFFERS ==========

  useEffect(() => {
    if (currentTab === 'offers') {
      fetchOffers();
    } else if (currentTab === 'subscriptions') {
      fetchSubscriptions();
    } else if (currentTab === 'modules') {
      fetchModules();
    } else if (currentTab === 'payments') {
      fetchPayments();
    } else if (currentTab === 'stats') {
      fetchStats();
    }
  }, [currentTab, offerPage, offerRowsPerPage, offerSearch, offerActiveFilter, subscriptionPage, subscriptionRowsPerPage, subscriptionFilters, paymentPage, paymentRowsPerPage, paymentFilters]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getPremiumOffers({
        page: offerPage + 1,
        limit: offerRowsPerPage,
        search: offerSearch || undefined,
        active: offerActiveFilter,
      });
      if (result.success) {
        setOffers(result.data.offers || []);
        setOfferTotal(result.data.total || 0);
      } else {
        showApiResponse(result);
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.createPremiumOffer(newOffer);
      showApiResponse(result);
      if (result.success) {
        setOfferDialog({ open: false, isEdit: false, editingId: null });
        setNewOffer({
          name: '',
          description: '',
          price: 0,
          durationDays: 30,
          trialPeriodDays: 0,
          active: true,
        });
        fetchOffers();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOffer = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.updatePremiumOffer(offerDialog.editingId, newOffer);
      showApiResponse(result);
      if (result.success) {
        setOfferDialog({ open: false, isEdit: false, editingId: null });
        setNewOffer({
          name: '',
          description: '',
          price: 0,
          durationDays: 30,
          trialPeriodDays: 0,
          active: true,
        });
        fetchOffers();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return;
    setLoading(true);
    try {
      const result = await ConsumApi.deletePremiumOffer(id);
      showApiResponse(result);
      if (result.success) {
        fetchOffers();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOffer = async (id) => {
    setLoading(true);
    try {
      const result = await ConsumApi.togglePremiumOffer(id);
      showApiResponse(result);
      if (result.success) {
        fetchOffers();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOfferDialog = (isEdit = false, offer = null) => {
    if (isEdit && offer) {
      setNewOffer({
        name: offer.name || '',
        description: offer.description || '',
        price: offer.price || 0,
        durationDays: offer.durationDays || 30,
        trialPeriodDays: offer.trialPeriodDays || 0,
        active: offer.active !== undefined ? offer.active : true,
      });
      setOfferDialog({ open: true, isEdit: true, editingId: offer.id });
    } else {
      setNewOffer({
        name: '',
        description: '',
        price: 0,
        durationDays: 30,
        trialPeriodDays: 0,
        active: true,
      });
      setOfferDialog({ open: true, isEdit: false, editingId: null });
    }
  };

  const handleCloseOfferDialog = () => {
    setOfferDialog({ open: false, isEdit: false, editingId: null });
    setNewOffer({
      name: '',
      description: '',
      price: 0,
      durationDays: 30,
      trialPeriodDays: 0,
      active: true,
    });
  };

  // ========== SUBSCRIPTIONS ==========

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getPremiumSubscriptions({
        page: subscriptionPage + 1,
        limit: subscriptionRowsPerPage,
        search: subscriptionFilters.search || undefined,
        subscriptionType: subscriptionFilters.subscriptionType || undefined,
        isActive: subscriptionFilters.isActive,
        status: subscriptionFilters.status || undefined,
      });
      if (result.success) {
        setSubscriptions(result.data.subscriptions || []);
        setSubscriptionTotal(result.data.total || 0);
      } else {
        showApiResponse(result);
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubscription = async (id) => {
    setLoading(true);
    try {
      const result = await ConsumApi.activatePremiumSubscription(id);
      showApiResponse(result);
      if (result.success) {
        fetchSubscriptions();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSubscription = async (id) => {
    setLoading(true);
    try {
      const result = await ConsumApi.deactivatePremiumSubscription(id);
      showApiResponse(result);
      if (result.success) {
        fetchSubscriptions();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) return;
    setLoading(true);
    try {
      const result = await ConsumApi.cancelPremiumSubscription(id);
      showApiResponse(result);
      if (result.success) {
        fetchSubscriptions();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSubscription = async (id) => {
    setLoading(true);
    try {
      const result = await ConsumApi.extendPremiumSubscription(id);
      showApiResponse(result);
      if (result.success) {
        fetchSubscriptions();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ========== MODULES ==========

  const fetchModules = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getPremiumModules();
      if (result.success) {
        setModules(result.data.modules || []);
      } else {
        showApiResponse(result);
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModulePremium = async (moduleName) => {
    setLoading(true);
    try {
      const result = await ConsumApi.togglePremiumModulePremium(moduleName);
      showApiResponse(result);
      if (result.success) {
        fetchModules();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModuleFree = async (moduleName) => {
    setLoading(true);
    try {
      const result = await ConsumApi.togglePremiumModuleFree(moduleName);
      showApiResponse(result);
      if (result.success) {
        fetchModules();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };


  const handleSetAllModulesFree = async () => {
    if (!window.confirm('Rendre tous les modules gratuits ?')) return;
    setLoading(true);
    try {
      const result = await ConsumApi.setAllPremiumModulesFree();
      showApiResponse(result);
      if (result.success) {
        fetchModules();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetAllModulesPremium = async () => {
    if (!window.confirm('Rendre tous les modules premium ?')) return;
    setLoading(true);
    try {
      const result = await ConsumApi.setAllPremiumModulesPremium();
      showApiResponse(result);
      if (result.success) {
        fetchModules();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ========== PAYMENTS ==========

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getPremiumPayments({
        page: paymentPage + 1,
        limit: paymentRowsPerPage,
        search: paymentFilters.search || undefined,
        status: paymentFilters.status || undefined,
        paymentMethod: paymentFilters.paymentMethod || undefined,
      });
      if (result.success) {
        setPayments(result.data.payments || []);
        setPaymentTotal(result.data.total || 0);
      } else {
        showApiResponse(result);
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (id, status) => {
    setLoading(true);
    try {
      const result = await ConsumApi.updatePremiumPaymentStatus(id, { status });
      showApiResponse(result);
      if (result.success) {
        fetchPayments();
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ========== STATS ==========

  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getPremiumStats();
      if (result.success) {
        setStats(result.data);
      } else {
        showApiResponse(result);
      }
    } catch (error) {
      showApiResponse({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ========== HELPER FUNCTIONS ==========

  const getPaymentStatusColor = (status) => {
    if (status === 'SUCCES') return 'success';
    if (status === 'ECHEC') return 'error';
    return 'warning';
  };

  const getSubscriptionDaysColor = (isExpired, daysRemaining) => {
    if (isExpired) return 'error';
    if (daysRemaining < 7) return 'warning';
    return 'success';
  };

  // ========== RENDER FUNCTIONS ==========

  const renderOffersTab = () => (
    <Card>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
        <TextField
          size="small"
          placeholder="Rechercher..."
          value={offerSearch}
          onChange={(e) => setOfferSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={offerActiveFilter === null ? '' : offerActiveFilter}
            label="Statut"
            onChange={(e) => setOfferActiveFilter(e.target.value === '' ? null : e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value>Actifs</MenuItem>
            <MenuItem value={false}>Inactifs</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={() => handleOpenOfferDialog(false)}>
          Nouvelle offre
        </Button>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Durée (jours)</TableCell>
              <TableCell>Période d&apos;essai (jours)</TableCell>
              <TableCell>Abonnements</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>{offer.name}</TableCell>
                <TableCell>{offer.description || '-'}</TableCell>
                <TableCell>{offer.price?.toLocaleString()} FCFA</TableCell>
                <TableCell>{offer.durationDays}</TableCell>
                <TableCell>{offer.trialPeriodDays}</TableCell>
                <TableCell>{offer.subscriptionsCount || 0}</TableCell>
                <TableCell>
                  <Chip
                    label={offer.active ? 'Actif' : 'Inactif'}
                    color={offer.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Modifier">
                      <IconButton size="small" onClick={() => handleOpenOfferDialog(true, offer)}>
                        <Iconify icon="eva:edit-fill" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={offer.active ? 'Désactiver' : 'Activer'}>
                      <IconButton size="small" onClick={() => handleToggleOffer(offer.id)}>
                        <Iconify icon={offer.active ? 'eva:eye-off-fill' : 'eva:eye-fill'} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton size="small" color="error" onClick={() => handleDeleteOffer(offer.id)}>
                        <Iconify icon="eva:trash-2-fill" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={offerTotal}
        page={offerPage}
        onPageChange={(e, newPage) => setOfferPage(newPage)}
        rowsPerPage={offerRowsPerPage}
        onRowsPerPageChange={(e) => {
          setOfferRowsPerPage(parseInt(e.target.value, 10));
          setOfferPage(0);
        }}
        labelRowsPerPage="Lignes par page:"
      />
    </Card>
  );

  const renderSubscriptionsTab = () => (
    <Card>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
        <TextField
          size="small"
          placeholder="Rechercher par email..."
          value={subscriptionFilters.search}
          onChange={(e) => setSubscriptionFilters({ ...subscriptionFilters, search: e.target.value })}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={subscriptionFilters.subscriptionType}
            label="Type"
            onChange={(e) => setSubscriptionFilters({ ...subscriptionFilters, subscriptionType: e.target.value })}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="ESSAI">Essai</MenuItem>
            <MenuItem value="PAYANT">Payant</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={subscriptionFilters.isActive === null ? '' : subscriptionFilters.isActive}
            label="Statut"
            onChange={(e) =>
              setSubscriptionFilters({ ...subscriptionFilters, isActive: e.target.value === '' ? null : e.target.value })
            }
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value>Actifs</MenuItem>
            <MenuItem value={false}>Inactifs</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Offre</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date début</TableCell>
              <TableCell>Date expiration</TableCell>
              <TableCell>Montant payé</TableCell>
              <TableCell>Jours restants</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{subscription.userName || subscription.userEmail}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {subscription.userEmail}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{subscription.offerName}</TableCell>
                <TableCell>
                  <Chip label={subscription.subscriptionType} size="small" />
                </TableCell>
                <TableCell>{new Date(subscription.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(subscription.expirationDate).toLocaleDateString()}</TableCell>
                <TableCell>{subscription.amountPaid?.toLocaleString() || 0} FCFA</TableCell>
                <TableCell>
                  <Chip
                    label={subscription.daysRemaining || 0}
                    color={getSubscriptionDaysColor(subscription.isExpired, subscription.daysRemaining)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={subscription.isActive ? 'Actif' : 'Inactif'}
                    color={subscription.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {!subscription.isActive && (
                      <Tooltip title="Activer">
                        <IconButton size="small" color="success" onClick={() => handleActivateSubscription(subscription.id)}>
                          <Iconify icon="eva:checkmark-fill" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {subscription.isActive && (
                      <Tooltip title="Désactiver">
                        <IconButton size="small" color="warning" onClick={() => handleDeactivateSubscription(subscription.id)}>
                          <Iconify icon="eva:close-fill" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Prolonger">
                      <IconButton size="small" color="info" onClick={() => handleExtendSubscription(subscription.id)}>
                        <Iconify icon="eva:clock-fill" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Annuler">
                      <IconButton size="small" color="error" onClick={() => handleCancelSubscription(subscription.id)}>
                        <Iconify icon="eva:trash-2-fill" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={subscriptionTotal}
        page={subscriptionPage}
        onPageChange={(e, newPage) => setSubscriptionPage(newPage)}
        rowsPerPage={subscriptionRowsPerPage}
        onRowsPerPageChange={(e) => {
          setSubscriptionRowsPerPage(parseInt(e.target.value, 10));
          setSubscriptionPage(0);
        }}
        labelRowsPerPage="Lignes par page:"
      />
    </Card>
  );

  const renderModulesTab = () => (
    <Card>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <Typography variant="h6">Gestion des modules</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={handleSetAllModulesFree}>
            Tout rendre gratuit
          </Button>
          <Button size="small" variant="outlined" onClick={handleSetAllModulesPremium}>
            Tout rendre premium
          </Button>
        </Stack>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom du module</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Premium requis</TableCell>
              <TableCell>Accès gratuit</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.id || module.moduleName}>
                <TableCell>
                  <Typography variant="subtitle2">{module.moduleName}</Typography>
                </TableCell>
                <TableCell>{module.description || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={module.premiumRequired ? 'Oui' : 'Non'}
                    color={module.premiumRequired ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={module.freeAccess ? 'Oui' : 'Non'}
                    color={module.freeAccess ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Basculer Premium">
                      <IconButton
                        size="small"
                        onClick={() => handleToggleModulePremium(module.moduleName)}
                      >
                        <Iconify icon={module.premiumRequired ? 'eva:star-fill' : 'eva:star-outline'} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Basculer Accès gratuit">
                      <IconButton size="small" onClick={() => handleToggleModuleFree(module.moduleName)}>
                        <Iconify icon={module.freeAccess ? 'eva:unlock-fill' : 'eva:lock-fill'} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  const renderPaymentsTab = () => (
    <Card>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
        <TextField
          size="small"
          placeholder="Rechercher par email..."
          value={paymentFilters.search}
          onChange={(e) => setPaymentFilters({ ...paymentFilters, search: e.target.value })}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, color: 'text.disabled' }} />,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={paymentFilters.status}
            label="Statut"
            onChange={(e) => setPaymentFilters({ ...paymentFilters, status: e.target.value })}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="SUCCES">Succès</MenuItem>
            <MenuItem value="ECHEC">Échec</MenuItem>
            <MenuItem value="EN_ATTENTE">En attente</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Méthode</InputLabel>
          <Select
            value={paymentFilters.paymentMethod}
            label="Méthode"
            onChange={(e) => setPaymentFilters({ ...paymentFilters, paymentMethod: e.target.value })}
          >
            <MenuItem value="">Toutes</MenuItem>
            <MenuItem value="MOBILE_MONEY">Mobile Money</MenuItem>
            <MenuItem value="CARTE">Carte</MenuItem>
            <MenuItem value="PAYPAL">PayPal</MenuItem>
            <MenuItem value="AUTRE">Autre</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Méthode</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Référence</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{payment.userEmail}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{payment.amount?.toLocaleString() || 0} FCFA</TableCell>
                <TableCell>{payment.paymentMethod}</TableCell>
                <TableCell>
                  <Chip
                    label={payment.status}
                    color={getPaymentStatusColor(payment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{payment.reference || '-'}</TableCell>
                <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={payment.status}
                      onChange={(e) => handleUpdatePaymentStatus(payment.id, e.target.value)}
                    >
                      <MenuItem value="SUCCES">Succès</MenuItem>
                      <MenuItem value="ECHEC">Échec</MenuItem>
                      <MenuItem value="EN_ATTENTE">En attente</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={paymentTotal}
        page={paymentPage}
        onPageChange={(e, newPage) => setPaymentPage(newPage)}
        rowsPerPage={paymentRowsPerPage}
        onRowsPerPageChange={(e) => {
          setPaymentRowsPerPage(parseInt(e.target.value, 10));
          setPaymentPage(0);
        }}
        labelRowsPerPage="Lignes par page:"
      />
    </Card>
  );

  const renderStatsTab = () => {
    if (!stats) {
      return (
        <Card sx={{ p: 3 }}>
          <Typography align="center">Chargement des statistiques...</Typography>
        </Card>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total des offres
            </Typography>
            <Typography variant="h4">{stats.totalOffers || 0}</Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.activeOffers || 0} actives
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total des abonnements
            </Typography>
            <Typography variant="h4">{stats.totalSubscriptions || 0}</Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.activeSubscriptions || 0} actifs
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Revenus totaux
            </Typography>
            <Typography variant="h4">{(stats.totalRevenue || 0).toLocaleString()} FCFA</Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.monthlyRevenue || 0} ce mois
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Taux de conversion
            </Typography>
            <Typography variant="h4">{((stats.conversionRate || 0) * 100).toFixed(1)}%</Typography>
            <Typography variant="caption" color="text.secondary">
              Taux de désabonnement: {((stats.churnRate || 0) * 100).toFixed(1)}%
            </Typography>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <>
      <Helmet>
        <title>Gestion Premium | AnnourTravel</title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Gestion Premium</Typography>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:refresh-fill" />}
            onClick={() => {
              if (currentTab === 'offers') fetchOffers();
              else if (currentTab === 'subscriptions') fetchSubscriptions();
              else if (currentTab === 'modules') fetchModules();
              else if (currentTab === 'payments') fetchPayments();
              else if (currentTab === 'stats') fetchStats();
            }}
            disabled={loading}
          >
            Actualiser
          </Button>
        </Stack>

        <Card sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ px: 2.5, pt: 1 }}>
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={<Iconify icon={tab.icon} />}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Card>

        {currentTab === 'offers' && renderOffersTab()}
        {currentTab === 'subscriptions' && renderSubscriptionsTab()}
        {currentTab === 'modules' && renderModulesTab()}
        {currentTab === 'payments' && renderPaymentsTab()}
        {currentTab === 'stats' && renderStatsTab()}

        {/* Offer Dialog */}
        <Dialog open={offerDialog.open} onClose={handleCloseOfferDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{offerDialog.isEdit ? 'Modifier l\'offre' : 'Créer une nouvelle offre'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Nom de l'offre *"
                value={newOffer.name}
                onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                placeholder="Ex: Premium Mensuel"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newOffer.description}
                onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                placeholder="Description de l'offre"
              />
              <TextField
                fullWidth
                type="number"
                label="Prix (FCFA) *"
                value={newOffer.price}
                onChange={(e) => setNewOffer({ ...newOffer, price: parseInt(e.target.value, 10) || 0 })}
              />
              <TextField
                fullWidth
                type="number"
                label="Durée (jours) *"
                value={newOffer.durationDays}
                onChange={(e) => setNewOffer({ ...newOffer, durationDays: parseInt(e.target.value, 10) || 0 })}
              />
              <TextField
                fullWidth
                type="number"
                label="Période d&apos;essai (jours)"
                value={newOffer.trialPeriodDays}
                onChange={(e) => setNewOffer({ ...newOffer, trialPeriodDays: parseInt(e.target.value, 10) || 0 })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newOffer.active}
                    onChange={(e) => setNewOffer({ ...newOffer, active: e.target.checked })}
                  />
                }
                label="Offre active"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseOfferDialog}>Annuler</Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon={offerDialog.isEdit ? 'eva:checkmark-fill' : 'eva:plus-fill'} />}
              onClick={offerDialog.isEdit ? handleUpdateOffer : handleCreateOffer}
              disabled={loading || !newOffer.name.trim() || !newOffer.price || !newOffer.durationDays}
            >
              {offerDialog.isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

