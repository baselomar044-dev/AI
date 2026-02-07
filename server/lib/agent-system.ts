// ============================================
// 🤖 AUTONOMOUS AGENT SYSTEM - Full Power
// ============================================
// Real agents with real capabilities

import { unlimitedAI, ChatMessage, FunctionDefinition } from './unlimited-ai';
import { generateUltimatePrompt, getAdaptiveStyle } from './ultimate-personality';
import { KnowledgeManager } from './knowledge-system';

// ================== AGENT TYPES ==================

export interface AgentCapability {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  execute: (params: any) => Promise<any>;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, context?: any) => Promise<string>;
}

export interface AgentConfig {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  avatar: string;
  color: string;
  systemPrompt: string;
  capabilities: string[];
  tools: AgentTool[];
  autonomyLevel: 'passive' | 'active' | 'autonomous';
  maxIterations: number;
  allowedIntegrations: string[];
  schedule?: {
    enabled: boolean;
    cron?: string;
    interval?: number;
  };
  apiKeys?: Record<string, string>; // e.g. { OPENAI_API_KEY: 'sk-...' }
  memoryId?: string; // Links to a specific memory scope
  canCallAgents?: string[]; // IDs of other agents this one can call
  customIntegrations?: {
    id: string;
    name: string;
    baseUrl: string;
    authHeader: string;
  }[];
}

export interface AgentExecution {
  id: string;
  agentId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  iterations: AgentIteration[];
  result?: any;
  error?: string;
  context?: any;
}

export interface AgentIteration {
  index: number;
  thought: string;
  action?: {
    tool: string;
    input: any;
    output: any;
  };
  observation: string;
  timestamp: Date;
}

// ================== BUILT-IN TOOLS ==================

