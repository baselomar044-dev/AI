// ============================================
// 🤖 AGENT ROUTES - Full Agent API
// ============================================

import { Router } from 'express';
import { agentEngine, PRESET_AGENTS, BUILT_IN_TOOLS } from '../lib/agent-system';
import { authenticateToken } from './auth';

const router = Router();

// ================== GET PRESET AGENTS ==================

router.get('/presets', (req, res) => {
  res.json({
    success: true,
    data: PRESET_AGENTS,
  });
});

// ================== GET AVAILABLE TOOLS ==================

router.get('/tools', (req, res) => {
  res.json({
    success: true,
    data: BUILT_IN_TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  });
});

// ================== LIST USER AGENTS ==================

router.get('/', (req, res) => {
  try {
    const agents = agentEngine.listAgents();
    res.json({
      success: true,
      data: agents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== GET SINGLE AGENT ==================

router.get('/:id', (req, res) => {
  try {
    const agent = agentEngine.getAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }
    res.json({
      success: true,
      data: agent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== CREATE AGENT ==================

router.post('/', (req, res) => {
  try {
    const agent = agentEngine.createAgent(req.body);
    res.status(201).json({
      success: true,
      data: agent,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== UPDATE AGENT ==================

router.put('/:id', (req, res) => {
  try {
    const agent = agentEngine.updateAgent(req.params.id, req.body);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }
    res.json({
      success: true,
      data: agent,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== DELETE AGENT ==================

router.delete('/:id', (req, res) => {
  try {
    const success = agentEngine.deleteAgent(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found or cannot be deleted',
      });
    }
    res.json({
      success: true,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== EXECUTE AGENT ==================

router.post('/:id/execute', async (req, res) => {
  try {
    const { input, context } = req.body;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required',
      });
    }

    const execution = await agentEngine.execute(req.params.id, input, context);
    
    res.json({
      success: true,
      data: execution,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== EXECUTE INLINE AGENT (from frontend config) ==================

router.post('/execute-inline', async (req, res) => {
  try {
    const { input, agent } = req.body;
    
    if (!input || !agent) {
      return res.status(400).json({
        success: false,
        error: 'Input and agent config are required',
      });
    }

    // Create a temporary agent with the provided config
    const tempAgent = agentEngine.createAgent({
      name: agent.name || 'Temp Agent',
      nameAr: agent.nameAr || '',
      description: agent.description || '',
      descriptionAr: agent.descriptionAr || '',
      avatar: agent.avatar || '🤖',
      color: agent.color || '#3B82F6',
      systemPrompt: agent.systemPrompt || 'You are a helpful AI assistant.',
      capabilities: agent.capabilities || [],
      tools: BUILT_IN_TOOLS.filter(t => 
        !agent.capabilities?.length || 
        agent.capabilities.includes('*') ||
        agent.capabilities.some((c: string) => t.name.includes(c))
      ),
      autonomyLevel: agent.autonomyLevel || 'active',
      maxIterations: agent.maxIterations || 10,
      allowedIntegrations: agent.allowedIntegrations || ['*'],
    });

    const execution = await agentEngine.execute(tempAgent.id, input);
    
    // Clean up temp agent
    agentEngine.deleteAgent(tempAgent.id);
    
    res.json({
      success: true,
      data: execution,
    });
  } catch (error: any) {
    console.error('Inline agent execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== STREAM EXECUTE AGENT ==================

router.post('/:id/stream', async (req, res) => {
  try {
    const { input, context } = req.body;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of agentEngine.streamExecute(req.params.id, input, context)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
    res.end();
  }
});

// ================== GET EXECUTION HISTORY ==================

router.get('/:id/executions', (req, res) => {
  try {
    const executions = agentEngine.listExecutions(req.params.id);
    res.json({
      success: true,
      data: executions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== GET SINGLE EXECUTION ==================

router.get('/executions/:execId', (req, res) => {
  try {
    const execution = agentEngine.getExecution(req.params.execId);
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found',
      });
    }
    res.json({
      success: true,
      data: execution,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
