import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return _supabase
}

// Proxy that lazily initializes the Supabase client on first property access
// This prevents errors during Next.js build/prerendering when env vars aren't available
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabase()
    const value = Reflect.get(client, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export type User = {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export type ReadingTest = {
  id: string
  title: string
  description: string | null
  difficulty: string
  time_limit_minutes: number
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ReadingPassage = {
  id: string
  test_id: string
  passage_number: number
  title: string
  content: string
  created_at: string
}

export type ReadingQuestion = {
  id: string
  passage_id: string
  question_number: number
  question_type: string
  question_text: string
  options: any | null
  correct_answer: string
  explanation: string | null
  created_at: string
}

export type ReadingAttempt = {
  id: string
  user_id: string
  test_id: string
  started_at: string
  completed_at: string | null
  time_spent_seconds: number | null
  score: number | null
  band_score: number | null
  status: string
  created_at: string
}

export type ReadingAnswer = {
  id: string
  attempt_id: string
  question_id: string
  user_answer: string | null
  is_correct: boolean | null
  created_at: string
}
