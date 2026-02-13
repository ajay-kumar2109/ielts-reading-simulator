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
  // Mobile tab state: 'passage' or 'questions'
  const [mobileTab, setMobileTab] = useState<'passage' | 'questions'>('passage')
  // Current passage index for mobile navigation
  const [activePassageIndex, setActivePassageIndex] = useState(0)

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

      // Check if user already completed this test
      const { data: existingAttempt } = await supabase
        .from('reading_attempts')
        .select('id')
        .eq('user_id', profile.id)
        .eq('test_id', testId)
        .eq('status', 'completed')
        .limit(1)
        .single()

      if (existingAttempt) {
        window.location.href = `/results/${existingAttempt.id}`
        return
      }

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

  const activePassage = passages[activePassageIndex]
  const activePassageQuestions = activePassage
    ? questions.filter(q => q.passage_id === activePassage.id)
    : []

  // Render question input based on type
  const renderQuestionInput = (question: ReadingQuestion) => {
    if (question.question_type === 'multiple_choice' && question.options) {
      return (
        <div className="space-y-1 md:space-y-2">
          {(Array.isArray(question.options) ? question.options : []).map((option: string, idx: number) => (
            <label key={idx} className="radio-option flex items-center space-x-3 cursor-pointer p-2 md:p-1 rounded-lg md:rounded hover:bg-gray-50 min-h-[44px]">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={answers[question.id] === option}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0"
              />
              <span className="text-sm sm:text-base">{option}</span>
            </label>
          ))}
        </div>
      )
    }

    if (question.question_type === 'true_false_not_given' || question.question_type === 'yes_no_not_given') {
      const options = question.question_type === 'true_false_not_given'
        ? ['TRUE', 'FALSE', 'NOT GIVEN']
        : ['YES', 'NO', 'NOT GIVEN']
      return (
        <div className="space-y-1 md:space-y-2">
          {options.map((option) => (
            <label key={option} className="radio-option flex items-center space-x-3 cursor-pointer p-2 md:p-1 rounded-lg md:rounded hover:bg-gray-50 min-h-[44px]">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={answers[question.id] === option}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0"
              />
              <span className="text-sm sm:text-base">{option}</span>
            </label>
          ))}
        </div>
      )
    }

    if (['sentence_completion', 'summary_completion', 'short_answer', 'note_completion', 'table_completion', 'flow_chart_completion', 'diagram_label'].includes(question.question_type)) {
      return (
        <input
          type="text"
          value={answers[question.id] || ''}
          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          className="w-full max-w-md px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
          placeholder="Enter your answer"
        />
      )
    }

    if (['matching_headings', 'matching_information', 'matching_features', 'list_selection'].includes(question.question_type) && question.options) {
      return (
        <select
          value={answers[question.id] || ''}
          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          className="w-full max-w-md px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
        >
          <option value="">Select an answer</option>
          {(Array.isArray(question.options) ? question.options : []).map((option: string, idx: number) => (
            <option key={idx} value={option}>{option}</option>
          ))}
        </select>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg sm:text-xl">Loading test...</div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg sm:text-xl">Test not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Sticky Timer Bar - always visible on all devices */}
      <header className="timer-bar bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-sm sm:text-lg md:text-xl font-bold text-blue-600 truncate mr-2 max-w-[40%] sm:max-w-none">
              {test.title}
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className={`text-base sm:text-lg font-semibold whitespace-nowrap ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                <span className="hidden xs:inline">Time: </span>{formatTime(timeLeft)}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 text-white px-3 sm:px-6 py-2 rounded text-sm sm:text-base hover:bg-green-700 disabled:opacity-50 min-h-[44px] whitespace-nowrap"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden test-tab-bar">
          <button
            className={`test-tab ${mobileTab === 'passage' ? 'active' : ''}`}
            onClick={() => setMobileTab('passage')}
          >
            Passage
          </button>
          <button
            className={`test-tab ${mobileTab === 'questions' ? 'active' : ''}`}
            onClick={() => setMobileTab('questions')}
          >
            Questions
          </button>
        </div>

        {/* Passage Selector (mobile/tablet) */}
        <div className="lg:hidden bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center space-x-2 overflow-x-auto">
          {passages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePassageIndex(idx)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors min-h-[36px] ${
                activePassageIndex === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Passage {p.passage_number}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-grow w-full">
        {/* ── DESKTOP: Split-screen layout ── */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {passages.map((passage) => {
            const passageQuestions = questions.filter(q => q.passage_id === passage.id)
            return (
              <div key={passage.id} className="mb-10">
                <div className="test-split-layout">
                  {/* Left: Passage */}
                  <div className="test-passage-panel bg-white rounded-lg shadow p-6 xl:p-8">
                    <h2 className="text-xl xl:text-2xl font-bold mb-4">
                      Passage {passage.passage_number}
                      {passage.title && `: ${passage.title}`}
                    </h2>
                    <div className="prose max-w-none whitespace-pre-wrap text-sm xl:text-base leading-relaxed">
                      {passage.content}
                    </div>
                  </div>

                  {/* Right: Questions */}
                  <div className="bg-white rounded-lg shadow p-6 xl:p-8">
                    <h3 className="text-lg xl:text-xl font-semibold mb-6">Questions</h3>
                    <div className="space-y-6">
                      {passageQuestions.map((question) => (
                        <div key={question.id} className="border-b pb-6 last:border-0">
                          <p className="font-medium mb-3 text-sm xl:text-base">
                            {question.question_number}. {question.question_text}
                          </p>
                          {renderQuestionInput(question)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── MOBILE/TABLET: Tab-based interface ── */}
        <div className="lg:hidden px-3 sm:px-4 py-4 sm:py-6">
          {activePassage && (
            <>
              {/* Passage Content (visible when passage tab active) */}
              {mobileTab === 'passage' && (
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                    Passage {activePassage.passage_number}
                    {activePassage.title && `: ${activePassage.title}`}
                  </h2>
                  <div className="prose max-w-none whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {activePassage.content}
                  </div>
                </div>
              )}

              {/* Questions (visible when questions tab active) */}
              {mobileTab === 'questions' && (
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">
                    Questions for Passage {activePassage.passage_number}
                  </h3>
                  <div className="space-y-5 sm:space-y-6">
                    {activePassageQuestions.map((question) => (
                      <div key={question.id} className="border-b pb-5 sm:pb-6 last:border-0">
                        <p className="font-medium mb-3 text-sm sm:text-base">
                          {question.question_number}. {question.question_text}
                        </p>
                        {renderQuestionInput(question)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom submit button */}
        <div className="text-center py-6 sm:py-8 px-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg hover:bg-green-700 disabled:opacity-50 min-h-[44px] w-full sm:w-auto max-w-sm"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              This is an independent IELTS practice simulator and is not affiliated with IELTS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
