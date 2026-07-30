import { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '@/lib/socket';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CustomNotification {
  id: string;
  type: "JUSTIFICATION_SUBMITTED";
  message: string;
  createdAt: string;
  read: boolean;
  attendanceId: string;
  sender: { id: string; email: string };
  receiver: { id: string; email: string };
}

interface NotificationContextType {
  notifications: CustomNotification[];
  markAsRead: (id: string) => Promise<void>;
  handleJustificationClick: (attendance: { id: string }) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<CustomNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  const handleJustificationClick = (attendance: { id: string }) => {
    if (!attendance) return;
    router.push(`/dashboard/attendance?justify=${attendance.id}`);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
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

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let mounted = true;

    const setupSocket = async () => {
      try {
        await socketService.connect(token);
        if (mounted) setIsConnected(true);

        // Fetch initial notifications
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const initialNotifications = await response.json();
        if (mounted) setNotifications(initialNotifications);

        socketService.onNewNotification((newNotification) => {
          if (!mounted) return;
          
          console.log('Received new notification:', newNotification);
          setNotifications(prev => [newNotification, ...prev]);
          
          toast.info(newNotification.message, {
            duration: 5000,
            action: {
              label: "Voir",
              onClick: () => handleJustificationClick({ id: newNotification.attendanceId })
            }
          });
        });
      } catch (error) {
        console.error('Socket setup error:', error);
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      if (isConnected) {
        socketService.removeNewNotificationListener();
        socketService.disconnect();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      markAsRead,
      handleJustificationClick
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};