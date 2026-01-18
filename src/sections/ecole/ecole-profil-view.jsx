import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Box,
  Card,
  Chip,
  Stack,
  Avatar,
  Button,
  Divider,
  Container,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import { fDateTime } from 'src/utils/format-time';
import { uploadImage } from 'src/utils/upload-media';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';

export default function EcoleProfilView() {
  const { contextHolder, showApiResponse } = useNotification();

  const [profile, setProfile] = useState({
    name: '', slogan: '', region: '', city: '', logoUrl: '', description: '', website: '', phone: '', email: '',
  });
  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getEcoleProfile();
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        showApiResponse(result, { errorTitle: 'Erreur de chargement' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchProfile(); 
  }, []);

  // Nettoyer l'URL de prévisualisation lors du démontage
  useEffect(() => {
    const currentPreviewUrl = logoPreviewUrl;
    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleSaveProfile = async () => {
    let finalLogoUrl = profile.logoUrl;

    // Si un fichier logo est sélectionné, on doit d'abord l'uploader
    if (selectedLogoFile) {
      setUploadingLogo(true);
      try {
        const uploadResult = await uploadImage(selectedLogoFile);
        
        if (!uploadResult.success) {
          showApiResponse(uploadResult, {
            errorTitle: 'Erreur d\'upload du logo',
          });
          setUploadingLogo(false);
          return;
        }
        
        if (!uploadResult.url) {
          showApiResponse({
            success: false,
            message: 'L\'URL du logo n\'a pas été retournée',
          }, { errorTitle: 'Erreur d\'upload' });
          setUploadingLogo(false);
          return;
        }

        // Utiliser l'URL retournée par l'upload
        finalLogoUrl = uploadResult.url;
      } catch (error) {
        console.error('Error uploading logo:', error);
        showApiResponse({
          success: false,
          message: 'Une erreur est survenue lors de l\'upload du logo',
        }, { errorTitle: 'Erreur d\'upload' });
        setUploadingLogo(false);
        return;
      } finally {
        setUploadingLogo(false);
      }
    }

    // Créer ou mettre à jour le profil avec l'URL du logo
    const profileData = {
      ...profile,
      logoUrl: finalLogoUrl,
    };

    const hasId = Boolean(profile?.id || profile?._id);
    const res = hasId ? await ConsumApi.updateEcoleProfile(profileData) : await ConsumApi.createEcoleProfile(profileData);
    showApiResponse(res, {
      successTitle: hasId ? 'Profil mis à jour' : 'Profil créé',
      errorTitle: hasId ? 'Erreur de mise à jour' : 'Erreur de création',
    });
    if (res.success) {
      // Nettoyer l'URL de prévisualisation si elle existe
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
        setLogoPreviewUrl(null);
      }
      setSelectedLogoFile(null);
      setIsEditingProfile(false);
      fetchProfile();
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Nettoyer l'URL de prévisualisation si elle existe
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
    }
    setSelectedLogoFile(null);
    fetchProfile(); // Recharger les données pour annuler les modifications
  };

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        showApiResponse({
          success: false,
          message: 'Veuillez sélectionner un fichier image',
        }, { errorTitle: 'Format invalide' });
        return;
      }
      
      // Nettoyer l'ancienne URL de prévisualisation si elle existe
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      
      // Créer une nouvelle URL de prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setLogoPreviewUrl(previewUrl);
      setSelectedLogoFile(file);
    }
  };


  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Profil École | AnnourTravel </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Profil École</Typography>
          <Button variant="outlined" startIcon={<Iconify icon="eva:refresh-fill" />} onClick={fetchProfile} disabled={loading}>
            Actualiser
          </Button>
        </Stack>

        <Card sx={{ p: 3, mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">Informations générales</Typography>
            {!isEditingProfile && (
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:edit-fill" />}
                onClick={() => setIsEditingProfile(true)}
              >
                Modifier
              </Button>
            )}
          </Stack>

          {isEditingProfile ? (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                  label="Nom de l'école *"
                  value={profile.name || ''}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                  label="Slogan"
                  value={profile.slogan || ''}
                  onChange={(e) => setProfile({ ...profile, slogan: e.target.value })}
                  placeholder="Ex: L'excellence académique"
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                  label="Région"
                  value={profile.region || ''}
                  onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                  placeholder="Ex: Abidjan"
                />
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                  label="Ville"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="Ex: Cocody"
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Logo de l&apos;école
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={logoPreviewUrl || profile.logoUrl}
                    alt={profile.name || 'Logo école'}
                    sx={{ width: 80, height: 80, fontSize: '1.5rem', bgcolor: 'primary.main' }}
                  >
                    {!logoPreviewUrl && !profile.logoUrl && (profile.name || 'É').charAt(0).toUpperCase()}
                  </Avatar>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Iconify icon="solar:upload-minimalistic-bold" />}
                      disabled={uploadingLogo}
                    >
                      {selectedLogoFile ? selectedLogoFile.name : 'Choisir un logo'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoFileChange}
                      />
                    </Button>
                    {selectedLogoFile && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Fichier sélectionné: {selectedLogoFile.name}
                        <br />
                        L&apos;upload se fera automatiquement lors de l&apos;enregistrement du profil
                      </Typography>
                    )}
                    {profile.logoUrl && !selectedLogoFile && (
                      <Typography variant="caption" color="text.secondary">
                        Logo actuel: {profile.logoUrl}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                  label="URL du logo (optionnel)"
                  value={profile.logoUrl || ''}
                  onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                  placeholder="https://exemple.com/logo.jpg"
                  helperText="Ou entrez directement une URL de logo"
                />
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                  label="Site web"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://exemple.com"
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                  label="Téléphone"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+225 00 00 00 00 00"
                />
                <TextField
                  sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                  label="Email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="contact@ecole.com"
                />
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Description"
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="Décrivez votre école, ses valeurs, sa mission..."
                helperText="Présentez votre établissement de manière attrayante"
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={handleCancelEdit} disabled={uploadingLogo || loading}>
                  Annuler
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSaveProfile} 
                  disabled={loading || uploadingLogo}
                  startIcon={uploadingLogo || loading ? <CircularProgress size={20} /> : null}
                >
                  {(() => {
                    if (uploadingLogo) return 'Upload en cours...';
                    if (loading) return 'Enregistrement...';
                    return 'Enregistrer';
                  })()}
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Stack direction="row" spacing={3} alignItems="flex-start">
                <Avatar
                  src={profile.logoUrl}
                  alt={profile.name || 'Logo école'}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    fontSize: '2.5rem', 
                    bgcolor: 'primary.main',
                    border: '2px solid',
                    borderColor: 'divider',
                  }}
                  imgProps={{
                    onError: (e) => {
                      e.target.style.display = 'none';
                    },
                  }}
                >
                  {!profile.logoUrl && (profile.name || 'É').charAt(0).toUpperCase()}
                </Avatar>
                <Stack spacing={1} sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography variant="h5">{profile.name || 'Nom de l\'école non défini'}</Typography>
                    {profile.isVerified && (
                      <Chip
                        label="Vérifié"
                        color="success"
                        size="small"
                        icon={<Iconify icon="eva:checkmark-circle-2-fill" width={16} />}
                      />
                    )}
                    {profile.hasPaid && (
                      <Chip
                        label="Payé"
                        color="primary"
                        size="small"
                        icon={<Iconify icon="eva:credit-card-fill" width={16} />}
                      />
                    )}
                  </Stack>
                  {profile.slogan && (
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      {profile.slogan}
                    </Typography>
                  )}
                  {(profile.region || profile.city) && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Iconify icon="eva:map-pin-fill" width={16} />
                      {[profile.region, profile.city].filter(Boolean).join(', ')}
                    </Typography>
                  )}
                </Stack>
              </Stack>

              <Divider />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {profile.website && (
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
                      Site web
                    </Typography>
                    <Typography
                      component="a"
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      <Iconify icon="eva:external-link-fill" width={16} />
                      {profile.website}
                    </Typography>
                  </Box>
                )}
                {profile.phone && (
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
                      Téléphone
                    </Typography>
                    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Iconify icon="eva:phone-fill" width={16} />
                      {profile.phone}
                    </Typography>
                  </Box>
                )}
                {profile.email && (
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
                      Email
                    </Typography>
                    <Typography
                      component="a"
                      href={`mailto:${profile.email}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      <Iconify icon="eva:email-fill" width={16} />
                      {profile.email}
                    </Typography>
                  </Box>
                )}
              </Box>

              {profile.description && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600, mb: 1, display: 'block' }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {profile.description}
                    </Typography>
                  </Box>
                </>
              )}

              {(profile.createdAt || profile.updatedAt || profile.userId || profile.id) && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600, mb: 2, display: 'block' }}>
                      Informations techniques
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {profile.createdAt && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Date de création
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Iconify icon="eva:calendar-fill" width={16} />
                            {fDateTime(profile.createdAt)}
                          </Typography>
                        </Box>
                      )}
                      {profile.updatedAt && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Dernière mise à jour
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Iconify icon="eva:clock-fill" width={16} />
                            {fDateTime(profile.updatedAt)}
                          </Typography>
                        </Box>
                      )}

                    </Box>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </Card>
      </Container>
    </>
  );
}


