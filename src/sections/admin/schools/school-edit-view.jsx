import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { RouterLink } from 'src/routes/components';

import { useNotification } from 'src/hooks/useNotification';

import { uploadImage } from 'src/utils/upload-media';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function SchoolEditView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contextHolder, showApiResponse } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProfilePhotoFile, setSelectedProfilePhotoFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    description: '',
    region: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    isVerified: false,
    hasPaid: false,
  });

  const regions = [
    'Abidjan',
    'Yamoussoukro',
    'Bouaké',
    'San-Pédro',
    'Korhogo',
    'Man',
    'Gagnoa',
    'Daloa',
    'Divo',
    'Anyama',
  ];

  const loadSchoolDetails = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getSchoolById(id);
      
      if (result.success) {
        const schoolData = result.data;
        setFormData({
          name: schoolData.name || '',
          slogan: schoolData.slogan || '',
          description: schoolData.description || '',
          region: schoolData.region || '',
          city: schoolData.city || '',
          address: schoolData.address || '',
          phone: schoolData.phone || '',
          email: schoolData.email || '',
          website: schoolData.website || '',
          logoUrl: schoolData.logoUrl || '',
          isVerified: schoolData.isVerified || false,
          hasPaid: schoolData.hasPaid || false,
        });
      } else {
        // Fallback vers des données mockées
        const mockSchool = {
          id: parseInt(id, 10),
          name: 'École Supérieure de Commerce',
          slogan: 'Excellence et Innovation',
          description: 'Une école de commerce de renommée internationale, formant les leaders de demain.',
          region: 'Abidjan',
          city: 'Cocody',
          address: 'Boulevard de la République, Cocody',
          phone: '+225 20 30 40 50',
          email: 'contact@esc-ci.com',
          website: 'https://www.esc-ci.com',
          isVerified: true,
          hasPaid: true,
        };
        setFormData({
          name: mockSchool.name,
          slogan: mockSchool.slogan,
          description: mockSchool.description,
          region: mockSchool.region,
          city: mockSchool.city,
          address: mockSchool.address,
          phone: mockSchool.phone,
          email: mockSchool.email,
          website: mockSchool.website,
          logoUrl: mockSchool.logoUrl || '',
          isVerified: mockSchool.isVerified,
          hasPaid: mockSchool.hasPaid,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails de l\'école:', error);
      // Données mockées en cas d'erreur
      const mockSchool = {
        id: parseInt(id, 10),
        name: 'École Supérieure de Commerce',
        slogan: 'Excellence et Innovation',
        description: 'Une école de commerce de renommée internationale, formant les leaders de demain.',
        region: 'Abidjan',
        city: 'Cocody',
        address: 'Boulevard de la République, Cocody',
        phone: '+225 20 30 40 50',
        email: 'contact@esc-ci.com',
        website: 'https://www.esc-ci.com',
        isVerified: true,
        hasPaid: true,
      };
      setFormData({
        name: mockSchool.name,
        slogan: mockSchool.slogan,
        description: mockSchool.description,
        region: mockSchool.region,
        city: mockSchool.city,
        address: mockSchool.address,
        phone: mockSchool.phone,
        email: mockSchool.email,
        website: mockSchool.website,
        isVerified: mockSchool.isVerified,
        hasPaid: mockSchool.hasPaid,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadSchoolDetails();
    }
  }, [id]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfilePhotoFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showApiResponse({ 
        success: false, 
        message: 'Veuillez sélectionner un fichier image valide' 
      });
      event.target.value = '';
      return;
    }

    setSelectedProfilePhotoFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    
    try {
      let logoUrl = formData.logoUrl ? formData.logoUrl.trim() : '';

      // Si un fichier de photo de profil est sélectionné, uploader le fichier d'abord
      if (selectedProfilePhotoFile) {
        const photoUploadResult = await uploadImage(selectedProfilePhotoFile);
        
        if (!photoUploadResult.success || !photoUploadResult.url) {
          showApiResponse({ 
            success: false, 
            message: photoUploadResult.message || 'Erreur lors de l\'upload de la photo de profil',
            errors: photoUploadResult.errors || []
          });
          setSaving(false);
          return;
        }
        
        // Utiliser l'URL retournée par l'upload
        logoUrl = photoUploadResult.url;
      }

      // Préparer les données à envoyer avec l'URL de la photo de profil
      const submitData = {
        name: formData.name,
        slogan: formData.slogan,
        description: formData.description,
        region: formData.region,
        city: formData.city,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        isVerified: formData.isVerified,
        hasPaid: formData.hasPaid,
        ...(logoUrl && { logoUrl }), // Inclure logoUrl seulement s'il existe
      };

      const result = await ConsumApi.updateSchool(id, submitData);
      
      if (result.success) {
        showApiResponse(result, {
          successTitle: 'Modification réussie',
          errorTitle: 'Erreur de modification'
        });
        // Rediriger vers les détails de l'école
        setTimeout(() => {
          navigate(`/admin/schools/${id}`);
        }, 1500);
      } else {
        showApiResponse(result, {
          errorTitle: 'Erreur de modification'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'école:', error);
      showApiResponse({ 
        success: false, 
        message: 'Erreur lors de la modification' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Chargement des détails de l&apos;école...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {contextHolder}
      <Box sx={{ p: 3 }}>
        {/* En-tête */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              component={RouterLink}
              href={`/admin/schools/${id}`}
            >
              Retour
            </Button>
            <Typography variant="h4">Modifier l&apos;école</Typography>
          </Stack>
          
          <Typography variant="body2" color="text.secondary">
            Modifiez les informations de l&apos;école
          </Typography>
        </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Informations générales */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations générales
                </Typography>
                
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Nom de l'école"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Slogan"
                    value={formData.slogan}
                    onChange={handleInputChange('slogan')}
                  />
                  
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange('description')}
                  />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Région</InputLabel>
                        <Select
                          value={formData.region}
                          label="Région"
                          onChange={handleInputChange('region')}
                        >
                          {regions.map((region) => (
                            <MenuItem key={region} value={region}>
                              {region}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Ville"
                        value={formData.city}
                        onChange={handleInputChange('city')}
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    fullWidth
                    label="Adresse"
                    value={formData.address}
                    onChange={handleInputChange('address')}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations de contact
                </Typography>
                
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Téléphone"
                        value={formData.phone}
                        onChange={handleInputChange('phone')}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    fullWidth
                    label="Site web"
                    value={formData.website}
                    onChange={handleInputChange('website')}
                    placeholder="https://www.exemple.com"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Statut et actions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Photo de profil
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-photo-upload-input"
                      type="file"
                      onChange={handleProfilePhotoFileSelect}
                      disabled={saving}
                    />
                    <label htmlFor="profile-photo-upload-input">
                      <Button
                        variant="outlined"
                        component="span"
                        disabled={saving}
                        fullWidth
                        startIcon={<Iconify icon="solar:upload-minimalistic-bold" />}
                      >
                        {selectedProfilePhotoFile ? `Photo sélectionnée: ${selectedProfilePhotoFile.name}` : 'Sélectionner une photo'}
                      </Button>
                    </label>
                    {selectedProfilePhotoFile && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        La photo sera uploadée lors de l&apos;enregistrement
                      </Typography>
                    )}
                    {!selectedProfilePhotoFile && (
                      <TextField
                        fullWidth
                        label="URL de la photo (optionnel)"
                        value={formData.logoUrl}
                        onChange={handleInputChange('logoUrl')}
                        helperText="Ou entrez une URL d'image directement"
                        disabled={saving}
                        sx={{ mt: 2 }}
                      />
                    )}
                    {formData.logoUrl && !selectedProfilePhotoFile && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        URL actuelle: {formData.logoUrl}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statut
                </Typography>
                
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isVerified}
                        onChange={handleInputChange('isVerified')}
                        color="success"
                      />
                    }
                    label="École vérifiée"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hasPaid}
                        onChange={handleInputChange('hasPaid')}
                        color="warning"
                      />
                    }
                    label="Abonnement Premium"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                
                <Stack spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <Iconify icon="eos-icons:loading" /> : <Iconify icon="solar:diskette-bold" />}
                    fullWidth
                  >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    href={`/admin/schools/${id}`}
                    fullWidth
                  >
                    Annuler
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
      </Box>
    </>
  );
}
