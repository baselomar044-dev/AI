// ============================================
// 🔌 35+ REAL INTEGRATIONS - Full OAuth & API
// ============================================

export interface Integration {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  authType: 'oauth2' | 'api_key' | 'basic' | 'webhook';
  authUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  endpoints: Record<string, IntegrationEndpoint>;
  category: IntegrationCategory;
  popular?: boolean;
  documentation?: string;
}

export interface IntegrationEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  descriptionAr: string;
  params?: Record<string, ParamDef>;
  bodySchema?: Record<string, any>;
}

export interface ParamDef {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  enum?: string[];
  default?: any;
}

export type IntegrationCategory = 
  | 'communication'
  | 'productivity'
  | 'social'
  | 'storage'
  | 'development'
  | 'business'
  | 'entertainment'
  | 'finance'
  | 'ai'
  | 'automation';

// ================== 35+ INTEGRATIONS ==================

export const INTEGRATIONS: Record<string, Integration> = {
  // ===== AI & ML SERVICES (5) =====
  openai: {
    id: 'openai',
    name: 'OpenAI',
    nameAr: 'أوبن إيه آي',
    icon: '🧠',
    color: '#412991',
    authType: 'api_key',
    category: 'ai',
    popular: true,
    documentation: 'https://platform.openai.com/docs',
    endpoints: {
      chat: {
        method: 'POST',
        path: '/v1/chat/completions',
        description: 'Chat completions with GPT models',
        descriptionAr: 'محادثة مع نماذج GPT',
        params: {
          model: { type: 'string', required: true, description: 'Model ID', enum: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
          messages: { type: 'array', required: true, description: 'Messages array' },
        },
      },
      createImage: {
        method: 'POST',
        path: '/v1/images/generations',
        description: 'Generate images with DALL-E',
        descriptionAr: 'إنشاء صور مع DALL-E',
      },
      createEmbedding: {
        method: 'POST',
        path: '/v1/embeddings',
        description: 'Create text embeddings',
        descriptionAr: 'إنشاء تضمينات النص',
      },
      transcribe: {
        method: 'POST',
        path: '/v1/audio/transcriptions',
        description: 'Transcribe audio with Whisper',
        descriptionAr: 'تحويل الصوت لنص',
      },
    },
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    nameAr: 'أنثروبيك كلود',
    icon: '🤖',
    color: '#D4A574',
    authType: 'api_key',
    category: 'ai',
    documentation: 'https://docs.anthropic.com',
    endpoints: {
      messages: {
        method: 'POST',
        path: '/v1/messages',
        description: 'Chat with Claude',
        descriptionAr: 'محادثة مع كلود',
      },
    },
  },

  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face',
    nameAr: 'هاغينغ فيس',
    icon: '🤗',
    color: '#FFD21E',
    authType: 'api_key',
    category: 'ai',
    endpoints: {
      inference: {
        method: 'POST',
        path: '/models/{model}',
        description: 'Run inference on any model',
        descriptionAr: 'تشغيل أي نموذج',
      },
    },
  },

  replicate: {
    id: 'replicate',
    name: 'Replicate',
    nameAr: 'ريبليكيت',
    icon: '🔄',
    color: '#000000',
    authType: 'api_key',
    category: 'ai',
    endpoints: {
      predict: {
        method: 'POST',
        path: '/v1/predictions',
        description: 'Run AI models',
        descriptionAr: 'تشغيل نماذج الذكاء',
      },
    },
  },

  stability: {
    id: 'stability',
    name: 'Stability AI',
    nameAr: 'ستابيليتي',
    icon: '🎨',
    color: '#5D3FD3',
    authType: 'api_key',
    category: 'ai',
    endpoints: {
      generate: {
        method: 'POST',
        path: '/v1/generation/{engine}/text-to-image',
        description: 'Generate images with Stable Diffusion',
        descriptionAr: 'إنشاء صور',
      },
    },
  },

  // ===== COMMUNICATION (6) =====
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    nameAr: 'جيميل',
    icon: '📧',
    color: '#EA4335',
    authType: 'oauth2',
    category: 'communication',
    popular: true,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
    ],
    endpoints: {
      listMessages: {
        method: 'GET',
        path: '/gmail/v1/users/me/messages',
        description: 'List all emails',
        descriptionAr: 'عرض جميع الرسائل',
        params: {
          q: { type: 'string', required: false, description: 'Search query' },
          maxResults: { type: 'number', required: false, description: 'Max results', default: 50 },
          labelIds: { type: 'array', required: false, description: 'Filter by labels' },
        },
      },
      getMessage: {
        method: 'GET',
        path: '/gmail/v1/users/me/messages/{id}',
        description: 'Get email details',
        descriptionAr: 'تفاصيل الرسالة',
      },
      sendEmail: {
        method: 'POST',
        path: '/gmail/v1/users/me/messages/send',
        description: 'Send an email',
        descriptionAr: 'إرسال رسالة',
        params: {
          to: { type: 'string', required: true, description: 'Recipient email' },
          subject: { type: 'string', required: true, description: 'Email subject' },
          body: { type: 'string', required: true, description: 'Email body (HTML supported)' },
          cc: { type: 'string', required: false, description: 'CC recipients' },
          bcc: { type: 'string', required: false, description: 'BCC recipients' },
        },
      },
      createDraft: {
        method: 'POST',
        path: '/gmail/v1/users/me/drafts',
        description: 'Create email draft',
        descriptionAr: 'إنشاء مسودة',
      },
      listLabels: {
        method: 'GET',
        path: '/gmail/v1/users/me/labels',
        description: 'List all labels',
        descriptionAr: 'عرض التصنيفات',
      },
      modifyLabels: {
        method: 'POST',
        path: '/gmail/v1/users/me/messages/{id}/modify',
        description: 'Add/remove labels',
        descriptionAr: 'تعديل التصنيفات',
      },
    },
  },

  slack: {
    id: 'slack',
    name: 'Slack',
    nameAr: 'سلاك',
    icon: '💬',
    color: '#4A154B',
    authType: 'oauth2',
    category: 'communication',
    popular: true,
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['chat:write', 'channels:read', 'channels:history', 'users:read', 'files:write'],
    endpoints: {
      postMessage: {
        method: 'POST',
        path: '/api/chat.postMessage',
        description: 'Send message to channel',
        descriptionAr: 'إرسال رسالة للقناة',
        params: {
          channel: { type: 'string', required: true, description: 'Channel ID or name' },
          text: { type: 'string', required: true, description: 'Message text' },
          blocks: { type: 'array', required: false, description: 'Rich message blocks' },
          thread_ts: { type: 'string', required: false, description: 'Thread timestamp for replies' },
        },
      },
      listChannels: {
        method: 'GET',
        path: '/api/conversations.list',
        description: 'List all channels',
        descriptionAr: 'عرض القنوات',
      },
      getHistory: {
        method: 'GET',
        path: '/api/conversations.history',
        description: 'Get channel history',
        descriptionAr: 'سجل المحادثات',
      },
      uploadFile: {
        method: 'POST',
        path: '/api/files.upload',
        description: 'Upload file',
        descriptionAr: 'رفع ملف',
      },
      listUsers: {
        method: 'GET',
        path: '/api/users.list',
        description: 'List workspace users',
        descriptionAr: 'عرض المستخدمين',
      },
    },
  },

  discord: {
    id: 'discord',
    name: 'Discord',
    nameAr: 'ديسكورد',
    icon: '🎮',
    color: '#5865F2',
    authType: 'oauth2',
    category: 'communication',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    endpoints: {
      sendMessage: {
        method: 'POST',
        path: '/channels/{channel_id}/messages',
        description: 'Send message to channel',
        descriptionAr: 'إرسال رسالة',
      },
      listGuilds: {
        method: 'GET',
        path: '/users/@me/guilds',
        description: 'List servers',
        descriptionAr: 'عرض السيرفرات',
      },
    },
  },

  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    nameAr: 'واتساب للأعمال',
    icon: '📱',
    color: '#25D366',
    authType: 'api_key',
    category: 'communication',
    popular: true,
    endpoints: {
      sendMessage: {
        method: 'POST',
        path: '/v17.0/{phone_number_id}/messages',
        description: 'Send WhatsApp message',
        descriptionAr: 'إرسال رسالة واتساب',
        params: {
          to: { type: 'string', required: true, description: 'Recipient phone number' },
          type: { type: 'string', required: true, description: 'Message type', enum: ['text', 'template', 'image', 'document'] },
          text: { type: 'object', required: false, description: 'Text message body' },
        },
      },
      sendTemplate: {
        method: 'POST',
        path: '/v17.0/{phone_number_id}/messages',
        description: 'Send template message',
        descriptionAr: 'إرسال قالب رسالة',
      },
      getMedia: {
        method: 'GET',
        path: '/v17.0/{media_id}',
        description: 'Get media URL',
        descriptionAr: 'رابط الوسائط',
      },
    },
  },

  telegram: {
    id: 'telegram',
    name: 'Telegram Bot',
    nameAr: 'بوت تيليجرام',
    icon: '✈️',
    color: '#0088CC',
    authType: 'api_key',
    category: 'communication',
    endpoints: {
      sendMessage: {
        method: 'POST',
        path: '/bot{token}/sendMessage',
        description: 'Send Telegram message',
        descriptionAr: 'إرسال رسالة تيليجرام',
        params: {
          chat_id: { type: 'string', required: true, description: 'Chat ID' },
          text: { type: 'string', required: true, description: 'Message text' },
          parse_mode: { type: 'string', required: false, description: 'Parse mode', enum: ['HTML', 'Markdown', 'MarkdownV2'] },
        },
      },
      getUpdates: {
        method: 'GET',
        path: '/bot{token}/getUpdates',
        description: 'Get new messages',
        descriptionAr: 'استلام الرسائل الجديدة',
      },
      sendPhoto: {
        method: 'POST',
        path: '/bot{token}/sendPhoto',
        description: 'Send photo',
        descriptionAr: 'إرسال صورة',
      },
      sendDocument: {
        method: 'POST',
        path: '/bot{token}/sendDocument',
        description: 'Send document',
        descriptionAr: 'إرسال مستند',
      },
    },
  },

  twilio: {
    id: 'twilio',
    name: 'Twilio',
    nameAr: 'تويليو',
    icon: '📞',
    color: '#F22F46',
    authType: 'basic',
    category: 'communication',
    endpoints: {
      sendSMS: {
        method: 'POST',
        path: '/2010-04-01/Accounts/{AccountSid}/Messages.json',
        description: 'Send SMS',
        descriptionAr: 'إرسال رسالة نصية',
      },
      makeCall: {
        method: 'POST',
        path: '/2010-04-01/Accounts/{AccountSid}/Calls.json',
        description: 'Make voice call',
        descriptionAr: 'إجراء مكالمة',
      },
    },
  },

  // ===== PRODUCTIVITY (6) =====
  googleCalendar: {
    id: 'google_calendar',
    name: 'Google Calendar',
    nameAr: 'تقويم جوجل',
    icon: '📅',
    color: '#4285F4',
    authType: 'oauth2',
    category: 'productivity',
    popular: true,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    endpoints: {
      listCalendars: {
        method: 'GET',
        path: '/calendar/v3/users/me/calendarList',
        description: 'List all calendars',
        descriptionAr: 'عرض التقويمات',
      },
      listEvents: {
        method: 'GET',
        path: '/calendar/v3/calendars/{calendarId}/events',
        description: 'List calendar events',
        descriptionAr: 'عرض الأحداث',
        params: {
          timeMin: { type: 'string', required: false, description: 'Start time (ISO)' },
          timeMax: { type: 'string', required: false, description: 'End time (ISO)' },
          maxResults: { type: 'number', required: false, description: 'Max results' },
        },
      },
      createEvent: {
        method: 'POST',
        path: '/calendar/v3/calendars/{calendarId}/events',
        description: 'Create new event',
        descriptionAr: 'إنشاء حدث جديد',
        params: {
          summary: { type: 'string', required: true, description: 'Event title' },
          start: { type: 'object', required: true, description: 'Start datetime' },
          end: { type: 'object', required: true, description: 'End datetime' },
          description: { type: 'string', required: false, description: 'Event description' },
          attendees: { type: 'array', required: false, description: 'Attendee emails' },
        },
      },
      updateEvent: {
        method: 'PUT',
        path: '/calendar/v3/calendars/{calendarId}/events/{eventId}',
        description: 'Update event',
        descriptionAr: 'تحديث الحدث',
      },
      deleteEvent: {
        method: 'DELETE',
        path: '/calendar/v3/calendars/{calendarId}/events/{eventId}',
        description: 'Delete event',
        descriptionAr: 'حذف الحدث',
      },
    },
  },

  notion: {
    id: 'notion',
    name: 'Notion',
    nameAr: 'نوشن',
    icon: '📝',
    color: '#000000',
    authType: 'oauth2',
    category: 'productivity',
    popular: true,
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    endpoints: {
      searchPages: {
        method: 'POST',
        path: '/v1/search',
        description: 'Search pages & databases',
        descriptionAr: 'البحث في الصفحات',
      },
      getPage: {
        method: 'GET',
        path: '/v1/pages/{page_id}',
        description: 'Get page details',
        descriptionAr: 'تفاصيل الصفحة',
      },
      createPage: {
        method: 'POST',
        path: '/v1/pages',
        description: 'Create new page',
        descriptionAr: 'إنشاء صفحة جديدة',
      },
      updatePage: {
        method: 'PATCH',
        path: '/v1/pages/{page_id}',
        description: 'Update page',
        descriptionAr: 'تحديث الصفحة',
      },
      queryDatabase: {
        method: 'POST',
        path: '/v1/databases/{database_id}/query',
        description: 'Query database',
        descriptionAr: 'استعلام قاعدة البيانات',
      },
      appendBlocks: {
        method: 'PATCH',
        path: '/v1/blocks/{block_id}/children',
        description: 'Append content blocks',
        descriptionAr: 'إضافة محتوى',
      },
    },
  },

  trello: {
    id: 'trello',
    name: 'Trello',
    nameAr: 'تريلو',
    icon: '📋',
    color: '#0079BF',
    authType: 'oauth2',
    category: 'productivity',
    endpoints: {
      listBoards: {
        method: 'GET',
        path: '/1/members/me/boards',
        description: 'List all boards',
        descriptionAr: 'عرض اللوحات',
      },
      getBoard: {
        method: 'GET',
        path: '/1/boards/{id}',
        description: 'Get board details',
        descriptionAr: 'تفاصيل اللوحة',
      },
      listCards: {
        method: 'GET',
        path: '/1/boards/{id}/cards',
        description: 'List board cards',
        descriptionAr: 'بطاقات اللوحة',
      },
      createCard: {
        method: 'POST',
        path: '/1/cards',
        description: 'Create new card',
        descriptionAr: 'إنشاء بطاقة جديدة',
        params: {
          name: { type: 'string', required: true, description: 'Card name' },
          idList: { type: 'string', required: true, description: 'List ID' },
          desc: { type: 'string', required: false, description: 'Description' },
          due: { type: 'string', required: false, description: 'Due date' },
        },
      },
      moveCard: {
        method: 'PUT',
        path: '/1/cards/{id}',
        description: 'Move/update card',
        descriptionAr: 'نقل البطاقة',
      },
    },
  },

  todoist: {
    id: 'todoist',
    name: 'Todoist',
    nameAr: 'تودويست',
    icon: '✅',
    color: '#E44332',
    authType: 'oauth2',
    category: 'productivity',
    endpoints: {
      listProjects: {
        method: 'GET',
        path: '/rest/v2/projects',
        description: 'List all projects',
        descriptionAr: 'عرض المشاريع',
      },
      listTasks: {
        method: 'GET',
        path: '/rest/v2/tasks',
        description: 'List all tasks',
        descriptionAr: 'عرض المهام',
      },
      createTask: {
        method: 'POST',
        path: '/rest/v2/tasks',
        description: 'Create new task',
        descriptionAr: 'إنشاء مهمة جديدة',
        params: {
          content: { type: 'string', required: true, description: 'Task content' },
          due_string: { type: 'string', required: false, description: 'Due date (natural language)' },
          priority: { type: 'number', required: false, description: 'Priority 1-4' },
          project_id: { type: 'string', required: false, description: 'Project ID' },
        },
      },
      completeTask: {
        method: 'POST',
        path: '/rest/v2/tasks/{id}/close',
        description: 'Complete task',
        descriptionAr: 'إكمال المهمة',
      },
    },
  },

  asana: {
    id: 'asana',
    name: 'Asana',
    nameAr: 'أسانا',
    icon: '🎯',
    color: '#F06A6A',
    authType: 'oauth2',
    category: 'productivity',
    endpoints: {
      listWorkspaces: {
        method: 'GET',
        path: '/api/1.0/workspaces',
        description: 'List workspaces',
        descriptionAr: 'مساحات العمل',
      },
      listProjects: {
        method: 'GET',
        path: '/api/1.0/workspaces/{workspace_gid}/projects',
        description: 'List projects',
        descriptionAr: 'المشاريع',
      },
      createTask: {
        method: 'POST',
        path: '/api/1.0/tasks',
        description: 'Create task',
        descriptionAr: 'إنشاء مهمة',
      },
    },
  },

  linear: {
    id: 'linear',
    name: 'Linear',
    nameAr: 'لينير',
    icon: '📐',
    color: '#5E6AD2',
    authType: 'oauth2',
    category: 'productivity',
    endpoints: {
      graphql: {
        method: 'POST',
        path: '/graphql',
        description: 'GraphQL API',
        descriptionAr: 'واجهة GraphQL',
      },
    },
  },

  // ===== STORAGE (4) =====
  googleDrive: {
    id: 'google_drive',
    name: 'Google Drive',
    nameAr: 'جوجل درايف',
    icon: '📁',
    color: '#1FA463',
    authType: 'oauth2',
    category: 'storage',
    popular: true,
    scopes: ['https://www.googleapis.com/auth/drive'],
    endpoints: {
      listFiles: {
        method: 'GET',
        path: '/drive/v3/files',
        description: 'List files',
        descriptionAr: 'عرض الملفات',
        params: {
          q: { type: 'string', required: false, description: 'Search query' },
          pageSize: { type: 'number', required: false, description: 'Results per page' },
        },
      },
      getFile: {
        method: 'GET',
        path: '/drive/v3/files/{fileId}',
        description: 'Get file metadata',
        descriptionAr: 'معلومات الملف',
      },
      uploadFile: {
        method: 'POST',
        path: '/upload/drive/v3/files',
        description: 'Upload file',
        descriptionAr: 'رفع ملف',
      },
      downloadFile: {
        method: 'GET',
        path: '/drive/v3/files/{fileId}?alt=media',
        description: 'Download file',
        descriptionAr: 'تحميل الملف',
      },
      createFolder: {
        method: 'POST',
        path: '/drive/v3/files',
        description: 'Create folder',
        descriptionAr: 'إنشاء مجلد',
      },
    },
  },

  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    nameAr: 'دروب بوكس',
    icon: '💧',
    color: '#0061FF',
    authType: 'oauth2',
    category: 'storage',
    endpoints: {
      listFolder: {
        method: 'POST',
        path: '/2/files/list_folder',
        description: 'List folder contents',
        descriptionAr: 'محتويات المجلد',
      },
      upload: {
        method: 'POST',
        path: '/2/files/upload',
        description: 'Upload file',
        descriptionAr: 'رفع ملف',
      },
      download: {
        method: 'POST',
        path: '/2/files/download',
        description: 'Download file',
        descriptionAr: 'تحميل ملف',
      },
      search: {
        method: 'POST',
        path: '/2/files/search_v2',
        description: 'Search files',
        descriptionAr: 'بحث الملفات',
      },
    },
  },

  oneDrive: {
    id: 'onedrive',
    name: 'OneDrive',
    nameAr: 'ون درايف',
    icon: '☁️',
    color: '#0078D4',
    authType: 'oauth2',
    category: 'storage',
    scopes: ['files.readwrite'],
    endpoints: {
      listItems: {
        method: 'GET',
        path: '/me/drive/root/children',
        description: 'List files',
        descriptionAr: 'عرض الملفات',
      },
      uploadSmall: {
        method: 'PUT',
        path: '/me/drive/root:/{filename}:/content',
        description: 'Upload small file',
        descriptionAr: 'رفع ملف صغير',
      },
      search: {
        method: 'GET',
        path: '/me/drive/root/search(q=\'{query}\')',
        description: 'Search files',
        descriptionAr: 'بحث الملفات',
      },
    },
  },

  aws_s3: {
    id: 'aws_s3',
    name: 'AWS S3',
    nameAr: 'أمازون S3',
    icon: '🪣',
    color: '#FF9900',
    authType: 'api_key',
    category: 'storage',
    endpoints: {
      listBuckets: {
        method: 'GET',
        path: '/',
        description: 'List buckets',
        descriptionAr: 'عرض الحاويات',
      },
      listObjects: {
        method: 'GET',
        path: '/{bucket}',
        description: 'List bucket objects',
        descriptionAr: 'محتويات الحاوية',
      },
      getObject: {
        method: 'GET',
        path: '/{bucket}/{key}',
        description: 'Get object',
        descriptionAr: 'الحصول على كائن',
      },
      putObject: {
        method: 'PUT',
        path: '/{bucket}/{key}',
        description: 'Upload object',
        descriptionAr: 'رفع كائن',
      },
    },
  },

  // ===== SOCIAL MEDIA (5) =====
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    nameAr: 'إكس (تويتر)',
    icon: '𝕏',
    color: '#000000',
    authType: 'oauth2',
    category: 'social',
    popular: true,
    endpoints: {
      postTweet: {
        method: 'POST',
        path: '/2/tweets',
        description: 'Post a tweet',
        descriptionAr: 'نشر تغريدة',
        params: {
          text: { type: 'string', required: true, description: 'Tweet text (max 280 chars)' },
          media_ids: { type: 'array', required: false, description: 'Media IDs to attach' },
        },
      },
      searchTweets: {
        method: 'GET',
        path: '/2/tweets/search/recent',
        description: 'Search recent tweets',
        descriptionAr: 'البحث في التغريدات',
      },
      getUserTimeline: {
        method: 'GET',
        path: '/2/users/{id}/tweets',
        description: 'Get user tweets',
        descriptionAr: 'تغريدات المستخدم',
      },
      getUser: {
        method: 'GET',
        path: '/2/users/by/username/{username}',
        description: 'Get user info',
        descriptionAr: 'معلومات المستخدم',
      },
    },
  },

  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    nameAr: 'لينكدإن',
    icon: '💼',
    color: '#0A66C2',
    authType: 'oauth2',
    category: 'social',
    endpoints: {
      getProfile: {
        method: 'GET',
        path: '/v2/me',
        description: 'Get profile',
        descriptionAr: 'معلومات الملف الشخصي',
      },
      sharePost: {
        method: 'POST',
        path: '/v2/ugcPosts',
        description: 'Share a post',
        descriptionAr: 'مشاركة منشور',
      },
      getConnections: {
        method: 'GET',
        path: '/v2/connections',
        description: 'Get connections',
        descriptionAr: 'الاتصالات',
      },
    },
  },

  instagram: {
    id: 'instagram',
    name: 'Instagram',
    nameAr: 'إنستغرام',
    icon: '📷',
    color: '#E4405F',
    authType: 'oauth2',
    category: 'social',
    endpoints: {
      getMedia: {
        method: 'GET',
        path: '/me/media',
        description: 'Get user media',
        descriptionAr: 'وسائط المستخدم',
      },
      publishMedia: {
        method: 'POST',
        path: '/{ig-user-id}/media',
        description: 'Publish media',
        descriptionAr: 'نشر وسائط',
      },
    },
  },

  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    nameAr: 'تيك توك',
    icon: '🎵',
    color: '#000000',
    authType: 'oauth2',
    category: 'social',
    endpoints: {
      getUserInfo: {
        method: 'GET',
        path: '/v2/user/info/',
        description: 'Get user info',
        descriptionAr: 'معلومات المستخدم',
      },
      listVideos: {
        method: 'POST',
        path: '/v2/video/list/',
        description: 'List videos',
        descriptionAr: 'قائمة الفيديوهات',
      },
    },
  },

  youtube: {
    id: 'youtube',
    name: 'YouTube',
    nameAr: 'يوتيوب',
    icon: '🎬',
    color: '#FF0000',
    authType: 'oauth2',
    category: 'entertainment',
    popular: true,
    scopes: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.upload'],
    endpoints: {
      searchVideos: {
        method: 'GET',
        path: '/youtube/v3/search',
        description: 'Search videos',
        descriptionAr: 'البحث في الفيديوهات',
      },
      getVideoDetails: {
        method: 'GET',
        path: '/youtube/v3/videos',
        description: 'Get video details',
        descriptionAr: 'تفاصيل الفيديو',
      },
      listPlaylists: {
        method: 'GET',
        path: '/youtube/v3/playlists',
        description: 'List playlists',
        descriptionAr: 'قوائم التشغيل',
      },
      getChannelStats: {
        method: 'GET',
        path: '/youtube/v3/channels',
        description: 'Get channel stats',
        descriptionAr: 'إحصائيات القناة',
      },
    },
  },

  // ===== DEVELOPMENT (4) =====
  github: {
    id: 'github',
    name: 'GitHub',
    nameAr: 'جيت هب',
    icon: '🐙',
    color: '#181717',
    authType: 'oauth2',
    category: 'development',
    popular: true,
    scopes: ['repo', 'user', 'gist'],
    endpoints: {
      listRepos: {
        method: 'GET',
        path: '/user/repos',
        description: 'List repositories',
        descriptionAr: 'عرض المستودعات',
      },
      getRepo: {
        method: 'GET',
        path: '/repos/{owner}/{repo}',
        description: 'Get repository details',
        descriptionAr: 'تفاصيل المستودع',
      },
      createIssue: {
        method: 'POST',
        path: '/repos/{owner}/{repo}/issues',
        description: 'Create issue',
        descriptionAr: 'إنشاء مشكلة',
      },
      listPRs: {
        method: 'GET',
        path: '/repos/{owner}/{repo}/pulls',
        description: 'List pull requests',
        descriptionAr: 'طلبات الدمج',
      },
      getCommits: {
        method: 'GET',
        path: '/repos/{owner}/{repo}/commits',
        description: 'Get commits',
        descriptionAr: 'سجل التعديلات',
      },
      createGist: {
        method: 'POST',
        path: '/gists',
        description: 'Create gist',
        descriptionAr: 'إنشاء gist',
      },
    },
  },

  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    nameAr: 'جيت لاب',
    icon: '🦊',
    color: '#FC6D26',
    authType: 'oauth2',
    category: 'development',
    endpoints: {
      listProjects: {
        method: 'GET',
        path: '/api/v4/projects',
        description: 'List projects',
        descriptionAr: 'عرض المشاريع',
      },
      createIssue: {
        method: 'POST',
        path: '/api/v4/projects/{id}/issues',
        description: 'Create issue',
        descriptionAr: 'إنشاء مشكلة',
      },
      listMRs: {
        method: 'GET',
        path: '/api/v4/projects/{id}/merge_requests',
        description: 'List merge requests',
        descriptionAr: 'طلبات الدمج',
      },
    },
  },

  jira: {
    id: 'jira',
    name: 'Jira',
    nameAr: 'جيرا',
    icon: '🎯',
    color: '#0052CC',
    authType: 'oauth2',
    category: 'development',
    endpoints: {
      searchIssues: {
        method: 'GET',
        path: '/rest/api/3/search',
        description: 'Search issues (JQL)',
        descriptionAr: 'البحث في المشكلات',
      },
      getIssue: {
        method: 'GET',
        path: '/rest/api/3/issue/{issueIdOrKey}',
        description: 'Get issue details',
        descriptionAr: 'تفاصيل المشكلة',
      },
      createIssue: {
        method: 'POST',
        path: '/rest/api/3/issue',
        description: 'Create issue',
        descriptionAr: 'إنشاء مشكلة',
      },
      updateIssue: {
        method: 'PUT',
        path: '/rest/api/3/issue/{issueIdOrKey}',
        description: 'Update issue',
        descriptionAr: 'تحديث المشكلة',
      },
      transitionIssue: {
        method: 'POST',
        path: '/rest/api/3/issue/{issueIdOrKey}/transitions',
        description: 'Transition issue status',
        descriptionAr: 'تغيير حالة المشكلة',
      },
    },
  },

  vercel: {
    id: 'vercel',
    name: 'Vercel',
    nameAr: 'فيرسل',
    icon: '▲',
    color: '#000000',
    authType: 'api_key',
    category: 'development',
    endpoints: {
      listProjects: {
        method: 'GET',
        path: '/v9/projects',
        description: 'List projects',
        descriptionAr: 'المشاريع',
      },
      listDeployments: {
        method: 'GET',
        path: '/v6/deployments',
        description: 'List deployments',
        descriptionAr: 'عمليات النشر',
      },
      createDeployment: {
        method: 'POST',
        path: '/v13/deployments',
        description: 'Create deployment',
        descriptionAr: 'نشر جديد',
      },
    },
  },

  // ===== BUSINESS & FINANCE (4) =====
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    nameAr: 'سترايب',
    icon: '💳',
    color: '#635BFF',
    authType: 'api_key',
    category: 'finance',
    popular: true,
    endpoints: {
      listPayments: {
        method: 'GET',
        path: '/v1/payment_intents',
        description: 'List payments',
        descriptionAr: 'عرض المدفوعات',
      },
      createPaymentIntent: {
        method: 'POST',
        path: '/v1/payment_intents',
        description: 'Create payment intent',
        descriptionAr: 'إنشاء نية دفع',
      },
      createPaymentLink: {
        method: 'POST',
        path: '/v1/payment_links',
        description: 'Create payment link',
        descriptionAr: 'إنشاء رابط دفع',
      },
      listCustomers: {
        method: 'GET',
        path: '/v1/customers',
        description: 'List customers',
        descriptionAr: 'عرض العملاء',
      },
      createCustomer: {
        method: 'POST',
        path: '/v1/customers',
        description: 'Create customer',
        descriptionAr: 'إنشاء عميل',
      },
      listSubscriptions: {
        method: 'GET',
        path: '/v1/subscriptions',
        description: 'List subscriptions',
        descriptionAr: 'الاشتراكات',
      },
    },
  },

  shopify: {
    id: 'shopify',
    name: 'Shopify',
    nameAr: 'شوبيفاي',
    icon: '🛒',
    color: '#96BF48',
    authType: 'oauth2',
    category: 'business',
    popular: true,
    endpoints: {
      listProducts: {
        method: 'GET',
        path: '/admin/api/2024-01/products.json',
        description: 'List products',
        descriptionAr: 'عرض المنتجات',
      },
      createProduct: {
        method: 'POST',
        path: '/admin/api/2024-01/products.json',
        description: 'Create product',
        descriptionAr: 'إنشاء منتج',
      },
      listOrders: {
        method: 'GET',
        path: '/admin/api/2024-01/orders.json',
        description: 'List orders',
        descriptionAr: 'عرض الطلبات',
      },
      getOrder: {
        method: 'GET',
        path: '/admin/api/2024-01/orders/{order_id}.json',
        description: 'Get order details',
        descriptionAr: 'تفاصيل الطلب',
      },
      updateInventory: {
        method: 'POST',
        path: '/admin/api/2024-01/inventory_levels/set.json',
        description: 'Update inventory',
        descriptionAr: 'تحديث المخزون',
      },
      listCustomers: {
        method: 'GET',
        path: '/admin/api/2024-01/customers.json',
        description: 'List customers',
        descriptionAr: 'العملاء',
      },
    },
  },

  paypal: {
    id: 'paypal',
    name: 'PayPal',
    nameAr: 'باي بال',
    icon: '💰',
    color: '#003087',
    authType: 'oauth2',
    category: 'finance',
    endpoints: {
      createOrder: {
        method: 'POST',
        path: '/v2/checkout/orders',
        description: 'Create order',
        descriptionAr: 'إنشاء طلب',
      },
      captureOrder: {
        method: 'POST',
        path: '/v2/checkout/orders/{id}/capture',
        description: 'Capture payment',
        descriptionAr: 'تأكيد الدفع',
      },
      listTransactions: {
        method: 'GET',
        path: '/v1/reporting/transactions',
        description: 'List transactions',
        descriptionAr: 'المعاملات',
      },
    },
  },

  quickbooks: {
    id: 'quickbooks',
    name: 'QuickBooks',
    nameAr: 'كويك بوكس',
    icon: '📊',
    color: '#2CA01C',
    authType: 'oauth2',
    category: 'finance',
    endpoints: {
      listInvoices: {
        method: 'GET',
        path: '/v3/company/{realmId}/query?query=select * from Invoice',
        description: 'List invoices',
        descriptionAr: 'الفواتير',
      },
      createInvoice: {
        method: 'POST',
        path: '/v3/company/{realmId}/invoice',
        description: 'Create invoice',
        descriptionAr: 'إنشاء فاتورة',
      },
    },
  },

  // ===== AUTOMATION (3) =====
  zapier: {
    id: 'zapier',
    name: 'Zapier',
    nameAr: 'زابير',
    icon: '⚡',
    color: '#FF4A00',
    authType: 'webhook',
    category: 'automation',
    endpoints: {
      triggerWebhook: {
        method: 'POST',
        path: '/hooks/catch/{hookId}',
        description: 'Trigger Zap webhook',
        descriptionAr: 'تشغيل Webhook',
      },
    },
  },

  make: {
    id: 'make',
    name: 'Make (Integromat)',
    nameAr: 'ميك',
    icon: '🔧',
    color: '#6D00CC',
    authType: 'webhook',
    category: 'automation',
    endpoints: {
      triggerWebhook: {
        method: 'POST',
        path: '/webhook/{webhookId}',
        description: 'Trigger webhook',
        descriptionAr: 'تشغيل Webhook',
      },
    },
  },

  n8n: {
    id: 'n8n',
    name: 'n8n',
    nameAr: 'إن8إن',
    icon: '🔄',
    color: '#EA4B71',
    authType: 'webhook',
    category: 'automation',
    endpoints: {
      triggerWebhook: {
        method: 'POST',
        path: '/webhook/{webhookId}',
        description: 'Trigger n8n workflow',
        descriptionAr: 'تشغيل سير العمل',
      },
    },
  },

  // ===== NEW FREE INTEGRATIONS (10) =====
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    nameAr: 'سبوتيفاي',
    icon: '🎵',
    color: '#1DB954',
    authType: 'oauth2',
    category: 'entertainment',
    popular: true,
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    scopes: ['user-read-private', 'user-read-email', 'playlist-read-private', 'user-library-read'],
    endpoints: {
      search: {
        method: 'GET',
        path: '/v1/search',
        description: 'Search for tracks, artists, albums',
        descriptionAr: 'بحث عن أغاني أو فنانين',
        params: {
          q: { type: 'string', required: true, description: 'Search query' },
          type: { type: 'string', required: true, description: 'Item type (track, artist, album)' },
        },
      },
      getUserProfile: {
        method: 'GET',
        path: '/v1/me',
        description: 'Get current user profile',
        descriptionAr: 'ملف المستخدم الحالي',
      },
      getPlaylists: {
        method: 'GET',
        path: '/v1/me/playlists',
        description: 'Get user playlists',
        descriptionAr: 'قوائم تشغيل المستخدم',
      },
    },
  },

  openweather: {
    id: 'openweather',
    name: 'OpenWeatherMap',
    nameAr: 'أوبن ويذر',
    icon: '🌤️',
    color: '#EB6E4B',
    authType: 'api_key',
    category: 'automation',
    popular: true,
    endpoints: {
      getCurrentWeather: {
        method: 'GET',
        path: '/data/2.5/weather',
        description: 'Get current weather',
        descriptionAr: 'الطقس الحالي',
        params: {
          q: { type: 'string', required: true, description: 'City name' },
          units: { type: 'string', required: false, description: 'Units (metric/imperial)', default: 'metric' },
        },
      },
      getForecast: {
        method: 'GET',
        path: '/data/2.5/forecast',
        description: 'Get 5 day forecast',
        descriptionAr: 'توقعات الطقس لـ 5 أيام',
        params: {
          q: { type: 'string', required: true, description: 'City name' },
          units: { type: 'string', required: false, description: 'Units', default: 'metric' },
        },
      },
    },
  },

  reddit: {
    id: 'reddit',
    name: 'Reddit',
    nameAr: 'ريديت',
    icon: '🔴',
    color: '#FF4500',
    authType: 'oauth2',
    category: 'social',
    popular: true,
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    scopes: ['identity', 'read', 'submit'],
    endpoints: {
      getMe: {
        method: 'GET',
        path: '/api/v1/me',
        description: 'Get user identity',
        descriptionAr: 'هوية المستخدم',
      },
      getSubreddit: {
        method: 'GET',
        path: '/r/{subreddit}/hot',
        description: 'Get hot posts from subreddit',
        descriptionAr: 'أشهر المنشورات في Subreddit',
      },
      submitPost: {
        method: 'POST',
        path: '/api/submit',
        description: 'Submit a new post',
        descriptionAr: 'نشر منشور جديد',
        params: {
          sr: { type: 'string', required: true, description: 'Subreddit name' },
          title: { type: 'string', required: true, description: 'Post title' },
          kind: { type: 'string', required: true, description: 'Kind (link, self, image)', enum: ['link', 'self'] },
          url: { type: 'string', required: false, description: 'URL (if link)' },
          text: { type: 'string', required: false, description: 'Body text (if self)' },
        },
      },
    },
  },

  unsplash: {
    id: 'unsplash',
    name: 'Unsplash',
    nameAr: 'أنسلاش',
    icon: '📸',
    color: '#000000',
    authType: 'api_key',
    category: 'productivity',
    endpoints: {
      searchPhotos: {
        method: 'GET',
        path: '/search/photos',
        description: 'Search photos',
        descriptionAr: 'بحث عن صور',
        params: {
          query: { type: 'string', required: true, description: 'Search terms' },
          per_page: { type: 'number', required: false, description: 'Photos per page', default: 10 },
        },
      },
      getRandomPhoto: {
        method: 'GET',
        path: '/photos/random',
        description: 'Get a random photo',
        descriptionAr: 'صورة عشوائية',
        params: {
          query: { type: 'string', required: false, description: 'Filter by query' },
        },
      },
    },
  },

  giphy: {
    id: 'giphy',
    name: 'GIPHY',
    nameAr: 'جيفي',
    icon: '🎞️',
    color: '#FF6666',
    authType: 'api_key',
    category: 'entertainment',
    endpoints: {
      searchGifs: {
        method: 'GET',
        path: '/v1/gifs/search',
        description: 'Search GIFs',
        descriptionAr: 'بحث عن صور متحركة',
        params: {
          q: { type: 'string', required: true, description: 'Search query' },
          limit: { type: 'number', required: false, description: 'Limit results', default: 25 },
        },
      },
      trendingGifs: {
        method: 'GET',
        path: '/v1/gifs/trending',
        description: 'Get trending GIFs',
        descriptionAr: 'الصور المتحركة الرائجة',
      },
    },
  },

  wikipedia: {
    id: 'wikipedia',
    name: 'Wikipedia',
    nameAr: 'ويكيبيديا',
    icon: '📚',
    color: '#000000', // Wikipedia logo is black/white usually
    authType: 'basic', // Actually mostly open, but for consistency
    category: 'productivity',
    endpoints: {
      search: {
        method: 'GET',
        path: '/w/api.php?action=query&format=json&list=search',
        description: 'Search Wikipedia',
        descriptionAr: 'بحث في ويكيبيديا',
        params: {
          srsearch: { type: 'string', required: true, description: 'Search query' },
        },
      },
      getPage: {
        method: 'GET',
        path: '/page/summary/{title}', // REST API v1
        description: 'Get page summary',
        descriptionAr: 'ملخص الصفحة',
      },
    },
  },

  stackoverflow: {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    nameAr: 'ستاك أوفر فلو',
    icon: '🥞',
    color: '#F48024',
    authType: 'oauth2', // Can be used without, but OAuth allows more
    category: 'development',
    authUrl: 'https://stackoverflow.com/oauth',
    tokenUrl: 'https://stackoverflow.com/oauth/access_token',
    endpoints: {
      searchQuestions: {
        method: 'GET',
        path: '/2.3/search',
        description: 'Search questions',
        descriptionAr: 'بحث عن أسئلة',
        params: {
          intitle: { type: 'string', required: true, description: 'Search query' },
          site: { type: 'string', required: false, description: 'Site', default: 'stackoverflow' },
        },
      },
      getUser: {
        method: 'GET',
        path: '/2.3/me',
        description: 'Get current user',
        descriptionAr: 'المستخدم الحالي',
        params: {
          site: { type: 'string', required: false, description: 'Site', default: 'stackoverflow' },
        },
      },
    },
  },

  twitch: {
    id: 'twitch',
    name: 'Twitch',
    nameAr: 'تويتش',
    icon: '👾',
    color: '#9146FF',
    authType: 'oauth2',
    category: 'entertainment',
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
    tokenUrl: 'https://id.twitch.tv/oauth2/token',
    scopes: ['user:read:email', 'channel:read:subscriptions'],
    endpoints: {
      getUsers: {
        method: 'GET',
        path: '/helix/users',
        description: 'Get users',
        descriptionAr: 'معلومات المستخدمين',
        params: {
          login: { type: 'string', required: false, description: 'Username' },
        },
      },
      getStreams: {
        method: 'GET',
        path: '/helix/streams',
        description: 'Get live streams',
        descriptionAr: 'البث المباشر',
        params: {
          game_id: { type: 'string', required: false, description: 'Game ID' },
          first: { type: 'number', required: false, description: 'Limit', default: 20 },
        },
      },
    },
  },

  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    nameAr: 'بينتيريست',
    icon: '📌',
    color: '#BD081C',
    authType: 'oauth2',
    category: 'social',
    authUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    scopes: ['boards:read', 'pins:read', 'user_accounts:read'],
    endpoints: {
      getUserAccount: {
        method: 'GET',
        path: '/v5/user_account',
        description: 'Get user account',
        descriptionAr: 'حساب المستخدم',
      },
      listBoards: {
        method: 'GET',
        path: '/v5/boards',
        description: 'List boards',
        descriptionAr: 'عرض اللوحات',
      },
      listPins: {
        method: 'GET',
        path: '/v5/boards/{board_id}/pins',
        description: 'List pins in board',
        descriptionAr: 'عرض الدبابيس في اللوحة',
      },
    },
  },

  devto: {
    id: 'devto',
    name: 'Dev.to',
    nameAr: 'ديف.تو',
    icon: '👩‍💻',
    color: '#0A0A0A',
    authType: 'api_key',
    category: 'development',
    endpoints: {
      getArticles: {
        method: 'GET',
        path: '/api/articles',
        description: 'List articles',
        descriptionAr: 'عرض المقالات',
        params: {
          tag: { type: 'string', required: false, description: 'Filter by tag' },
          username: { type: 'string', required: false, description: 'Filter by username' },
        },
      },
      getArticle: {
        method: 'GET',
        path: '/api/articles/{id}',
        description: 'Get article details',
        descriptionAr: 'تفاصيل المقال',
      },
      createArticle: {
        method: 'POST',
        path: '/api/articles',
        description: 'Create article',
        descriptionAr: 'إنشاء مقال',
      },
    },
  },

  // ===== NEW DEPLOYMENT INTEGRATIONS (3) =====
  vercel: {
    id: 'vercel',
    name: 'Vercel',
    nameAr: 'فيرسل',
    icon: '▲',
    color: '#000000',
    authType: 'oauth2',
    category: 'development',
    popular: true,
    authUrl: 'https://vercel.com/oauth/authorize',
    tokenUrl: 'https://api.vercel.com/v2/oauth/access_token',
    endpoints: {
      getDeployments: {
        method: 'GET',
        path: '/v6/deployments',
        description: 'List deployments',
        descriptionAr: 'عرض عمليات النشر',
        params: {
          limit: { type: 'number', required: false, description: 'Limit', default: 10 },
        },
      },
      createDeployment: {
        method: 'POST',
        path: '/v13/deployments',
        description: 'Create a new deployment',
        descriptionAr: 'إنشاء نشر جديد',
      },
    },
  },

  netlify: {
    id: 'netlify',
    name: 'Netlify',
    nameAr: 'نتليفاي',
    icon: '💠',
    color: '#00C7B7',
    authType: 'oauth2',
    category: 'development',
    authUrl: 'https://app.netlify.com/authorize',
    tokenUrl: 'https://api.netlify.com/oauth/token',
    endpoints: {
      getSites: {
        method: 'GET',
        path: '/api/v1/sites',
        description: 'List sites',
        descriptionAr: 'عرض المواقع',
      },
      getDeploys: {
        method: 'GET',
        path: '/api/v1/sites/{site_id}/deploys',
        description: 'List site deploys',
        descriptionAr: 'عمليات نشر الموقع',
      },
    },
  },

  heroku: {
    id: 'heroku',
    name: 'Heroku',
    nameAr: 'هيروكو',
    icon: '💜',
    color: '#430098',
    authType: 'oauth2',
    category: 'development',
    authUrl: 'https://id.heroku.com/oauth/authorize',
    tokenUrl: 'https://id.heroku.com/oauth/token',
    endpoints: {
      getApps: {
        method: 'GET',
        path: '/apps',
        description: 'List apps',
        descriptionAr: 'عرض التطبيقات',
      },
      getDynos: {
        method: 'GET',
        path: '/apps/{app_id_or_name}/dynos',
        description: 'List dynos',
        descriptionAr: 'عرض Dynos',
      },
    },
  },

  // ===== MESSAGING INTEGRATION =====
  whatsapp_business: {
    id: 'whatsapp_business',
    name: 'WhatsApp Business',
    nameAr: 'واتساب للأعمال',
    icon: '💬',
    color: '#25D366',
    authType: 'api_key', // Uses Meta Access Token
    category: 'communication',
    popular: true,
    endpoints: {
      sendMessage: {
        method: 'POST',
        path: '/{phone_number_id}/messages',
        description: 'Send a message',
        descriptionAr: 'إرسال رسالة',
        params: {
          to: { type: 'string', required: true, description: 'Recipient phone number' },
          type: { type: 'string', required: false, default: 'text', description: 'Message type' },
          text: { type: 'string', required: true, description: 'Message body' },
        },
      },
      getTemplates: {
        method: 'GET',
        path: '/{business_id}/message_templates',
        description: 'Get message templates',
        descriptionAr: 'قوالب الرسائل',
      },
    },
  },
};

