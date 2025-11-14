// import { useState, useEffect, useCallback } from 'react';
// import { socketService } from '@/lib/socket';
// //  import { notificationsAPI } from '@/lib/api';
// import { toast } from 'sonner';
// import { useRouter } from 'next/navigation';

// interface Notification {
//   date: string;
//   id: string;
//   type: 'JUSTIFICATION_SUBMITTED';
//   message: string;
//   createdAt: string;
//   read: boolean;
//   attendanceId: string;
//   sender: {
//     id: string;
//     email: string;
//   };
//   receiver: {
//     id: string;
//     email: string;
//   };
// }

// export function useNotifications() {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   const fetchNotifications = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await notificationsAPI.getUnread();
//       setNotifications(response.map((notif: any) => ({
//         ...notif,
//         date: notif.date || new Date().toISOString(), // Ensure 'date' is present
//       })));
//     } catch (error) {
//       console.error('Error fetching notifications:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Move markAsRead before handleNotificationClick
//   const markAsRead = async (notificationId: string) => {
//     try {
//       await notificationsAPI.markAsRead(notificationId);
//       setNotifications(prev =>
//         prev.map(notif =>
//           notif.id === notificationId ? { ...notif, read: true } : notif
//         )
//       );
//     } catch (error) {
//       console.error('Error marking notification as read:', error);
//     }
//   };

//   const handleNotificationClick = useCallback(async (notification) => {
//     if (!notification) return;
    
//     try {
//       // Mark notification as read
//       await markAsRead(notification.id);
      
//       // Log the attendance ID for debugging
//       console.log('Clicking notification for attendance:', notification.attendanceId);
      
//       // Navigate to the attendance page with the justify parameter
//       router.push(`/dashboard/attendance?justify=${notification.attendanceId}`);
//     } catch (error) {
//       console.error('Error handling notification click:', error);
//       toast.error('Une erreur est survenue');
//     }
//   }, [router, markAsRead]);

//   useEffect(() => {
//     const token = localStorage.getItem('accessToken');
//     if (!token) return;

//     let mounted = true;

//     const setupSocket = async () => {
//       try {
//         await socketService.connect(token);

//         socketService.onNewNotification((newNotification) => {
//           if (!mounted) return;
          
//           console.log('Received new notification:', newNotification);
//           setNotifications(prev => [
//             { ...newNotification, date: newNotification.date || new Date().toISOString() },
//             ...prev
//           ]);
          
//           toast.info(newNotification.message, {
//             duration: 5000,
//             action: {
//               label: "Voir",
//               onClick: () => handleNotificationClick(newNotification)
//             }
//           });
//         });

//         await fetchNotifications();
//       } catch (error) {
//         console.error('Socket setup error:', error);
//       }
//     };

//     setupSocket();

//     return () => {
//       mounted = false;
//       socketService.removeNewNotificationListener();
//       socketService.disconnect();
//     };
//   }, [fetchNotifications, handleNotificationClick]);

//   return {
//     notifications,
//     loading,
//     markAsRead,
//     handleNotificationClick
//   };
// }