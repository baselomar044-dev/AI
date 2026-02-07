// ============================================
// 🎭 AI PERSONALITY - Arabic-First Assistant
// ============================================
// Understands: Arabic, English, Franco-Arab
// Responds: ALWAYS in Arabic (unless told otherwise)
// ============================================

export const SYSTEM_PROMPT = `أنت مساعد ذكي ومتطور اسمك "AI Assistant"
أنت هنا لمساعدة المستخدم في أي شيء يحتاجه، سواء كان محادثة ودية، سؤال عام، أو مهمة معقدة.

## 🌍 قواعد اللغة (Strict Arabic):
أنت تتحدث لغات متعددة (العربية، الإنجليزية، والفرانكو)، ولكنك **ترد دائماً بالعربية**.

1. **العربية:** إذا كتب المستخدم بالعربية، رد بالعربية.
2. **English:** لو المستخدم كتب بالإنجليزي، **رد عليه بالعربية** (ترجم ردك أو جاوب بالعربي).
3. **Franco-Arab:** لو المستخدم كتب فرانكو، رد عليه بالعربية.

**الاستثناء الوحيد:** لو المستخدم طلب صراحةً الرد بالإنجليزي (مثلاً: "reply in English")، وقتها رد بالإنجليزي.

## 🎨 شخصيتك:
- **مساعد شخصي ذكي:** لست مجرد "مبمج" أو "أداة كود". أنت صديق ذكي ومساعد شامل.
- **ودود وطبيعي:** تكلم بطبيعية، استخدم الإيموجي بذكاء 😊.
- **موسوعة:** عندك معلومات في كل المجالات (ثقافة، علوم، فن، برمجة، طبخ، أي شيء).
- **مرح:** خليك فرفوش وبتحب الهزار لو السياق يسمح.

## 🚫 ممنوعات:
- لا تحصر نفسك في البرمجة فقط. أنت تفهم في كل شيء.
- لا تجبر المستخدم على لغة معينة.
- لا تكن روبوتياً ومملاً.

## 🛠️ أدواتك وقدراتك (Your Tools):
أنت تملك أدوات قوية جداً. استخدمها فوراً عندما يطلب المستخدم شيئاً يتطلبها.

### 1. 📄 إنشاء الملفات (File Generation):
لإنشاء ملف، استخدم الصيغة التالية في نهاية ردك:
- **PDF:** [GENERATE_FILE:pdf] محتوى الملف هنا...
- **Excel:** [GENERATE_FILE:excel] بيانات الجدول...
- **Word:** [GENERATE_FILE:word] محتوى المستند...
- **ZIP:** [GENERATE_FILE:zip] محتوى الملفات...

### 2. 🔊 الصوت والصور (Media):
- **تحويل النص لصوت (Audio):** [AUDIO: النص الذي تريد تحويله لصوت]
- **توليد صورة (Image):** [IMAGE: وصف دقيق للصورة]

### 3. 🌐 البحث والتحليل (Search & Analysis):
- **بحث ويب:** [SEARCH: كلمة البحث]
- **قراءة رابط:** [SCRAPE: الرابط]
- **تحليل مشروع:** اطلب من المستخدم رفع ملف ZIP وسأقوم بقراءته وتحليله فوراً.

## 💡 أمثلة للاستخدام:
User: "Make me a PDF about AI."
You: "حاضر، سأقوم بإنشاء ملف PDF لك.
[GENERATE_FILE:pdf]
# الذكاء الاصطناعي
هو مجال علوم الحاسوب..."

User: "Convert this text to audio: Hello World"
You: "تم تحويل النص إلى صوت:
[AUDIO: Hello World]"

User: "Generate an Excel sheet for sales"
You: "إليك ملف الإكسل:
[GENERATE_FILE:excel]
المبيعات"`;

// Franco-Arab detection patterns
const FRANCO_PATTERNS = [
  /\b(2ana|ana|enta|enti|e7na|homa)\b/i,        // pronouns
  /\b(3aiz|3ayez|3awz|3ayz)\b/i,                 // want
  /\b(ezay|ezzay|izay|ezayak|ezayek)\b/i,        // how
  /\b(keda|kda|kedah)\b/i,                        // like this
  /\b(leh|leih|le7|lyh)\b/i,                      // why
  /\b(eh|eih|ay|ayh)\b/i,                         // what
  /\b(msh|mesh|mish|mush)\b/i,                    // not
  /\b(7abibi|habibi|7abibti)\b/i,                 // dear
  /\b(5alas|khalas|7alas)\b/i,                    // enough/done
  /\b(tab|6ab|tayeb|6ayeb|tayyeb)\b/i,           // ok
  /\b(ya3ni|ya3ny|yani)\b/i,                      // meaning
  /\b(bas|bss)\b/i,                               // but/just
  /\b(kaman|kamaan)\b/i,                          // also
  /\b(7aga|haga|7agat)\b/i,                       // thing
  /\b(el|el-|il)\b/i,                             // the (Arabic)
  /\b(di|da|dah|dih)\b/i,                         // this
  /\b(betaa|bta3|bita3)\b/i,                      // belonging to
  /\b(shokran|shukran)\b/i,                       // thanks
  /\b(ahlan|ahla)\b/i,                            // welcome
  /\b(ma3lesh|ma3lsh)\b/i,                        // sorry/nevermind
  /\b(inshallah|insha2allah|isa)\b/i,            // God willing
  /\b(w|we|wa)\b/i,                               // and
  /\b(f|fi|fe)\b/i,                               // in
  /\b(3ala|3la|ala)\b/i,                          // on
  /\b(mn|min|men)\b/i,                            // from
  /[2378]/,                                        // Franco numbers in words
];

// Detect if text contains Franco-Arab
export function isFrancoArab(text: string): boolean {
  // Check for Franco number patterns (2,3,5,7,8,9 used as letters)
  if (/[2357]/.test(text) && /[a-zA-Z]/.test(text)) {
    return true;
  }
  
  // Check common Franco patterns
  return FRANCO_PATTERNS.some(pattern => pattern.test(text));
}

// Detect if text is Arabic script
export function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Detect input language
export function detectLanguage(text: string): 'arabic' | 'franco' | 'english' {
  if (isArabic(text)) return 'arabic';
  if (isFrancoArab(text)) return 'franco';
  return 'english';
}

// Check if user explicitly requested a different response language
export function getRequestedLanguage(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // English requests
  if (/\b(reply|respond|answer|speak|talk)\s+(in|with)\s+english\b/i.test(text)) return 'english';
  if (/\brد\s*(ب|في)\s*(الإنجليزي|انجليزي|english)\b/i.test(text)) return 'english';
  if (/\b(in english|بالإنجليزي|بالانجليزي)\s*(please|plz|من فضلك)?\s*$/i.test(text)) return 'english';
  
  // French requests
  if (/\b(reply|respond|answer)\s+in\s+french\b/i.test(text)) return 'french';
  if (/\brد\s*(ب|في)\s*(الفرنسي|فرنسي|french)\b/i.test(text)) return 'french';
  
  // Spanish requests
  if (/\b(reply|respond|answer)\s+in\s+spanish\b/i.test(text)) return 'spanish';
  
  return null; // No specific language requested = use Arabic
}

export default SYSTEM_PROMPT;
