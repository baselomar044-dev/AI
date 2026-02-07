// ============================================
// 🎙️ PERFECT VOICE CALL SYSTEM
// High Quality Real-time Voice Conversation
// ============================================

export interface VoiceConfig {
  // Input settings
  inputDevice?: string;
  noiseSupression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  silenceThreshold: number; // 0-1
  
  // Output settings
  outputDevice?: string;
  voice: VoiceOption;
  speed: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
  volume: number; // 0 - 1
  
  // AI settings
  interruptible: boolean; // Can user interrupt AI
  responseDelay: number; // ms before AI responds
  streamResponse: boolean;
  emotionalTone: boolean;
  
  // Language
  language: 'ar' | 'en' | 'auto';
  dialect?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  nameAr: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  accent?: string;
  preview?: string;
}

// Available voices
export const VOICES: VoiceOption[] = [
  // English voices (2 Only)
  { id: 'en-US-Neural2-A', name: 'Alex (US)', nameAr: 'أليكس (أمريكي)', gender: 'male', language: 'en-US' },
  { id: 'en-US-Neural2-C', name: 'Sarah (US)', nameAr: 'سارة (أمريكية)', gender: 'female', language: 'en-US' }, // Renamed Emma to Sarah per request

  // Arabic voices (2 Only - Egyptian Dialect)
  { id: 'ar-EG-Standard-A', name: 'Omar (Egyptian)', nameAr: 'عمر (مصري)', gender: 'male', language: 'ar-EG', accent: 'egyptian' }, // Renamed Mohamed to Omar
  { id: 'ar-EG-Standard-B', name: 'Layla (Egyptian)', nameAr: 'ليلى (مصرية)', gender: 'female', language: 'ar-EG', accent: 'egyptian' }, // Renamed Nour to Layla
];

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  noiseSupression: true,
  echoCancellation: true,
  autoGainControl: true,
  silenceThreshold: 0.02,
  voice: VOICES[0],
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
  interruptible: true,
  responseDelay: 300,
  streamResponse: true,
  emotionalTone: true,
  language: 'auto',
};

// ================== VOICE CALL ENGINE ==================

export class VoiceCallEngine {
  private config: VoiceConfig;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private isSpeaking = false;
  private ws: WebSocket | null = null;
  
  // Callbacks
  onStateChange?: (state: CallState) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAIResponse?: (text: string, audio?: ArrayBuffer) => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (error: Error) => void;
  
  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
    this.synthesis = window.speechSynthesis;
  }
  
  async start(): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.config.inputDevice,
          noiseSuppression: this.config.noiseSupression,
          echoCancellation: this.config.echoCancellation,
          autoGainControl: this.config.autoGainControl,
        },
      });
      
      // Set up audio analysis
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      
      // Start volume monitoring
      this.monitorVolume();
      
      // Set up speech recognition
      await this.setupRecognition();
      
      // Connect to backend for AI processing
      await this.connectWebSocket();
      
      this.onStateChange?.('connected');
    } catch (error) {
      this.onError?.(error as Error);
      throw error;
    }
  }
  
  private async setupRecognition(): Promise<void> {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.language === 'ar' ? 'ar-SA' : 
                            this.config.language === 'en' ? 'en-US' : 
                            navigator.language;
    
    let finalTranscript = '';
    let silenceTimer: NodeJS.Timeout | null = null;
    
    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Report transcript
      if (interimTranscript) {
        this.onTranscript?.(interimTranscript, false);
      }
      
      // Clear silence timer on new speech
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      
      // Set silence timer to detect end of speech
      silenceTimer = setTimeout(() => {
        if (finalTranscript) {
          this.onTranscript?.(finalTranscript, true);
          this.sendToAI(finalTranscript);
          finalTranscript = '';
        }
      }, this.config.responseDelay);
    };
    
    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        this.onError?.(new Error(`Recognition error: ${event.error}`));
      }
    };
    
    this.recognition.onend = () => {
      // Restart if still listening
      if (this.isListening && !this.isSpeaking) {
        this.recognition?.start();
      }
    };
  }
  
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.ws = new WebSocket(`${protocol}//${window.location.host}/api/voice/stream`);
      
      this.ws.onopen = () => {
        // Send config
        this.ws?.send(JSON.stringify({
          type: 'config',
          config: this.config,
        }));
        resolve();
      };
      
      this.ws.onerror = (error) => reject(error);
      
      this.ws.onmessage = async (event) => {
        try {
          if (event.data instanceof Blob) {
            // Audio data
            const arrayBuffer = await event.data.arrayBuffer();
            await this.playAudio(arrayBuffer);
          } else {
            const data = JSON.parse(event.data);
            
            if (data.type === 'text') {
              this.onAIResponse?.(data.content);
            } else if (data.type === 'audio_start') {
              this.isSpeaking = true;
              this.onStateChange?.('ai_speaking');
              if (!this.config.interruptible) {
                this.recognition?.stop();
              }
            } else if (data.type === 'audio_end') {
              this.isSpeaking = false;
              this.onStateChange?.('listening');
              this.recognition?.start();
            } else if (data.type === 'error') {
              this.onError?.(new Error(data.message));
            }
          }
        } catch (e) {
          console.error('WebSocket message error:', e);
        }
      };
    });
  }
  
  private async sendToAI(text: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    this.onStateChange?.('processing');
    
    this.ws.send(JSON.stringify({
      type: 'message',
      text,
      language: this.detectLanguage(text),
    }));
  }
  
  private detectLanguage(text: string): string {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'ar' : 'en';
  }
  
  private async playAudio(arrayBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;
    
    try {
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Apply pitch and speed adjustments
      source.playbackRate.value = this.config.speed;
      
      // Create gain node for volume
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.config.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
      
      source.onended = () => {
        this.isSpeaking = false;
        this.onStateChange?.('listening');
      };
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }
  
  private monitorVolume(): void {
    if (!this.analyser) return;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const check = () => {
      if (!this.analyser) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalized = average / 255;
      
      this.onVolumeChange?.(normalized);
      
      if (this.isListening) {
        requestAnimationFrame(check);
      }
    };
    
    check();
  }
  
  startListening(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    this.recognition?.start();
    this.onStateChange?.('listening');
  }
  
  stopListening(): void {
    this.isListening = false;
    this.recognition?.stop();
    this.onStateChange?.('paused');
  }
  
  interrupt(): void {
    if (!this.config.interruptible) return;
    
    // Stop current AI speech
    this.ws?.send(JSON.stringify({ type: 'interrupt' }));
    this.synthesis.cancel();
    this.isSpeaking = false;
    this.onStateChange?.('listening');
  }
  
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }
  
  setSpeed(speed: number): void {
    this.config.speed = Math.max(0.5, Math.min(2, speed));
  }
  
  setPitch(pitch: number): void {
    this.config.pitch = Math.max(0.5, Math.min(2, pitch));
  }
  
  setVoice(voice: VoiceOption): void {
    this.config.voice = voice;
    this.ws?.send(JSON.stringify({ type: 'config', config: { voice } }));
  }
  
  async switchDevice(type: 'input' | 'output', deviceId: string): Promise<void> {
    if (type === 'input') {
      this.config.inputDevice = deviceId;
      // Restart with new device
      this.stop();
      await this.start();
    } else {
      this.config.outputDevice = deviceId;
      // Note: Output device switching requires Web Audio API workarounds
    }
  }
  
  stop(): void {
    this.isListening = false;
    this.isSpeaking = false;
    
    this.recognition?.stop();
    this.recognition = null;
    
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
    
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    
    this.ws?.close();
    this.ws = null;
    
    this.onStateChange?.('disconnected');
  }
  
  getState(): CallState {
    if (!this.mediaStream) return 'disconnected';
    if (this.isSpeaking) return 'ai_speaking';
    if (this.isListening) return 'listening';
    return 'connected';
  }
  
  async getDevices(): Promise<{ inputs: MediaDeviceInfo[]; outputs: MediaDeviceInfo[] }> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      inputs: devices.filter(d => d.kind === 'audioinput'),
      outputs: devices.filter(d => d.kind === 'audiooutput'),
    };
  }
}

