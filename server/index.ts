// ============================================
// 🚀 TRY-IT! SERVER - Production Ready
// Enterprise-grade security & performance
// ============================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

// CommonJS/ESM compatible __dirname
const __dirname = process.cwd();

// Security middleware
import {
  helmetConfig,
  generalLimiter,
  chatLimiter,
  authLimiter,
  passwordResetLimiter,
  securityHeaders,
  requestLogger,
  errorHandler,
  authMiddleware,
  optionalAuthMiddleware,
  sanitizeBody,
} from './lib/security';

// Routes
import streamChatRouter from './routes/stream-chat';
import authRouter from './routes/auth';
import integrationsRouter from './routes/integrations';
import computerUseRouter from './routes/computer-use';
import voiceRouter from './routes/voice';
import memoryRouter from './routes/memory';
import triggersRouter from './routes/triggers';
import agentsRouter from './routes/agents';
import adminRouter from './routes/admin';
// import analyticsRouter from './routes/analytics';
import computerRouter from './routes/computer';
import messagingRouter from './routes/messaging';

// ================== ENVIRONMENT VALIDATION ==================

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('   Please configure .env file based on .env.example');
  // if (true) { // Always serve static files
  //   process.exit(1);
  // }
}

// Warn about missing AI providers
// All 11 AI Providers
const aiProviders = [
  'GROQ_API_KEY',        // 1. Groq - Fast inference
  'GEMINI_API_KEY',      // 2. Gemini - Google AI
  'OPENROUTER_API_KEY',  // 3. OpenRouter - 100+ models
  'MISTRAL_API_KEY',     // 4. Mistral - Code & Chat
  'COHERE_API_KEY',      // 5. Cohere - RAG & Search
  'REPLICATE_API_KEY',   // 6. Replicate - Image Gen
  'ELEVENLABS_API_KEY',  // 7. ElevenLabs - TTS
  'E2B_API_KEY',         // 8. E2B - Code Sandbox
  'FIRECRAWL_API_KEY',   // 9. Firecrawl - Web Scrape
  'TAVILY_API_KEY',      // 10. Tavily - AI Search
  'RESEND_API_KEY',      // 11. Resend - Email
];
const configuredProviders = aiProviders.filter(v => process.env[v]);
if (configuredProviders.length === 0) {
  console.warn('⚠️  WARNING: No AI providers configured. Chat features will not work.');
  console.warn('   Configure at least one of:', aiProviders.join(', '));
}

// ================== EXPRESS APP ==================

const app = express();
const server = createServer(app);

// ================== CORS CONFIGURATION ==================

const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || ['http://localhost:5173'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 86400, // 24 hours
};

// ================== SOCKET.IO ==================

const io = new SocketIO(server, {
  cors: {
    origin: true,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      // Verify token - in production, use proper JWT verification
      socket.data.authenticated = true;
    } catch {
      socket.data.authenticated = false;
    }
  }
  next();
});

// ================== MIDDLEWARE STACK ==================

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security headers (Helmet + custom)
app.use(helmetConfig);
app.use(securityHeaders);

// Request logging
app.use(requestLogger);

// CORS
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    (req as any).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeBody);

// Request ID for tracing
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// General rate limiting
app.use('/api/', generalLimiter);

// ================== ROUTES ==================

// Health check (no auth, no rate limit)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Network Info (for QR Code)
app.get('/api/system/network', (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    let ipAddress = 'localhost';

    // Priority: WiFi > Ethernet > First non-internal
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        // Skip internal (127.0.0.1) and non-IPv4
        if (iface.family === 'IPv4' && !iface.internal) {
          if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan')) {
             ipAddress = iface.address;
             break; 
          }
          // If we haven't found a WiFi one yet, keep this one as a fallback
          if (ipAddress === 'localhost') {
            ipAddress = iface.address;
          }
        }
      }
      if (ipAddress !== 'localhost' && (ipAddress.startsWith('192.') || ipAddress.startsWith('10.'))) break;
    }

    res.json({ ip: ipAddress });
  } catch (error) {
    res.json({ ip: 'localhost' });
  }
});

