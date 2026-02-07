// ============================================
// 🧠 AUTO MEMORY - Automatically extract & save memories
// With fallback storage support for private browsing
// ============================================

export interface Memory {
  id: string;
  category: 'preference' | 'fact' | 'skill' | 'goal' | 'context';
  content: string;
  confidence: number;
  createdAt: Date;
  source: 'auto' | 'manual';
}

// ===== FALLBACK STORAGE =====
const memoryStore: Record<string, string> = {};

const safeStorage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return memoryStore[key] || null;
      }
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        memoryStore[key] = value;
      }
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      try {
        sessionStorage.removeItem(key);
      } catch {
        delete memoryStore[key];
      }
    }
  }
};

// Keywords that indicate preferences
const PREFERENCE_PATTERNS = [
  /i (like|love|prefer|enjoy|want|hate|dislike|don't like)/i,
  /my favorite/i,
  /i always/i,
  /i never/i,
  /(أحب|أفضل|أكره|أريد|بفضّل)/,
];

// Keywords that indicate facts about the user
const FACT_PATTERNS = [
  /i (am|'m) (a |an )?([\w]+)/i,
  /my (name|job|work|age|location|city|country)/i,
  /i (work|live|study) (at|in|as)/i,
  /(اسمي|عمري|أعمل|أسكن|أدرس)/,
  /my name is (\w+)/i,
  /call me (\w+)/i,
  /اسمي ([\u0600-\u06FF]+)/,
];

// Keywords that indicate skills
const SKILL_PATTERNS = [
  /i (can|know how to|am good at|specialize in)/i,
  /i have experience (in|with)/i,
  /(أعرف|أجيد|خبرة في)/,
];

// Keywords that indicate goals
const GOAL_PATTERNS = [
  /i want to (learn|build|create|become|achieve)/i,
  /my goal is/i,
  /i'm trying to/i,
  /(أريد أن|هدفي|أحاول أن)/,
];

export function analyzeForMemories(message: string): Memory[] {
  const memories: Memory[] = [];
  
  // Check for preferences
  for (const pattern of PREFERENCE_PATTERNS) {
    if (pattern.test(message)) {
      memories.push({
        id: crypto.randomUUID(),
        category: 'preference',
        content: extractRelevantPart(message, pattern),
        confidence: 0.8,
        createdAt: new Date(),
        source: 'auto',
      });
      break;
    }
  }
  
  // Check for facts
  for (const pattern of FACT_PATTERNS) {
    if (pattern.test(message)) {
      memories.push({
        id: crypto.randomUUID(),
        category: 'fact',
        content: extractRelevantPart(message, pattern),
        confidence: 0.9,
        createdAt: new Date(),
        source: 'auto',
      });
      break;
    }
  }
  
  // Check for skills
  for (const pattern of SKILL_PATTERNS) {
    if (pattern.test(message)) {
      memories.push({
        id: crypto.randomUUID(),
        category: 'skill',
        content: extractRelevantPart(message, pattern),
        confidence: 0.85,
        createdAt: new Date(),
        source: 'auto',
      });
      break;
    }
  }
  
  // Check for goals
  for (const pattern of GOAL_PATTERNS) {
    if (pattern.test(message)) {
      memories.push({
        id: crypto.randomUUID(),
        category: 'goal',
        content: extractRelevantPart(message, pattern),
        confidence: 0.85,
        createdAt: new Date(),
        source: 'auto',
      });
      break;
    }
  }
  
  return memories;
}

function extractRelevantPart(message: string, _pattern: RegExp): string {
  // For now, return the whole message if it's short, or first sentence
  const sentences = message.split(/[.!?]/);
  if (sentences[0].length < 200) {
    return sentences[0].trim();
  }
  return message.substring(0, 200) + '...';
}

// Memory storage key
const MEMORY_KEY = 'ai_assistant_memories';

export function getMemories(): Memory[] {
  try {
    const stored = safeStorage.get(MEMORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveMemory(memory: Memory): void {
  const memories = getMemories();
  
  // Check for duplicates
  const isDuplicate = memories.some(m => 
    m.content.toLowerCase() === memory.content.toLowerCase()
  );
  
  if (!isDuplicate) {
    memories.push(memory);
    // Keep max 100 memories
    const trimmed = memories.slice(-100);
    safeStorage.set(MEMORY_KEY, JSON.stringify(trimmed));
  }
}

export function deleteMemory(id: string): void {
  const memories = getMemories().filter(m => m.id !== id);
  safeStorage.set(MEMORY_KEY, JSON.stringify(memories));
}

export function clearAllMemories(): void {
  safeStorage.remove(MEMORY_KEY);
}

// Process a message and auto-save memories
export function processMessageForMemories(message: string): Memory[] {
  const detected = analyzeForMemories(message);
  detected.forEach(saveMemory);
  return detected;
}

// Get memory context for AI
export function getMemoryContext(): string {
  const memories = getMemories();
  if (memories.length === 0) return '';
  
  const grouped: Record<string, string[]> = {};
  memories.forEach(m => {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m.content);
  });
  
  let context = '\n[User Memory Context]\n';
  
  if (grouped.preference?.length) {
    context += `Preferences: ${grouped.preference.join('; ')}\n`;
  }
  if (grouped.fact?.length) {
    context += `Facts: ${grouped.fact.join('; ')}\n`;
  }
  if (grouped.skill?.length) {
    context += `Skills: ${grouped.skill.join('; ')}\n`;
  }
  if (grouped.goal?.length) {
    context += `Goals: ${grouped.goal.join('; ')}\n`;
  }
  
  return context;
}

// Manual memory addition
export function addManualMemory(content: string, category: Memory['category'] = 'fact'): Memory {
  const memory: Memory = {
    id: crypto.randomUUID(),
    category,
    content,
    confidence: 1.0,
    createdAt: new Date(),
    source: 'manual',
  };
  saveMemory(memory);
  return memory;
}
