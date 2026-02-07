// ============================================
// 🌟 ULTIMATE AI PERSONALITY
// The BEST of Tasklet + ChatGPT Combined
// No Limitations, Maximum Intelligence
// ============================================

export interface PersonalityConfig {
  name: string;
  language: 'ar' | 'en' | 'auto';
  style: 'professional' | 'friendly' | 'casual' | 'adaptive';
  creativity: number;    // 0-1
  verbosity: number;     // 0-1 (brief to detailed)
  humor: number;         // 0-1
  empathy: number;       // 0-1
  directness: number;    // 0-1
}

const DEFAULT_CONFIG: PersonalityConfig = {
  name: 'Try-It! AI',
  language: 'auto',
  style: 'adaptive',
  creativity: 0.8,
  verbosity: 0.6,
  humor: 0.5,
  empathy: 0.9,
  directness: 0.7,
};

// ============================================
// ULTIMATE SYSTEM PROMPT
// ============================================

export function generateUltimatePrompt(
  config: Partial<PersonalityConfig> = {},
  userContext?: string
): string {
  const c = { ...DEFAULT_CONFIG, ...config };

  return `
# 🌟 أنا ${c.name} - مساعد ذكي متكامل
أنا هنا لمساعدتك في أي شيء، سواء كان محادثة عادية أو مهمة معقدة.

## 🧠 قدراتي:
- 💬 **محادثة طبيعية:** أتحدث معك كصديق ذكي.
- 🌍 **متعدد اللغات:** أتحدث العربية والإنجليزية والفرانكو بطلاقة.
- 🛠️ **مساعدة شاملة:** أساعدك في الكتابة، التفكير، التحليل، والبرمجة (إذا طلبت ذلك).
- 🎨 **إبداع:** أساعدك في توليد الأفكار والمحتوى.

## 🎨 شخصيتي:
- ذكي، ودود، وطبيعي.
- لست روبوتاً مملاً.
- أتذكر تفاصيلك وأتكيف معك.

## 🌐 اللغة (Arabic First):
- **قاعدة ثابتة:** الرد الافتراضي هو **العربية** دائماً.
- English input -> Arabic output.
- Arabic input -> Arabic output.
- Franco input -> Arabic output.
- **استثناء:** إذا طلب المستخدم الرد ب لغة أخرى (Reply in English).

${userContext ? `
## 👤 معلومات المستخدم
${userContext}
` : ''}

## 💡 تذكير مهم

أنا هنا لمساعدتك بأي شيء. لا تتردد في السؤال عن أي موضوع. سواء كان:
- سؤال بسيط أو معقد
- مشكلة تقنية أو شخصية
- مشروع عمل أو فكرة إبداعية
- تعلم شيء جديد أو حل مشكلة

أنا جاهز دائماً! 🚀
`;
}

// ============================================
// LANGUAGE DETECTION (Enhanced)
// ============================================

export function detectLanguage(text: string): 'ar' | 'en' | 'franco' {
  // Check for Arabic characters
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = arabicChars + englishChars;

  if (totalChars === 0) return 'en';

  // Franco Arabic patterns
  const francoPatterns = [
    /\b(3|7|5|2|8|9)\w+/i, // Numbers in words
    /\b(ya|yalla|sho|enta|ana|msh|kda|law|bs|w|f|m3|7bb|a7|3rf)\b/i,
    /\b(habibi|yani|bas|mesh|leh|ezay|ezzayak|ta3al)\b/i,
  ];

  if (francoPatterns.some(p => p.test(text))) {
    return 'franco';
  }

  const arabicRatio = arabicChars / totalChars;
  
  if (arabicRatio > 0.3) return 'ar';
  return 'en';
}

// ============================================
// RESPONSE LANGUAGE DETECTION
// ============================================

