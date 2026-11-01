import { GameState, UserProfile, MatchChallenge, FriendRequest } from '../types/chess';

type SocketEventListener = (payload: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventListener>> = new Map();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  public status: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  private currentUser: UserProfile | null = null;
  private currentRoomId: string | null = null;

  connect(user: UserProfile) {
    this.currentUser = user;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // Already active or connecting; update user identification
      this.send('identify', { user });
      return;
    }

    this.status = 'connecting';
    this.emitStatusChange();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.emitStatusChange();
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Identify client
        this.send('identify', { user: this.currentUser });

        // If we were in a room, re-join it
        if (this.currentRoomId) {
          this.send('rejoin_room', { roomId: this.currentRoomId, user: this.currentUser });
        }

        // Keep connection warm with heartbeats
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'pong') return;
          this.dispatch(msg.type, msg.payload);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.emitStatusChange();
        clearInterval(this.pingInterval);
        // Attempt reconnect in 2 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.currentUser) {
              this.connect(this.currentUser);
            }
          }, 2000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };
    } catch (err) {
      this.status = 'disconnected';
      this.emitStatusChange();
      console.error('WebSocket connection error:', err);
    }
  }

  send(type: string, payload: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('Socket not open. Cannot send:', type);
    }
  }

  on(event: string, callback: SocketEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private dispatch(event: string, payload: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in socket listener for ${event}:`, err);
        }
      });
    }
  }

  private emitStatusChange() {
    this.dispatch('connection_status', { status: this.status });
  }

  setCurrentRoom(roomId: string | null) {
    this.currentRoomId = roomId;
  }

  disconnect() {
    clearInterval(this.pingInterval);
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
    this.emitStatusChange();
  }
}

export const socket = new SocketClient();
