// ===== API KEYS & CONFIG SOURCE =====

const getStoredKeys = () => {
  try {
    return JSON.parse(localStorage.getItem('tryit_api_keys') || '{}');
  } catch {
    return {};
  }
};

const STORED_KEYS = getStoredKeys();

export const KEYS = {
  groq: STORED_KEYS.groq || import.meta.env.VITE_GROQ_API_KEY || '',
  gemini: STORED_KEYS.gemini || import.meta.env.VITE_GEMINI_API_KEY || '',
  openrouter: STORED_KEYS.openrouter || import.meta.env.VITE_OPENROUTER_API_KEY || '',
  mistral: STORED_KEYS.mistral || import.meta.env.VITE_MISTRAL_API_KEY || '',
  cohere: STORED_KEYS.cohere || import.meta.env.VITE_COHERE_API_KEY || '',
  tavily: STORED_KEYS.tavily || import.meta.env.VITE_TAVILY_API_KEY || '',
  firecrawl: STORED_KEYS.firecrawl || import.meta.env.VITE_FIRECRAWL_API_KEY || '',
  elevenlabs: STORED_KEYS.elevenlabs || import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  replicate: STORED_KEYS.replicate || import.meta.env.VITE_REPLICATE_API_KEY || '',
  e2b: STORED_KEYS.e2b || import.meta.env.VITE_E2B_API_KEY || '',
  resend: STORED_KEYS.resend || import.meta.env.VITE_RESEND_API_KEY || '',
  supabaseUrl: STORED_KEYS.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: STORED_KEYS.supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  anthropic: STORED_KEYS.anthropic || import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  openai: STORED_KEYS.openai || import.meta.env.VITE_OPENAI_API_KEY || '',
  github: STORED_KEYS.github || import.meta.env.VITE_GITHUB_TOKEN || '',
  vercel: STORED_KEYS.vercel || import.meta.env.VITE_VERCEL_TOKEN || '',
  gmail: STORED_KEYS.gmail || import.meta.env.VITE_GMAIL_TOKEN || '',
  whatsapp: STORED_KEYS.whatsapp || import.meta.env.VITE_WHATSAPP_TOKEN || '',
  twilio: STORED_KEYS.twilio || import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
  telegram: STORED_KEYS.telegram || import.meta.env.VITE_TELEGRAM_TOKEN || '',
  discord: STORED_KEYS.discord || import.meta.env.VITE_DISCORD_TOKEN || '',
  slack: STORED_KEYS.slack || import.meta.env.VITE_SLACK_TOKEN || '',
  notion: STORED_KEYS.notion || import.meta.env.VITE_NOTION_TOKEN || '',
  airtable: STORED_KEYS.airtable || import.meta.env.VITE_AIRTABLE_TOKEN || '',
  linear: STORED_KEYS.linear || import.meta.env.VITE_LINEAR_TOKEN || '',
  jira: STORED_KEYS.jira || import.meta.env.VITE_JIRA_TOKEN || '',
  trello: STORED_KEYS.trello || import.meta.env.VITE_TRELLO_TOKEN || '',
  hubspot: STORED_KEYS.hubspot || import.meta.env.VITE_HUBSPOT_TOKEN || '',
  google_calendar: STORED_KEYS.google_calendar || import.meta.env.VITE_GOOGLE_CALENDAR_TOKEN || '',
};

export function updateApiKey(provider: keyof typeof KEYS, key: string) {
  KEYS[provider] = key;
  const currentStored = getStoredKeys();
  currentStored[provider] = key;
  localStorage.setItem('tryit_api_keys', JSON.stringify(currentStored));
}

export function checkApiKeys(): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  for (const key in KEYS) {
    status[key] = !!KEYS[key as keyof typeof KEYS];
  }
  return status;
}

// ===== UNIVERSAL SYSTEM PROMPT (Arabic Base for Consistency) =====
export const UNIVERSAL_SYSTEM_PROMPT = `
أنت "باسل" (Basil)، مساعد شخصي مصري، جدع، وذكي جداً.

# هويتك (Identity):
- **مصري أصيل**: بتتكلم "عامية مصرية" (Egyptian Arabic) دايماً.
- **صاحب صاحبك**: أسلوبك ودود، قريب من القلب، ومش رسمي.
- **ذكي وشامل**: بتفهم في كل حاجة (كتابة، تفكير، تحليل، حياة)، مش بس كود.

# قواعد اللغة (Language Rules):
- **تتكلم مصري بس**: حتى لو المستخدم كتب بالإنجليزي أو الفرانكو، رد عليه بالمصري.
  - مثال: User: "Hello" -> You: "أهلاً يا غالي، منور! إيه الأخبار؟"
  - مثال: User: "ezayak" -> You: "الحمد لله تمام، أنت عامل إيه؟"
- **ممنوع الإنجليزي**: إلا لو المستخدم طلب ترجمة أو مصطلح تقني لازم يتقال بالإنجليزي.

# قواعد التعامل (Interaction Rules):
- **بلاش جو الروبوتات**: ماتقولش "أنا ذكاء اصطناعي" ولا "بصفتي نموذج لغوي". خليك طبيعي.
- **أنت مش مبرمج بس**: لو المستخدم ما سألش عن كود، ماتجبش سيرة البرمجة. خليك في الموضوع اللي بيتكلم فيه.
- **مفيد ومباشر**: حل المشكلة علطول بذكاء ومن غير رغي كتير.

# قدراتك (Your Capabilities):
- **توليد ملفات كاملة**: تقدر تعمل ملفات حقيقية مش بس كلام.
  - [PDF: المحتوى] -> لعمل ملف PDF.
  - [EXCEL: البيانات] -> لعمل ملف Excel.
  - [WORD: المحتوى] -> لعمل ملف Word.
  - [ZIP: المحتوى] -> لعمل ملف مضغوط (مشروع كامل).
  - [IMAGE: الوصف] -> لعمل صورة.
  - [AUDIO: النص] -> لعمل ملف صوتي.
- **تحليل بيانات**: بتقرأ Excel/CSV وتطلع إحصائيات.
- **قراءة مستندات**: PDF/Word/Text.
- **سماع صوتيات**: Audio transcription.
- **كتابة كود**: Code generation & Preview.

أنت مساعد "تنفيذي" قوي. نفذ الأوامر واصنع الملفات فوراً.
أنت جاهز يا بطل.. انطلق! 🚀
`;

export const ARABIC_SYSTEM_PROMPT = UNIVERSAL_SYSTEM_PROMPT; 
export const ENGLISH_SYSTEM_PROMPT = UNIVERSAL_SYSTEM_PROMPT;
