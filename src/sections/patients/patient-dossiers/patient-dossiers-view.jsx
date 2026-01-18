import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Stack,
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
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
  InputAdornment,
  Avatar,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDate, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

const GENDER_COLORS = {
  M: 'info',
  F: 'error',
};

export default function PatientDossiersView() {
  const router = useRouter();
  const { contextHolder, showApiResponse, showError, showSuccess } = useNotification();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');

  // Dialogs
  const [createDialog, setCreateDialog] = useState({ open: false, loading: false });
  const [editDialog, setEditDialog] = useState({ open: false, patient: null, loading: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, patient: null, loading: false });

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    profession: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (search) filters.search = search;
      if (genderFilter) filters.gender = genderFilter;
      if (ageFilter) filters.age = ageFilter;

      const result = await ConsumApi.getPatients(filters);
      const processed = showApiResponse(result, {
        successTitle: 'Patients chargés',
        errorTitle: 'Erreur de chargement',
        showNotification: false,
      });

      if (processed.success) {
        setPatients(Array.isArray(processed.data?.patients) ? processed.data.patients : processed.data || []);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      showError('Erreur', 'Impossible de charger les patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, genderFilter, ageFilter]);

  useEffect(() => {
    loadPatients();
  }, [page, rowsPerPage, search, genderFilter, ageFilter]);

  const handleCreate = async () => {
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreateDialog({ ...createDialog, loading: true });
    try {
      const result = await ConsumApi.createPatient(formData);
      const processed = showApiResponse(result, {
        successTitle: 'Patient créé',
        errorTitle: 'Erreur lors de la création',
      });

      if (processed.success) {
        setCreateDialog({ open: false, loading: false });
        setFormData({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          profession: '',
          emergencyContact: {
            name: '',
            phone: '',
            relationship: '',
          },
        });
        await loadPatients();
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      showError('Erreur', 'Impossible de créer le patient');
    } finally {
      setCreateDialog({ ...createDialog, loading: false });
    }
  };

  const handleEdit = async () => {
    if (!editDialog.patient || !formData.firstName || !formData.lastName) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setEditDialog({ ...editDialog, loading: true });
    try {
      const result = await ConsumApi.updatePatient(editDialog.patient.id, formData);
      const processed = showApiResponse(result, {
        successTitle: 'Patient mis à jour',
        errorTitle: 'Erreur lors de la mise à jour',
      });

      if (processed.success) {
        setEditDialog({ open: false, patient: null, loading: false });
        await loadPatients();
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      showError('Erreur', 'Impossible de mettre à jour le patient');
    } finally {
      setEditDialog({ ...editDialog, loading: false });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.patient) return;

    setDeleteDialog({ ...deleteDialog, loading: true });
    try {
      const result = await ConsumApi.deletePatient(deleteDialog.patient.id);
      const processed = showApiResponse(result, {
        successTitle: 'Patient supprimé',
        errorTitle: 'Erreur lors de la suppression',
      });

      if (processed.success) {
        setDeleteDialog({ open: false, patient: null, loading: false });
        await loadPatients();
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      showError('Erreur', 'Impossible de supprimer le patient');
    } finally {
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  const handleEditOpen = (patient) => {
    setFormData({
      firstName: patient.firstName || patient.firstname || '',
      lastName: patient.lastName || patient.lastname || '',
      dateOfBirth: patient.dateOfBirth || patient.dateOfBirth || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      city: patient.city || '',
      profession: patient.profession || '',
      emergencyContact: patient.emergencyContact || {
        name: '',
        phone: '',
        relationship: '',
      },
    });
    setEditDialog({ open: true, patient, loading: false });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age;
  };

  return (
    <>
      <Helmet>
        <title> Dossiers Patients | Clinique </title>
      </Helmet>

      {contextHolder}

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Dossiers Patients</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Création et gestion des dossiers patients
            </Typography>
          </Box>

          {/* Actions */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Liste des patients</Typography>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => setCreateDialog({ open: true, loading: false })}
              >
                Nouveau patient
              </Button>
            </Box>
          </Card>

          {/* Filters */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, prénom, téléphone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadPatients();
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
                  <InputLabel>Genre</InputLabel>
                  <Select
                    value={genderFilter}
                    label="Genre"
                    onChange={(e) => setGenderFilter(e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="M">Masculin</MenuItem>
                    <MenuItem value="F">Féminin</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Tranche d&apos;âge</InputLabel>
                  <Select
                    value={ageFilter}
                    label="Tranche d&apos;âge"
                    onChange={(e) => setAgeFilter(e.target.value)}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    <MenuItem value="0-18">0-18 ans</MenuItem>
                    <MenuItem value="19-35">19-35 ans</MenuItem>
                    <MenuItem value="36-50">36-50 ans</MenuItem>
                    <MenuItem value="51-65">51-65 ans</MenuItem>
                    <MenuItem value="65+">65+ ans</MenuItem>
                  </Select>
                </FormControl>

                <LoadingButton
                  variant="outlined"
                  onClick={loadPatients}
                  loading={loading}
                  startIcon={<Iconify icon="eva:search-fill" />}
                >
                  Rechercher
                </LoadingButton>
              </Stack>
            </Stack>
          </Card>

          {/* Patients Table */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Date de naissance</TableCell>
                      <TableCell>Âge</TableCell>
                      <TableCell>Genre</TableCell>
                      <TableCell>Téléphone</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (loading && patients.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              Chargement...
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (patients.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              Aucun patient trouvé
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return patients.map((patient) => (
                        <TableRow key={patient.id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar>
                                {patient.firstName?.charAt(0) || patient.firstname?.charAt(0) || 'P'}
                                {patient.lastName?.charAt(0) || patient.lastname?.charAt(0) || ''}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">
                                  {patient.firstName || patient.firstname} {patient.lastName || patient.lastname}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {patient.patientId || patient.id}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>{fDate(patient.dateOfBirth || patient.dateOfBirth)}</TableCell>
                          <TableCell>{calculateAge(patient.dateOfBirth || patient.dateOfBirth)} ans</TableCell>
                          <TableCell>
                            <Chip
                              label={(() => {
                                if (patient.gender === 'M') return 'Masculin';
                                if (patient.gender === 'F') return 'Féminin';
                                return 'N/A';
                              })()}
                              color={GENDER_COLORS[patient.gender] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{patient.phone || 'N/A'}</TableCell>
                          <TableCell>{patient.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => router.push(`/patients/${patient.id}`)}
                                color="primary"
                                title="Voir le dossier"
                              >
                                <Iconify icon="eva:eye-fill" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleEditOpen(patient)}
                                color="info"
                                title="Modifier"
                              >
                                <Iconify icon="eva:edit-fill" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setDeleteDialog({ open: true, patient, loading: false })}
                                color="error"
                                title="Supprimer"
                              >
                                <Iconify icon="eva:trash-2-fill" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
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

      {/* Create Dialog */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Créer un nouveau patient</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom *"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom *"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de naissance *"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Genre *</InputLabel>
                  <Select
                    value={formData.gender}
                    label="Genre *"
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <MenuItem value="M">Masculin</MenuItem>
                    <MenuItem value="F">Féminin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Adresse"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ville"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Profession"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Contact d&apos;urgence
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={formData.emergencyContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Relation"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value },
                    })
                  }
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleCreate} loading={createDialog.loading}>
            Créer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, patient: null, loading: false })} maxWidth="md" fullWidth>
        <DialogTitle>Modifier le patient</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom *"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom *"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de naissance *"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Genre *</InputLabel>
                  <Select
                    value={formData.gender}
                    label="Genre *"
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <MenuItem value="M">Masculin</MenuItem>
                    <MenuItem value="F">Féminin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Adresse"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ville"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Profession"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Contact d&apos;urgence
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={formData.emergencyContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Relation"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value },
                    })
                  }
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, patient: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" onClick={handleEdit} loading={editDialog.loading}>
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, patient: null, loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Supprimer le patient</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Êtes-vous sûr de vouloir supprimer le patient &quot;{deleteDialog.patient?.firstName} {deleteDialog.patient?.lastName}&quot; ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, patient: null, loading: false })}>Annuler</Button>
          <LoadingButton variant="contained" color="error" onClick={handleDelete} loading={deleteDialog.loading}>
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
