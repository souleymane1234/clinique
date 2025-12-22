import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

import { fToNow } from 'src/utils/format-time';

import { useAdminStore } from 'src/store/useAdminStore';
import ConsumApi from 'src/services_workers/consum_api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export default function NotificationsPopover() {
  const { admin } = useAdminStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const totalUnRead = notifications.filter((item) => item.isRead === false || !item.isRead).length;

  const [open, setOpen] = useState(null);

  const loadNotifications = useCallback(async () => {
    if (!admin?.id) {
      // Ne pas charger si pas d'admin mais toujours afficher l'icône
      return;
    }

    setLoading(true);
    try {
      const result = await ConsumApi.getNotifications(admin.id, true);
      if (result.success && Array.isArray(result.data)) {
        setNotifications(result.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [admin?.id]);

  useEffect(() => {
    if (admin?.id) {
      loadNotifications();
      // Rafraîchir les notifications toutes les 30 secondes
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [loadNotifications, admin?.id]);

  const handleOpen = (event) => {
    setOpen(event.currentTarget);
    // Recharger les notifications quand on ouvre le popover
    loadNotifications();
  };

  const handleClose = () => {
    setOpen(null);
  };

  const handleMarkAllAsRead = async () => {
    if (!admin?.id) return;

    try {
      const result = await ConsumApi.markAllNotificationsAsRead(admin.id);
      if (result.success) {
        // Mettre à jour localement
        setNotifications(
          notifications.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    // Mettre à jour immédiatement l'état local pour un feedback instantané
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification?.isRead) {
      return; // Déjà lue, pas besoin d'appeler l'API
    }

    // Optimistic update: mettre à jour localement immédiatement
    setNotifications(
      notifications.map((notif) =>
        notif.id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    );

    // Appeler l'API en arrière-plan
    try {
      await ConsumApi.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // En cas d'erreur, on peut revert l'état local si nécessaire
      // Pour l'instant, on laisse l'état local tel quel
    }
  };

  return (
    <>
      <IconButton 
        color={open ? 'primary' : 'default'} 
        onClick={handleOpen}
        sx={{ position: 'relative' }}
      >
        <Badge 
          badgeContent={totalUnRead} 
          color="error" 
          max={99}
          invisible={totalUnRead === 0}
        >
          <Iconify icon="eva:bell-fill" width={24} height={24} />
        </Badge>
      </IconButton>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            ml: 0.75,
            width: 360,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', py: 2, px: 2.5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">Notifications</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {totalUnRead > 0 
                ? `Vous avez ${totalUnRead} message${totalUnRead > 1 ? 's' : ''} non lu${totalUnRead > 1 ? 's' : ''}`
                : 'Aucun message non lu'
              }
            </Typography>
          </Box>

          {totalUnRead > 0 && (
            <Tooltip title="Tout marquer comme lu">
              <IconButton color="primary" onClick={handleMarkAllAsRead}>
                <Iconify icon="eva:done-all-fill" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Scrollbar sx={{ height: { xs: 340, sm: 'auto' } }}>
          {loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chargement...
              </Typography>
            </Box>
          )}
          {!loading && notifications.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Aucune notification
              </Typography>
            </Box>
          )}
          {!loading && notifications.length > 0 && (
            <>
              <List
                disablePadding
                subheader={
                  <ListSubheader disableSticky sx={{ py: 1, px: 2.5, typography: 'overline' }}>
                    Non lues
                  </ListSubheader>
                }
              >
                {notifications
                  .filter((n) => !n.isRead)
                  .slice(0, 5)
                  .map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
              </List>

              {notifications.filter((n) => n.isRead).length > 0 && (
                <List
                  disablePadding
                  subheader={
                    <ListSubheader disableSticky sx={{ py: 1, px: 2.5, typography: 'overline' }}>
                      Plus anciennes
                    </ListSubheader>
                  }
                >
                  {notifications
                    .filter((n) => n.isRead)
                    .slice(0, 3)
                    .map((notification) => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    ))}
                </List>
              )}
            </>
          )}
        </Scrollbar>
      </Popover>
    </>
  );
}

// ----------------------------------------------------------------------

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string,
    isRead: PropTypes.bool,
    title: PropTypes.string,
    message: PropTypes.string,
    type: PropTypes.string,
    createdAt: PropTypes.string,
    reminderDate: PropTypes.string,
  }),
  onMarkAsRead: PropTypes.func,
};

function NotificationItem({ notification, onMarkAsRead }) {
  const { avatar, title } = renderContent(notification);
  const isUnRead = !notification.isRead;

  const handleClick = () => {
    // Marquer comme lue dès qu'on clique, même si déjà lue
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <ListItemButton
      onClick={handleClick}
      sx={{
        py: 1.5,
        px: 2.5,
        mt: '1px',
        ...(isUnRead && {
          bgcolor: 'action.selected',
        }),
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'background.neutral' }}>{avatar}</Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={title}
        secondary={
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.disabled',
            }}
          >
            <Iconify icon="eva:clock-outline" sx={{ mr: 0.5, width: 16, height: 16 }} />
            {notification.createdAt ? fToNow(notification.createdAt) : '-'}
          </Typography>
        }
      />
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

function renderContent(notification) {
  const notificationTitle = notification.title || notification.message || 'Notification';
  const notificationDescription = notification.description || notification.message || '';
  
  const title = (
    <Typography variant="subtitle2">
      {notificationTitle}
      {notificationDescription && notificationDescription !== notificationTitle && (
        <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
          &nbsp; {notificationDescription}
        </Typography>
      )}
    </Typography>
  );

  // Déterminer l'icône selon le type de notification
  let iconSrc = '/assets/icons/ic_notification_mail.svg';
  
  if (notification.type) {
    switch (notification.type) {
      case 'client_assigned':
      case 'client_created':
        iconSrc = '/assets/icons/ic_notification_package.svg';
        break;
      case 'session_reminder':
      case 'reminder':
        iconSrc = '/assets/icons/ic_notification_chat.svg';
        break;
      case 'facture':
      case 'paiement':
        iconSrc = '/assets/icons/ic_notification_shipping.svg';
        break;
      default:
        iconSrc = '/assets/icons/ic_notification_mail.svg';
    }
  }

  return {
    avatar: <img alt={notificationTitle} src={iconSrc} width={24} height={24} />,
    title,
  };
}
