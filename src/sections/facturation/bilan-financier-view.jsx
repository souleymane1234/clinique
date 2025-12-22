import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Tab,
  Card,
  Grid,
  Tabs,
  Stack,
  Select,
  MenuItem,
  Container,
  Typography,
  InputLabel,
  FormControl,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fNumber } from 'src/utils/format-number';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

export default function BilanFinancierView() {
  const { contextHolder } = useNotification();
  const [currentTab, setCurrentTab] = useState('mensuel');
  const [loading, setLoading] = useState(false);

  // Bilan mensuel
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [bilanMensuel, setBilanMensuel] = useState(null);

  // Bilan annuel
  const [selectedYearAnnuel, setSelectedYearAnnuel] = useState(new Date().getFullYear());
  const [bilanAnnuel, setBilanAnnuel] = useState(null);

  // Générer les années (5 dernières années)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const loadBilanMensuel = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getBilanMensuel(selectedMonth, selectedYear);
      if (result.success) {
        setBilanMensuel(result.data);
      } else {
        setBilanMensuel(null);
      }
    } catch (error) {
      console.error('Error loading bilan mensuel:', error);
      setBilanMensuel(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const loadBilanAnnuel = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getBilanAnnuel(selectedYearAnnuel);
      if (result.success) {
        setBilanAnnuel(result.data);
      } else {
        setBilanAnnuel(null);
      }
    } catch (error) {
      console.error('Error loading bilan annuel:', error);
      setBilanAnnuel(null);
    } finally {
      setLoading(false);
    }
  }, [selectedYearAnnuel]);

  useEffect(() => {
    if (currentTab === 'mensuel') {
      loadBilanMensuel();
    } else {
      loadBilanAnnuel();
    }
  }, [currentTab, loadBilanMensuel, loadBilanAnnuel]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const renderBilanMensuel = () => {
    if (!bilanMensuel) {
      return (
        <Card sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Aucune donnée disponible
          </Typography>
        </Card>
      );
    }

    const { revenus, depenses, factures, bilan } = bilanMensuel;

    return (
      <Grid container spacing={3}>
        {/* Sélecteurs */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Mois</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Mois"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {MONTHS.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Année</InputLabel>
                <Select
                  value={selectedYear}
                  label="Année"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Card>
        </Grid>

        {/* Revenus */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" color="success.main">
                Revenus
              </Typography>
              <Typography variant="h4">{fNumber(revenus?.total || 0)} FCFA</Typography>
              <Typography variant="body2" color="text.secondary">
                {revenus?.nombrePaiements || 0} paiement(s)
              </Typography>
            </Stack>
          </Card>
        </Grid>

        {/* Dépenses */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" color="error.main">
                Dépenses
              </Typography>
              <Typography variant="h4">{fNumber(depenses?.total || 0)} FCFA</Typography>
              <Typography variant="body2" color="text.secondary">
                {depenses?.nombreBons || 0} bon(s) de sortie
              </Typography>
            </Stack>
          </Card>
        </Grid>

        {/* Bilan */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Bilan</Typography>
              <Typography
                variant="h4"
                color={bilan?.solde >= 0 ? 'success.main' : 'error.main'}
              >
                {fNumber(bilan?.solde || 0)} FCFA
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Marge: {bilan?.marge || '0.00'}%
              </Typography>
            </Stack>
          </Card>
        </Grid>

        {/* Détails Revenus */}
        {revenus?.parMethode && Object.keys(revenus.parMethode).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Revenus par méthode de paiement
              </Typography>
              <Stack spacing={1}>
                {Object.entries(revenus.parMethode).map(([methode, montant]) => (
                  <Box key={methode} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{methode}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {fNumber(montant)} FCFA
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        )}

        {/* Détails Dépenses */}
        {depenses?.parCategorie && Object.keys(depenses.parCategorie).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dépenses par catégorie
              </Typography>
              <Stack spacing={1}>
                {Object.entries(depenses.parCategorie).map(([categorie, montant]) => (
                  <Box key={categorie} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{categorie}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {fNumber(montant)} FCFA
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        )}

        {/* Factures */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Factures
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h6">{fNumber(factures?.total || 0)} FCFA</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Payées
                </Typography>
                <Typography variant="h6" color="success.main">
                  {fNumber(factures?.payees || 0)} FCFA
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  En attente
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {fNumber(factures?.enAttente || 0)} FCFA
                </Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderBilanAnnuel = () => {
    if (!bilanAnnuel) {
      return (
        <Card sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Aucune donnée disponible
          </Typography>
        </Card>
      );
    }

    const { revenus, depenses, factures, bilan } = bilanAnnuel;

    return (
      <Grid container spacing={3}>
        {/* Sélecteur */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Année</InputLabel>
              <Select
                value={selectedYearAnnuel}
                label="Année"
                onChange={(e) => setSelectedYearAnnuel(e.target.value)}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Card>
        </Grid>

        {/* Résumé */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" color="success.main">
                Revenus Totaux
              </Typography>
              <Typography variant="h4">{fNumber(revenus?.total || 0)} FCFA</Typography>
              <Typography variant="body2" color="text.secondary">
                {revenus?.nombrePaiements || 0} paiement(s)
              </Typography>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" color="error.main">
                Dépenses Totales
              </Typography>
              <Typography variant="h4">{fNumber(depenses?.total || 0)} FCFA</Typography>
              <Typography variant="body2" color="text.secondary">
                {depenses?.nombreBons || 0} bon(s) de sortie
              </Typography>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Bilan Annuel</Typography>
              <Typography
                variant="h4"
                color={bilan?.solde >= 0 ? 'success.main' : 'error.main'}
              >
                {fNumber(bilan?.solde || 0)} FCFA
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Marge: {bilan?.marge || '0.00'}%
              </Typography>
            </Stack>
          </Card>
        </Grid>

        {/* Revenus par mois */}
        {revenus?.parMois && revenus.parMois.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Revenus par mois
              </Typography>
              <Grid container spacing={2}>
                {revenus.parMois.map((mois) => (
                  <Grid item xs={6} sm={4} md={2} key={mois.mois}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {MONTHS.find((m) => m.value === mois.mois)?.label || `Mois ${mois.mois}`}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {fNumber(mois.montant)} FCFA
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mois.nombre} paiement(s)
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        )}

        {/* Dépenses par mois */}
        {depenses?.parMois && depenses.parMois.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dépenses par mois
              </Typography>
              <Grid container spacing={2}>
                {depenses.parMois.map((mois) => (
                  <Grid item xs={6} sm={4} md={2} key={mois.mois}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {MONTHS.find((m) => m.value === mois.mois)?.label || `Mois ${mois.mois}`}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold" color="error.main">
                        {fNumber(mois.montant)} FCFA
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mois.nombre} bon(s)
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        )}

        {/* Détails par catégorie */}
        {depenses?.parCategorie && Object.keys(depenses.parCategorie).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dépenses par catégorie
              </Typography>
              <Stack spacing={1}>
                {Object.entries(depenses.parCategorie).map(([categorie, montant]) => (
                  <Box key={categorie} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{categorie}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {fNumber(montant)} FCFA
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        )}

        {/* Factures */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Factures
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h6">{fNumber(factures?.total || 0)} FCFA</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Payées
                </Typography>
                <Typography variant="h6" color="success.main">
                  {fNumber(factures?.payees || 0)} FCFA
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  En attente
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {fNumber(factures?.enAttente || 0)} FCFA
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Nombre
                </Typography>
                <Typography variant="h6">{factures?.nombre || 0}</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Bilan financier | Annour Travel </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Bilan financier</Typography>
        </Stack>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="bilan tabs">
            <Tab label="Bilan Mensuel" value="mensuel" icon={<Iconify icon="eva:calendar-fill" />} iconPosition="start" />
            <Tab label="Bilan Annuel" value="annuel" icon={<Iconify icon="eva:calendar-outline" />} iconPosition="start" />
          </Tabs>
        </Box>

        {loading ? (
          <Card sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Chargement...
            </Typography>
          </Card>
        ) : (
          <Box>
            {currentTab === 'mensuel' && renderBilanMensuel()}
            {currentTab === 'annuel' && renderBilanAnnuel()}
          </Box>
        )}
      </Container>
    </>
  );
}