// ================== HELPERS ==================

export function getIntegrationsList(): Integration[] {
  return Object.values(INTEGRATIONS);
}

export function getPopularIntegrations(): Integration[] {
  return Object.values(INTEGRATIONS).filter(i => i.popular);
}

export function getIntegrationsByCategory(): Record<IntegrationCategory, Integration[]> {
  const byCategory: Record<IntegrationCategory, Integration[]> = {
    communication: [],
    productivity: [],
    social: [],
    storage: [],
    development: [],
    business: [],
    entertainment: [],
    finance: [],
    ai: [],
    automation: [],
  };
  
  for (const integration of Object.values(INTEGRATIONS)) {
    byCategory[integration.category].push(integration);
  }
  
  return byCategory;
}

export function searchIntegrations(query: string): Integration[] {
  const q = query.toLowerCase();
  return Object.values(INTEGRATIONS).filter(i => 
    i.name.toLowerCase().includes(q) ||
    i.nameAr.includes(q) ||
    i.category.includes(q)
  );
}

// ================== INTEGRATION MANAGER ==================

export class IntegrationManager {
  private connections: Map<string, IntegrationConnection> = new Map();
  
  async connect(integrationId: string, credentials: any): Promise<IntegrationConnection> {
    const integration = INTEGRATIONS[integrationId];
    if (!integration) throw new Error(`Unknown integration: ${integrationId}`);
    
    const connection = new IntegrationConnection(integration, credentials);
    await connection.test();
    
    this.connections.set(integrationId, connection);
    return connection;
  }
  
