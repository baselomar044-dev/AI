// ============================================
// 🖥️ COMPUTER USE - Browser Automation Client
// Real implementation using server APIs
// ============================================

export interface ComputerUseConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface Session {
  id: string;
  status: 'active' | 'stopped';
  createdAt: Date;
  mode?: 'demo' | 'production';
}

export interface ScreenshotResult {
  screenshot: string | null;
  timestamp: Date;
}

export interface AutomationRecipe {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  steps: AutomationStep[];
}

export interface AutomationStep {
  action: 'navigate' | 'click' | 'type' | 'scroll' | 'wait' | 'screenshot';
  params: Record<string, any>;
}

export interface CommandResult {
  output: string;
  error?: string;
  exitCode: number;
}

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export class ComputerUseClient {
  private config: ComputerUseConfig;
  private currentSession: Session | null = null;
  private baseUrl: string;

  constructor(config: ComputerUseConfig = {}) {
    this.config = config;
    this.baseUrl = config.baseUrl || '/api/computer';
  }

  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `API error: ${response.status}`);
    }

    return response.json();
  }

  async startSession(template: string = 'ubuntu'): Promise<Session> {
    try {
      const data = await this.fetchApi<{ sandboxId: string; screenUrl?: string; mode: string }>('/sandbox', {
        method: 'POST',
        body: JSON.stringify({ template }),
      });

      this.currentSession = {
        id: data.sandboxId,
        status: 'active',
        createdAt: new Date(),
        mode: data.mode as 'demo' | 'production',
      };

      return this.currentSession;
    } catch (error) {
      console.error('[Computer Use] Failed to start session:', error);
      throw error;
    }
  }

  async closeSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await this.fetchApi(`/sandbox/${this.currentSession.id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('[Computer Use] Failed to close session:', error);
    } finally {
      if (this.currentSession) {
        this.currentSession.status = 'stopped';
        this.currentSession = null;
      }
    }
  }

  async screenshot(): Promise<ScreenshotResult> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch(`${this.baseUrl}/screenshot?sandboxId=${this.currentSession.id}`);
      
      if (!response.ok) {
        throw new Error('Screenshot failed');
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);

      return {
        screenshot: base64,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[Computer Use] Screenshot failed:', error);
      return {
        screenshot: null,
        timestamp: new Date(),
      };
    }
  }

  async executeCommand(command: string): Promise<CommandResult> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const data = await this.fetchApi<CommandResult>('/execute', {
      method: 'POST',
      body: JSON.stringify({
        sandboxId: this.currentSession.id,
        command,
      }),
    });

    return data;
  }

  async navigate(url: string): Promise<void> {
    // For browser-based sandboxes, navigate by executing a command
    if (this.currentSession) {
      await this.executeCommand(`xdg-open "${url}" || google-chrome --no-sandbox "${url}" &`);
    }
    console.log(`[Computer Use] Navigating to: ${url}`);
  }

  async click(x: number, y: number): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    await this.fetchApi('/click', {
      method: 'POST',
      body: JSON.stringify({
        sandboxId: this.currentSession.id,
        x,
        y,
      }),
    });

    console.log(`[Computer Use] Clicked at (${x}, ${y})`);
  }

  async type(text: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    await this.fetchApi('/keyboard', {
      method: 'POST',
      body: JSON.stringify({
        sandboxId: this.currentSession.id,
        text,
      }),
    });

    console.log(`[Computer Use] Typed: ${text}`);
  }

  async keyPress(key: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    await this.fetchApi('/keyboard', {
      method: 'POST',
      body: JSON.stringify({
        sandboxId: this.currentSession.id,
        key,
      }),
    });

    console.log(`[Computer Use] Key press: ${key}`);
  }

  async scroll(direction: 'up' | 'down', amount: number = 300): Promise<void> {
    // Scroll using xdotool or similar
    if (this.currentSession) {
      const scrollCmd = direction === 'down' ? 'button4' : 'button5';
      await this.executeCommand(`xdotool click --repeat ${Math.floor(amount / 100)} ${scrollCmd}`);
    }
    console.log(`[Computer Use] Scrolling ${direction} by ${amount}px`);
  }

  async listFiles(path: string = '/home/user'): Promise<FileInfo[]> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const data = await this.fetchApi<{ files: FileInfo[] }>(
      `/files?sandboxId=${this.currentSession.id}&path=${encodeURIComponent(path)}`
    );

    return data.files || [];
  }

  async uploadFile(path: string, content: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    await this.fetchApi('/files', {
      method: 'POST',
      body: JSON.stringify({
        sandboxId: this.currentSession.id,
        path,
        content,
      }),
    });
  }

  async downloadFile(path: string): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const response = await fetch(
      `${this.baseUrl}/files/download?sandboxId=${this.currentSession.id}&path=${encodeURIComponent(path)}`
    );

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.text();
  }

  async getStatus(): Promise<{ status: string; uptime: number; template?: string }> {
    if (!this.currentSession) {
      return { status: 'disconnected', uptime: 0 };
    }

    try {
      const data = await this.fetchApi<{ status: string; uptime: number; template?: string }>(
        `/sandbox/${this.currentSession.id}/status`
      );
      return data;
    } catch {
      return { status: 'unknown', uptime: 0 };
    }
  }

  getSession(): Session | null {
    return this.currentSession;
  }

  isActive(): boolean {
    return this.currentSession?.status === 'active';
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// ============================================
// PRE-BUILT AUTOMATION RECIPES
// ============================================

export const AUTOMATION_RECIPES: AutomationRecipe[] = [
  {
    id: 'google-search',
    name: 'Google Search',
    nameAr: 'بحث جوجل',
    description: 'Search Google for any query',
    descriptionAr: 'ابحث في جوجل عن أي شيء',
    icon: '🔍',
    steps: [
      { action: 'navigate', params: { url: 'https://www.google.com' } },
      { action: 'wait', params: { ms: 1000 } },
      { action: 'type', params: { selector: 'input[name="q"]', text: '{{query}}' } },
      { action: 'click', params: { selector: 'input[name="btnK"]' } },
      { action: 'wait', params: { ms: 2000 } },
      { action: 'screenshot', params: {} },
    ],
  },
  {
    id: 'youtube-search',
    name: 'YouTube Search',
    nameAr: 'بحث يوتيوب',
    description: 'Search YouTube for videos',
    descriptionAr: 'ابحث في يوتيوب عن فيديوهات',
    icon: '📺',
    steps: [
      { action: 'navigate', params: { url: 'https://www.youtube.com' } },
      { action: 'wait', params: { ms: 1500 } },
      { action: 'type', params: { selector: 'input#search', text: '{{query}}' } },
      { action: 'click', params: { selector: 'button#search-icon-legacy' } },
      { action: 'wait', params: { ms: 2000 } },
      { action: 'screenshot', params: {} },
    ],
  },
  {
    id: 'weather-check',
    name: 'Check Weather',
    nameAr: 'تحقق من الطقس',
    description: 'Get current weather for a location',
    descriptionAr: 'احصل على الطقس الحالي لموقع',
    icon: '🌤️',
    steps: [
      { action: 'navigate', params: { url: 'https://www.google.com/search?q=weather+{{location}}' } },
      { action: 'wait', params: { ms: 2000 } },
      { action: 'screenshot', params: {} },
    ],
  },
  {
    id: 'open-website',
    name: 'Open Website',
    nameAr: 'فتح موقع',
    description: 'Navigate to any website',
    descriptionAr: 'انتقل إلى أي موقع ويب',
    icon: '🌐',
    steps: [
      { action: 'navigate', params: { url: '{{url}}' } },
      { action: 'wait', params: { ms: 2000 } },
      { action: 'screenshot', params: {} },
    ],
  },
  {
    id: 'take-screenshot',
    name: 'Take Screenshot',
    nameAr: 'لقطة شاشة',
    description: 'Capture current screen',
    descriptionAr: 'التقط الشاشة الحالية',
    icon: '📸',
    steps: [
      { action: 'screenshot', params: {} },
    ],
  },
];

// Export default instance
export const computerUse = new ComputerUseClient();
