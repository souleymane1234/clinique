import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  TablePagination,
  InputAdornment,
  Avatar,
} from '@mui/material';

import { useNotification } from 'src/hooks/useNotification';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function DoctorMessagerieView() {
  const { contextHolder, showError } = useNotification();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null });

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler le chargement des messages internes
      const mockMessages = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        from: `Dr. ${['Martin', 'Dubois', 'Bernard', 'Lefevre'][Math.floor(Math.random() * 4)]}`,
        to: `Dr. ${['Martin', 'Dubois', 'Bernard', 'Lefevre'][Math.floor(Math.random() * 4)]}`,
        subject: `Message ${i + 1}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        read: Math.random() > 0.5,
        content: `Contenu du message ${i + 1}`,
      }));

      let filtered = mockMessages;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.from.toLowerCase().includes(searchLower) ||
            m.to.toLowerCase().includes(searchLower) ||
            m.subject.toLowerCase().includes(searchLower)
        );
      }
      if (readFilter !== '') {
        filtered = filtered.filter((m) => m.read === (readFilter === 'read'));
      }

      setMessages(filtered);
    } catch (error) {
      console.error('Error loading messages:', error);
      showError('Erreur', 'Impossible de charger les messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, readFilter]);

  useEffect(() => {
    loadMessages();
  }, [page, rowsPerPage, search, readFilter]);

  const handleViewDetails = (item) => {
    setDetailsDialog({ open: true, item });
    // Marquer comme lu
    setMessages((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, read: true } : m))
    );
  };

  return (
    <>
      <Helmet>
        <title> Messagerie Interne | Clinique </title>
      </Helmet>

      {contextHolder}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Messagerie Interne</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Communication interne entre médecins
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Statut"
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 150 }}
              SelectProps={{ native: true }}
            >
              <option value="">Tous</option>
              <option value="read">Lu</option>
              <option value="unread">Non lu</option>
            </TextField>
          </Stack>
        </Card>

        {/* Table */}
        <Card>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>De</TableCell>
                    <TableCell>À</TableCell>
                    <TableCell>Sujet</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    if (loading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <LoadingButton loading>Chargement...</LoadingButton>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (messages.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            Aucun message trouvé
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return messages.map((message, index) => (
                      <TableRow
                        key={`${message.id}-${index}`}
                        hover
                        sx={message.read ? {} : { bgcolor: 'action.hover' }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {message.from.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{message.from}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{message.to}</TableCell>
                        <TableCell>{message.subject}</TableCell>
                        <TableCell>{fDateTime(message.date)}</TableCell>
                        <TableCell>
                          <Chip
                            label={message.read ? 'Lu' : 'Non lu'}
                            size="small"
                            color={message.read ? 'default' : 'primary'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button variant="outlined" size="small" onClick={() => handleViewDetails(message)}>
                            Lire
                          </Button>
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
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Lignes par page:"
          />
        </Card>
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onClose={() => setDetailsDialog({ open: false, item: null })} maxWidth="md" fullWidth>
        <DialogTitle>{detailsDialog.item?.subject}</DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2">De</Typography>
                <Typography variant="body2">{detailsDialog.item.from}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">À</Typography>
                <Typography variant="body2">{detailsDialog.item.to}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Date</Typography>
                <Typography variant="body2">{fDateTime(detailsDialog.item.date)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Contenu</Typography>
                <Typography variant="body2">{detailsDialog.item.content}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, item: null })}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
