import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
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
