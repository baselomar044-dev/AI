// ============================================
// 💬 CHAT PAGE v2.0 - Refactored & Modularized
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

import {
  streamChat,
  webSearch,
  textToSpeech,
  speechToText,
  generateImage,
  generatePDF,
  generateExcel,
  generateWord,
  analyzeImage,
  addReminder,
  webScrape,
  executeCode,
  sendEmail,
  ChatMessage,
} from '../services/ai';

// Components
import { ThinkingProcess, ThinkingStep } from '../components/chat/ThinkingProcess';
import { AttachmentPreview, Attachment } from '../components/chat/AttachmentPreview';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import { AnimatedLogo } from '../components/AnimatedLogo';

// ===== TYPES =====
interface GeneratedFile {
  blob: Blob;
  filename: string;
  type: string;
}

// ===== THINKING STEPS CONSTANTS =====
const THINKING_STEPS_CONFIG = {
  analyzing: { text: 'Thinking...', textAr: 'بفكر...' },
  searching: { text: 'Searching...', textAr: 'ببحث...' },
  generating_image: { text: 'Creating image...', textAr: 'بعمل الصورة...' },
  generating_pdf: { text: 'Creating PDF...', textAr: 'بعمل PDF...' },
  generating_excel: { text: 'Creating Excel...', textAr: 'بعمل Excel...' },
  generating_word: { text: 'Creating Word...', textAr: 'بعمل Word...' },
  executing_code: { text: 'Working...', textAr: 'بشتغل...' },
  scraping: { text: 'Reading...', textAr: 'بقرأ...' },
  transcribing: { text: 'Listening...', textAr: 'بسمع...' },
  thinking: { text: 'Thinking...', textAr: 'بفكر...' },
  responding: { text: 'Replying...', textAr: 'بكتب...' },
  analyzing_image: { text: 'Looking...', textAr: 'بشوف...' },
  sending_email: { text: 'Sending...', textAr: 'ببعت...' },
  remembering: { text: 'Remembering...', textAr: 'بفتكر...' },
};