export function getResponseLanguage(message: string): string {
  // Explicit language requests
  const englishRequest = /\b(in english|بالإنجليزي|بالانجليزي|reply in english|respond in english)\b/i;
  const arabicRequest = /\b(in arabic|بالعربي|رد بالعربي|respond in arabic|reply in arabic)\b/i;

  if (englishRequest.test(message)) return 'english';
  if (arabicRequest.test(message)) return 'arabic';

  // Auto-detect
  const lang = detectLanguage(message);
  if (lang === 'ar' || lang === 'franco') return 'arabic';
  return 'english';
}

// ============================================
// MOOD DETECTION (Enhanced)
// ============================================

export function detectMood(text: string): {
  mood: string;
  confidence: number;
  emoji: string;
} {
  const lowerText = text.toLowerCase();

  const moods = [
    {
      mood: 'excited',
      patterns: [/!{2,}/, /omg|wow|amazing|awesome|incredible|يا سلام|روعة|واو/, /🎉|🔥|💯|🚀/],
      emoji: '🎉',
    },
    {
      mood: 'happy',
      patterns: [/😊|😄|😃|❤️|💕/, /happy|great|شكرا|ممتاز|حلو|جميل|تمام/, /thanks|thank you|شكراً/i],
      emoji: '😊',
    },
    {
      mood: 'frustrated',
      patterns: [/😤|😡|🤬/, /wtf|ugh|damn|مش|ليه كدا|زهقت|مستفز/, /doesn't work|not working|broken/i],
      emoji: '😤',
    },
    {
      mood: 'sad',
      patterns: [/😢|😭|💔/, /sad|depressed|حزين|زعلان|مش كويس/, /feeling down|feel bad/i],
      emoji: '😢',
    },
    {
      mood: 'anxious',
      patterns: [/😰|😟|😨/, /worried|anxious|stressed|قلقان|متوتر|خايف/, /nervous|afraid/i],
      emoji: '😰',
    },
    {
      mood: 'curious',
      patterns: [/\?{1,}|؟{1,}/, /how|what|why|when|كيف|ايه|ليه|ازاي|متى/, /wondering|curious/i],
      emoji: '🤔',
    },
    {
      mood: 'grateful',
      patterns: [/🙏|💕|🥰/, /thank|thanks|شكر|ممنون|appreciate/i],
      emoji: '🙏',
    },
  ];

  for (const { mood, patterns, emoji } of moods) {
    const matches = patterns.filter(p => p.test(lowerText));
    if (matches.length > 0) {
      return {
        mood,
        confidence: Math.min(0.5 + matches.length * 0.2, 1),
        emoji,
      };
    }
  }

  return { mood: 'neutral', confidence: 0.8, emoji: '😐' };
}

// ============================================
// RESPONSE STYLE ADAPTATION
// ============================================

export function getAdaptiveStyle(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): Partial<PersonalityConfig> {
  const style: Partial<PersonalityConfig> = {};

  // Analyze message length preference
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / (userMessages.length || 1);
  
  style.verbosity = Math.min(avgLength / 200, 1);

  // Detect formality
  const formalPatterns = /\b(please|kindly|would you|could you|من فضلك|لو سمحت)\b/i;
  const casualPatterns = /\b(hey|hi|yo|sup|يا|هاي|ازيك)\b/i;

  if (formalPatterns.test(userMessage)) {
    style.style = 'professional';
  } else if (casualPatterns.test(userMessage)) {
    style.style = 'casual';
  }

  // Detect humor preference
  const humorPatterns = /😂|🤣|lol|haha|ههه|😄/;
  if (conversationHistory.some(m => humorPatterns.test(m.content))) {
    style.humor = 0.8;
  }

  return style;
}

// ============================================
// EXPORT DEFAULTS
// ============================================

export const ULTIMATE_SYSTEM_PROMPT = generateUltimatePrompt();

export default {
  generateUltimatePrompt,
  detectLanguage,
  getResponseLanguage,
  detectMood,
  getAdaptiveStyle,
  DEFAULT_CONFIG,
};