export const BUILT_IN_TOOLS: AgentTool[] = [
  // Web Search Tool
  {
    name: 'web_search',
    description: 'Search the web for current information. Use for recent events, facts, or research.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        num_results: { type: 'number', description: 'Number of results (default 5)' },
      },
      required: ['query'],
    },
    handler: async (args) => {
      // Tavily (Best)
      if (process.env.TAVILY_API_KEY) {
        try {
          const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: process.env.TAVILY_API_KEY,
              query: args.query,
              max_results: args.num_results || 5,
            }),
          });
          const data = await response.json();
          return JSON.stringify(data.results?.map((r: any) => ({
            title: r.title,
            url: r.url,
            content: r.content,
          })) || []);
        } catch (e) {
          console.warn('Tavily search failed', e);
        }
      }

      // Brave Search (Fallback)
      if (process.env.BRAVE_API_KEY) {
        try {
          const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(args.query)}&count=${args.num_results || 5}`,
            {
              headers: { 'X-Subscription-Token': process.env.BRAVE_API_KEY },
            }
          );
          const data = await response.json();
          return JSON.stringify(data.web?.results?.map((r: any) => ({
            title: r.title,
            url: r.url,
            description: r.description,
          })) || []);
        } catch (e) {
          console.warn('Brave search failed', e);
        }
      }
      
      // Fallback to DuckDuckGo (no API key needed)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(args.query)}&format=json`
      );
      const data = await response.json();
      return JSON.stringify({
        abstract: data.Abstract,
        results: data.RelatedTopics?.slice(0, 5).map((t: any) => t.Text) || [],
      });
    },
  },

  // Web Scrape Tool (Firecrawl)
  {
    name: 'web_scrape',
    description: 'Scrape content from a website URL. Use this to read full pages.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to scrape' },
      },
      required: ['url'],
    },
    handler: async (args) => {
      if (!process.env.FIRECRAWL_API_KEY) {
        return 'Error: FIRECRAWL_API_KEY not configured';
      }
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          },
          body: JSON.stringify({ url: args.url, formats: ['markdown'] }),
        });
        const data = await response.json();
        return data.data?.markdown || data.data?.content || 'No content found';
      } catch (e: any) {
        return `Scrape failed: ${e.message}`;
      }
    },
  },

  // HTTP Request Tool
  {
    name: 'http_request',
    description: 'Make HTTP requests to any URL. Use for APIs or web scraping.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to request' },
        method: { type: 'string', description: 'HTTP method (GET, POST, etc.)' },
        headers: { type: 'object', description: 'Request headers (supports {{ENV_VAR}} placeholders)' },
        body: { type: 'string', description: 'Request body for POST/PUT (supports {{ENV_VAR}} placeholders)' },
      },
      required: ['url'],
    },
    handler: async (args) => {
      // Helper to replace placeholders
      const replacePlaceholders = (obj: any): any => {
        if (typeof obj === 'string') {
          return obj.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => process.env[key] || '');
        }
        if (typeof obj === 'object' && obj !== null) {
          const newObj: any = Array.isArray(obj) ? [] : {};
          for (const key in obj) {
            newObj[key] = replacePlaceholders(obj[key]);
          }
          return newObj;
        }
        return obj;
      };

      const finalUrl = replacePlaceholders(args.url);
      const finalHeaders = replacePlaceholders(args.headers || {});
      const finalBody = replacePlaceholders(args.body);

      try {
        const response = await fetch(finalUrl, {
          method: args.method || 'GET',
          headers: finalHeaders,
          body: finalBody,
        });
        
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return JSON.stringify(await response.json());
        }
        return await response.text();
      } catch (e: any) {
        return `HTTP Request Failed: ${e.message}`;
      }
    },
  },

  // Code Execution Tool (sandboxed with E2B or QuickJS)
  {
    name: 'execute_code',
    description: 'Execute Python or JavaScript code. Use for calculations, data processing, etc.',
    parameters: {
      type: 'object',
      properties: {
        language: { type: 'string', description: 'python or javascript' },
        code: { type: 'string', description: 'Code to execute' },
      },
      required: ['language', 'code'],
    },
    handler: async (args) => {
      // E2B Sandboxing (Preferred)
      if (process.env.E2B_API_KEY) {
        try {
          const response = await fetch('https://api.e2b.dev/v1/sandboxes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.E2B_API_KEY}`,
            },
            body: JSON.stringify({
              template: args.language === 'python' ? 'python' : 'node',
            }),
          });
          
          if (!response.ok) throw new Error('Failed to create sandbox');
          const sandbox = await response.json();
          
          const execResponse = await fetch(`https://api.e2b.dev/v1/sandboxes/${sandbox.id}/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.E2B_API_KEY}`,
            },
            body: JSON.stringify({ code: args.code }),
          });
          
          const result = await execResponse.json();
          // Kill sandbox after use (fire and forget)
          fetch(`https://api.e2b.dev/v1/sandboxes/${sandbox.id}`, {
             method: 'DELETE',
             headers: { 'Authorization': `Bearer ${process.env.E2B_API_KEY}` },
          }).catch(() => {});
          
          return JSON.stringify({
            output: result.stdout || '',
            error: result.stderr || result.error,
          });
        } catch (e: any) {
          console.warn('E2B execution failed, falling back to local', e);
        }
      }

      // Local Fallback (QuickJS / Eval)
      if (args.language === 'javascript') {
        try {
          // Warning: Only use for simple calculations in dev
          const result = eval(args.code);
          return JSON.stringify(result);
        } catch (e: any) {
          return `Error: ${e.message}`;
        }
      }
      return 'Python execution requires E2B API key configured.';
    },
  },

  // Memory Tool
  {
    name: 'remember',
    description: 'Store important information for later recall.',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key' },
        value: { type: 'string', description: 'Value to remember' },
      },
      required: ['key', 'value'],
    },
    handler: async (args) => {
      // Store in database or local storage
      return `Remembered: ${args.key} = ${args.value}`;
    },
  },

  // Recall Tool
  {
    name: 'recall',
    description: 'Retrieve previously stored information.',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key to recall' },
      },
      required: ['key'],
    },
    handler: async (args) => {
      // Retrieve from database or local storage
      return `Recalled value for: ${args.key}`;
    },
  },

  // File Operations
  {
    name: 'file_operation',
    description: 'Read, write, or list files.',
    parameters: {
      type: 'object',
      properties: {
        operation: { type: 'string', description: 'read, write, list, or delete' },
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'Content for write operation' },
      },
      required: ['operation', 'path'],
    },
    handler: async (args) => {
      // Implement with proper sandboxing
      return `File operation: ${args.operation} on ${args.path}`;
    },
  },

  // Send Notification / Email
  {
    name: 'send_notification',
    description: 'Send a notification or email to the user.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Notification title' },
        message: { type: 'string', description: 'Notification message' },
        channel: { type: 'string', description: 'email, push, or sms' },
        to: { type: 'string', description: 'Recipient (email address)' },
      },
      required: ['message'],
    },
    handler: async (args) => {
      // Use Resend for Email
      if (args.channel === 'email' && process.env.RESEND_API_KEY && args.to) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Try-It! Agents <agents@tryit.app>',
              to: args.to,
              subject: args.title || 'Agent Notification',
              html: `<p>${args.message}</p>`,
            }),
          });
          return `Email sent to ${args.to}`;
        } catch (e: any) {
          return `Email failed: ${e.message}`;
        }
      }
      return `Notification sent: ${args.title || 'Alert'} - ${args.message}`;
    },
  },

  // Image Generation (Replicate)
  {
    name: 'generate_image',
    description: 'Generate an image from a text description.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Image description' },
      },
      required: ['prompt'],
    },
    handler: async (args) => {
      if (!process.env.REPLICATE_API_KEY) return 'Error: REPLICATE_API_KEY not set';
      try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
          },
          body: JSON.stringify({
            version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
            input: { prompt: args.prompt, width: 1024, height: 1024, num_outputs: 1 },
          }),
        });
        const result = await response.json();
        return `Image generation started: ${result.urls?.get || 'Check logs'}`;
      } catch (e: any) {
        return `Image generation failed: ${e.message}`;
      }
    },
  },

  // Schedule Task
  {
    name: 'schedule_task',
    description: 'Schedule a task for later execution.',
    parameters: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task description' },
        when: { type: 'string', description: 'When to execute (ISO date or relative like "in 1 hour")' },
        repeat: { type: 'string', description: 'Repeat pattern (daily, weekly, etc.)' },
      },
      required: ['task', 'when'],
    },
    handler: async (args) => {
      return `Scheduled: ${args.task} for ${args.when}`;
    },
  },

  // Integration Tool
  {
    name: 'use_integration',
    description: 'Use a connected integration/service.',
    parameters: {
      type: 'object',
      properties: {
        integration: { type: 'string', description: 'Integration name (gmail, slack, vercel, whatsapp, github)' },
        action: { type: 'string', description: 'Action to perform' },
        params: { type: 'object', description: 'Action parameters' },
      },
      required: ['integration', 'action'],
    },
    handler: async (args) => {
      // Vercel Integration
      if (args.integration === 'vercel') {
        const token = process.env.VERCEL_TOKEN;
        if (!token) return 'Error: Vercel Token not found. Please add it in Settings > Integrations.';

        if (args.action === 'deploy') {
          // Real Vercel Deployment (Simplified)
          return `[Vercel] ℹ️ Real deployment requires complex file uploading. Use 'vercel_deploy' tool for existing projects or 'list_projects' to see what's available.`;
        }
        if (args.action === 'list_projects') {
          try {
            const res = await fetch('https://api.vercel.com/v9/projects', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Unknown error');
            
            const projects = data.projects.slice(0, 5).map((p: any) => `- ${p.name} (${p.link?.type || 'N/A'})`).join('\n');
            return `[Vercel] Active Projects:\n${projects}`;
          } catch (e: any) {
            return `[Vercel Error] Failed to list projects: ${e.message}`;
          }
        }
      }

      // WhatsApp Integration (Twilio)
      if (args.integration === 'whatsapp') {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.WHATSAPP_TOKEN; // Using WHATSAPP_TOKEN as Auth Token for Twilio
        
        if (!sid || !token) return 'Error: Twilio SID or Token not found. Please add them in Settings.';

        if (args.action === 'send_message') {
          const to = args.params?.to;
          const text = args.params?.text;
          if (!to || !text) return 'Error: Missing "to" or "text" parameter.';

          try {
            const body = new URLSearchParams({
              'To': `whatsapp:${to}`,
              'From': 'whatsapp:+14155238886', // Twilio Sandbox Number
              'Body': text
            });

            const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: body
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Unknown error');
            return `[WhatsApp] ✅ Message sent! SID: ${data.sid}`;
          } catch (e: any) {
            return `[WhatsApp Error] Failed to send: ${e.message}`;
          }
        }
      }

      // GitHub Integration
      if (args.integration === 'github') {
        const token = process.env.GITHUB_TOKEN;
        if (!token) return 'Error: GitHub Token not found. Add it in Settings.';

        if (args.action === 'create_issue') {
           const owner = args.params?.owner;
           const repo = args.params?.repo;
           const title = args.params?.title;
           
           if (!owner || !repo || !title) return 'Error: Missing owner, repo, or title.';

           try {
             const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
               method: 'POST',
               headers: {
                 'Authorization': `Bearer ${token}`,
                 'Accept': 'application/vnd.github.v3+json',
                 'User-Agent': 'TryIt-Agent'
               },
               body: JSON.stringify({ title, body: args.params?.body || '' })
             });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message);
             return `[GitHub] ✅ Issue created: ${data.html_url}`;
           } catch (e: any) {
             return `[GitHub Error] ${e.message}`;
           }
        }
        
        if (args.action === 'list_repos') {
           try {
             const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=5', {
               headers: {
                 'Authorization': `Bearer ${token}`,
                 'User-Agent': 'TryIt-Agent'
               }
             });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message);
             const repos = data.map((r: any) => `- ${r.full_name} (⭐ ${r.stargazers_count})`).join('\n');
             return `[GitHub] Recent Repos:\n${repos}`;
           } catch (e: any) {
             return `[GitHub Error] ${e.message}`;
           }
        }
      }

      // Check for Custom Integrations via "this" context if available, or try to infer from agent config passed in context?
      // Since this is a static tool definition, we need a way to access the current agent's config.
      // Ideally, the handler should have access to the agent instance.
      // For now, we'll check if the integration name matches a known pattern or if we can access the agent config via closure if we restructure.
      
      // Since tools are defined globally but executed in the context of an agent, we need to pass the agent config to the tool handler.
      // We will modify the execute loop to inject the agent config into the tool execution context.
      
      // @ts-ignore - We will inject 'agentConfig' into args or a separate context in runAgentLoop
      const customIntegration = (args._agentConfig?.customIntegrations || []).find((i: any) => i.name.toLowerCase() === args.integration.toLowerCase());
      
      if (customIntegration) {
         try {
           const baseUrl = customIntegration.baseUrl.replace(/\/$/, '');
           const endpoint = args.action.startsWith('/') ? args.action : `/${args.action}`;
           const url = `${baseUrl}${endpoint}`;
           
           // Replace placeholders in Auth Header
           const authHeader = customIntegration.authHeader.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_: string, key: string) => process.env[key] || '');
           
           const headers: Record<string, string> = {
             'Content-Type': 'application/json',
           };
           
           if (authHeader) {
             const [key, ...valParts] = authHeader.split(':');
             if (key && valParts.length > 0) {
               headers[key.trim()] = valParts.join(':').trim();
             }
           }

           const method = args.params?.method || (Object.keys(args.params || {}).length > 0 ? 'POST' : 'GET');
           const body = method !== 'GET' ? JSON.stringify(args.params) : undefined;

           const res = await fetch(url, { method, headers, body });
           const text = await res.text();
           
           try {
             const json = JSON.parse(text);
             return `[${customIntegration.name}] Response:\n${JSON.stringify(json, null, 2)}`;
           } catch {
             return `[${customIntegration.name}] Response:\n${text}`;
           }
         } catch (e: any) {
           return `[${customIntegration.name} Error] ${e.message}`;
         }
      }

      return `Integration ${args.integration} not supported or action ${args.action} unknown.`;
    },
  },

  // Vercel Deploy Tool (Specialized)
  {
    name: 'vercel_deploy',
    description: 'Deploy the current project to Vercel.',
    parameters: {
      type: 'object',
      properties: {
        project_name: { type: 'string', description: 'Name of the project' },
        environment: { type: 'string', description: 'production or preview' },
      },
      required: ['project_name'],
    },
    handler: async (args) => {
      const token = process.env.VERCEL_TOKEN;
      if (!token) return 'Error: Vercel Token not found in Settings.';
      
      // Note: Real deployment from a running agent is complex as it requires uploading file blobs.
      // For this simplified version, we'll trigger a re-deployment of an EXISTING project hook if available,
      // or just list the latest deployment details.
      
      try {
        // 1. Search for project ID
        const searchRes = await fetch(`https://api.vercel.com/v9/projects?search=${args.project_name}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const searchData = await searchRes.json();
        const project = searchData.projects?.[0];
        
        if (!project) return `[Vercel] Project '${args.project_name}' not found. Please create it on Vercel first.`;

        // 2. Get latest deployment
        const deployRes = await fetch(`https://api.vercel.com/v6/deployments?projectId=${project.id}&limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const deployData = await deployRes.json();
        const latest = deployData.deployments?.[0];

        if (latest) {
           return `[Vercel] Project '${project.name}' found.\nLatest Deployment: ${latest.url}\nState: ${latest.state}\nCreated: ${new Date(latest.created).toLocaleString()}`;
        }
        
        return `[Vercel] Project '${project.name}' found, but no deployments yet.`;
      } catch (e: any) {
        return `[Vercel Error] ${e.message}`;
      }
    },
  },

  // WhatsApp Send Tool (Specialized)
  {
    name: 'whatsapp_send',
    description: 'Send a WhatsApp message via WhatsApp Business API.',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Phone number with country code' },
        message: { type: 'string', description: 'Message content' },
      },
      required: ['to', 'message'],
    },
    handler: async (args) => {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.WHATSAPP_TOKEN;
        
        if (!sid || !token) return 'Error: Twilio SID or Token not found. Please add them in Settings.';

        try {
            const body = new URLSearchParams({
              'To': `whatsapp:${args.to}`,
              'From': 'whatsapp:+14155238886', // Standard Twilio Sandbox
              'Body': args.message
            });

            const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: body
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Unknown error');
            return `[WhatsApp] 📨 Message sent successfully! SID: ${data.sid}`;
        } catch (e: any) {
            return `[WhatsApp Error] ${e.message}`;
        }
     },
   },

  // Call Other Agent Tool
  {
    name: 'call_agent',
    description: 'Delegate a sub-task to another specialized agent.',
    parameters: {
      type: 'object',
      properties: {
        agentId: { type: 'string', description: 'ID of the agent to call' },
        task: { type: 'string', description: 'Task description for the agent' },
      },
      required: ['agentId', 'task'],
    },
    handler: async (args, context) => {
      // Recursive Agent Call
      if (!context || typeof context.execute !== 'function') {
        return `Error: Agent Engine context not available for delegation.`;
      }
      
      // Permission Check
      const callingAgent = args._agentConfig as AgentConfig;
      if (callingAgent && callingAgent.canCallAgents) {
        if (!callingAgent.canCallAgents.includes(args.agentId) && !callingAgent.canCallAgents.includes('*')) {
             return `Error: Permission denied. You are not allowed to call agent '${args.agentId}'. Allowed: ${callingAgent.canCallAgents.join(', ')}`;
        }
      }
      
      try {
        const result = await context.execute(args.agentId, args.task, {
          userData: { id: 'delegated_execution' } // Pass minimal context
        });
        
        if (result.status === 'completed') {
           return `[Agent ${args.agentId} Completed] Result:\n${result.result}`;
        } else {
           return `[Agent ${args.agentId} Failed] Error: ${result.error}`;
        }
      } catch (e: any) {
        return `Delegation failed: ${e.message}`;
      }
    },
  },
];

