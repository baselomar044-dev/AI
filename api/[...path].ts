import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import routes
import streamChatRouter from '../server/routes/stream-chat';
import authRouter from '../server/routes/auth';
import memoryRouter from '../server/routes/memory';
import voiceRouter from '../server/routes/voice';
import integrationsRouter from '../server/routes/integrations';
import computerUseRouter from '../server/routes/computer-use';
import triggersRouter from '../server/routes/triggers';
import agentsRouter from '../server/routes/agents';
import adminRouter from '../server/routes/admin';
import computerRouter from '../server/routes/computer';
import messagingRouter from '../server/routes/messaging';

// Import Knowledge System Routes
import { createKnowledgeRoutes } from '../server/lib/knowledge-system';
import { Router } from 'express';

// Import Middleware
import {
  authMiddleware,
  optionalAuthMiddleware,
  sanitizeBody,
  securityHeaders,
  helmetConfig
} from '../server/lib/security';

const app = express();

// Middleware
app.use(cors());
app.use(helmetConfig);
app.use(securityHeaders);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(sanitizeBody);

// Mount routes
app.use('/api/stream-chat', optionalAuthMiddleware, streamChatRouter);
app.use('/api/auth', authRouter);
app.use('/api/memory', authMiddleware, memoryRouter);
app.use('/api/voice', authMiddleware, voiceRouter);
app.use('/api/integrations', authMiddleware, integrationsRouter);
app.use('/api/computer-use', authMiddleware, computerUseRouter);
app.use('/api/triggers', authMiddleware, triggersRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/computer', authMiddleware, computerRouter);
app.use('/api/messaging', messagingRouter); // Webhooks often need public access

// Knowledge System Routes
const knowledgeRouter = createKnowledgeRoutes(Router());
app.use('/api/knowledge', authMiddleware, knowledgeRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'vercel' });
});

// Fallback 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API Endpoint not found' });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
