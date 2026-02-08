/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_MISTRAL_API_KEY: string
  readonly VITE_COHERE_API_KEY: string
  readonly VITE_TAVILY_API_KEY: string
  readonly VITE_FIRECRAWL_API_KEY: string
  readonly VITE_ELEVENLABS_API_KEY: string
  readonly VITE_REPLICATE_API_KEY: string
  readonly VITE_E2B_API_KEY: string
  readonly VITE_RESEND_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