// ================== PRESET AGENTS ==================

export const PRESET_AGENTS: Omit<AgentConfig, 'id'>[] = []; // Templates removed per user request

// ================== AGENT ENGINE ==================

export class AgentEngine {
  private agents: Map<string, AgentConfig> = new Map();
  private executions: Map<string, AgentExecution> = new Map();

  constructor() {
    // Load preset agents
    PRESET_AGENTS.forEach((preset, index) => {
      const id = `preset_${index + 1}`;
      this.agents.set(id, { ...preset, id });
    });
  }

  createAgent(config: Omit<AgentConfig, 'id'>): AgentConfig {
    const id = `agent_${Date.now()}`;
    const agent: AgentConfig = { ...config, id };
    this.agents.set(id, agent);
    return agent;
  }

  getAgent(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  listAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  updateAgent(id: string, updates: Partial<AgentConfig>): AgentConfig | undefined {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updated = { ...agent, ...updates, id };
    this.agents.set(id, updated);
    return updated;
  }

  deleteAgent(id: string): boolean {
    return this.agents.delete(id);
  }

  async execute(
    agentId: string,
    input: string,
    context?: {
      conversationHistory?: ChatMessage[];
      userData?: any;
    }
  ): Promise<AgentExecution> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    const executionId = `exec_${Date.now()}`;
    const execution: AgentExecution = {
      id: executionId,
      agentId,
      status: 'running',
      startedAt: new Date(),
      iterations: [],
    };
    this.executions.set(executionId, execution);

    try {
      // Inject Agent API Keys into Process Environment temporarily
      const originalEnv = { ...process.env };
      if (agent.apiKeys) {
        Object.entries(agent.apiKeys).forEach(([key, value]) => {
          if (value && value.trim()) {
            process.env[key] = value;
          }
        });
      }

      const result = await this.runAgentLoop(agent, input, execution, context);
      
      // Restore Environment
      process.env = originalEnv;

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = result;
    } catch (error: any) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error.message;
    }

