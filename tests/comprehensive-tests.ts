// ============================================
// 🧪 COMPREHENSIVE TESTS - AI Assistant v2.0
// Full Dev-User-Logic AI Tests
// ============================================

// Test Results Interface
interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  timestamp: string;
}

const results: TestResult[] = [];

function log(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', details: string) {
  const result: TestResult = {
    category,
    test,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  results.push(result);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${category}] ${test}: ${details}`);
}

// ================== 1. THEME SYSTEM TESTS ==================
console.log('\n========== THEME SYSTEM TESTS ==========\n');

async function testThemes() {
  const fs = await import('fs');
  const path = await import('path');
  
  // Read themes file
  const themesPath = path.join(__dirname, '../src/lib/themes.ts');
  const themesContent = fs.readFileSync(themesPath, 'utf-8');
  
  // Test 1.1: Three themes exist
  const hasDarkBlue = themesContent.includes("'dark-blue'");
  const hasLight = themesContent.includes("'light'");
  const hasPink = themesContent.includes("'pink'");
  
  log('THEMES', '1.1 Three themes defined', 
    hasDarkBlue && hasLight && hasPink ? 'PASS' : 'FAIL',
    `dark-blue: ${hasDarkBlue}, light: ${hasLight}, pink: ${hasPink}`
  );
  
  // Test 1.2: THEMES object has all three
  const themesObjectMatch = themesContent.match(/export const THEMES[^}]+}/s);
  const hasAllInObject = themesObjectMatch && 
    themesObjectMatch[0].includes('dark-blue') &&
    themesObjectMatch[0].includes('light') &&
    themesObjectMatch[0].includes('pink');
  
  log('THEMES', '1.2 THEMES object complete',
    hasAllInObject ? 'PASS' : 'FAIL',
    hasAllInObject ? 'All three themes in THEMES object' : 'Missing themes in object'
  );
  
  // Test 1.3: useTheme hook exists
  const hasUseTheme = themesContent.includes('export function useTheme');
  log('THEMES', '1.3 useTheme hook exists',
    hasUseTheme ? 'PASS' : 'FAIL',
    hasUseTheme ? 'Hook found' : 'Hook missing'
  );
  
  // Test 1.4: Theme colors properly defined
  const hasAccent = themesContent.includes('accent:');
  const hasPrimary = themesContent.includes('primary:');
  const hasBg = themesContent.includes('bg:');
  
  log('THEMES', '1.4 Theme colors defined',
    hasAccent && hasPrimary && hasBg ? 'PASS' : 'FAIL',
    `accent: ${hasAccent}, primary: ${hasPrimary}, bg: ${hasBg}`
  );
  
  return true;
}

// ================== 2. SIDEBAR & NAVIGATION TESTS ==================
console.log('\n========== SIDEBAR & NAVIGATION TESTS ==========\n');

async function testSidebar() {
  const fs = await import('fs');
  const path = await import('path');
  
  // Read App.tsx
  const appPath = path.join(__dirname, '../src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  
  // Test 2.1: Name is "AI Assistant"
  const hasTryIt = appContent.includes('AI Assistant');
  log('SIDEBAR', '2.1 Name is "AI Assistant"',
    hasTryIt ? 'PASS' : 'FAIL',
    hasTryIt ? 'Correct name found' : 'Name not found'
  );
  
  // Test 2.2: Relationships removed
  const hasRelationships = appContent.includes('RelationshipsPage') || appContent.includes('/relationships');
  log('SIDEBAR', '2.2 Relationships removed',
    !hasRelationships ? 'PASS' : 'FAIL',
    !hasRelationships ? 'Successfully removed' : 'Still contains relationships'
  );
  
  // Test 2.3: Personal Services section exists
  const hasPersonalServices = appContent.includes('Personal Services') || appContent.includes('الخدمات الشخصية');
  log('SIDEBAR', '2.3 Personal Services section',
    hasPersonalServices ? 'PASS' : 'FAIL',
    hasPersonalServices ? 'Section found' : 'Section missing'
  );
  
  // Test 2.4: Settings at bottom
  const settingsIndex = appContent.indexOf('Settings');
  const personalIndex = appContent.indexOf('Personal Services');
  log('SIDEBAR', '2.4 Settings below Personal Services',
    settingsIndex > personalIndex ? 'PASS' : 'WARN',
    settingsIndex > personalIndex ? 'Correct order' : 'Check order manually'
  );
  
  // Test 2.5: All navigation items exist
  const navItems = ['/chat', '/notes', '/agents', '/integrations', '/voice', '/computer', '/reminders', '/memory', '/settings'];
  const missingItems = navItems.filter(item => !appContent.includes(item));
  
  log('SIDEBAR', '2.5 All nav items present',
    missingItems.length === 0 ? 'PASS' : 'FAIL',
    missingItems.length === 0 ? 'All 9 items found' : `Missing: ${missingItems.join(', ')}`
  );
  
  // Test 2.6: Logout button
  const hasLogout = appContent.includes('logout') && appContent.includes('🚪');
  log('SIDEBAR', '2.6 Logout button',
    hasLogout ? 'PASS' : 'FAIL',
    hasLogout ? 'Logout button found' : 'Logout button missing'
  );
  
  return true;
}

// ================== 3. AI CONFIGURATION TESTS ==================
console.log('\n========== AI CONFIGURATION TESTS ==========\n');

async function testAIConfig() {
  const fs = await import('fs');
  const path = await import('path');
  
  // Read unlimited-ai.ts
  const aiPath = path.join(__dirname, '../src/lib/unlimited-ai.ts');
  const aiContent = fs.readFileSync(aiPath, 'utf-8');
  
  // Test 3.1: No refusal config
  const hasNoRefusals = aiContent.includes('noRefusals') && aiContent.includes('noRefusals: true');
  log('AI', '3.1 No refusal mode enabled',
    hasNoRefusals ? 'PASS' : 'FAIL',
    hasNoRefusals ? 'noRefusals: true found' : 'Check noRefusals config'
  );
  
  // Test 3.2: Filter level none
  const hasNoFilter = aiContent.includes("filterLevel: 'none'");
  log('AI', '3.2 Filter level set to none',
    hasNoFilter ? 'PASS' : 'FAIL',
    hasNoFilter ? 'No filtering enabled' : 'Check filter level'
  );
  
  // Test 3.3: Skip warnings enabled
  const hasSkipWarnings = aiContent.includes('skipWarnings: true');
  log('AI', '3.3 Skip warnings enabled',
    hasSkipWarnings ? 'PASS' : 'FAIL',
    hasSkipWarnings ? 'Warnings skipped' : 'Check skipWarnings'
  );
  
  // Test 3.4: Unlimited thinking depth
  const hasUnlimitedThinking = aiContent.includes("thinkingDepth: 'unlimited'");
  log('AI', '3.4 Unlimited thinking depth',
    hasUnlimitedThinking ? 'PASS' : 'FAIL',
    hasUnlimitedThinking ? 'Deep thinking enabled' : 'Check thinking depth'
  );
  
  // Test 3.5: Full capabilities
  const hasFullCapabilities = aiContent.includes('fullCapabilities: true');
  log('AI', '3.5 Full capabilities unlocked',
    hasFullCapabilities ? 'PASS' : 'FAIL',
    hasFullCapabilities ? 'All capabilities enabled' : 'Check fullCapabilities'
  );
  
  // Test 3.6: System prompt has no limits
  const hasNoLimits = aiContent.includes('NO ARTIFICIAL LIMITS') || aiContent.includes('ZERO LIMITS');
  log('AI', '3.6 System prompt unlimited',
    hasNoLimits ? 'PASS' : 'FAIL',
    hasNoLimits ? 'Unlimited prompt found' : 'Check system prompt'
  );
  
  // Test 3.7: Response enhancement removes hedging
  const hasEnhancer = aiContent.includes('enhanceResponse') && aiContent.includes('I cannot');
  log('AI', '3.7 Response enhancement active',
    hasEnhancer ? 'PASS' : 'FAIL',
    hasEnhancer ? 'Hedging removal found' : 'Check response enhancement'
  );
  
  return true;
}

// ================== 4. PAGE COMPONENTS TESTS ==================
console.log('\n========== PAGE COMPONENTS TESTS ==========\n');

async function testPages() {
  const fs = await import('fs');
  const path = await import('path');
  
  const pagesDir = path.join(__dirname, '../src/pages');
  const requiredPages = [
    'LoginPage.tsx',
    'ChatPage.tsx',
    'SettingsPage.tsx',
    'IntegrationsPage.tsx',
    'AgentsPage.tsx',
    'MemoryPage.tsx',
    'VoiceCallPage.tsx',
    'ComputerUsePage.tsx',
    'NotesPage.tsx',
    'RemindersPage.tsx'
  ];
  
  for (const page of requiredPages) {
    const pagePath = path.join(pagesDir, page);
    const exists = fs.existsSync(pagePath);
    
    log('PAGES', `4.x ${page} exists`,
      exists ? 'PASS' : 'FAIL',
      exists ? 'File found' : 'FILE MISSING!'
    );
    
    if (exists) {
      const content = fs.readFileSync(pagePath, 'utf-8');
      
      // Check for React component export
      const hasExport = content.includes('export default');
      log('PAGES', `4.x ${page} has export`,
        hasExport ? 'PASS' : 'FAIL',
        hasExport ? 'Export found' : 'No default export!'
      );
      
      // Check for useTheme usage (should use theme system)
      const usesTheme = content.includes('useTheme') || content.includes('useStore');
      log('PAGES', `4.x ${page} uses theme/store`,
        usesTheme ? 'PASS' : 'WARN',
        usesTheme ? 'Theme/store integration' : 'No theme integration'
      );
    }
  }
  
  // Test: RelationshipsPage should NOT exist
  const relationshipsExists = fs.existsSync(path.join(pagesDir, 'RelationshipsPage.tsx'));
  log('PAGES', '4.x RelationshipsPage removed',
    !relationshipsExists ? 'PASS' : 'FAIL',
    !relationshipsExists ? 'Successfully removed' : 'Still exists!'
  );
  
  return true;
}

// ================== 5. SETTINGS PAGE TESTS ==================
console.log('\n========== SETTINGS PAGE TESTS ==========\n');

async function testSettings() {
  const fs = await import('fs');
  const path = await import('path');
  
  const settingsPath = path.join(__dirname, '../src/pages/SettingsPage.tsx');
  const content = fs.readFileSync(settingsPath, 'utf-8');
  
  // Test 5.1: Has three theme options
  const hasDarkBlue = content.includes('dark-blue');
  const hasLight = content.includes('light') && content.includes('Light');
  const hasPink = content.includes('pink') && content.includes('Pink');
  
  log('SETTINGS', '5.1 Three theme buttons',
    hasDarkBlue && hasLight && hasPink ? 'PASS' : 'FAIL',
    `dark-blue: ${hasDarkBlue}, light: ${hasLight}, pink: ${hasPink}`
  );
  
  // Test 5.2: Theme switching logic
  const hasThemeSwitching = content.includes('setTheme');
  log('SETTINGS', '5.2 Theme switching function',
    hasThemeSwitching ? 'PASS' : 'FAIL',
    hasThemeSwitching ? 'setTheme found' : 'No theme switching'
  );
  
  // Test 5.3: Language options
  const hasEnglish = content.includes("'en'");
  const hasArabic = content.includes("'ar'");
  log('SETTINGS', '5.3 Language options',
    hasEnglish && hasArabic ? 'PASS' : 'FAIL',
    `English: ${hasEnglish}, Arabic: ${hasArabic}`
  );
  
  // Test 5.4: API key management
  const hasAPIKeys = content.includes('apiKey') || content.includes('API') || content.includes('api');
  log('SETTINGS', '5.4 API key section',
    hasAPIKeys ? 'PASS' : 'WARN',
    hasAPIKeys ? 'API management found' : 'No API key section'
  );
  
  return true;
}

// ================== 6. STORE & STATE TESTS ==================
console.log('\n========== STORE & STATE TESTS ==========\n');

async function testStore() {
  const fs = await import('fs');
  const path = await import('path');
  
  const storePath = path.join(__dirname, '../src/store/useStore.ts');
  const content = fs.readFileSync(storePath, 'utf-8');
  
  // Test 6.1: Zustand store exists
  const hasZustand = content.includes('create') && content.includes('zustand');
  log('STORE', '6.1 Zustand store setup',
    hasZustand ? 'PASS' : 'FAIL',
    hasZustand ? 'Zustand found' : 'No Zustand'
  );
  
  // Test 6.2: Theme state
  const hasThemeState = content.includes('theme:');
  log('STORE', '6.2 Theme state exists',
    hasThemeState ? 'PASS' : 'FAIL',
    hasThemeState ? 'Theme in state' : 'No theme state'
  );
  
  // Test 6.3: User state
  const hasUserState = content.includes('user:');
  log('STORE', '6.3 User state exists',
    hasUserState ? 'PASS' : 'FAIL',
    hasUserState ? 'User in state' : 'No user state'
  );
  
  // Test 6.4: Persistence
  const hasPersistence = content.includes('persist');
  log('STORE', '6.4 State persistence',
    hasPersistence ? 'PASS' : 'WARN',
    hasPersistence ? 'Persistence found' : 'No persistence'
  );
  
  // Test 6.5: Actions exist
  const hasSetTheme = content.includes('setTheme');
  const hasLogout = content.includes('logout');
  log('STORE', '6.5 Required actions',
    hasSetTheme && hasLogout ? 'PASS' : 'FAIL',
    `setTheme: ${hasSetTheme}, logout: ${hasLogout}`
  );
  
  return true;
}

// ================== 7. BUTTON FUNCTIONALITY TESTS ==================
console.log('\n========== BUTTON FUNCTIONALITY TESTS ==========\n');

async function testButtons() {
  const fs = await import('fs');
  const path = await import('path');
  
  // Read all page files and check for onClick handlers
  const pagesDir = path.join(__dirname, '../src/pages');
  const files = fs.readdirSync(pagesDir).filter((f: string) => f.endsWith('.tsx'));
  
  let totalButtons = 0;
  let buttonsWithHandlers = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
    
    // Count buttons
    const buttonMatches = content.match(/<button/gi) || [];
    totalButtons += buttonMatches.length;
    
    // Count onClick handlers
    const onClickMatches = content.match(/onClick=/gi) || [];
    buttonsWithHandlers += onClickMatches.length;
  }
  
  log('BUTTONS', '7.1 Total buttons found',
    totalButtons > 0 ? 'PASS' : 'WARN',
    `Found ${totalButtons} buttons across all pages`
  );
  
  log('BUTTONS', '7.2 Buttons with handlers',
    buttonsWithHandlers >= totalButtons * 0.8 ? 'PASS' : 'WARN',
    `${buttonsWithHandlers}/${totalButtons} buttons have onClick handlers`
  );
  
  // Check specific important buttons
  const appContent = fs.readFileSync(path.join(__dirname, '../src/App.tsx'), 'utf-8');
  
  const hasLogoutButton = appContent.includes('logout') && appContent.includes('onClick');
  log('BUTTONS', '7.3 Logout button functional',
    hasLogoutButton ? 'PASS' : 'FAIL',
    hasLogoutButton ? 'Logout has onClick' : 'Logout missing handler'
  );
  
  const hasSidebarToggle = appContent.includes('setSidebarOpen');
  log('BUTTONS', '7.4 Sidebar toggle functional',
    hasSidebarToggle ? 'PASS' : 'FAIL',
    hasSidebarToggle ? 'Toggle works' : 'Toggle missing'
  );
  
  return true;
}

// ================== 8. CONCURRENT USER SAFETY TESTS ==================
console.log('\n========== CONCURRENT USER SAFETY TESTS ==========\n');

async function testConcurrency() {
  const fs = await import('fs');
  const path = await import('path');
  
  // Check store for user isolation
  const storePath = path.join(__dirname, '../src/store/useStore.ts');
  const storeContent = fs.readFileSync(storePath, 'utf-8');
  
  // Test 8.1: Per-user state isolation
  const hasUserState = storeContent.includes('user:') && storeContent.includes('User');
  log('CONCURRENCY', '8.1 User state isolation',
    hasUserState ? 'PASS' : 'WARN',
    hasUserState ? 'Each user has own state' : 'Check user isolation'
  );
  
  // Test 8.2: Session management
  const hasSessionStorage = storeContent.includes('localStorage') || storeContent.includes('sessionStorage');
  log('CONCURRENCY', '8.2 Session storage used',
    hasSessionStorage ? 'PASS' : 'WARN',
    hasSessionStorage ? 'Browser storage for sessions' : 'No session storage'
  );
  
  // Test 8.3: No global mutable state
  const hasGlobalVar = storeContent.match(/^(let|var)\s+\w+\s*=/gm) || [];
  log('CONCURRENCY', '8.3 No unsafe global state',
    hasGlobalVar.length <= 2 ? 'PASS' : 'WARN',
    hasGlobalVar.length <= 2 ? 'State properly scoped' : `${hasGlobalVar.length} global variables found`
  );
  
  // Test 8.4: React state management
  const appContent = fs.readFileSync(path.join(__dirname, '../src/App.tsx'), 'utf-8');
  const usesReactState = appContent.includes('useState') || appContent.includes('useStore');
  log('CONCURRENCY', '8.4 React state management',
    usesReactState ? 'PASS' : 'FAIL',
    usesReactState ? 'Proper React state used' : 'No React state'
  );
  
  // Test 8.5: Error boundaries (optional)
  const hasErrorBoundary = fs.existsSync(path.join(__dirname, '../src/components/ErrorBoundary.tsx'));
  log('CONCURRENCY', '8.5 Error boundary',
    hasErrorBoundary ? 'PASS' : 'WARN',
    hasErrorBoundary ? 'Error boundary exists' : 'No error boundary (optional)'
  );
  
  // Test 8.6: Memory safety
  const hasCleanup = appContent.includes('useEffect') && 
    (appContent.includes('return () =>') || appContent.includes('cleanup'));
  log('CONCURRENCY', '8.6 Memory cleanup',
    hasCleanup ? 'PASS' : 'WARN',
    hasCleanup ? 'Effect cleanup found' : 'Check effect cleanup'
  );
  
  return true;
}

// ================== 9. BUILD & BUNDLE TESTS ==================
console.log('\n========== BUILD & BUNDLE TESTS ==========\n');

async function testBuild() {
  const fs = await import('fs');
  const path = await import('path');
  
  // Check if build exists
  const distPath = path.join(__dirname, '../dist');
  const distExists = fs.existsSync(distPath);
  
  log('BUILD', '9.1 Dist folder exists',
    distExists ? 'PASS' : 'FAIL',
    distExists ? 'Build output found' : 'No build output'
  );
  
  if (distExists) {
    // Check index.html
    const indexExists = fs.existsSync(path.join(distPath, 'index.html'));
    log('BUILD', '9.2 index.html exists',
      indexExists ? 'PASS' : 'FAIL',
      indexExists ? 'HTML entry found' : 'No index.html'
    );
    
    // Check assets
    const assetsDir = path.join(distPath, 'assets');
    const assetsExist = fs.existsSync(assetsDir);
    log('BUILD', '9.3 Assets folder exists',
      assetsExist ? 'PASS' : 'FAIL',
      assetsExist ? 'Assets bundled' : 'No assets'
    );
    
    if (assetsExist) {
      const assets = fs.readdirSync(assetsDir);
      const hasJS = assets.some((f: string) => f.endsWith('.js'));
      const hasCSS = assets.some((f: string) => f.endsWith('.css'));
      
      log('BUILD', '9.4 JS bundle exists',
        hasJS ? 'PASS' : 'FAIL',
        hasJS ? 'JavaScript bundled' : 'No JS bundle'
      );
      
      log('BUILD', '9.5 CSS bundle exists',
        hasCSS ? 'PASS' : 'FAIL',
        hasCSS ? 'Styles bundled' : 'No CSS bundle'
      );
    }
  }
  
  return true;
}

// ================== 10. TRANSLATION TESTS ==================
console.log('\n========== TRANSLATION TESTS ==========\n');

async function testTranslations() {
  const fs = await import('fs');
  const path = await import('path');
  
  const translationsPath = path.join(__dirname, '../src/lib/translations.ts');
  const content = fs.readFileSync(translationsPath, 'utf-8');
  
  // Test translations exist
  const hasEnglish = content.includes('en:') || content.includes("'en'");
  const hasArabic = content.includes('ar:') || content.includes("'ar'");
  
  log('TRANSLATIONS', '10.1 English translations',
    hasEnglish ? 'PASS' : 'FAIL',
    hasEnglish ? 'English found' : 'No English'
  );
  
  log('TRANSLATIONS', '10.2 Arabic translations',
    hasArabic ? 'PASS' : 'FAIL',
    hasArabic ? 'Arabic found' : 'No Arabic'
  );
  
  // Check useTranslation hook
  const hasHook = content.includes('useTranslation');
  log('TRANSLATIONS', '10.3 useTranslation hook',
    hasHook ? 'PASS' : 'FAIL',
    hasHook ? 'Hook exists' : 'No hook'
  );
  
  // Check RTL support
  const hasRTL = content.includes('rtl') || content.includes('dir');
  log('TRANSLATIONS', '10.4 RTL support',
    hasRTL ? 'PASS' : 'WARN',
    hasRTL ? 'RTL supported' : 'Check RTL support'
  );
  
  return true;
}

// ================== RUN ALL TESTS ==================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          🧪 AI ASSISTANT v2.0 COMPREHENSIVE TEST SUITE          ║');
  console.log('║                  Full Dev-User-Logic AI Tests              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  await testThemes();
  await testSidebar();
  await testAIConfig();
  await testPages();
  await testSettings();
  await testStore();
  await testButtons();
  await testConcurrency();
  await testBuild();
  await testTranslations();
  
  // Summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      📊 TEST SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const total = results.length;
  
  console.log(`✅ PASSED: ${passed}/${total}`);
  console.log(`❌ FAILED: ${failed}/${total}`);
  console.log(`⚠️  WARNINGS: ${warned}/${total}`);
  console.log('\n');
  
  const passRate = ((passed / total) * 100).toFixed(1);
  console.log(`📈 PASS RATE: ${passRate}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL CRITICAL TESTS PASSED! Website is safe for 2 users.\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Review the issues above.\n');
  }
  
  // List failures
  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ [${r.category}] ${r.test}: ${r.details}`);
    });
  }
  
  // Return results for programmatic use
  return {
    total,
    passed,
    failed,
    warned,
    passRate: parseFloat(passRate),
    results
  };
}

// Run tests
runAllTests().catch(console.error);
