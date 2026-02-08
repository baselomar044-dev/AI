import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { KEYS } from './env';
import { WebSearchResult, Reminder } from './types';

// ===== WEB SEARCH =====
export async function webSearch(query: string): Promise<WebSearchResult[]> {
  if (!KEYS.tavily) {
    console.warn('Tavily API key not set');
    return [];
  }
  
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: KEYS.tavily,
      query,
      search_depth: 'basic',
      max_results: 5,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results?.map((r: any) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  })) || [];
}

// ===== WEB SCRAPE =====
export async function webScrape(url: string): Promise<string> {
  if (!KEYS.firecrawl) {
    throw new Error('Firecrawl API key not set');
  }
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KEYS.firecrawl}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  });
  
  if (!response.ok) {
    throw new Error(`Scrape failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data?.markdown || data.data?.content || '';
}

export const scrapeWebsite = webScrape;

// ===== TEXT TO SPEECH =====
export async function textToSpeech(text: string, voiceId = 'EXAVITQu4vr4xnSDxMaL'): Promise<Blob> {
  if (!KEYS.elevenlabs) {
    throw new Error('ElevenLabs API key not set');
  }
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': KEYS.elevenlabs,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TTS Authentication Failed: Check ElevenLabs API Key');
    }
    throw new Error(`TTS failed: ${response.status}`);
  }
  
  return response.blob();
}

// ===== SPEECH TO TEXT =====
export async function speechToText(audioBlob: Blob, language?: 'ar' | 'en'): Promise<string> {
  if (!KEYS.groq) {
    throw new Error('Groq API key not set');
  }
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  
  if (language) {
    formData.append('language', language);
  }
  
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEYS.groq}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`STT failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.text || '';
}

// ===== IMAGE GENERATION =====
export async function generateImage(prompt: string): Promise<string> {
  if (!KEYS.replicate) {
    throw new Error('Replicate API key not set');
  }
  
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${KEYS.replicate}`,
    },
    body: JSON.stringify({
      version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status}`);
  }
  
  const result = await response.json();
  
  // Poll for completion
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 2000));
    
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${KEYS.replicate}` },
    });
    
    const pollResult = await pollResponse.json();
    
    if (pollResult.status === 'succeeded') {
      return pollResult.output[0];
    } else if (pollResult.status === 'failed') {
      throw new Error('Image generation failed');
    }
    
    attempts++;
  }
  
  throw new Error('Image generation timed out');
}

// ===== VIDEO GENERATION =====
export async function generateVideo(prompt: string): Promise<string> {
  if (!KEYS.replicate) {
    throw new Error('Replicate API key not set');
  }

  const videoResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${KEYS.replicate}`,
    },
    body: JSON.stringify({
      version: '9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
      input: {
        prompt,
        num_frames: 24,
        fps: 8,
        width: 576,
        height: 320,
      },
    }),
  });

  if (!videoResponse.ok) {
    throw new Error(`Video generation failed: ${videoResponse.status}`);
  }

  const result = await videoResponse.json();

  // Poll for completion
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 3000));
    
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${KEYS.replicate}` },
    });
    
    const pollResult = await pollResponse.json();
    
    if (pollResult.status === 'succeeded') {
      return pollResult.output[0];
    } else if (pollResult.status === 'failed') {
      throw new Error('Video generation failed');
    }
    
    attempts++;
  }
  
  throw new Error('Video generation timed out');
}

// ===== PDF GENERATION =====
export async function generatePDF(content: {
  title: string;
  sections: { heading?: string; body: string }[];
}): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  let y = 20;

  doc.setFontSize(22);
  doc.text(content.title, 105, y, { align: 'center' });
  y += 20;

  doc.setFontSize(14);
  
  for (const section of content.sections) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (section.heading) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(section.heading, 20, y);
      y += 10;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const splitText = doc.splitTextToSize(section.body, 170);
    doc.text(splitText, 20, y);
    y += (splitText.length * 7) + 10;
  }

  return doc.output('blob');
}

// ===== EXCEL GENERATION =====
export async function generateExcel(data: {
  sheetName: string;
  headers: string[];
  rows: any[][];
}): Promise<Blob> {
  try {
    const wb = XLSX.utils.book_new();
    const wsData = [data.headers, ...data.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    if (data.headers.some(h => /[\u0600-\u06FF]/.test(h))) {
      ws['!views'] = [{ rightToLeft: true }];
    }
    
    XLSX.utils.book_append_sheet(wb, ws, data.sheetName);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (e) {
    console.error('Excel generation failed, falling back to CSV', e);
    const csv = [
      data.headers.join(','),
      ...data.rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  }
}

// ===== WORD GENERATION =====
export async function generateWord(content: {
  title: string;
  sections: { heading?: string; body: string }[];
}): Promise<Blob> {
  try {
    const children: Paragraph[] = [
      new Paragraph({
        text: content.title,
        heading: HeadingLevel.HEADING_1,
        bidirectional: true,
      }),
    ];

    for (const section of content.sections) {
      if (section.heading) {
        children.push(new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_2,
          bidirectional: true,
        }));
      }
      children.push(new Paragraph({
        children: [new TextRun({
          text: section.body,
          rightToLeft: true,
        })],
        bidirectional: true,
      }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    return await Packer.toBlob(doc);
  } catch (e) {
    console.error('Word generation failed, falling back to HTML', e);
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; padding: 40px; direction: rtl; }
          h1 { color: #1a1a2e; }
          h2 { color: #16213e; }
          p { line-height: 1.8; }
        </style>
      </head>
      <body>
        <h1>${content.title}</h1>
        ${content.sections.map(s => `
          ${s.heading ? `<h2>${s.heading}</h2>` : ''}
          <p>${s.body}</p>
        `).join('')}
      </body>
      </html>
    `;
    return new Blob([html], { type: 'application/msword' });
  }
}

