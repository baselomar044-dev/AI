export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
  fullContent?: string; // For internal context
  isVoice?: boolean;
  attachments?: any[];
  isStreaming?: boolean;
  generatedFiles?: any[];
  provider?: string;
  model?: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  thinkingSteps?: string[];
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface MemoryItem {
  key: string;
  value: string;
  category: 'personal' | 'preference' | 'fact' | 'relationship';
  timestamp: number;
}

export interface RelationshipPerson {
  id: string;
  name: string;
  nickname?: string;
  birthday?: string;
  favoriteFood?: string;
  favoriteGifts?: string[];
  notes?: string;
  lastContact?: string;
  reminders?: { date: string; text: string }[];
}

export interface ChatProvider {
  name: string;
  model: string;
  endpoint: string;
  supportsVision: boolean;
  getHeaders: () => Record<string, string>;
  formatBody: (messages: ChatMessage[], systemPrompt?: string) => any;
  parseResponse: (data: any) => string;
}

export interface Reminder {
  id: string;
  text: string;
  date: string;
  time?: string;
  completed: boolean;
}