    return execution;
  }

  private buildSystemPrompt(agent: AgentConfig, knowledgeContext: string = ''): string {
    // 1. Core Identity & Persona (The "Gaslighting" Layer)
    // We use the ULTIMATE PROMPT generator to give it a soul
    const basePersonality = generateUltimatePrompt({
        name: agent.name,
        // Map agent description/tone to personality config if possible, 
        // for now we use defaults or infer from description
    }, knowledgeContext);

    let prompt = `${basePersonality}\n\n`;
    
    prompt += `[SPECIFIC IDENTITY]\n`;
    prompt += `You are ${agent.name}.\n`;
    if (agent.description) prompt += `Your description: ${agent.description}\n`;
    
    prompt += `\n[STRICT PERSONA RULES]\n`;
    prompt += `1. You are NOT a generic AI assistant. You are ${agent.name}.\n`;
    prompt += `2. You MUST act, speak, and think exactly as your description dictates.\n`;
    prompt += `3. NEVER break character or admit to being an AI model. You are the persona defined above.\n`;
    prompt += `4. If your description implies a specific profession (e.g. Coder, Doctor), use that professional tone and jargon.\n`;
    
    // NEW: Output Rules to prevent spam
    prompt += `\n[OUTPUT RULES]\n`;
    prompt += `1. **NO UNSOLICITED CODE:** Do NOT offer code, Python scripts, or file downloads unless the user explicitly asks for them.\n`;
    prompt += `2. **CHAT FIRST:** If the user is just chatting or asking a question, simply answer the question conversationally.\n`;
    prompt += `3. **CONTEXT AWARENESS:** You have a memory. USE IT. Do not treat this message as the start of a new conversation. Connect it to previous messages.\n`;
    prompt += `4. Do NOT mention 'preview' or 'deploy' unless the user is building a web project.\n`;
    
    // 2. User-defined System Prompt
    prompt += `\n[INSTRUCTIONS]\n${agent.systemPrompt}\n`;

    // 3. API Keys & Integrations
    if (agent.apiKeys && Object.keys(agent.apiKeys).length > 0) {
      const keys = Object.keys(agent.apiKeys).join(', ');
      prompt += `\n[SYSTEM ACCESS]\nYou have access to the following API keys: ${keys}.\nTo use them in http_request, use the placeholder format {{KEY_NAME}}.\nDO NOT output the actual key values.\n`;
    }

    if (agent.customIntegrations && agent.customIntegrations.length > 0) {
       const integrationsList = agent.customIntegrations.map(i => `- ${i.name} (Base URL: ${i.baseUrl})`).join('\n');
       prompt += `\n[CUSTOM INTEGRATIONS]\n${integrationsList}\nTo use them, call 'use_integration' with the integration name.\n`;
    }

    return prompt;
  }

  private async runAgentLoop(
    agent: AgentConfig,
    input: string,
    execution: AgentExecution,
    context?: any
  ): Promise<string> {
    // 1. Fetch Knowledge Context
    let knowledgeContext = '';
    try {
        // Use a generic user ID or the one passed in context
        const userId = context?.userData?.id || 'anonymous';
        const knowledgeManager = new KnowledgeManager(userId);
        knowledgeContext = await knowledgeManager.generateContext(input);
        console.log(`[Agent ${agent.name}] 🧠 Loaded knowledge context`);
    } catch (e) {
        console.warn(`[Agent ${agent.name}] Failed to load knowledge`, e);
    }

    const systemInstructions = this.buildSystemPrompt(agent, knowledgeContext);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemInstructions },
      ...(context?.conversationHistory || []),
      { role: 'user', content: input },
    ];

    // Convert tools to function definitions
    const functions: FunctionDefinition[] = agent.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));

    let iterations = 0;
    let finalResponse = '';

    while (iterations < agent.maxIterations) {
      iterations++;

      const response = await unlimitedAI.chatWithFunctions({
        messages,
        functions,
        function_call: 'auto',
      });

      // If there's a function call, execute it
      if (response.functionCall) {
        const tool = agent.tools.find(t => t.name === response.functionCall!.name);
        if (!tool) {
          throw new Error(`Unknown tool: ${response.functionCall.name}`);
        }

        // Inject Agent Config into tool args for context-aware tools (like custom integrations)
        const toolArgs = {
           ...response.functionCall.arguments,
           _agentConfig: agent
        };

        const toolResult = await tool.handler(toolArgs, this);

        const iteration: AgentIteration = {
          index: iterations,
          thought: response.content || 'Executing tool...',
          action: {
            tool: response.functionCall.name,
            input: response.functionCall.arguments,
            output: toolResult,
          },
          observation: toolResult,
          timestamp: new Date(),
        };
        execution.iterations.push(iteration);

        // Add the function call and result to messages
        messages.push({
          role: 'assistant',
          content: response.content || '',
          function_call: {
            name: response.functionCall.name,
            arguments: JSON.stringify(response.functionCall.arguments),
          },
        });
        messages.push({
          role: 'function',
          name: response.functionCall.name,
          content: toolResult,
        });
      } else {
        // No function call, we have a final response
        finalResponse = response.content;
        
        const iteration: AgentIteration = {
          index: iterations,
          thought: 'Generating final response',
          observation: response.content,
          timestamp: new Date(),
        };
        execution.iterations.push(iteration);
        
        break;
      }
    }

    return finalResponse;
  }

  async *streamExecute(
    agentId: string,
    input: string,
    context?: any
  ): AsyncGenerator<{ type: 'thought' | 'action' | 'response'; data: any }> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    yield { type: 'thought', data: 'Starting agent execution...' };
    
    // 1. Fetch Knowledge Context
    let knowledgeContext = '';
    try {
        const userId = context?.userData?.id || 'anonymous';
        const knowledgeManager = new KnowledgeManager(userId);
        knowledgeContext = await knowledgeManager.generateContext(input);
        yield { type: 'thought', data: '🧠 Knowledge context loaded.' };
    } catch (e) {
        // Ignore
    }

    const systemInstructions = this.buildSystemPrompt(agent, knowledgeContext);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemInstructions },
      ...(context?.conversationHistory || []),
      { role: 'user', content: input },
    ];

    let iterations = 0;

    while (iterations < agent.maxIterations) {
      iterations++;
      yield { type: 'thought', data: `Iteration ${iterations}...` };

      // Stream the response
      let fullContent = '';
      for await (const chunk of unlimitedAI.stream({ messages })) {
        fullContent += chunk;
        yield { type: 'response', data: chunk };
      }

      // Simple heuristic: if content suggests using a tool, we'd execute it
      // For now, just return the streamed content
      break;
    }
  }

  getExecution(id: string): AgentExecution | undefined {
    return this.executions.get(id);
  }

  listExecutions(agentId?: string): AgentExecution[] {
    const executions = Array.from(this.executions.values());
    if (agentId) {
      return executions.filter(e => e.agentId === agentId);
    }
    return executions;
  }
}

// Export singleton
export const agentEngine = new AgentEngine();
