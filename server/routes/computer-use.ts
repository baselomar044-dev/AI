// ============================================
// 🖥️ COMPUTER USE ROUTES
// Real Browser Automation with Puppeteer (FREE!)
// ============================================

import express from 'express';
import { browserAutomation } from '../services/browser-automation';
import BrowserAutomation from '../services/browser-automation';

const router = express.Router();

// Initialize browser
router.post('/init', async (req, res) => {
  try {
    await browserAutomation.initialize();
    res.json({ 
      success: true, 
      message: '🖥️ Browser initialized!',
      status: 'ready'
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Close browser
router.post('/close', async (req, res) => {
  try {
    await browserAutomation.close();
    res.json({ 
      success: true, 
      message: '👋 Browser closed',
      status: 'closed'
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Execute single action
router.post('/action', async (req, res) => {
  try {
    const action = req.body;
    console.log('🎯 Executing action:', action);
    
    const result = await browserAutomation.executeAction(action);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Execute recipe (sequence of actions)
router.post('/recipe', async (req, res) => {
  try {
    const { recipe } = req.body;
    console.log('📋 Executing recipe with', recipe.length, 'actions');
    
    const results = await browserAutomation.executeRecipe(recipe);
    res.json({ 
      success: true, 
      results,
      totalActions: recipe.length,
      successfulActions: results.filter(r => r.success).length
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Pre-built recipes
router.post('/recipes/google-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    console.log('🔍 Google search:', query);
    const recipe = BrowserAutomation.recipes.googleSearch(query);
    const results = await browserAutomation.executeRecipe(recipe);
    
    res.json({ 
      success: true, 
      query,
      results 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/recipes/youtube-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    console.log('🎬 YouTube search:', query);
    const recipe = BrowserAutomation.recipes.youtubeSearch(query);
    const results = await browserAutomation.executeRecipe(recipe);
    
    res.json({ 
      success: true, 
      query,
      results 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/recipes/open-website', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }
    
    console.log('🌐 Opening:', url);
    const recipe = BrowserAutomation.recipes.openWebsite(url);
    const results = await browserAutomation.executeRecipe(recipe);
    
    res.json({ 
      success: true, 
      url,
      results 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/recipes/weather', async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) {
      return res.status(400).json({ error: 'City required' });
    }
    
    console.log('🌤️ Weather for:', city);
    const recipe = BrowserAutomation.recipes.checkWeather(city);
    const results = await browserAutomation.executeRecipe(recipe);
    
    res.json({ 
      success: true, 
      city,
      results 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get browser status
router.get('/status', async (_req, res) => {
  try {
    const isActive = browserAutomation.isActive();
    const url = await browserAutomation.getCurrentUrl();
    const title = await browserAutomation.getPageTitle();
    
    res.json({
      active: isActive,
      currentUrl: url,
      pageTitle: title,
      status: isActive ? 'running' : 'stopped'
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Take screenshot
router.get('/screenshot', async (_req, res) => {
  try {
    const result = await browserAutomation.executeAction({ type: 'screenshot' });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