// ===== MARKDOWN GENERATION =====
export function generateMarkdown(content: string): Blob {
  return new Blob([content], { type: 'text/markdown;charset=utf-8' });
}

// ===== ZIP GENERATION =====
export async function generateZip(files: { name: string; content: Blob | string }[]): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.content);
  }

  return await zip.generateAsync({ type: 'blob' });
}

// ===== SEND EMAIL =====
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!KEYS.resend) {
    throw new Error('Resend API key not set');
  }
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KEYS.resend}`,
    },
    body: JSON.stringify({
      from: 'Try-It! <notifications@tryit.app>',
      to,
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Email failed: ${response.status}`);
  }
  
  return true;
}

// ===== CODE EXECUTION =====
export async function executeCode(code: string, language: 'python' | 'javascript' = 'python'): Promise<{
  output: string;
  error?: string;
}> {
  if (!KEYS.e2b) {
    return {
      output: '',
      error: 'E2B API key not set. Code execution is not available.',
    };
  }
  
  try {
    const response = await fetch('https://api.e2b.dev/v1/sandboxes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': KEYS.e2b,
      },
      body: JSON.stringify({
        template: language === 'python' ? 'Python3' : 'Nodejs',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create sandbox: ${response.status}`);
    }
    
    const sandbox = await response.json();
    
    const execResponse = await fetch(`https://api.e2b.dev/v1/sandboxes/${sandbox.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': KEYS.e2b,
      },
      body: JSON.stringify({ code }),
    });
    
    const result = await execResponse.json();
    
    return {
      output: result.stdout || '',
      error: result.stderr || result.error,
    };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Code execution failed',
    };
  }
}

// ===== DOWNLOAD FILE =====
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== ADD REMINDER =====
const REMINDERS_KEY = 'tryit_reminders';

export function addReminder(text: string, date: string, time?: string): Reminder {
  const reminder: Reminder = {
    id: crypto.randomUUID(),
    text,
    date,
    time,
    completed: false,
  };
  
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    const reminders: Reminder[] = stored ? JSON.parse(stored) : [];
    reminders.push(reminder);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.warn('Failed to save reminder');
  }
  
  return reminder;
}

export function getReminders(): Reminder[] {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function completeReminder(id: string): void {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    const reminders: Reminder[] = stored ? JSON.parse(stored) : [];
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index].completed = true;
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    }
  } catch {
    console.warn('Failed to complete reminder');
  }
}

export function deleteReminder(id: string): void {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    const reminders: Reminder[] = stored ? JSON.parse(stored) : [];
    const filtered = reminders.filter(r => r.id !== id);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered));
  } catch {
    console.warn('Failed to delete reminder');
  }
}
