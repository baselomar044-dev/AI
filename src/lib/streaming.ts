// ============================================
// 🌊 STREAMING RESPONSES - Real-time AI Output
// ============================================

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
  onMetadata?: (meta: StreamMetadata) => void;
}

export interface StreamMetadata {
  model: string;
  provider: string;
  tokensUsed: number;
  latencyMs: number;
  cached: boolean;
}

// Parse SSE stream from backend
export async function streamChat(
  message: string,
  conversationId: string,
  callbacks: StreamCallbacks,
  options: {
    images?: string[];
    files?: string[];
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<void> {
  const startTime = Date.now();
  let fullText = '';
  
  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        message,
        conversationId,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            callbacks.onComplete(fullText);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'token') {
              fullText += parsed.content;
              callbacks.onToken(parsed.content);
            } else if (parsed.type === 'metadata') {
              callbacks.onMetadata?.({
                model: parsed.model,
                provider: parsed.provider,
                tokensUsed: parsed.tokens,
                latencyMs: Date.now() - startTime,
                cached: parsed.cached || false,
              });
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message);
            }
          } catch (e) {
            // Non-JSON data, treat as token
            if (data && data !== '[DONE]') {
              fullText += data;
              callbacks.onToken(data);
            }
          }
        }
      }
    }

    callbacks.onComplete(fullText);
  } catch (error) {
    callbacks.onError(error as Error);
  }
}

// WebSocket streaming for real-time bidirectional communication
export class WebSocketStream {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private messageQueue: any[] = [];
  private callbacks: Map<string, StreamCallbacks> = new Map();

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        // Send queued messages
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          this.ws?.send(JSON.stringify(msg));
        }
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const callbacks = this.callbacks.get(data.requestId);
          
          if (callbacks) {
            if (data.type === 'token') {
              callbacks.onToken(data.content);
            } else if (data.type === 'complete') {
              callbacks.onComplete(data.fullText);
              this.callbacks.delete(data.requestId);
            } else if (data.type === 'error') {
              callbacks.onError(new Error(data.message));
              this.callbacks.delete(data.requestId);
            } else if (data.type === 'metadata') {
              callbacks.onMetadata?.(data.metadata);
            }
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnects) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        reject(error);
      };
    });
  }

  send(requestId: string, message: any, callbacks: StreamCallbacks): void {
    this.callbacks.set(requestId, callbacks);
    
    const payload = { ...message, requestId };
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.messageQueue.push(payload);
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}

// Streaming text renderer with typing effect
export function useStreamingText(initialText = '') {
  let displayedText = initialText;
  let targetText = initialText;
  let animationFrame: number | null = null;

  const setTargetText = (text: string) => {
    targetText = text;
  };

  const appendText = (token: string) => {
    targetText += token;
  };

  const startAnimation = (onUpdate: (text: string) => void) => {
    const animate = () => {
      if (displayedText.length < targetText.length) {
        // Add characters progressively
        const charsToAdd = Math.min(3, targetText.length - displayedText.length);
        displayedText = targetText.slice(0, displayedText.length + charsToAdd);
        onUpdate(displayedText);
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animate();
  };

  const stopAnimation = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    displayedText = targetText;
  };

  return {
    setTargetText,
    appendText,
    startAnimation,
    stopAnimation,
    getText: () => displayedText,
  };
}
