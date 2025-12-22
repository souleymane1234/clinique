import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Box,
  Card,
  Grid,
  Stack,
  Table,
  Button,
  TableRow,
  TextField,
  TableHead,
  TableBody,
  TableCell,
  Container,
  Typography,
  IconButton,
  TableContainer,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import ConfirmDeleteDialog from 'src/components/confirm-dialog/confirm-delete-dialog';

export default function EcoleDirectorWordsView() {
  const { contextHolder, showApiResponse } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({ message: '' });
  const [editingId, setEditingId] = useState(null);
  const [edits, setEdits] = useState({ message: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, loading: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ConsumApi.getEcoleDirectorWords();
      if (result.success) {
        setItems(result.data || []);
      } else {
        showApiResponse(result, { errorTitle: 'Erreur de chargement' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id, loading: false });
  };

  const handleDeleteConfirm = async () => {
    const idToDelete = deleteDialog.id;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    const res = await ConsumApi.deleteEcoleDirectorWords(idToDelete);
    showApiResponse(res, {
      successTitle: 'Message supprimé',
      errorTitle: 'Erreur de suppression',
    });
    if (res.success) {
      setDeleteDialog({ open: false, id: null, loading: false });
      fetchData();
    } else {
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, loading: false });
  };

  const handleAdd = async () => {
    if (!newItem.message || newItem.message.trim() === '') {
      showApiResponse({ success: false, message: 'Le message est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }
    const res = await ConsumApi.createEcoleDirectorWords(newItem);
    showApiResponse(res);
    if (res.success) {
      setNewItem({ message: '' });
      fetchData();
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id || row._id);
    setEdits({
      message: row.message || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdits({ message: '' });
  };

  const saveEdit = async () => {
    if (!edits.message || edits.message.trim() === '') {
      showApiResponse({ success: false, message: 'Le message est obligatoire' }, { errorTitle: 'Validation' });
      return;
    }
    const res = await ConsumApi.updateEcoleDirectorWords(editingId, edits);
    showApiResponse(res);
    if (res.success) {
      setEditingId(null);
      fetchData();
    }
  };

  return (
    <>
      {contextHolder}
      <Helmet>
        <title> Mots du directeur | AnnourTravel </title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Mots du directeur</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:refresh-fill" />}
              onClick={fetchData}
              disabled={loading}
            >
              Actualiser
            </Button>
          </Stack>
        </Stack>

        {/* Add New Director Words Form */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Ajouter un nouveau message du directeur</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  size="small"
                  label="Message *"
                  value={newItem.message}
                  onChange={(e) => setNewItem({ ...newItem, message: e.target.value })}
                  placeholder="Ex: Bienvenue dans notre établissement..."
                  helperText="Message du directeur aux visiteurs de l&apos;école"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:plus-fill" />}
                  disabled={loading || !newItem.message || newItem.message.trim() === ''}
                  onClick={handleAdd}
                >
                  Ajouter le message
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Director Words List */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Message</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucun message du directeur enregistré
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id || row._id} hover>
                      <TableCell>
                        {editingId === (row.id || row._id) ? (
                          <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            size="small"
                            value={edits.message}
                            onChange={(e) => setEdits({ ...edits, message: e.target.value })}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {row.message}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingId === (row.id || row._id) ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton color="primary" size="small" onClick={saveEdit}>
                              <Iconify icon="eva:checkmark-fill" />
                            </IconButton>
                            <IconButton size="small" onClick={cancelEdit}>
                              <Iconify icon="eva:close-fill" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => startEdit(row)}>
                              <Iconify icon="eva:edit-fill" />
                            </IconButton>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteClick(row.id || row._id)}
                            >
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <ConfirmDeleteDialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Supprimer le message du directeur"
          message="Êtes-vous sûr de vouloir supprimer ce message du directeur ? Cette action est irréversible."
          loading={deleteDialog.loading}
        />
      </Container>
    </>
  );
}

