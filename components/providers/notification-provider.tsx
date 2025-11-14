'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '@/lib/socket';
import { toast } from 'sonner';

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
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let mounted = true;
    let cleanup: (() => Promise<void>) | null = null;

    const setup = async () => {
      try {
        await socketService.connect(token);

        if (!mounted) return;

        socketService.onNewNotification(async (notification) => {
          if (!mounted) return;

          console.log('Processing notification:', notification);
          setNotifications(prev => [notification, ...prev]);
          
          await new Promise<void>(resolve => {
            toast.info(notification.message, {
              duration: 5000,
              action: {
                label: "Voir",
                onClick: () => {
                                    handleJustificationClick({ id: notification.attendanceId });
                  
                  function handleJustificationClick({ id }: { id: string }) {
                    console.log(`Justification clicked for attendance ID: ${id}`);
                    // Add your logic here, e.g., navigation or API call
                  }
                  resolve();
                }
              },
              onAutoClose: () => resolve()
            });
          });
        });

        cleanup = async () => {
          await socketService.disconnect();
        };
      } catch (error) {
        console.error('Setup error:', error);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (cleanup) {
        cleanup().catch(console.error);
      }
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
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