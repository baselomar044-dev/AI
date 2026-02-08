// ============================================
// VOICE CALL PAGE - Try-It!
// Real voice chat with AI using speech recognition and TTS
// ============================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Phone, PhoneOff, Loader2, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';
import { smartChat, textToSpeech, speechToText, ChatMessage, KEYS } from '../services/aiMatrix';

// Polyfill types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceCallPage() {
  const navigate = useNavigate();
  const { theme, language, apiKeys } = useStore();
  const colors = getTheme(theme);
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Start call
  const startCall = async () => {
    try {
      setError(null);
      // Only need stream if using MediaRecorder (Groq)
      if (KEYS.groq) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }
      setIsCallActive(true);
      
      // Greet user
      await speak(language === 'ar' ? 'أهلاً بك. كيف يمكنني مساعدتك؟' : 'Hello. How can I assist you today?');
    } catch (err: any) {
      setError('فشل في الوصول للميكروفون. تأكد من السماح للمتصفح.');
      console.error('Microphone error:', err);
    }
  };
  
  // End call
  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');
    setResponse('');
    setMessages([]);
  };
  
  // Start listening
  const startListening = async () => {
    if (isSpeaking || isProcessing) return;
    
    // 1. Try Browser Native Speech Recognition (Free, Fast) if Groq is missing OR preferred
    // For now, prioritize Groq if available for quality, but fallback if not.
    // Actually, user wants "Free", so let's prefer Native if Groq is not set.
    
    if (!KEYS.groq && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
       try {
         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
         const recognition = new SpeechRecognition();
         recognition.lang = language === 'ar' ? 'ar-EG' : 'en-US';
         recognition.continuous = false;
         recognition.interimResults = false;
         
         recognition.onstart = () => setIsListening(true);
         recognition.onend = () => setIsListening(false);
         recognition.onerror = (event: any) => {
           console.error('Speech recognition error', event.error);
           setIsListening(false);
           setError('فشل في التعرف على الصوت (المتصفح)');
         };
         
         recognition.onresult = async (event: any) => {
           const text = event.results[0][0].transcript;
           await handleUserText(text);
         };
         
         recognitionRef.current = recognition;
         recognition.start();
         return;
       } catch (e) {
         console.warn('Native speech recognition failed', e);
       }
    }

    // 2. Fallback to MediaRecorder (Groq / Whisper)
    if (!streamRef.current) {
       // Try to get stream again if missing
       try {
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         streamRef.current = stream;
       } catch (e) {
         setError('الميكروفون غير متاح');
         return;
       }
    }

    try {
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error('Recording error:', err);
      setError('فشل في التسجيل');
    }
  };
  
  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // Don't set isListening false here, wait for onend
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // Handle Text Input (Direct)
  const handleUserText = async (text: string) => {
      setTranscript(text);
      
      // Add user message
      const userMsg: ChatMessage = { role: 'user', content: text };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      
      setIsProcessing(true);
      try {
        // Get AI response
        const aiResponse = await smartChat(newMessages, {
          enableWebSearch: true,
          language: language === 'ar' ? 'ar' : 'en',
        });
        
        // Add assistant message
        const assistantMsg: ChatMessage = { role: 'assistant', content: aiResponse.content };
        setMessages([...newMessages, assistantMsg]);
        setResponse(aiResponse.content);
        
        // Speak the response
        if (!isMuted) {
          await speak(aiResponse.content);
        }
      } catch (err: any) {
        setError(err.message || 'حصل خطأ. جرب تاني.');
      } finally {
        setIsProcessing(false);
      }
  };
  
  // Process recorded audio
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Transcribe audio
      const text = await speechToText(audioBlob, language === 'ar' ? 'ar' : 'en');
      if (!text.trim()) {
        setError('مسمعتش حاجة. جرب تاني.');
        setIsProcessing(false);
        return;
      }
      
      // Pass to text handler
      await handleUserText(text);

    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'حصل خطأ. جرب تاني.');
      setIsProcessing(false);
    }
  };
  
  // ===== TEXT TO SPEECH (FREE ONLY) =====
  // If ElevenLabs is not set or paid, we fallback to Browser Speech Synthesis (100% Free)
  const speak = async (text: string) => {
    if (isMuted) return;
    setIsSpeaking(true);
    
    // Check if ElevenLabs key is present
    const hasElevenLabs = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (hasElevenLabs) {
      try {
        const audioBlob = await textToSpeech(text);
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        return;
      } catch (e) {
        console.warn('ElevenLabs failed, falling back to Browser TTS');
      }
    }
    
    // Fallback: Browser Native TTS (100% Free)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ar' ? 'ar-EG' : 'en-US';
      
      // Try to find a good voice matching the language
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith(language === 'ar' ? 'ar' : 'en') && 
        (v.name.includes('Google') || v.name.includes('Natural'))
      ) || voices.find(v => v.lang.startsWith(language === 'ar' ? 'ar' : 'en')) || voices[0];
      
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current && !isMuted) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  return (
    <div className={`h-full flex flex-col ${colors.bg} ${colors.text}`}>
      {/* Header */}
      <div className={`p-4 flex items-center gap-3 border-b ${colors.border}`}>
        <button
          onClick={() => navigate('/chat')}
          className={`p-2 rounded-lg hover:opacity-80 transition-opacity ${colors.bgSecondary}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="ml-4">
          <h1 className="text-2xl font-bold text-white">AI Assistant Voice</h1>
          <p className="text-gray-400 text-sm">
            Chat with AI Assistant using your voice
          </p>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        {!isCallActive ? (
          // Start Call Button
          <div className="text-center">
            <button
              onClick={startCall}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${colors.primary}`}
            >
              <Phone className="w-16 h-16 text-white" />
            </button>
            <p className="mt-6 text-lg font-medium">اضغط للاتصال</p>
            <p className="mt-2 text-sm opacity-60">تأكد من السماح بالوصول للميكروفون</p>
          </div>
        ) : (
          // Active Call UI
          <div className="w-full max-w-md space-y-8">
            {/* Status */}
            <div className="text-center">
              <div 
                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  isListening ? 'bg-blue-500' : isSpeaking ? colors.primary : colors.bgSecondary
                }`}
                style={{ 
                  animation: isListening || isSpeaking ? 'pulse 2s infinite' : 'none',
                }}
              >
                {isProcessing ? (
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                ) : isListening ? (
                  <Mic className="w-12 h-12 text-white" />
                ) : isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-white" />
                ) : (
                  <Mic className={`w-12 h-12 ${colors.textMuted}`} />
                )}
              </div>
              
              <p className="text-lg font-medium">
                {isProcessing ? 'جاري المعالجة...' :
                 isListening ? 'بسمعك...' :
                 isSpeaking ? 'بتكلم...' :
                 'اضغط واتكلم'}
              </p>
            </div>
            
            {/* Error */}
            {error && (
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
                {error}
              </div>
            )}
            
            {/* Transcript */}
            {transcript && (
              <div className={`p-4 rounded-lg ${colors.bgSecondary}`}>
                <p className="text-sm opacity-60 mb-1">أنت قلت:</p>
                <p>{transcript}</p>
              </div>
            )}
            
            {/* Response */}
            {response && (
              <div className={`p-4 rounded-lg ${colors.aiMsg}`}>
                <p className="text-sm opacity-60 mb-1">Try-It! قال:</p>
                <p>{response}</p>
              </div>
            )}
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isMuted ? 'bg-gray-700 text-red-400' : 'bg-[#111] text-gray-400'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
              
              {/* Push to Talk Button */}
              <button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                disabled={isSpeaking || isProcessing}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                  isListening ? 'bg-green-500' : colors.primary
                }`}
                style={{ 
                  transform: isListening ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {isListening ? (
                  <Mic className="w-10 h-10 text-white" />
                ) : (
                  <MicOff className="w-10 h-10 text-white" />
                )}
              </button>
              
              {/* End Call Button */}
              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#ef4444' }}
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <p className="text-center text-sm opacity-60">
              اضغط واستمر على الزرار الأخضر وأنت بتتكلم
            </p>
          </div>
        )}
      </div>
      
      {/* Pulse Animation Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
