// ============================================
// 📊 ANALYTICS API - Usage & Cost Analytics
// ============================================

import { Router, Request, Response } from 'express';
import { 
  costTracker, 
  CostSummary, 
  ProviderId, 
  TaskCategory,
  PROVIDER_PRICING,
  formatCost,
  getProviderColor,
  getCategoryIcon,
} from '../lib/cost-tracker';
import { smartRouter, TaskType } from '../lib/smart-router';

const router = Router();

// ===== GET COST SUMMARY =====
router.get('/summary', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as CostSummary['period']) || 'day';
    const summary = costTracker.getCostSummary(period);
    
    res.json({
      success: true,
      data: {
        ...summary,
        formattedTotalCost: formatCost(summary.totalCost),
        formattedSavings: formatCost(summary.savings),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== GET USAGE HISTORY =====
router.get('/usage', (req: Request, res: Response) => {
  try {
    const { 
      providerId, 
      category, 
      startDate, 
      endDate, 
      limit 
    } = req.query;

    const history = costTracker.getUsageHistory({
      providerId: providerId as ProviderId | undefined,
      category: category as TaskCategory | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 100,
    });

    res.json({
      success: true,
      data: history.map(record => ({
        ...record,
        formattedCost: formatCost(record.calculatedCost),
        providerColor: getProviderColor(record.providerId),
        categoryIcon: getCategoryIcon(record.taskCategory),
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== GET BUDGET STATUS =====
router.get('/budget', (req: Request, res: Response) => {
  try {
    const status = costTracker.getBudgetStatus();
    
    res.json({
      success: true,
      data: {
        daily: {
          ...status.daily,
          formattedUsed: formatCost(status.daily.used),
          formattedLimit: formatCost(status.daily.limit),
          status: status.daily.percentage >= 100 ? 'exceeded' : 
                  status.daily.percentage >= 80 ? 'warning' : 'ok',
        },
        monthly: {
          ...status.monthly,
          formattedUsed: formatCost(status.monthly.used),
          formattedLimit: formatCost(status.monthly.limit),
          status: status.monthly.percentage >= 100 ? 'exceeded' : 
                  status.monthly.percentage >= 80 ? 'warning' : 'ok',
        },
        isOverBudget: status.isOverBudget,
        alerts: status.alerts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== SET BUDGET =====
router.post('/budget', (req: Request, res: Response) => {
  try {
    const { dailyLimit, monthlyLimit, alertThreshold } = req.body;
    
    costTracker.setBudget({
      dailyLimit: dailyLimit !== undefined ? parseFloat(dailyLimit) : undefined,
      monthlyLimit: monthlyLimit !== undefined ? parseFloat(monthlyLimit) : undefined,
      alertThreshold: alertThreshold !== undefined ? parseFloat(alertThreshold) : undefined,
    });

    res.json({
      success: true,
      message: 'Budget updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== GET PROVIDER STATS =====
router.get('/providers', (req: Request, res: Response) => {
  try {
    const providerId = req.query.providerId as ProviderId | undefined;
    
    if (providerId) {
      const stats = costTracker.getProviderStats(providerId);
      const pricing = PROVIDER_PRICING[providerId];
      
      res.json({
        success: true,
        data: {
          ...stats,
          providerId,
          name: pricing.name,
          color: getProviderColor(providerId),
          formattedTotalCost: formatCost(stats.totalCost),
          models: Object.keys(pricing.models),
        },
      });
    } else {
      // Return all providers
      const allProviders = Object.keys(PROVIDER_PRICING) as ProviderId[];
      const providersData = allProviders.map(id => {
        const stats = costTracker.getProviderStats(id);
        const pricing = PROVIDER_PRICING[id];
        return {
          providerId: id,
          name: pricing.name,
          color: getProviderColor(id),
          categories: pricing.category,
          totalCost: stats.totalCost,
          formattedTotalCost: formatCost(stats.totalCost),
          totalRequests: stats.totalRequests,
          avgLatency: stats.avgLatency,
          successRate: stats.successRate,
          lastUsed: stats.lastUsed,
          remainingFreeQuota: stats.remainingFreeQuota,
        };
      });

      res.json({
        success: true,
        data: providersData,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== GET PROVIDER HEALTH =====
router.get('/health', (req: Request, res: Response) => {
  try {
    const healthStatus = smartRouter.getAllHealthStatus();
    const availableProviders = smartRouter.getAvailableProviders();
    
    res.json({
      success: true,
      data: {
        health: healthStatus,
        availableProviders: availableProviders.map(p => ({
          providerId: p.providerId,
          model: p.model,
          taskTypes: p.taskTypes,
          qualityScore: p.qualityScore,
          speedScore: p.speedScore,
          costScore: p.costScore,
          color: getProviderColor(p.providerId),
        })),
        totalHealthy: Object.values(healthStatus).filter(h => h.healthy).length,
        totalProviders: Object.keys(healthStatus).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== GET COST OPTIMIZATION SUGGESTIONS =====
router.get('/suggestions', (req: Request, res: Response) => {
  try {
    const suggestions = costTracker.getCostOptimizationSuggestions();
    
    res.json({
      success: true,
      data: suggestions.map(s => ({
        ...s,
        formattedSavings: formatCost(s.potentialSavings),
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== GET CHARTS DATA =====
router.get('/charts', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';
    
    // Get data for different time ranges
    const hourly = costTracker.getCostSummary('hour');
    const daily = costTracker.getCostSummary('day');
    const weekly = costTracker.getCostSummary('week');
    const monthly = costTracker.getCostSummary('month');

    // Cost by provider (for pie chart)
    const costByProvider = Object.entries(weekly.byProvider).map(([id, data]) => ({
      name: PROVIDER_PRICING[id as ProviderId]?.name || id,
      value: data.cost,
      color: getProviderColor(id as ProviderId),
    }));

    // Cost by category (for bar chart)
    const costByCategory = Object.entries(weekly.byCategory).map(([cat, data]) => ({
      name: cat,
      value: data.cost,
      requests: data.requests,
      icon: getCategoryIcon(cat as TaskCategory),
    }));

    // Usage timeline (for line chart)
    const history = costTracker.getUsageHistory({ limit: 100 });
    const timeline = generateTimeline(history, period);

    res.json({
      success: true,
      data: {
        overview: {
          hourly: { cost: hourly.totalCost, requests: hourly.totalRequests },
          daily: { cost: daily.totalCost, requests: daily.totalRequests },
          weekly: { cost: weekly.totalCost, requests: weekly.totalRequests },
          monthly: { cost: monthly.totalCost, requests: monthly.totalRequests },
        },
        costByProvider,
        costByCategory,
        timeline,
        topModels: Object.entries(weekly.byModel)
          .sort((a, b) => b[1].cost - a[1].cost)
          .slice(0, 5)
          .map(([model, data]) => ({
            model,
            cost: data.cost,
            requests: data.requests,
            formattedCost: formatCost(data.cost),
          })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== ACKNOWLEDGE ALERT =====
router.post('/alerts/:alertId/acknowledge', (req: Request, res: Response) => {
  try {
    costTracker.acknowledgeAlert(req.params.alertId);
    
    res.json({
      success: true,
      message: 'Alert acknowledged',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== EXPORT DATA =====
router.get('/export', (req: Request, res: Response) => {
  try {
    const data = costTracker.exportData();
    
    res.json({
      success: true,
      data,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== IMPORT DATA =====
router.post('/import', (req: Request, res: Response) => {
  try {
    const { usageRecords, budget, alerts } = req.body;
    
    costTracker.importData({ usageRecords, budget, alerts });
    
    res.json({
      success: true,
      message: 'Data imported successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== CLEAR DATA =====
router.delete('/data', (req: Request, res: Response) => {
  try {
    const { olderThan } = req.query;
    const deletedCount = costTracker.clearData(
      olderThan ? new Date(olderThan as string) : undefined
    );
    
    res.json({
      success: true,
      message: `Deleted ${deletedCount} records`,
      deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== GET RECOMMENDATIONS =====
router.get('/recommendations', (req: Request, res: Response) => {
  try {
    const taskType = (req.query.taskType as TaskType) || 'simple';
    const priority = (req.query.priority as 'quality' | 'cost' | 'speed' | 'balanced') || 'balanced';
    
    const recommendation = smartRouter.getRecommendation(taskType, priority);
    
    res.json({
      success: true,
      data: {
        recommended: {
          ...recommendation.recommended,
          color: getProviderColor(recommendation.recommended.providerId),
        },
        alternatives: recommendation.alternatives.map(alt => ({
          ...alt,
          color: getProviderColor(alt.providerId),
        })),
        reasoning: recommendation.reasoning,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== PRICING INFO =====
router.get('/pricing', (req: Request, res: Response) => {
  try {
    const pricingInfo = Object.entries(PROVIDER_PRICING).map(([id, pricing]) => ({
      providerId: id,
      name: pricing.name,
      color: getProviderColor(id as ProviderId),
      categories: pricing.category,
      models: Object.entries(pricing.models).map(([model, tier]) => ({
        model,
        ...tier,
      })),
      rateLimits: pricing.rateLimits,
    }));

    res.json({
      success: true,
      data: pricingInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===== HELPER FUNCTIONS =====
function generateTimeline(
  history: any[],
  period: string
): { time: string; cost: number; requests: number }[] {
  const timeline: Map<string, { cost: number; requests: number }> = new Map();
  
  for (const record of history) {
    const date = new Date(record.timestamp);
    let key: string;
    
    switch (period) {
      case 'hour':
        key = `${date.getHours()}:${Math.floor(date.getMinutes() / 10) * 10}`;
        break;
      case 'day':
        key = `${date.getHours()}:00`;
        break;
      case 'week':
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
        break;
      case 'month':
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    const existing = timeline.get(key) || { cost: 0, requests: 0 };
    existing.cost += record.calculatedCost;
    existing.requests += 1;
    timeline.set(key, existing);
  }

  return Array.from(timeline.entries()).map(([time, data]) => ({
    time,
    cost: Math.round(data.cost * 1000000) / 1000000,
    requests: data.requests,
  }));
}

export default router;
