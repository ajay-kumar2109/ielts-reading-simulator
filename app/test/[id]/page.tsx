'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, ReadingTest, ReadingPassage, ReadingQuestion } from '@/lib/supabase'
import { calculateBand, formatTime } from '@/lib/utils'

export default function TestPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [test, setTest] = useState<ReadingTest | null>(null)
  const [passages, setPassages] = useState<ReadingPassage[]>([])
  const [questions, setQuestions] = useState<ReadingQuestion[]>([])
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [timeLeft, setTimeLeft] = useState(3600)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  useEffect(() => {
    if (loading || !test) return

    if (timeLeft <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, loading, test])

  const checkAuthAndLoad = async () => {
    try {
      const { profile } = await getCurrentUser()
      if (!profile) {
        window.location.href = '/login'
        return
      }
      setUserId(profile.id)
      await loadTest()
    } catch (err) {
      console.error('Auth check failed:', err)
      window.location.href = '/login'
    }
  }

  const loadTest = async () => {
    const { data: testData } = await supabase
      .from('reading_tests')
      .select('*')
      .eq('id', testId)
      .single()

    if (testData) {
      setTest(testData)
      setTimeLeft(testData.time_limit_minutes * 60)
    }

    const { data: passagesData } = await supabase
      .from('reading_passages')
      .select('*')
      .eq('test_id', testId)
      .order('passage_number')

    if (passagesData) {
      setPassages(passagesData)

      // Get questions for all passages of this test
      const passageIds = passagesData.map(p => p.id)
      if (passageIds.length > 0) {
        const { data: questionsData } = await supabase
          .from('reading_questions')
          .select('*')
          .in('passage_id', passageIds)
          .order('question_number')

        if (questionsData) setQuestions(questionsData)
      }
    }

    setLoading(false)
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)

    let correctCount = 0
    const answerRecords: any[] = []

    questions.forEach((q) => {
      const userAnswer = answers[q.id]?.trim() || ''
      const isCorrect = userAnswer.toLowerCase() === q.correct_answer.toLowerCase()
      if (isCorrect) correctCount++
      
      answerRecords.push({
        question_id: q.id,
        user_answer: userAnswer,
        is_correct: isCorrect,
      })
    })

    const bandScore = calculateBand(correctCount)
    const timeSpent = (test?.time_limit_minutes || 60) * 60 - timeLeft

    const { data: attemptData, error: attemptError } = await supabase
      .from('reading_attempts')
      .insert([{
        user_id: userId,
        test_id: testId,
        score: correctCount,
        band_score: bandScore,
        time_spent_seconds: timeSpent,
        status: 'completed',
        completed_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (attemptError || !attemptData) {
      alert('Error submitting test')
      setSubmitting(false)
      return
    }

    const answersWithAttempt = answerRecords.map(a => ({
      ...a,
      attempt_id: attemptData.id,
    }))

    await supabase.from('reading_answers').insert(answersWithAttempt)

    window.location.href = `/results/${attemptData.id}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading test...</div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Test not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">{test.title}</h1>
            <div className="flex items-center space-x-4">
              <div className={`text-lg font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                Time: {formatTime(timeLeft)}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {passages.map((passage) => {
          const passageQuestions = questions.filter(q => q.passage_id === passage.id)
          
          return (
            <div key={passage.id} className="mb-12">
              <div className="bg-white rounded-lg shadow p-8 mb-6">
                <h2 className="text-2xl font-bold mb-4">
                  Passage {passage.passage_number}
                  {passage.title && `: ${passage.title}`}
                </h2>
                <div className="prose max-w-none whitespace-pre-wrap">
                  {passage.content}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-8">
                <h3 className="text-xl font-semibold mb-6">Questions</h3>
                <div className="space-y-6">
                  {passageQuestions.map((question) => (
                    <div key={question.id} className="border-b pb-6 last:border-0">
                      <p className="font-medium mb-3">
                        {question.question_number}. {question.question_text}
                      </p>

                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="space-y-2">
                          {(Array.isArray(question.options) ? question.options : []).map((option: string, idx: number) => (
                            <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={answers[question.id] === option}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="w-4 h-4"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {(question.question_type === 'true_false_not_given' || question.question_type === 'yes_no_not_given') && (
                        <div className="space-y-2">
                          {(question.question_type === 'true_false_not_given' 
                            ? ['TRUE', 'FALSE', 'NOT GIVEN'] 
                            : ['YES', 'NO', 'NOT GIVEN']
                          ).map((option) => (
                            <label key={option} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={answers[question.id] === option}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="w-4 h-4"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {['sentence_completion', 'summary_completion', 'short_answer', 'note_completion', 'table_completion', 'flow_chart_completion', 'diagram_label'].includes(question.question_type) && (
                        <input
                          type="text"
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your answer"
                        />
                      )}

                      {['matching_headings', 'matching_information', 'matching_features', 'list_selection'].includes(question.question_type) && question.options && (
                        <select
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select an answer</option>
                          {(Array.isArray(question.options) ? question.options : []).map((option: string, idx: number) => (
                            <option key={idx} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        <div className="text-center mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8">
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
