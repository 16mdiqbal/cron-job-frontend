import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDistanceToNow, parseISO } from 'date-fns';

export const NotificationsDropdown = () => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch unread count on mount
    fetchUnreadCount();
    
    // Poll for new notifications every 10 seconds for faster updates
    const interval = setInterval(() => {
      fetchUnreadCount();
      // Also refresh notifications if dropdown is open
      if (isOpen) {
        fetchNotifications(1, 10, true); // Only fetch unread notifications
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchNotifications, isOpen]);

  useEffect(() => {
    // Fetch only unread notifications when dropdown opens
    if (isOpen) {
      fetchNotifications(1, 10, true);
    }
  }, [isOpen, fetchNotifications]);

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-amber-600 bg-amber-50';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markNotificationAsRead(notificationId);
    // Refresh to remove read notification from list
    fetchNotifications(1, 10, true);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    // Refresh to clear all notifications from list since we're showing unread only
    fetchNotifications(1, 10, true);
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    removeNotification(notificationId);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-lg transition-all">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs flex items-center justify-center shadow-md animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto rounded-2xl shadow-xl border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs hover:bg-white dark:hover:bg-gray-600 transition-colors"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {loading && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        )}
        
        {!loading && notifications.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        )}
        
        {!loading && notifications.length > 0 && (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all ${
                  notification.is_read ? '' : 'bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getNotificationTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="font-medium text-sm mt-1">{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 break-words">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleDelete(e, notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
