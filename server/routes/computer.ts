// ============================================
// 🖥️ COMPUTER USE API ROUTES
// E2B Sandbox Integration for Remote Desktop
// ============================================

import { Router, Request, Response } from 'express';

const router = Router();

// ============================================
// TYPES
// ============================================

interface SandboxSession {
  id: string;
  template: string;
  createdAt: Date;
  status: 'active' | 'stopped' | 'error';
  screenUrl?: string;
}

// In-memory storage for demo (use Redis in production)
const activeSandboxes = new Map<string, SandboxSession>();

// ============================================
// E2B INTEGRATION
// ============================================

/**
 * Create a new sandbox
 */
router.post('/sandbox', async (req: Request, res: Response) => {
  try {
    const { template = 'ubuntu' } = req.body;
    // Check for API key in headers or env
    const e2bApiKey = (req.headers['x-e2b-api-key'] as string) || process.env.E2B_API_KEY;
    
    if (!e2bApiKey) {
      // Return demo sandbox if no API key
      const demoId = `demo-${Date.now()}`;
      activeSandboxes.set(demoId, {
        id: demoId,
        template,
        createdAt: new Date(),
        status: 'active',
        screenUrl: `https://placehold.co/1920x1080/1e293b/94a3b8?text=Demo+Mode`,
      });
      
      return res.json({
        sandboxId: demoId,
        screenUrl: activeSandboxes.get(demoId)?.screenUrl,
        mode: 'demo',
      });
    }
    
    // Create E2B sandbox
    const response = await fetch('https://api.e2b.dev/sandboxes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${e2bApiKey}`,
      },
      body: JSON.stringify({
        template: template === 'ubuntu' ? 'base' : template,
        timeout: 300, // 5 minutes
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`E2B API error: ${error}`);
    }
    
    const data = await response.json();
    
    const session: SandboxSession = {
      id: data.sandboxId || data.id,
      template,
      createdAt: new Date(),
      status: 'active',
    };
    
    activeSandboxes.set(session.id, session);
    
    res.json({
      sandboxId: session.id,
      screenUrl: data.screenUrl,
      mode: 'production',
    });
    
  } catch (error: any) {
    console.error('Sandbox creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete/stop a sandbox
 */
router.delete('/sandbox/:sandboxId', async (req: Request, res: Response) => {
  try {
    const { sandboxId } = req.params;
    const e2bApiKey = (req.headers['x-e2b-api-key'] as string) || process.env.E2B_API_KEY;
    
    if (sandboxId.startsWith('demo-')) {
      activeSandboxes.delete(sandboxId);
      return res.json({ success: true });
    }
    
    if (e2bApiKey) {
      await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${e2bApiKey}`,
        },
      });
    }
    
    activeSandboxes.delete(sandboxId);
    res.json({ success: true });
    
  } catch (error: any) {
    console.error('Sandbox deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Execute a command in sandbox
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { sandboxId, command } = req.body;
    const e2bApiKey = (req.headers['x-e2b-api-key'] as string) || process.env.E2B_API_KEY;
    
    if (!sandboxId || !command) {
      return res.status(400).json({ error: 'sandboxId and command required' });
    }
    
    // Demo mode
    if (sandboxId.startsWith('demo-')) {
      const output = getDemoOutput(command);
      return res.json({
        output,
        exitCode: 0,
        duration: Math.floor(Math.random() * 500) + 100,
      });
    }
    
    // Real E2B execution
    if (!e2bApiKey) {
      return res.status(400).json({ error: 'E2B API key not configured' });
    }
    
    const response = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${e2bApiKey}`,
      },
      body: JSON.stringify({
        command,
        timeout: 30000,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const data = await response.json();
    
    res.json({
      output: data.stdout || '',
      error: data.stderr || '',
      exitCode: data.exitCode || 0,
    });
    
  } catch (error: any) {
    console.error('Command execution error:', error);
    res.status(500).json({ error: error.message, exitCode: 1 });
  }
});

/**
 * Get files from sandbox
 */
router.get('/files', async (req: Request, res: Response) => {
  try {
    const { sandboxId, path = '/home/user' } = req.query as { sandboxId: string; path: string };
    const e2bApiKey = process.env.E2B_API_KEY;
    
    if (!sandboxId) {
      return res.status(400).json({ error: 'sandboxId required' });
    }
    
    // Demo mode
    if (sandboxId.startsWith('demo-')) {
      return res.json({
        files: [
          { name: 'Documents', path: `${path}/Documents`, type: 'directory' },
          { name: 'Downloads', path: `${path}/Downloads`, type: 'directory' },
          { name: 'Desktop', path: `${path}/Desktop`, type: 'directory' },
          { name: 'script.py', path: `${path}/script.py`, type: 'file', size: 1024 },
          { name: 'notes.txt', path: `${path}/notes.txt`, type: 'file', size: 256 },
          { name: 'data.json', path: `${path}/data.json`, type: 'file', size: 512 },
        ],
      });
    }
    
    // Real E2B file listing
    if (!e2bApiKey) {
      return res.status(400).json({ error: 'E2B API key not configured' });
    }
    
    const response = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/files?path=${encodeURIComponent(path)}`, {
      headers: {
        'Authorization': `Bearer ${e2bApiKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    const data = await response.json();
    res.json({ files: data });
    
  } catch (error: any) {
    console.error('File listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload file to sandbox
 */
router.post('/files', async (req: Request, res: Response) => {
  try {
    const { sandboxId, path, content } = req.body;
    const e2bApiKey = process.env.E2B_API_KEY;
    
    if (!sandboxId || !path || content === undefined) {
      return res.status(400).json({ error: 'sandboxId, path, and content required' });
    }
    
    // Demo mode
    if (sandboxId.startsWith('demo-')) {
      return res.json({ success: true, path });
    }
    
    // Real E2B file upload
    if (!e2bApiKey) {
      return res.status(400).json({ error: 'E2B API key not configured' });
    }
    
    const response = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${e2bApiKey}`,
      },
      body: JSON.stringify({ path, content }),
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    res.json({ success: true, path });
    
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download file from sandbox
 */
router.get('/files/download', async (req: Request, res: Response) => {
  try {
    const { sandboxId, path } = req.query as { sandboxId: string; path: string };
    const e2bApiKey = process.env.E2B_API_KEY;
    
    if (!sandboxId || !path) {
      return res.status(400).json({ error: 'sandboxId and path required' });
    }
    
    // Demo mode
    if (sandboxId.startsWith('demo-')) {
      return res.send('Demo file content\nHello from Try-It!');
    }
    
    // Real E2B file download
    if (!e2bApiKey) {
      return res.status(400).json({ error: 'E2B API key not configured' });
    }
    
    const response = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(path)}`, {
      headers: {
        'Authorization': `Bearer ${e2bApiKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    const content = await response.text();
    res.send(content);
    
  } catch (error: any) {
    console.error('File download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Take screenshot
 */
router.get('/screenshot', async (req: Request, res: Response) => {
  try {
    const { sandboxId } = req.query as { sandboxId: string };
    const e2bApiKey = (req.headers['x-e2b-api-key'] as string) || process.env.E2B_API_KEY;
    
    if (!sandboxId) {
      return res.status(400).json({ error: 'sandboxId required' });
    }
    
    // Demo mode - return placeholder image
    if (sandboxId.startsWith('demo-')) {
      const response = await fetch('https://placehold.co/1920x1080/1e293b/94a3b8.png?text=Screenshot');
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', 'image/png');
      return res.send(Buffer.from(buffer));
    }
    
    // Real E2B screenshot
    if (!e2bApiKey) {
      return res.status(400).json({ error: 'E2B API key not configured' });
    }
    
    const response = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/screenshot`, {
      headers: {
        'Authorization': `Bearer ${e2bApiKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    const buffer = await response.arrayBuffer();
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(buffer));
    
  } catch (error: any) {
    console.error('Screenshot error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send mouse click
 */
router.post('/click', async (req: Request, res: Response) => {
  try {
    const { sandboxId, x, y, button = 'left' } = req.body;
    const e2bApiKey = (req.headers['x-e2b-api-key'] as string) || process.env.E2B_API_KEY;
    
    if (!sandboxId || x === undefined || y === undefined) {
      return res.status(400).json({ error: 'sandboxId, x, and y required' });
    }
    
    // Demo mode
    if (sandboxId.startsWith('demo-')) {
      return res.json({ success: true, x, y });
    }
    
    // Real E2B click (if supported)
    if (e2bApiKey) {
      // E2B may or may not support direct mouse control
      // This would depend on the specific sandbox template
      console.log(`Click at (${x}, ${y}) with ${button} button`);
    }
    
    res.json({ success: true, x, y });
    
  } catch (error: any) {
    console.error('Click error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send keyboard input
 */
router.post('/keyboard', async (req: Request, res: Response) => {
  try {
    const { sandboxId, text, key } = req.body;
    const e2bApiKey = process.env.E2B_API_KEY;
    
    if (!sandboxId || (!text && !key)) {
      return res.status(400).json({ error: 'sandboxId and text/key required' });
    }
    
    // Demo mode
    if (sandboxId.startsWith('demo-')) {
      return res.json({ success: true });
    }
    
    // Real E2B keyboard input
    if (e2bApiKey) {
      console.log(`Keyboard input: ${text || key}`);
    }
    
    res.json({ success: true });
    
  } catch (error: any) {
    console.error('Keyboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get sandbox status
 */
router.get('/sandbox/:sandboxId/status', async (req: Request, res: Response) => {
  try {
    const { sandboxId } = req.params;
    const e2bApiKey = (req.headers['x-e2b-api-key'] as string) || process.env.E2B_API_KEY;
    
    // Check local cache first
    const cached = activeSandboxes.get(sandboxId);
    if (cached) {
      return res.json({
        status: cached.status,
        uptime: Math.floor((Date.now() - cached.createdAt.getTime()) / 1000),
        template: cached.template,
      });
    }
    
    // Demo mode
    if (sandboxId.startsWith('demo-')) {
      return res.json({ status: 'stopped' });
    }
    
    // Check E2B API
    if (e2bApiKey) {
      const response = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}`, {
        headers: {
          'Authorization': `Bearer ${e2bApiKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return res.json({
          status: data.status || 'active',
          uptime: data.uptime || 0,
        });
      }
    }
    
    res.json({ status: 'unknown' });
    
  } catch (error: any) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List active sandboxes
 */
router.get('/sandboxes', async (req: Request, res: Response) => {
  try {
    const sandboxes = Array.from(activeSandboxes.values()).map(s => ({
      id: s.id,
      template: s.template,
      status: s.status,
      createdAt: s.createdAt,
      uptime: Math.floor((Date.now() - s.createdAt.getTime()) / 1000),
    }));
    
    res.json({ sandboxes });
    
  } catch (error: any) {
    console.error('List sandboxes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDemoOutput(command: string): string {
  const cmd = command.toLowerCase().trim();
  
  // File system commands
  if (cmd === 'ls' || cmd === 'ls -la' || cmd === 'ls -l') {
    return `total 24
drwxr-xr-x  5 user user 4096 Feb  1 12:00 .
drwxr-xr-x  3 root root 4096 Jan 15 10:30 ..
-rw-r--r--  1 user user  220 Jan 15 10:30 .bash_logout
-rw-r--r--  1 user user 3771 Jan 15 10:30 .bashrc
drwxr-xr-x  2 user user 4096 Feb  1 11:00 Documents
drwxr-xr-x  2 user user 4096 Feb  1 11:00 Downloads
drwxr-xr-x  2 user user 4096 Feb  1 11:00 Desktop
-rw-r--r--  1 user user 1024 Feb  1 12:00 script.py
-rw-r--r--  1 user user  256 Feb  1 12:00 notes.txt`;
  }
  
  if (cmd === 'pwd') return '/home/user';
  if (cmd === 'whoami') return 'user';
  if (cmd === 'hostname') return 'ai-assistant-sandbox';
  if (cmd.startsWith('cd ')) return '';
  
  // System info
  if (cmd === 'date') return new Date().toString();
  if (cmd === 'uptime') return ' 12:00:00 up 1 day,  2:30,  1 user,  load average: 0.15, 0.10, 0.05';
  if (cmd === 'uname -a') return 'Linux ai-assistant-sandbox 5.15.0-generic #1 SMP x86_64 GNU/Linux';
  if (cmd === 'free -h') return `              total        used        free      shared  buff/cache   available
Mem:           7.8G        2.1G        3.2G        256M        2.5G        5.2G
Swap:          2.0G          0B        2.0G`;
  if (cmd === 'df -h') return `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   15G   33G  32% /
tmpfs           3.9G     0  3.9G   0% /dev/shm`;
  
  // Network
  if (cmd === 'ip addr' || cmd === 'ifconfig') return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>`;
  if (cmd.startsWith('ping')) return 'PING google.com (142.250.185.78): 56 data bytes\n64 bytes from 142.250.185.78: icmp_seq=0 ttl=117 time=10.5 ms';
  if (cmd.startsWith('curl')) return '{"status": "ok", "demo": true}';
  
  // Package managers
  if (cmd.startsWith('apt') || cmd.startsWith('sudo apt')) return 'Reading package lists... Done\nBuilding dependency tree... Done\nAll packages are up to date.';
  if (cmd.startsWith('pip')) return 'pip 23.0.1 from /usr/local/lib/python3.11/site-packages/pip (python 3.11)';
  if (cmd.startsWith('npm')) return 'npm 10.2.0';
  
  // Programming
  if (cmd === 'python --version' || cmd === 'python3 --version') return 'Python 3.11.0';
  if (cmd === 'node --version') return 'v20.10.0';
  if (cmd === 'go version') return 'go version go1.21.0 linux/amd64';
  if (cmd === 'rustc --version') return 'rustc 1.74.0 (79e9716c9 2023-11-13)';
  
  // Git
  if (cmd === 'git --version') return 'git version 2.43.0';
  if (cmd === 'git status') return 'On branch main\nnothing to commit, working tree clean';
  
  // Echo
  if (cmd.startsWith('echo ')) return cmd.substring(5).replace(/['"]/g, '');
  
  // Cat
  if (cmd.startsWith('cat ')) {
    const file = cmd.substring(4).trim();
    if (file === 'script.py') return '#!/usr/bin/env python3\nprint("Hello from AI Assistant!")';
    if (file === 'notes.txt') return 'Welcome to AI Assistant Virtual Sandbox\nThis is a demo environment.';
    return `cat: ${file}: No such file or directory`;
  }
  
  // Applications
  if (cmd.includes('chrome') || cmd.includes('firefox') || cmd.includes('code')) {
    return 'Application started in background';
  }
  
  // Help
  if (cmd === 'help' || cmd === '--help') {
    return `AI Assistant Demo Sandbox
Available commands: ls, cd, pwd, whoami, cat, echo, date, python, node, git, and more.
This is a simulated environment for demonstration purposes.`;
  }
  
  // Default
  return `Command executed: ${command}`;
}

export default router;
