// ============================================
// 👑 ADMIN ROUTES - Full System Control API
// ============================================

import { Router, Request, Response } from 'express';
import { adminAgent } from '../lib/admin-agent';

const router = Router();

// ============================================
// PROCESS NATURAL LANGUAGE COMMAND
// ============================================

router.post('/command', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Command is required',
      });
    }
    
    const result = await adminAgent.processCommand(command);
    
    res.json(result);
  } catch (error) {
    console.error('Admin command error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process command',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// GET CURRENT CONFIGURATION
// ============================================

router.get('/config', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: adminAgent.getConfig(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get config' });
  }
});

router.get('/theme', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: adminAgent.getTheme(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get theme' });
  }
});

router.get('/layout', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: adminAgent.getLayout(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get layout' });
  }
});

// ============================================
// SCHEDULED TASKS
// ============================================

router.get('/tasks', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: adminAgent.getScheduledTasks(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get tasks' });
  }
});

router.post('/tasks/:taskId/run', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const result = await adminAgent.processCommand(`run ${taskId} now`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to run task' });
  }
});

// ============================================
// MAINTENANCE ACTIONS
// ============================================

router.post('/maintenance', async (req: Request, res: Response) => {
  try {
    const result = await adminAgent.runMaintenance();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to run maintenance' });
  }
});

router.post('/backup', async (req: Request, res: Response) => {
  try {
    const result = await adminAgent.createBackup();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create backup' });
  }
});

router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const { daysToKeep } = req.body;
    const result = await adminAgent.cleanupOldData(daysToKeep || 30);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cleanup' });
  }
});

router.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await adminAgent.healthCheck();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check health' });
  }
});

// ============================================
// REPORTS
// ============================================

router.post('/report', async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    const result = await adminAgent.generateReport(type || 'weekly');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

router.get('/reports', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: adminAgent.getReports(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
});

// ============================================
// COMMAND HISTORY
// ============================================

router.get('/history', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: adminAgent.getCommandHistory(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get history' });
  }
});

export default router;
