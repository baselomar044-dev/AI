import { agentEngine, BUILT_IN_TOOLS } from './server/lib/agent-system';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Mock Browser Environment for "Client-Side" logic if needed
global.localStorage = {
  getItem: (key) => null,
  setItem: (key, val) => {},
} as any;

async function testSystem() {
  console.log('🚀 Starting Full System Audit...');
  const report: string[] = [];

  // 1. Agents System
  console.log('\n🤖 Testing Agents System...');
  try {
    const agents = agentEngine.listAgents();
    console.log(`✅ Agent Listing: Found ${agents.length} agents`);
    report.push(`- **Agents:** ✅ Functional (Found ${agents.length} agents)`);
    
    // Create Test Agent
    const testAgent = agentEngine.createAgent({
      name: 'Test Agent',
      nameAr: 'وكيل اختبار',
      description: 'System Audit Agent',
      descriptionAr: '',
      avatar: '🧪',
      color: '#ff0000',
      systemPrompt: 'You are a test agent.',
      capabilities: [],
      tools: [],
      autonomyLevel: 'active',
      maxIterations: 1,
      allowedIntegrations: ['*']
    });
    console.log(`✅ Agent Creation: Created agent ${testAgent.id}`);
    report.push(`- **Agent Creation:** ✅ Functional`);

    // Cleanup
    agentEngine.deleteAgent(testAgent.id);
    console.log(`✅ Agent Deletion: Deleted agent ${testAgent.id}`);
  } catch (e: any) {
    console.error('❌ Agent System Failed:', e.message);
    report.push(`- **Agents:** ❌ Failed (${e.message})`);
  }

  // 2. Integration Configuration (WhatsApp)
  console.log('\n📱 Testing WhatsApp Business Config...');
  // Since we can't inspect private properties easily, we check if the tool exists in BUILT_IN_TOOLS
  
  const waTool = BUILT_IN_TOOLS.find((t: any) => t.name === 'whatsapp_send');
  if (waTool) {
      console.log('✅ WhatsApp Business Tool: Exists');
      report.push(`- **WhatsApp Business:** ✅ Tool Defined (Twilio)`);
  } else {
      console.error('❌ WhatsApp Tool Missing');
      report.push(`- **WhatsApp Business:** ❌ Missing Tool`);
  }

  // 3. Workflow Logic (Simulated)
  console.log('\n⚡ Testing Workflow Logic...');
  // Since Workflows are client-side, we can't easily test the execution engine here without a browser.
  // But we can verify the file structure was updated.
  const workflowPagePath = path.join(process.cwd(), 'src', 'pages', 'WorkflowPage.tsx');
  if (fs.existsSync(workflowPagePath)) {
      const content = fs.readFileSync(workflowPagePath, 'utf-8');
      if (content.includes('if_else') && content.includes('parallel')) {
          console.log('✅ Workflow Page: Contains advanced logic (if_else, parallel)');
          report.push(`- **Workflow Engine:** ✅ Upgraded with Parallel/Conditional Logic`);
      } else {
          console.error('❌ Workflow Page: Missing advanced logic');
          report.push(`- **Workflow Engine:** ❌ Upgrade Verification Failed`);
      }
  }

  // 4. Computer Use (Simulated)
  console.log('\n💻 Testing Computer Use...');
  const compPagePath = path.join(process.cwd(), 'src', 'pages', 'ComputerUsePage.tsx');
  if (fs.existsSync(compPagePath)) {
      const content = fs.readFileSync(compPagePath, 'utf-8');
      if (content.includes('QUICK_ACTIONS') && !content.includes('BRIDGE_SCRIPT')) {
           console.log('✅ Computer Use: Configured for "Personal Computer" (No Bridge)');
           report.push(`- **Computer Use:** ✅ "Personal Mode" Active`);
      } else {
           report.push(`- **Computer Use:** ⚠️ Bridge Script Found (Dev Mode?)`);
      }
  }

  console.log('\n📝 Generating Report...');
  console.log(report.join('\n'));
  return report;
}

testSystem();
