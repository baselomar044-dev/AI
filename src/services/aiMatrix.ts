export { 
  KEYS, 
  updateApiKey, 
  checkApiKeys, 
  UNIVERSAL_SYSTEM_PROMPT, 
  ARABIC_SYSTEM_PROMPT, 
  ENGLISH_SYSTEM_PROMPT 
} from './ai/env';

// ===== RE-EXPORTS FOR BACKWARD COMPATIBILITY =====
export { smartChat, streamChat, chat, analyzeImage } from './ai/chat';

export { 
  textToSpeech, 
  speechToText, 
  generateImage, 
  generateVideo,
  webSearch,
  sendEmail,
  generatePDF,
  generateExcel,
  generateWord,
  generateZip,
  generateMarkdown,
  scrapeWebsite,
  executeCode,
  addReminder,
  getReminders,
  completeReminder,
  deleteReminder
} from './ai/tools';
export type { ChatMessage } from './ai/types';

