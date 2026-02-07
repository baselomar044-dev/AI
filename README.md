# 🚀 AI Assistant Platform

## Quick Start

### Step 1: Install
```bash
npm install
```

### Step 2: Run (Need 2 Terminals!)

**Terminal 1 - Server:**
```bash
npm run dev:server
```

Wait until you see:
```
🚀 AI Server v2.0.0
🔌 AI Providers: 11/11 configured
🎉 Ready to serve!
```

**Terminal 2 - Client:**
```bash
npm run dev:client
```

### Step 3: Open Browser
```
http://localhost:5173
```

---

## ✅ Features

- 💬 AI Chat (Groq, Gemini, OpenRouter, Mistral, Cohere)
- 🎨 Image Generation (Replicate)
- 🔊 Text-to-Speech (ElevenLabs)
- 💻 Computer Use (E2B)
- 🔍 Web Search (Tavily, Firecrawl)
- 📧 Email (Resend)
- 📊 Analytics Dashboard
- 🌐 PWA Support
- 📱 Mobile Responsive

---

## 🔑 API Keys

All 11 API keys are configured in `.env`:
- GROQ_API_KEY
- GEMINI_API_KEY
- OPENROUTER_API_KEY
- MISTRAL_API_KEY
- COHERE_API_KEY
- REPLICATE_API_KEY
- ELEVENLABS_API_KEY
- E2B_API_KEY
- FIRECRAWL_API_KEY
- TAVILY_API_KEY
- RESEND_API_KEY

---

## 🔧 Troubleshooting

### "Network Error" on signup/login
→ Make sure the server is running (Terminal 1)

### Server not starting
→ Run `npm install` again

### Port already in use
→ Kill the process or change PORT in .env
# Force redeploy Wed Feb  4 04:27:45 UTC 2026