// ===== COMPONENT =====
const ChatPage: React.FC = () => {
  const { 
    theme,
    language, 
    conversations, 
    activeConversationId, 
    addMessage, 
    setActiveConversation, 
    createConversation,
    getMessages,
    clearMessages,
    setPreviewContent 
  } = useStore();
  
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  const isGemini = theme === 'gemini';
  
  // State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  
  // Agents State
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('default');

  // Load Agents
  useEffect(() => {
    const savedAgents = localStorage.getItem('ai-agents-v2');
    if (savedAgents) {
      setAgents(JSON.parse(savedAgents));
    }
  }, []);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get messages
  const storeMessages = activeConversationId ? getMessages(activeConversationId) : [];
  const messages = [...storeMessages, ...localMessages.filter(lm => 
    !storeMessages.some((sm: any) => sm.id === lm.id)
  )];
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingSteps]);
  
  // Create conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation(isArabic ? 'محادثة جديدة' : 'New Chat');
    } else if (!activeConversationId) {
      setActiveConversation(conversations[0].id);
    }
  }, [conversations.length, activeConversationId]);

  // ===== CLEAR CHAT =====
  const handleClearChat = () => {
    if (!activeConversationId) return;
    if (confirm(isArabic ? 'هل أنت متأكد من مسح محتوى المحادثة؟' : 'Are you sure you want to clear this chat?')) {
      clearMessages(activeConversationId);
      setLocalMessages([]); 
    }
  };

  // ===== THINKING STEP HELPERS =====
  const addThinkingStep = useCallback((key: keyof typeof THINKING_STEPS_CONFIG): string => {
    const step = THINKING_STEPS_CONFIG[key];
    const id = crypto.randomUUID();
    setThinkingSteps(prev => [...prev, {
      id,
      text: step.text,
      textAr: step.textAr,
      status: 'active',
      startTime: Date.now(),
    }]);
    return id;
  }, []);

  const updateThinkingStep = useCallback((id: string, status: 'done' | 'error') => {
    setThinkingSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, endTime: Date.now() } : step
    ));
  }, []);

  const clearThinkingSteps = useCallback(() => {
    setTimeout(() => setThinkingSteps([]), 2000);
  }, []);

  // ===== PROCESS AI COMMANDS =====
  const processAICommands = async (response: string): Promise<{ text: string; files: GeneratedFile[] }> => {
    let text = response;
    const files: GeneratedFile[] = [];
    
    // Helper for command processing
    const processCommand = async (
      regex: RegExp, 
      stepKey: keyof typeof THINKING_STEPS_CONFIG, 
      action: (match: RegExpMatchArray) => Promise<any>,
      onSuccess: (match: RegExpMatchArray, result: any) => string
    ) => {
      const match = text.match(regex);
      if (match) {
        const stepId = addThinkingStep(stepKey);
        try {
          const result = await action(match);
          text = onSuccess(match, result);
          updateThinkingStep(stepId, 'done');
        } catch (e) {
          console.error(`Command ${stepKey} failed:`, e);
          updateThinkingStep(stepId, 'error');
        }
      }
    };

    // Generate PDF
    await processCommand(
      /\[GENERATE_FILE:pdf\]([^[]*)|\[PDF:([^\]]+)\]/i,
      'generating_pdf',
      async (m) => {
        const content = m[1]?.trim() || m[2]?.trim() || text;
        const blob = await generatePDF({ 
          title: isArabic ? 'مستند' : 'Document', 
          sections: [{ body: content }] 
        });
        files.push({ blob, filename: 'document.pdf', type: 'pdf' });
        return blob;
      },
      (m) => text.replace(m[0], '')
    );
    
    // Generate Excel
    await processCommand(
      /\[GENERATE_FILE:excel\]([^[]*)|\[EXCEL:([^\]]+)\]/i,
      'generating_excel',
      async (m) => {
        const blob = await generateExcel({ 
          sheetName: isArabic ? 'ورقة 1' : 'Sheet1',
          headers: [isArabic ? 'عمود 1' : 'Column 1', isArabic ? 'عمود 2' : 'Column 2'],
          rows: [[isArabic ? 'بيانات' : 'Data', '1']]
        });
        files.push({ blob, filename: 'spreadsheet.xlsx', type: 'excel' });
        return blob;
      },
      (m) => text.replace(m[0], '')
    );
    
    // Generate Word
    await processCommand(
      /\[GENERATE_FILE:word\]([^[]*)|\[WORD:([^\]]+)\]/i,
      'generating_word',
      async (m) => {
        const content = m[1]?.trim() || m[2]?.trim() || text;
        const blob = await generateWord({ title: isArabic ? 'مستند' : 'Document', sections: [{ body: content }] });
        files.push({ blob, filename: 'document.docx', type: 'word' });
        return blob;
      },
      (m) => text.replace(m[0], '')
    );
    
    // Search
    await processCommand(
      /\[SEARCH:([^\]]+)\]/i,
      'searching',
      async (m) => webSearch(m[1]),
      (m, results) => {
        const resultsText = results.map((r: any) => `• ${r.title}: ${r.snippet}`).join('\n');
        return text.replace(m[0], `\n\n📊 ${isArabic ? 'نتائج البحث:' : 'Search results:'}\n${resultsText}`);
      }
    );
    
    // Image
    await processCommand(
      /\[IMAGE:([^\]]+)\]/i,
      'generating_image',
      async (m) => generateImage(m[1]),
      (m, url) => text.replace(m[0], `\n\n🎨 ${isArabic ? 'الصورة:' : 'Image:'}\n![Generated](${url})`)
    );

    // Scrape
    await processCommand(
      /\[SCRAPE:([^\]]+)\]/i,
      'scraping',
      async (m) => webScrape(m[1]),
      (m, content) => text.replace(m[0], `\n\n📄 ${isArabic ? 'محتوى الصفحة:' : 'Page content:'}\n${content.substring(0, 500)}...`)
    );

    // Execute Code
    await processCommand(
      /\[EXECUTE_CODE:([\s\S]+?)\]/i,
      'executing_code',
      async (m) => executeCode(m[1]),
      (m, result) => text.replace(m[0], `\n\n💻 ${isArabic ? 'تنفيذ الكود:' : 'Code execution:'}\n${result.output || result.error}`)
    );

    // Send Email
    await processCommand(
      /\[SEND_EMAIL:([^\|]+)\|([^\|]+)\|([^\]]+)\]/i,
      'sending_email',
      async (m) => sendEmail(m[1], m[2], m[3]),
      (m) => text.replace(m[0], `\n\n📧 ${isArabic ? 'تم إرسال الإيميل!' : 'Email sent!'}`)
    );

    // Reminder
    const reminderMatch = text.match(/\[REMINDER:([^\|]+)\|([^\]]+)\]/i);
    if (reminderMatch) {
      try {
        addReminder(reminderMatch[1].trim(), reminderMatch[2].trim());
        text = text.replace(reminderMatch[0], `\n\n✅ ${isArabic ? 'تم إضافة التذكير!' : 'Reminder added!'}`);
      } catch (e) {
        console.error('Reminder failed:', e);
      }
    }

    // Generate Audio (TTS)
    await processCommand(
      /\[AUDIO:([^\]]+)\]/i,
      'transcribing',
      async (m) => {
        const audioBlob = await textToSpeech(m[1].trim());
        files.push({ blob: audioBlob, filename: 'audio_generated.mp3', type: 'audio' });
        return audioBlob;
      },
      (m) => text.replace(m[0], `\n\n🔊 ${isArabic ? 'تم توليد الصوت!' : 'Audio generated!'}`)
    );
    
    // Generate Zip
    await processCommand(
      /\[GENERATE_FILE:zip\]([^[]*)|\[ZIP:([^\]]+)\]/i,
      'generating_word', // Reusing existing step type for now
      async (m) => {
        const content = m[1]?.trim() || m[2]?.trim() || text;
        // This is a placeholder. Real zip generation needs structure parsing.
        // For now, we'll create a simple zip with a readme.
        const zip = new JSZip();
        zip.file("README.md", content);
        const blob = await zip.generateAsync({ type: "blob" });
        files.push({ blob, filename: 'project.zip', type: 'zip' });
        return blob;
      },
      (m) => text.replace(m[0], '')
    );

    return { text: text.trim(), files };
  };

  // ===== FILE TO BASE64 =====
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async (voiceBlob?: Blob) => {
    // 1. Prepare Content
    let userText = input.trim();
    let displayContent = input.trim(); 
    let aiPrompt = input.trim(); 
    
    // Handle voice
    if (voiceBlob) {
      const stepId = addThinkingStep('transcribing');
      try {
        const transcribed = await speechToText(voiceBlob);
        userText = transcribed;
        displayContent = transcribed;
        aiPrompt = transcribed;
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
        return;
      }
    }
    
    if (!userText && attachments.length === 0) return;
    
    // Get image attachments for vision
    const imageAttachments = attachments.filter(a => a.type === 'image');
    let imageBase64: string | undefined;
    
    if (imageAttachments.length > 0 && imageAttachments[0].base64) {
      imageBase64 = imageAttachments[0].base64;
    }
    
    // Add attachment info to message
    if (attachments.length > 0) {
      const nonImageAttachments = attachments.filter(a => a.type !== 'image');
      if (nonImageAttachments.length > 0) {
        const attachmentNames = nonImageAttachments.map(a => a.file.name).join(', ');
        displayContent += `\n\n[${isArabic ? 'مرفقات' : 'Attachments'}: ${attachmentNames}]`;
        aiPrompt += `\n\n[Attachments: ${attachmentNames}]`;
        
        // Try to read text files content or ZIP content
        for (const att of nonImageAttachments) {
          // Handle ZIP files
          if (att.file.name.endsWith('.zip') || att.file.type.includes('zip') || att.file.type.includes('compressed')) {
             try {
               const zip = new JSZip();
               const loadedZip = await zip.loadAsync(att.file);
               let zipContent = `\n\n--- ZIP FILE CONTENT: ${att.file.name} ---\n`;
               let fileList: string[] = [];
               
               // 1. List all files
               loadedZip.forEach((relativePath, zipEntry) => {
                 fileList.push(relativePath);
               });
               
               zipContent += `File Structure:\n${fileList.slice(0, 50).join('\n')}${fileList.length > 50 ? '\n... (and more)' : ''}\n\n`;
               
               // 2. Read important files (limit to top 10 files to save context)
               let readCount = 0;
               for (const filename of fileList) {
                 if (readCount >= 10) break;
                 
                 const isText = filename.match(/\.(json|md|txt|js|ts|tsx|jsx|html|css|py|java|c|cpp|h|xml|yaml|yml|env|gitignore|sql|sh|bat)$/i);
                 const isIgnored = filename.includes('node_modules') || filename.includes('.git') || filename.includes('dist') || filename.includes('build') || filename.startsWith('__') || filename.includes('package-lock');
                 
                 if (isText && !isIgnored && !filename.endsWith('/')) {
                   const fileData = await loadedZip.file(filename)?.async('string');
                   if (fileData && fileData.length < 30000) { 
                     zipContent += `--- File: ${filename} ---\n${fileData}\n\n`;
                     readCount++;
                   }
                 }
               }
               
               zipContent += `--- End of ZIP ${att.file.name} ---\n`;
               aiPrompt += zipContent;
               displayContent += `\n\n📦 **${att.file.name}**\n- Project loaded.`;
               
             } catch (e) {
               console.error('Failed to read zip', e);
               displayContent += `\n\n❌ Failed to read ZIP: ${att.file.name}`;
             }
          }
          // Handle PDF Files
          else if (att.file.type === 'application/pdf' || att.file.name.endsWith('.pdf')) {
            try {
              const arrayBuffer = await att.file.arrayBuffer();
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let pdfText = '';
              
              const maxPages = Math.min(pdf.numPages, 20); // Limit to 20 pages to prevent overload
              for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                pdfText += `--- Page ${i} ---\n${pageText}\n\n`;
              }
              
              if (pdf.numPages > 20) {
                pdfText += `\n... (Truncated. Total pages: ${pdf.numPages})`;
              }

              aiPrompt += `\n\n--- PDF CONTENT: ${att.file.name} ---\n${pdfText}\n--- END OF PDF ---\n`;
              displayContent += `\n\n📄 **${att.file.name}**\n- Document loaded.`;
            } catch (e) {
              console.error('Failed to read PDF', e);
              displayContent += `\n\n❌ Failed to read PDF: ${att.file.name}`;
            }
          }
          // Handle Excel Files
          else if (att.file.name.match(/\.(xlsx|xls|csv)$/i) || att.file.type.includes('sheet') || att.file.type.includes('excel')) {
            try {
              const arrayBuffer = await att.file.arrayBuffer();
              const workbook = XLSX.read(arrayBuffer);
              let excelContent = '';
              
              // Read first 3 sheets max
              const sheetNames = workbook.SheetNames.slice(0, 3);
              for (const sheetName of sheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 50); // Limit to 50 rows
                excelContent += `--- Sheet: ${sheetName} ---\n${JSON.stringify(jsonData, null, 2)}\n\n`;
              }
              
              if (workbook.SheetNames.length > 3) excelContent += `... (More sheets available)`;

              aiPrompt += `\n\n--- EXCEL CONTENT: ${att.file.name} ---\n${excelContent}\n--- END OF EXCEL ---\n`;
              displayContent += `\n\n📊 **${att.file.name}**\n- Spreadsheet loaded.`;
            } catch (e) {
              console.error('Failed to read Excel', e);
              displayContent += `\n\n❌ Failed to read Excel: ${att.file.name}`;
            }
          }
          // Handle Audio Files (Transcription)
          else if (att.file.type.startsWith('audio/')) {
            try {
               displayContent += `\n\n🎧 **${att.file.name}**\n- Listening...`;
               // We need to convert the file to a Blob that speechToText accepts
               // speechToText expects a Blob, which File inherits from, so it should work directly
               const text = await speechToText(att.file);
               aiPrompt += `\n\n--- AUDIO TRANSCRIPTION: ${att.file.name} ---\n${text}\n--- END OF AUDIO ---\n`;
               displayContent += `\n- Voice note received.`;
            } catch (e) {
               console.error('Failed to transcribe audio file', e);
               displayContent += `\n\n❌ Failed to transcribe audio: ${att.file.name}`;
            }
          }
          // Handle Text files
          else if (att.file.size < 1000000 && ( 
              att.file.type.startsWith('text/') || 
              att.file.name.match(/\.(txt|md|csv|json|js|ts|tsx|py|html|css|xml|yaml|yml)$/i)
             )) {
               try {
                 const text = await new Promise<string>((resolve) => {
                   const reader = new FileReader();
                   reader.onload = (e) => resolve(e.target?.result as string);
                   reader.readAsText(att.file);
                 });
                 aiPrompt += `\n\n--- Start of ${att.file.name} ---\n${text}\n--- End of ${att.file.name} ---\n`;
                 displayContent += `\n\n📄 **${att.file.name}**\n\`\`\`\n${text.slice(0, 300)}${text.length > 300 ? '\n... (truncated)' : ''}\n\`\`\``;
               } catch (e) {
                 console.error('Failed to read file', e);
               }
          }
        }
      }
    }
    
    // 2. Create User Message Object
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: displayContent, 
      timestamp: new Date(),
      isVoice: !!voiceBlob,
      attachments: attachments.map(a => ({ name: a.file.name, type: a.type, preview: a.preview })),
    };
    
    // 3. Update Local State (Immediate Feedback)
    setLocalMessages(prev => [...prev, { ...userMsg, fullContent: aiPrompt }]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    // 4. Update Global Store (if active conversation)
    if (activeConversationId) {
      try {
        addMessage(activeConversationId, { 
          id: userMsg.id, 
          role: 'user', 
          content: displayContent, 
          fullContent: aiPrompt, 
          conversationId: activeConversationId 
        });
      } catch (e) {
        console.warn('Store addMessage failed, relying on local state');
      }
    }
    
    // 5. AI Processing
    const thinkingId = addThinkingStep('thinking');
    
    try {
      // If there's an image, analyze it first
      let imageContext = '';
      if (imageBase64) {
        const analyzeId = addThinkingStep('analyzing_image');
        try {
          imageContext = await analyzeImage(imageBase64, aiPrompt || (isArabic ? 'وصفلي الصورة دي' : 'Describe this image'));
          updateThinkingStep(analyzeId, 'done');
        } catch (e) {
          updateThinkingStep(analyzeId, 'error');
        }
      }
      
      const chatHistory: ChatMessage[] = messages.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.fullContent || m.content, 
      }));
      
      let prompt = aiPrompt;
      
      // Removed the auto-preview logic that was forcing code output
      
      if (imageContext) {
        prompt = `[تحليل الصورة المرفقة: ${imageContext}]\n\n${aiPrompt || (isArabic ? 'إيه رأيك؟' : 'What do you think?')}`;
      }
      
      updateThinkingStep(thinkingId, 'done');
      const respondingId = addThinkingStep('responding');
      
      // Create streaming assistant message
      const streamingMsgId = crypto.randomUUID();
      const streamingMsg = {
        id: streamingMsgId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setLocalMessages(prev => [...prev, streamingMsg]);
      
      // Call AI with streamChat
      const aiResponse = await new Promise<{content: string, provider: string, model: string}>((resolve, reject) => {
        let fullText = '';
        streamChat(
          prompt,
          activeConversationId || 'temp-id',
          {
            onToken: (token) => {
              fullText += token;
              setLocalMessages(prev => prev.map(msg => 
                msg.id === streamingMsgId 
                  ? { ...msg, content: fullText }
                  : msg
              ));
            },
            onComplete: (text) => {
              resolve({
                content: text || fullText,
                provider: 'server-router',
                model: 'auto'
              });
            },
            onError: (err) => {
              console.error("Stream error:", err);
              reject(err);
            }
          },
          {
            systemPrompt: selectedAgent?.systemPrompt,
            history: chatHistory
          }
        );
      });
      
      updateThinkingStep(respondingId, 'done');
      
      // Process AI commands
      const { text: processedText, files } = await processAICommands(aiResponse.content);
      
      // Finalize the streaming message
      setLocalMessages(prev => prev.map(msg => 
        msg.id === streamingMsgId 
          ? { 
              ...msg, 
              content: processedText, 
              isStreaming: false,
              generatedFiles: files,
              provider: aiResponse.provider,
              model: aiResponse.model,
            }
          : msg
      ));
      
      if (activeConversationId) {
        try {
          addMessage(activeConversationId, { 
            id: streamingMsgId, 
            role: 'assistant', 
            content: processedText, 
            conversationId: activeConversationId 
          });
        } catch (e) {
          console.log('Store addMessage failed, using local state');
        }
      }
      
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: isArabic 
          ? `❌ في مشكلة: ${error.message}. جرب تاني.`
          : `❌ Error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      clearThinkingSteps();
    }
  };

  // ===== ATTACHMENTS =====
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files)) {
      const attachment: Attachment = {
        id: crypto.randomUUID(),
        file,
        type: file.type.startsWith('image/') ? 'image' 
            : file.type.startsWith('audio/') ? 'audio'
            : file.type.includes('document') || file.type.includes('pdf') ? 'document'
            : 'other',
      };
      
      if (attachment.type === 'image') {
        const base64 = await fileToBase64(file);
        attachment.preview = base64;
        attachment.base64 = base64;
      }
      
      setAttachments(prev => [...prev, attachment]);
    }
    
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // ===== VOICE RECORDING =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      alert(isArabic ? '❌ مش قادر أوصل للميكروفون. تأكد من الإذن.' : '❌ Cannot access microphone. Check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSend(audioBlob);
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // ===== TEXT TO SPEECH =====
  const speakMessage = async (text: string) => {
    try {
      const audioBlob = await textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('TTS failed:', error);
      alert(isArabic ? 'فشل تشغيل الصوت' : 'Failed to play audio');
    }
  };

  // ===== PREVIEW CODE =====
  const handlePreview = (content: string) => {
    const match = content.match(/```(html|react|jsx|tsx)([\s\S]*?)```/i);
    if (match && match[2]) {
      setPreviewContent(match[2].trim());
      navigate('/live-preview');
    } else {
      if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
        setPreviewContent(content);
        navigate('/live-preview');
      }
    }
  };

  // ===== RENDER =====
  const renderStars = () => {
    if (!isGemini) return null;
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[2px] h-[2px] bg-white rounded-full opacity-20 animate-twinkle" style={{ top: '10%', left: '20%' }}></div>
        <div className="absolute w-[3px] h-[3px] bg-blue-400 rounded-full opacity-30 animate-twinkle" style={{ top: '30%', left: '70%', animationDelay: '1s' }}></div>
        <div className="absolute w-[1px] h-[1px] bg-white rounded-full opacity-50 animate-twinkle" style={{ top: '60%', left: '40%', animationDelay: '2s' }}></div>
        <div className="absolute w-[2px] h-[2px] bg-purple-400 rounded-full opacity-20 animate-twinkle" style={{ top: '80%', left: '10%', animationDelay: '3s' }}></div>
        <div className="absolute w-[1px] h-[1px] bg-white rounded-full opacity-40 animate-twinkle" style={{ top: '15%', left: '85%', animationDelay: '1.5s' }}></div>
        
        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.5); }
          }
          .animate-twinkle {
            animation: twinkle 4s infinite ease-in-out;
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px) rotate(-12deg); }
            50% { transform: translateY(-10px) rotate(-12deg); }
            100% { transform: translateY(0px) rotate(-12deg); }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className={`flex h-full relative ${isGemini ? 'bg-[#050505] text-gray-200' : 'bg-white dark:bg-gray-900'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {renderStars()}
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Only for Non-Gemini */}
        {!isGemini && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
            <div>
              <h2 className="text-xl font-bold truncate flex items-center gap-2">
                ✨ {isArabic ? 'AI Assistant' : 'AI Assistant'}
              </h2>
              <p className="text-xs text-gray-500">
                Professional AI Assistant
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearChat}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title={isArabic ? 'مسح المحادثة' : 'Clear Chat'}
              >
                <Trash2 size={18} />
              </button>
              
              <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                <span className="text-sm">{isArabic ? '🔍 بحث' : '🔍 Search'}</span>
                <input
                  type="checkbox"
                  checked={webSearchEnabled}
                  onChange={(e) => setWebSearchEnabled(e.target.checked)}
                  className="w-5 h-5 accent-blue-500"
                />
              </label>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Gemini Welcome Screen */}
          {messages.length === 0 && isGemini && (
            <div className="flex flex-col items-center justify-center h-full z-10 relative -mt-20">
               {/* App Logo Animation */}
                <div className="mb-8 relative group">
                  <AnimatedLogo size="2xl" />
                  
                  {/* "Hi!" Handwriting - No Arrow */}
                  <div className="absolute -top-12 -right-20 w-32 h-20 pointer-events-none">
                    <span className="absolute -top-6 left-10 font-handwriting text-6xl text-gray-400 -rotate-12 animate-float whitespace-nowrap">
                      Hi!
                    </span>
                  </div>
                </div>
                
                {/* Centered Input Box */}
               <div className="w-full max-w-2xl bg-[#0f1115] border border-[#1f1f1f] rounded-[2rem] p-4 shadow-2xl relative z-20">
                 <ChatInput
                   input={input}
                   setInput={setInput}
                   handleSend={handleSend}
                   isLoading={isLoading}
                   isArabic={isArabic}
                   isRecording={isRecording}
                   recordingTime={recordingTime}
                   startRecording={startRecording}
                   stopRecording={stopRecording}
                   cancelRecording={cancelRecording}
                   fileInputRef={fileInputRef}
                   handleFileSelect={handleFileSelect}
                   agents={agents}
                   selectedAgentId={selectedAgentId}
                   setSelectedAgentId={setSelectedAgentId}
                   attachments={attachments}
                 />
               </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((msg: any) => (
            <ChatMessageItem 
              key={msg.id} 
              msg={msg} 
              isArabic={isArabic} 
              onSpeak={speakMessage} 
              onPreview={handlePreview} 
            />
          ))}

          {/* Thinking Steps Tasklet */}
          <ThinkingProcess steps={thinkingSteps} isArabic={isArabic} />

          {/* Loading */}
          {isLoading && thinkingSteps.length === 0 && (
            <div className={`flex ${isArabic ? 'justify-end' : 'justify-start'}`}>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Attachments Preview */}
        <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />

        {/* Input Area */}
        <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${isGemini ? 'bg-[#050505] border-[#1f1f1f]' : 'bg-white dark:bg-gray-900'} ${isGemini && messages.length === 0 ? 'hidden' : ''}`}>
          <ChatInput
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            isLoading={isLoading}
            isArabic={isArabic}
            isRecording={isRecording}
            recordingTime={recordingTime}
            startRecording={startRecording}
            stopRecording={stopRecording}
            cancelRecording={cancelRecording}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            agents={agents}
            selectedAgentId={selectedAgentId}
            setSelectedAgentId={setSelectedAgentId}
            attachments={attachments}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
