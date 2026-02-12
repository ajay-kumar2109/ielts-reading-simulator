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
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const checkAuthAndLoad = async () => {
    const { profile } = await getCurrentUser()
    if (!profile) {
      router.push('/login')
      return
    }
    setUserId(profile.id)
    await loadTest()
  }

  const loadTest = async () => {
    const { data: testData } = await supabase
      .from('reading_tests')
      .select('*')
      .eq('id', testId)
      .single()

    const { data: passagesData } = await supabase
      .from('reading_passages')
      .select('*')
      .eq('test_id', testId)
      .order('passage_number')

    const { data: questionsData } = await supabase
      .from('reading_questions')
      .select('*')
      .eq('test_id', testId)
      .order('question_number')

    if (testData) setTest(testData)
    if (passagesData) setPassages(passagesData)
    if (questionsData) setQuestions(questionsData)
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

    const band = calculateBand(correctCount)
    const timeUsed = 3600 - timeLeft

    const { data: attemptData, error: attemptError } = await supabase
      .from('reading_attempts')
      .insert([{
        user_id: userId,
        test_id: testId,
        score: correctCount,
        band: band,
        time_used: timeUsed,
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

    router.push(`/results/${attemptData.id}`)
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

                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, idx) => (
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

                      {question.type === 'true_false_not_given' && (
                        <div className="space-y-2">
                          {['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => (
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

                      {question.type === 'fill_blank' && (
                        <input
                          type="text"
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your answer"
                        />
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
