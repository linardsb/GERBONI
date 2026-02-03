const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api";

export type MessageHandler = (data: WebSocketMessage) => void;

export interface WebSocketMessage {
  type: "auth_success" | "auth_error" | "guest_success" | "message" | "typing" | "error";
  message?: string;
  content?: string;
  role?: "assistant";
  status?: boolean;
}

class ChatWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private reconnectDelay = 1000;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(`${WS_URL}/agent/chat`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          this.handlers.forEach((handler) => handler(data));
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnects) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect().catch(console.error);
          }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }

  authenticate(token: string) {
    this.send({ type: "auth", token });
  }

  setGuestSession(sessionToken: string, email?: string) {
    this.send({ type: "guest", session_token: sessionToken, email });
  }

  sendMessage(content: string) {
    this.send({ type: "message", content });
  }

  private send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const chatWebSocket = new ChatWebSocket();
