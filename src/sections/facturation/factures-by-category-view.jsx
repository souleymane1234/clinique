import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import {
  Card,
  Chip,
  Table,
  Stack,
  Button,
  Select,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  TableContainer,
  TablePagination,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import { fDate } from 'src/utils/format-time';
import { fNumber } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

// Plus besoin de catégories, on affiche seulement les factures proforma

// Fonction helper pour extraire le nom du créateur de la facture
const getCreatorName = (facture) => {
  // Essayer différents champs possibles pour le créateur
  const creator = facture.createdBy || facture.author || facture.user || facture.creator;
  
  if (!creator) return '-';
  
  // Si c'est un objet avec firstname/lastname
  if (typeof creator === 'object') {
    const firstName = creator.firstname || creator.firstName || '';
    const lastName = creator.lastname || creator.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (fullName) return fullName;
    if (creator.email) return creator.email;
    if (creator.nom) return creator.nom;
    if (creator.name) return creator.name;
    
    return '-';
  }
  
  // Si c'est une string (nom ou email)
  return creator || '-';
};

export default function FacturesByCategoryView() {
  const router = useRouter();
  const { contextHolder, showError } = useNotification();

  const [facturesProforma, setFacturesProforma] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [clientFilter, setClientFilter] = useState('');
  const [clients, setClients] = useState([]);

  const loadFactures = useCallback(async () => {
    setLoading(true);
    try {
      // Charger toutes les factures et filtrer uniquement les proforma
      const facturesResult = await ConsumApi.getFactures();

      if (facturesResult.success && Array.isArray(facturesResult.data)) {
        const allFactures = facturesResult.data;
        
        // Filtrer uniquement les factures proforma
        const proformaFactures = allFactures.filter(
          (f) => f.type === 'proforma'
        );

        setFacturesProforma(proformaFactures);
      } else {
        setFacturesProforma([]);
      }
    } catch (error) {
      console.error('Error loading factures proforma:', error);
      setFacturesProforma([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const result = await ConsumApi.getClients();
      if (result.success) {
        setClients(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }, []);

  useEffect(() => {
    loadFactures();
    loadClients();
  }, [loadFactures, loadClients]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filtrer les factures proforma par client si nécessaire
  const getFilteredFactures = () => {
    let filtered = facturesProforma.map((f) => ({ ...f, invoiceType: 'proforma' }));

    // Filtrer par client si sélectionné
    if (clientFilter) {
      filtered = filtered.filter((f) => f.clientId === clientFilter || f.client?.id === clientFilter);
    }

    return filtered;
  };

  const filteredFactures = getFilteredFactures();

  const getStats = () => {
    const allFactures = getFilteredFactures();
    return {
      total: allFactures.length,
      totalAmount: allFactures.reduce((sum, f) => sum + (f.montantTotal || 0), 0),
    };
  };

  const stats = getStats();

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Factures Proforma | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Factures Proforma</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              onClick={() => router.back()}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => router.push('/facturation/factures-proforma/create')}
            >
              Créer Facture Proforma
            </Button>
          </Stack>
        </Stack>

        {/* Statistiques */}
        <Stack direction="row" spacing={2} mb={3}>
          <Card sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Factures Proforma
            </Typography>
            <Typography variant="h4">{stats.total}</Typography>
          </Card>
          <Card sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Facturé
            </Typography>
            <Typography variant="h4">{fNumber(stats.totalAmount)} FCFA</Typography>
          </Card>
        </Stack>

        {/* Filtres */}
        <Card sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} p={2}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Client</InputLabel>
              <Select
                value={clientFilter}
                label="Client"
                onChange={(e) => {
                  setClientFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Tous les clients</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.nom} - {client.numero}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Card>


        {/* Table */}
        <Card>
          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Créé par</TableCell>
                    <TableCell>Date Facture</TableCell>
                    <TableCell>Date Échéance</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && filteredFactures.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Aucune facture trouvée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && filteredFactures.length > 0 && filteredFactures
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((facture) => (
                        <TableRow key={`${facture.type}-${facture.id}`} hover>
                          <TableCell>
                            <Chip
                              label="Proforma"
                              color="default"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {facture.numeroFacture || `PRO-${facture.id}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{facture.clientName || facture.client?.nom || '-'}</Typography>
                            {facture.client?.email && (
                              <Typography variant="caption" color="text.secondary">
                                {facture.client.email}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{getCreatorName(facture)}</Typography>
                          </TableCell>
                          <TableCell>{facture.dateFacture ? fDate(facture.dateFacture) : '-'}</TableCell>
                          <TableCell>{facture.dateEcheance ? fDate(facture.dateEcheance) : '-'}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={async () => {
                                try {
                                  // Ouvrir le PDF de la facture dans un nouvel onglet
                                  const result = await ConsumApi.openFacturePdfInNewTab(facture.id);
                                  if (!result.success) {
                                    showError('Erreur', result.message || 'Impossible d\'ouvrir le PDF de la facture');
                                  }
                                } catch (error) {
                                  console.error('Error opening PDF:', error);
                                  showError('Erreur', 'Impossible d\'ouvrir le PDF de la facture');
                                }
                              }}
                            >
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            page={page}
            component="div"
            count={filteredFactures.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>
    </>
  );
}
