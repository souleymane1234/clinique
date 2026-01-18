import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Chip, Stack, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { useNotification } from 'src/hooks/useNotification';
import Iconify from 'src/components/iconify';

export default function ExportView() {
  const { contextHolder, showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('pdf');
  const [type, setType] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const handleExport = async () => {
    if (!type) {
      showError('Erreur', 'Veuillez sélectionner un type de document');
      return;
    }
    setLoading(true);
    try {
      // Simuler l'export
      await new Promise((resolve) => setTimeout(resolve, 2000));
      showSuccess('Succès', `Export ${format.toUpperCase()} généré avec succès`);
    } catch (error) {
      showError('Erreur', 'Impossible de générer l\'export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title> Export PDF / Excel | Clinique </title></Helmet>
      {contextHolder}
      <Stack spacing={3}>
        <Box><Typography variant="h4">Export PDF / Excel</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Exporter les documents en PDF ou Excel</Typography></Box>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Format d&apos;export</InputLabel>
              <Select value={format} label="Format d'export" onChange={(e) => setFormat(e.target.value)}>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Type de document</InputLabel>
              <Select value={type} label="Type de document" onChange={(e) => setType(e.target.value)}>
                <MenuItem value="ordonnances">Ordonnances</MenuItem>
                <MenuItem value="resultats">Résultats d&apos;analyses</MenuItem>
                <MenuItem value="factures">Factures</MenuItem>
                <MenuItem value="certificats">Certificats médicaux</MenuItem>
                <MenuItem value="rapports">Rapports</MenuItem>
                <MenuItem value="tous">Tous les documents</MenuItem>
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" label="Date de début" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" label="Date de fin" value={dateFin} onChange={(e) => setDateFin(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <LoadingButton variant="contained" size="large" loading={loading} onClick={handleExport} startIcon={<Iconify icon="solar:file-download-bold" />}>Exporter</LoadingButton>
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
