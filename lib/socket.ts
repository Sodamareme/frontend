// import { Socket as ClientSocket } from 'socket.io-client';
// import io from 'socket.io-client';

// interface ServerToClientEvents {
//   newNotification: (notification: {
//     date: string;
//     id: string;
//     type: 'JUSTIFICATION_SUBMITTED';
//     message: string;
//     createdAt: string;
//     read: boolean;
//     attendanceId: string;
//     sender: {
//       id: string;
//       email: string;
//     };
//     receiver: {
//       id: string;
//       email: string;
//     };
//   }) => void;
// }

// interface ClientToServerEvents {
//   // Add events that client sends to server if any
// }

// class SocketService {
//   private socket: ReturnType<typeof io> | null = null;

//   connect(token: string) {
//     if (this.socket?.connected) {
//       console.log('Socket already connected');
//       return;
//     }

//     console.log('Attempting to connect to WebSocket...');

//     this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
//       auth: { token },
//       autoConnect: false,
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//       transports: ['websocket', 'polling'],
//     });

//     this.socket.on('connect', () => {
//       console.log('WebSocket connected successfully');
//     });

//     this.socket.on('connect_error', (error) => {
//       console.error('WebSocket connection error:', error);
//     });

//     this.socket.on('disconnect', (reason) => {
//       console.log('WebSocket disconnected:', reason);
//       if (reason === 'io server disconnect') {
//         // Server has forcefully disconnected, try to reconnect
//         this.socket?.connect();
//       }
//     });

//     this.socket.connect();
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.removeAllListeners();
//       this.socket.disconnect();
//       this.socket = null;
//       console.log('Socket disconnected and cleaned up');
//     }
//   }

  

//   removeNewNotificationListener() {
//     this.socket?.off('newNotification');
//   }

//     onNewNotification(callback: (notification: any) => void) {
//     this.socket?.on('new-notification', callback);
//   }
// }


// export const socketService = new SocketService();