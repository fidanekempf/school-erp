import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage, Notification } from '@/lib/storage';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  const loadNotifications = () => {
    const allNotifications = storage.getNotifications();
    const userNotifications = allNotifications.filter(n => n.userId === user?.id);
    setNotifications(userNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    
    const allNotifications = storage.getNotifications();
    storage.setNotifications([...allNotifications, newNotification]);
    
    if (notification.userId === user?.id) {
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const markAsRead = (id: string) => {
    const allNotifications = storage.getNotifications();
    const updated = allNotifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    storage.setNotifications(updated);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    const allNotifications = storage.getNotifications();
    const updated = allNotifications.map(n => 
      n.userId === user?.id ? { ...n, read: true } : n
    );
    storage.setNotifications(updated);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    const allNotifications = storage.getNotifications();
    storage.setNotifications(allNotifications.filter(n => n.id !== id));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount,
        addNotification, 
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
