// ============================================
// 🌐 TRANSLATIONS - Language Support
// ============================================

export type Language = 'en' | 'ar';

export const translations = {
  en: {
    // Navigation
    chat: 'Chat',
    agents: 'Agents',
    integrations: 'Integrations',
    memory: 'Memory',
    voiceCalls: 'Voice Calls',
    computerUse: 'Computer Use',
    settings: 'Settings',
    logout: 'Logout',
    
    // Chat
    newChat: 'New Chat',
    typeMessage: 'Type your message...',
    send: 'Send',
    thinking: 'Thinking...',
    analyzing: 'Analyzing your request...',
    searching: 'Searching for information...',
    writing: 'Writing response...',
    reviewing: 'Reviewing...',
    
    // Settings
    theme: 'Theme',
    language: 'Language',
    darkBlue: 'Dark Blue',
    dark: 'Dark',
    light: 'Light',
    english: 'English',
    arabic: 'العربية',
    aiSettings: 'AI Settings',
    thinkingDepth: 'Thinking Depth',
    fast: 'Fast',
    balanced: 'Balanced',
    deep: 'Deep',
    unlimited: 'Unlimited',
    
    // Memory
    memoryTitle: 'AI Memory',
    memoryDesc: 'The AI remembers these things about you',
    preferences: 'Preferences',
    facts: 'Facts',
    skills: 'Skills',
    goals: 'Goals',
    noMemories: 'No memories saved yet',
    autoSave: 'Auto-save enabled',
    
    // Login
    welcome: 'Welcome to Try-It!',
    loginSubtitle: 'Free AI Assistant with 85% of ChatGPT features',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    register: 'Register',
    demoMode: 'Try Demo Mode',
    orContinueWith: 'Or continue with',
    
    // Computer Use
    startBrowser: 'Start Browser',
    stopBrowser: 'Stop Browser',
    browserRunning: 'Browser is running',
    browserStopped: 'Browser is stopped',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  ar: {
    // Navigation
    chat: 'المحادثة',
    agents: 'الوكلاء',
    integrations: 'التكاملات',
    memory: 'الذاكرة',
    voiceCalls: 'المكالمات',
    computerUse: 'التحكم بالحاسوب',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Chat
    newChat: 'محادثة جديدة',
    typeMessage: 'اكتب رسالتك...',
    send: 'إرسال',
    thinking: 'أفكر...',
    analyzing: 'أحلل طلبك...',
    searching: 'أبحث عن معلومات...',
    writing: 'أكتب الرد...',
    reviewing: 'أراجع...',
    
    // Settings
    theme: 'المظهر',
    language: 'اللغة',
    darkBlue: 'أزرق داكن',
    dark: 'داكن',
    light: 'فاتح',
    english: 'English',
    arabic: 'العربية',
    aiSettings: 'إعدادات الذكاء الاصطناعي',
    thinkingDepth: 'عمق التفكير',
    fast: 'سريع',
    balanced: 'متوازن',
    deep: 'عميق',
    unlimited: 'بلا حدود',
    
    // Memory
    memoryTitle: 'ذاكرة الذكاء الاصطناعي',
    memoryDesc: 'الذكاء الاصطناعي يتذكر هذه الأشياء عنك',
    preferences: 'التفضيلات',
    facts: 'الحقائق',
    skills: 'المهارات',
    goals: 'الأهداف',
    noMemories: 'لا توجد ذكريات محفوظة بعد',
    autoSave: 'الحفظ التلقائي مفعّل',
    
    // Login
    welcome: 'مرحباً بك في المساعد الذكي',
    loginSubtitle: 'مساعد ذكاء اصطناعي مجاني',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'دخول',
    register: 'تسجيل',
    demoMode: 'جرب الوضع التجريبي',
    orContinueWith: 'أو تابع مع',
    
    // Computer Use
    startBrowser: 'تشغيل المتصفح',
    stopBrowser: 'إيقاف المتصفح',
    browserRunning: 'المتصفح يعمل',
    browserStopped: 'المتصفح متوقف',
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'تم بنجاح',
  }
};

export function t(key: keyof typeof translations.en, lang: Language = 'en'): string {
  return translations[lang][key] || translations.en[key] || key;
}

export function useTranslation(lang: Language) {
  return {
    t: (key: keyof typeof translations.en) => t(key, lang),
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    lang,
  };
}
