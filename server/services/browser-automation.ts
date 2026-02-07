// ============================================
// 🖥️ BROWSER AUTOMATION SERVICE
// Real Computer Use with Puppeteer (FREE!)
// ============================================

import puppeteer, { Browser, Page } from 'puppeteer';

interface BrowserAction {
  type: 'navigate' | 'click' | 'type' | 'screenshot' | 'scroll' | 'wait';
  selector?: string;
  value?: string;
  url?: string;
  x?: number;
  y?: number;
}

interface ActionResult {
  success: boolean;
  action: string;
  screenshot?: string;
  error?: string;
  timestamp: Date;
}

class BrowserAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRunning: boolean = false;

  async initialize(): Promise<void> {
    if (this.browser) return;
    
    console.log('🖥️ Starting browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    console.log('✅ Browser ready!');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async executeAction(action: BrowserAction): Promise<ActionResult> {
    if (!this.page) {
      await this.initialize();
    }

    const page = this.page!;
    const timestamp = new Date();

    try {
      switch (action.type) {
        case 'navigate':
          if (!action.url) throw new Error('URL required');
          console.log(`🌐 Navigating to: ${action.url}`);
          await page.goto(action.url, { waitUntil: 'networkidle2', timeout: 30000 });
          const screenshot = await page.screenshot({ encoding: 'base64' });
          return {
            success: true,
            action: `Navigated to ${action.url}`,
            screenshot: screenshot as string,
            timestamp
          };

        case 'click':
          if (action.selector) {
            console.log(`🖱️ Clicking: ${action.selector}`);
            await page.click(action.selector);
          } else if (action.x !== undefined && action.y !== undefined) {
            console.log(`🖱️ Clicking at: (${action.x}, ${action.y})`);
            await page.mouse.click(action.x, action.y);
          }
          await new Promise(r => setTimeout(r, 500));
          const clickScreenshot = await page.screenshot({ encoding: 'base64' });
          return {
            success: true,
            action: `Clicked ${action.selector || `at (${action.x}, ${action.y})`}`,
            screenshot: clickScreenshot as string,
            timestamp
          };

        case 'type':
          if (!action.value) throw new Error('Value required for typing');
          if (action.selector) {
            console.log(`⌨️ Typing in: ${action.selector}`);
            await page.type(action.selector, action.value);
          } else {
            console.log(`⌨️ Typing: ${action.value}`);
            await page.keyboard.type(action.value);
          }
          const typeScreenshot = await page.screenshot({ encoding: 'base64' });
          return {
            success: true,
            action: `Typed: "${action.value}"`,
            screenshot: typeScreenshot as string,
            timestamp
          };

        case 'screenshot':
          console.log('📸 Taking screenshot...');
          const snap = await page.screenshot({ encoding: 'base64' });
          return {
            success: true,
            action: 'Screenshot captured',
            screenshot: snap as string,
            timestamp
          };

        case 'scroll':
          const scrollY = action.y || 500;
          console.log(`📜 Scrolling: ${scrollY}px`);
          await page.evaluate((y) => window.scrollBy(0, y), scrollY);
          const scrollScreenshot = await page.screenshot({ encoding: 'base64' });
          return {
            success: true,
            action: `Scrolled ${scrollY}px`,
            screenshot: scrollScreenshot as string,
            timestamp
          };

        case 'wait':
          const waitTime = parseInt(action.value || '1000');
          console.log(`⏳ Waiting: ${waitTime}ms`);
          await new Promise(r => setTimeout(r, waitTime));
          return {
            success: true,
            action: `Waited ${waitTime}ms`,
            timestamp
          };

        default:
          throw new Error(`Unknown action: ${action.type}`);
      }
    } catch (error: any) {
      console.error(`❌ Action failed: ${error.message}`);
      let errorScreenshot: string | undefined;
      try {
        errorScreenshot = await page.screenshot({ encoding: 'base64' }) as string;
      } catch {}
      
      return {
        success: false,
        action: action.type,
        error: error.message,
        screenshot: errorScreenshot,
        timestamp
      };
    }
  }

  // Execute a recipe (sequence of actions)
  async executeRecipe(recipe: BrowserAction[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    
    for (const action of recipe) {
      const result = await this.executeAction(action);
      results.push(result);
      
      if (!result.success) {
        console.log(`⚠️ Recipe stopped due to error: ${result.error}`);
        break;
      }
    }
    
    return results;
  }

  // Pre-built recipes
  static recipes = {
    googleSearch: (query: string): BrowserAction[] => [
      { type: 'navigate', url: 'https://www.google.com' },
      { type: 'type', selector: 'textarea[name="q"]', value: query },
      { type: 'click', selector: 'input[name="btnK"]' },
      { type: 'wait', value: '2000' },
      { type: 'screenshot' }
    ],
    
    youtubeSearch: (query: string): BrowserAction[] => [
      { type: 'navigate', url: 'https://www.youtube.com' },
      { type: 'type', selector: 'input#search', value: query },
      { type: 'click', selector: 'button#search-icon-legacy' },
      { type: 'wait', value: '3000' },
      { type: 'screenshot' }
    ],
    
    openWebsite: (url: string): BrowserAction[] => [
      { type: 'navigate', url },
      { type: 'wait', value: '2000' },
      { type: 'screenshot' }
    ],
    
    checkWeather: (city: string): BrowserAction[] => [
      { type: 'navigate', url: `https://www.google.com/search?q=weather+${encodeURIComponent(city)}` },
      { type: 'wait', value: '2000' },
      { type: 'screenshot' }
    ]
  };

  isActive(): boolean {
    return this.browser !== null;
  }

  async getCurrentUrl(): Promise<string> {
    if (!this.page) return '';
    return this.page.url();
  }

  async getPageTitle(): Promise<string> {
    if (!this.page) return '';
    return await this.page.title();
  }
}

// Singleton instance
export const browserAutomation = new BrowserAutomation();
export default BrowserAutomation;
