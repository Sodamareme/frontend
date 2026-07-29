// lib/socket.ts
import { io } from 'socket.io-client';
import type { Socket as SocketIOClient } from 'socket.io-client';

class SocketService {
  private socket: SocketIOClient | null = null;

  connect() {
    if (this.socket?.connected) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const socketOrigin = (() => {
      try {
        return new URL(apiUrl).origin;
      } catch {
        return apiUrl;
      }
    })();

    this.socket = io(socketOrigin, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {});
    this.socket.on('disconnect', () => {});
    this.socket.on('connect_error', () => {});
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: any) {
    if (!this.socket?.connected) {
      this.connect();
    }
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ── Méthodes dédiées aux notifications ──────────────────────────────────────

  onNewNotification(callback: (notification: any) => void) {
    this.socket?.on('notification', callback);
  }

  offNewNotification(callback?: (notification: any) => void) {
    if (callback) {
      this.socket?.off('notification', callback);
    } else {
      this.socket?.off('notification');
    }
  }

  joinRoom(room: string) {
    this.emit('join-room', { room });
  }

  leaveRoom(room: string) {
    this.emit('leave-room', { room });
  }
}

export const socketService = new SocketService();
export default socketService;