  get(integrationId: string): IntegrationConnection | undefined {
    return this.connections.get(integrationId);
  }
  
  async execute(
    integrationId: string,
    endpointId: string,
    params: Record<string, any>
  ): Promise<any> {
    const connection = this.connections.get(integrationId);
    if (!connection) throw new Error(`Not connected to ${integrationId}`);
    
    return connection.call(endpointId, params);
  }
  
  listConnected(): string[] {
    return Array.from(this.connections.keys());
  }
  
  disconnect(integrationId: string): void {
    this.connections.delete(integrationId);
  }
}

export class IntegrationConnection {
  constructor(
    private integration: Integration,
    private credentials: any
  ) {}
  
  async test(): Promise<boolean> {
    try {
      const testEndpoint = Object.keys(this.integration.endpoints)[0];
      await this.call(testEndpoint, {});
      return true;
    } catch {
      return false;
    }
  }
  
  async call(endpointId: string, params: Record<string, any>): Promise<any> {
    const endpoint = this.integration.endpoints[endpointId];
    if (!endpoint) throw new Error(`Unknown endpoint: ${endpointId}`);
    
    let url = endpoint.path;
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
    
    const response = await fetch('/api/integrations/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        integrationId: this.integration.id,
        method: endpoint.method,
        path: url,
        params,
        credentials: this.credentials,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Integration error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  getIntegration(): Integration {
    return this.integration;
  }
}