export type CallState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'processing'
  | 'ai_speaking'
  | 'paused'
  | 'error';

// ================== VOICE ACTIVITY DETECTION ==================

export class VoiceActivityDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private isActive = false;
  private activityThreshold: number;
  private silenceTimeout: number;
  private silenceTimer: NodeJS.Timeout | null = null;
  
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  onVolumeLevel?: (level: number) => void;
  
  constructor(stream: MediaStream, options: {
    threshold?: number;
    silenceTimeout?: number;
  } = {}) {
    this.activityThreshold = options.threshold ?? 0.02;
    this.silenceTimeout = options.silenceTimeout ?? 500;
    
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);
  }
  
  start(): void {
    const dataArray = new Float32Array(this.analyser.frequencyBinCount);
    
    const check = () => {
      this.analyser.getFloatTimeDomainData(dataArray);
      
      // Calculate RMS volume
      let sum = 0;
      for (const sample of dataArray) {
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      
      this.onVolumeLevel?.(rms);
      
      if (rms > this.activityThreshold) {
        if (!this.isActive) {
          this.isActive = true;
          this.onVoiceStart?.();
        }
        
        // Clear silence timer
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      } else if (this.isActive && !this.silenceTimer) {
        // Start silence timer
        this.silenceTimer = setTimeout(() => {
          this.isActive = false;
          this.onVoiceEnd?.();
          this.silenceTimer = null;
        }, this.silenceTimeout);
      }
      
      requestAnimationFrame(check);
    };
    
    check();
  }
  
  stop(): void {
    this.audioContext.close();
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
  }
}

// ================== AUDIO VISUALIZER ==================

export function createAudioVisualizer(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode,
  options: {
    type: 'waveform' | 'bars' | 'circle';
    color: string;
    backgroundColor: string;
  }
): () => void {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  let animationId: number;
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  const draw = () => {
    analyser.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = options.color;
    
    if (options.type === 'bars') {
      const barWidth = width / dataArray.length;
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
      }
    } else if (options.type === 'waveform') {
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let i = 0; i < dataArray.length; i++) {
        const x = (i / dataArray.length) * width;
        const y = ((dataArray[i] / 255) * height * 0.8) + height * 0.1;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = options.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (options.type === 'circle') {
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) / 2 - 10;
      
      for (let i = 0; i < dataArray.length; i++) {
        const angle = (i / dataArray.length) * Math.PI * 2;
        const radius = (dataArray[i] / 255) * maxRadius * 0.5 + maxRadius * 0.5;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = options.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    animationId = requestAnimationFrame(draw);
  };
  
  draw();
  
  return () => cancelAnimationFrame(animationId);
}

// Add to window for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  var SpeechRecognition: any;
  var webkitSpeechRecognition: any;
}
