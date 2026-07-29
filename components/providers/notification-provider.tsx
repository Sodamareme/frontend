'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '@/lib/socket';
import { toast } from 'sonner';
import { getAuthToken } from '@/lib/api';

interface Notification {
  id: string;
  type: 'JUSTIFICATION_SUBMITTED';
  message: string;
  createdAt: string;
  read: boolean;
  attendanceId: string;
  sender: {
    id: string;
    email: string;
  };
  receiver: {
    id: string;
    email: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    let mounted = true;
    let cleanup: (() => Promise<void>) | null = null;

    const setup = async () => {
      try {
        socketService.connect();

        if (!mounted) return;

        socketService.onNewNotification(async (notification) => {
          if (!mounted) return;

          setNotifications(prev => [notification, ...prev]);
          
          await new Promise<void>(resolve => {
            toast.info(notification.message, {
              duration: 5000,
              action: {
                label: "Voir",
                onClick: () => {
                  resolve();
                }
              },
              onAutoClose: () => resolve()
            });
          });
        });

        cleanup = async () => {
          socketService.disconnect();
        };
      } catch (error) {
      }
    };

    setup();

    return () => {
      mounted = false;
      if (cleanup) {
        cleanup().catch(() => undefined);
      }
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        }
      });

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
