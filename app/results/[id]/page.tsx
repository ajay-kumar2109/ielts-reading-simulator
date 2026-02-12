'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { supabase, ReadingAttempt, ReadingTest, ReadingAnswer, ReadingQuestion } from '@/lib/supabase'

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const attemptId = params.id as string

  const [attempt, setAttempt] = useState<ReadingAttempt | null>(null)
  const [test, setTest] = useState<ReadingTest | null>(null)
  const [answers, setAnswers] = useState<(ReadingAnswer & { question: ReadingQuestion })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  const checkAuthAndLoad = async () => {
    try {
      const { profile } = await getCurrentUser()
      if (!profile) {
        window.location.href = '/login'
        return
      }
      await loadResults()
    } catch (err) {
      console.error('Auth check failed:', err)
      window.location.href = '/login'
    }
  }

  const loadResults = async () => {
    const { data: attemptData } = await supabase
      .from('reading_attempts')
      .select('*')
      .eq('id', attemptId)
      .single()

    if (!attemptData) {
      setLoading(false)
      return
    }

    const { data: testData } = await supabase
      .from('reading_tests')
      .select('*')
      .eq('id', attemptData.test_id)
      .single()

    const { data: answersData } = await supabase
      .from('reading_answers')
      .select(`
        *,
        question:reading_questions(*)
      `)
      .eq('attempt_id', attemptId)

    setAttempt(attemptData)
    if (testData) setTest(testData)
    if (answersData) {
      const formattedAnswers = answersData.map(a => ({
        ...a,
        question: Array.isArray(a.question) ? a.question[0] : a.question
      }))
      formattedAnswers.sort((a, b) => a.question.question_number - b.question.question_number)
      setAnswers(formattedAnswers)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading results...</div>
      </div>
    )
  }

  if (!attempt || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Results not found</div>
      </div>
    )
  }

  const score = attempt.score || 0
  const timeSpent = attempt.time_spent_seconds || 0

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            IELTS Reading Simulator
          </Link>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-3xl font-bold mb-8">Test Results</h1>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">{test.title}</h2>
          
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{attempt.band_score}</div>
              <div className="text-sm text-gray-600 mt-1">Band Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{score}/40</div>
              <div className="text-sm text-gray-600 mt-1">Correct Answers</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round((score / 40) * 100)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {Math.floor(timeSpent / 60)}m
              </div>
              <div className="text-sm text-gray-600 mt-1">Time Used</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Performance Analysis</h3>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all"
                  style={{ width: `${(score / 40) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-semibold mb-6">Answer Review</h3>
          <div className="space-y-4">
            {answers.map((answer) => (
              <div
                key={answer.id}
                className={`p-4 rounded-lg border-2 ${
                  answer.is_correct
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <p className="font-medium mb-2">
                      Question {answer.question.question_number}: {answer.question.question_text}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">Your answer:</span>{' '}
                        <span className={answer.is_correct ? 'text-green-700' : 'text-red-700'}>
                          {answer.user_answer || '(No answer)'}
                        </span>
                      </p>
                      {!answer.is_correct && (
                        <p>
                          <span className="font-semibold">Correct answer:</span>{' '}
                          <span className="text-green-700">{answer.question.correct_answer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {answer.is_correct ? (
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              This is an independent IELTS practice simulator and is not affiliated with IELTS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
