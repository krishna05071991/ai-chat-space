// Supabase client configuration for chat.space platform with validation
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enhanced validation with detailed error messages
function validateSupabaseConfig() {
  const errors: string[] = []
  
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is missing from environment variables')
  } else {
    try {
      const url = new URL(supabaseUrl)
      if (!url.hostname.includes('supabase.co')) {
        errors.push(`VITE_SUPABASE_URL should be a Supabase URL (*.supabase.co), got: ${supabaseUrl}`)
      }
    } catch (error) {
      errors.push(`VITE_SUPABASE_URL is not a valid URL: ${supabaseUrl}`)
    }
  }
  
  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing from environment variables')
  } else if (!supabaseAnonKey.startsWith('eyJ')) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (should start with "eyJ")')
  }
  
  if (errors.length > 0) {
    const errorMessage = [
      '❌ Supabase configuration errors:',
      ...errors.map(err => `  • ${err}`),
      '',
      '🔧 To fix this:',
      '  1. Check your .env file in the project root',
      '  2. Ensure both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set',
      '  3. Get these values from your Supabase project dashboard',
      '  4. Restart the development server after changes',
      '',
      '📖 Need help? Visit: https://supabase.com/docs/guides/getting-started'
    ].join('\n')
    
    throw new Error(errorMessage)
  }
}

// Validate environment variables
validateSupabaseConfig()

// Log configuration status (only in development)
if (import.meta.env.DEV) {
  console.log('✅ Supabase client initialized:', {
    url: supabaseUrl,
    project: supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown',
    keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
    timestamp: new Date().toISOString()
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'chat-space-web'
    }
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          model_history: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          model_history?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          model_history?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          model_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          model_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          model_used?: string | null
          created_at?: string
        }
      }
    }
  }
}