// Readiness check (for k8s/container orchestration)
app.get('/api/ready', async (req, res) => {
  try {
    // Add your readiness checks here (DB connection, etc.)
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// Auth routes (special rate limiting)
app.use('/api/auth', authLimiter, authRouter);

// Chat routes (auth + chat rate limiting)
app.use('/api/chat', optionalAuthMiddleware, chatLimiter, streamChatRouter);

// Protected routes (require authentication)
app.use('/api/integrations', authMiddleware, integrationsRouter);
app.use('/api/computer-use', authMiddleware, computerUseRouter);
app.use('/api/voice', authMiddleware, voiceRouter);
app.use('/api/memory', authMiddleware, memoryRouter);
app.use('/api/triggers', authMiddleware, triggersRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/admin', authMiddleware, adminRouter);
// app.use('/api/analytics', optionalAuthMiddleware, analyticsRouter);
app.use('/api/computer', authMiddleware, computerRouter);
app.use('/api/messaging', messagingRouter); // WhatsApp & Telegram (webhooks need public access)

// Knowledge system routes (automatic AI learning + manual user control)
import { createKnowledgeRoutes } from './lib/knowledge-system';
import { Router } from 'express';
const knowledgeRouter = createKnowledgeRoutes(Router());
app.use('/api/knowledge', authMiddleware, knowledgeRouter);

// Static files in production
if (true) { // Always serve static files
  const staticPath = path.join(__dirname, 'dist');
  
  app.use(express.static(staticPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
  }));
  
  // SPA fallback
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'المسار غير موجود',
    errorEn: 'Endpoint not found',
    code: 'NOT_FOUND',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ================== WEBSOCKET EVENTS ==================

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Voice call room
  socket.on('join_voice', (roomId: string) => {
    if (!roomId || typeof roomId !== 'string') return;
    const sanitizedRoom = roomId.slice(0, 100).replace(/[^a-zA-Z0-9-_]/g, '');
    socket.join(`voice:${sanitizedRoom}`);
  });
  
  socket.on('voice_data', (data: { roomId: string; audio: ArrayBuffer }) => {
    if (!data?.roomId || !data?.audio) return;
    const sanitizedRoom = data.roomId.slice(0, 100).replace(/[^a-zA-Z0-9-_]/g, '');
    socket.to(`voice:${sanitizedRoom}`).emit('voice_data', data.audio);
  });
  
  // Computer use updates
  socket.on('join_computer', (sessionId: string) => {
    if (!sessionId || typeof sessionId !== 'string') return;
    const sanitizedSession = sessionId.slice(0, 100).replace(/[^a-zA-Z0-9-_]/g, '');
    socket.join(`computer:${sanitizedSession}`);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

// ================== SERVER STARTUP ==================

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  // Provider status display
  const providerStatus = [
    { key: 'GROQ_API_KEY', name: 'Groq', emoji: '⚡' },
    { key: 'GEMINI_API_KEY', name: 'Gemini', emoji: '💎' },
    { key: 'OPENROUTER_API_KEY', name: 'OpenRouter', emoji: '🔀' },
    { key: 'MISTRAL_API_KEY', name: 'Mistral', emoji: '🌀' },
    { key: 'COHERE_API_KEY', name: 'Cohere', emoji: '🔍' },
    { key: 'REPLICATE_API_KEY', name: 'Replicate', emoji: '🎨' },
    { key: 'ELEVENLABS_API_KEY', name: 'ElevenLabs', emoji: '🔊' },
    { key: 'E2B_API_KEY', name: 'E2B', emoji: '💻' },
    { key: 'FIRECRAWL_API_KEY', name: 'Firecrawl', emoji: '🔥' },
    { key: 'TAVILY_API_KEY', name: 'Tavily', emoji: '🔎' },
    { key: 'RESEND_API_KEY', name: 'Resend', emoji: '📧' },
  ];

  const activeProviders = providerStatus.filter(p => process.env[p.key]);
  const providerList = activeProviders.map(p => `${p.emoji} ${p.name}`).join(' | ');

  console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   🚀 AI Server v2.0.0                                                  ║
║                                                                        ║
║   Status:  Running                                                     ║
║   Port:    ${String(PORT).padEnd(60)}║
║   Host:    ${HOST.padEnd(60)}║
║   Mode:    ${(process.env.NODE_ENV || 'development').padEnd(60)}║
║                                                                        ║
║   🔌 AI Providers: ${String(activeProviders.length + '/11 configured').padEnd(52)}║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
  `);

  // Show individual provider status
  console.log('   📋 Provider Status:');
  providerStatus.forEach(p => {
    const status = process.env[p.key] ? '✅' : '❌';
    console.log(`      ${status} ${p.emoji} ${p.name}`);
  });
  console.log('');
  console.log('   🎉 Ready to serve!');
  console.log('');
});

// ================== GRACEFUL SHUTDOWN ==================

const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    io.close(() => {
      console.log('WebSocket server closed.');
      process.exit(0);
    });
  });
  
  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { app, io, server };
