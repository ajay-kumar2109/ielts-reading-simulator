import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export type ReadingTest = {
  id: string
  title: string
  description: string | null
  created_at: string
  created_by: string | null
}

export type ReadingPassage = {
  id: string
  test_id: string
  passage_number: number
  title: string | null
  content: string
}

export type ReadingQuestion = {
  id: string
  test_id: string
  passage_id: string
  question_number: number
  type: 'multiple_choice' | 'true_false_not_given' | 'fill_blank'
  question_text: string
  options: string[] | null
  correct_answer: string
}

export type ReadingAttempt = {
  id: string
  user_id: string
  test_id: string
  score: number
  band: number
  time_used: number
  attempted_at: string
}

export type ReadingAnswer = {
  id: string
  attempt_id: string
  question_id: string
  user_answer: string | null
  is_correct: boolean | null
}
