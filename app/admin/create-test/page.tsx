'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'

type PassageInput = {
  passage_number: number
  title: string
  content: string
}

type QuestionInput = {
  passage_index: number
  question_number: number
  question_type: string
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string
}

const QUESTION_TYPES = [
  'multiple_choice',
  'true_false_not_given',
  'yes_no_not_given',
  'sentence_completion',
  'summary_completion',
  'short_answer',
  'matching_headings',
  'matching_information',
  'matching_features',
  'list_selection',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label',
]

export default function CreateTestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [timeLimit, setTimeLimit] = useState(60)

  const [passages, setPassages] = useState<PassageInput[]>([
    { passage_number: 1, title: '', content: '' },
    { passage_number: 2, title: '', content: '' },
    { passage_number: 3, title: '', content: '' },
  ])

  const [questions, setQuestions] = useState<QuestionInput[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { profile } = await getCurrentUser()
      if (!profile) {
        window.location.href = '/login'
        return
      }
      if (profile.role !== 'admin') {
        window.location.href = '/dashboard'
        return
      }
      setUser(profile)
      setLoading(false)
    } catch (err) {
      console.error('Auth check failed:', err)
      window.location.href = '/login'
    }
  }

  const updatePassage = (index: number, field: keyof PassageInput, value: string) => {
    setPassages(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const addQuestion = (passageIndex: number) => {
    const passageQuestions = questions.filter(q => q.passage_index === passageIndex)
    const totalBefore = questions.filter(q => q.passage_index < passageIndex).length
    const newNumber = totalBefore + passageQuestions.length + 1

    setQuestions(prev => [...prev, {
      passage_index: passageIndex,
      question_number: newNumber,
      question_type: 'multiple_choice',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
    }])
  }

  const updateQuestion = (qIndex: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, [field]: value } : q))
  }

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const newOptions = [...q.options]
      newOptions[optIndex] = value
      return { ...q, options: newOptions }
    }))
  }

  const removeQuestion = (qIndex: number) => {
    setQuestions(prev => {
      const updated = prev.filter((_, i) => i !== qIndex)
      // Renumber questions
      let num = 1
      return updated.map(q => ({ ...q, question_number: num++ }))
    })
  }

  const needsOptions = (type: string) => {
    return ['multiple_choice', 'matching_headings', 'matching_information', 'matching_features', 'list_selection'].includes(type)
  }

  const handleSubmit = async (publish: boolean) => {
    setError('')
    setSuccess('')

    if (!title.trim()) {
      setError('Test title is required')
      return
    }

    if (passages.some(p => !p.content.trim())) {
      setError('All passages must have content')
      return
    }

    if (questions.length === 0) {
      setError('At least one question is required')
      return
    }

    if (questions.some(q => !q.question_text.trim() || !q.correct_answer.trim())) {
      setError('All questions must have text and a correct answer')
      return
    }

    setSaving(true)

    // Create test
    const { data: testData, error: testError } = await supabase
      .from('reading_tests')
      .insert([{
        title: title.trim(),
        description: description.trim() || null,
        difficulty,
        time_limit_minutes: timeLimit,
        is_published: publish,
        created_by: user?.id,
      }])
      .select()
      .single()

    if (testError || !testData) {
      setError('Failed to create test: ' + (testError?.message || 'Unknown error'))
      setSaving(false)
      return
    }

    // Create passages
    const passageInserts = passages.map(p => ({
      test_id: testData.id,
      passage_number: p.passage_number,
      title: p.title.trim(),
      content: p.content.trim(),
    }))

    const { data: passageData, error: passageError } = await supabase
      .from('reading_passages')
      .insert(passageInserts)
      .select()

    if (passageError || !passageData) {
      setError('Failed to create passages: ' + (passageError?.message || 'Unknown error'))
      setSaving(false)
      return
    }

    // Create questions
    const questionInserts = questions.map(q => {
      const passage = passageData[q.passage_index]
      return {
        passage_id: passage.id,
        question_number: q.question_number,
        question_type: q.question_type,
        question_text: q.question_text.trim(),
        options: needsOptions(q.question_type) ? q.options.filter(o => o.trim()) : null,
        correct_answer: q.correct_answer.trim(),
        explanation: q.explanation.trim() || null,
      }
    })

    const { error: questionError } = await supabase
      .from('reading_questions')
      .insert(questionInserts)

    if (questionError) {
      setError('Failed to create questions: ' + questionError.message)
      setSaving(false)
      return
    }

    setSuccess('Test created successfully!')
    setSaving(false)

    setTimeout(() => {
      window.location.href = '/admin'
    }, 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="text-2xl font-bold text-blue-600">
              IELTS Reading Simulator
            </Link>
            <Link
              href="/admin"
              className="text-gray-600 hover:text-blue-600"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-3xl font-bold mb-8">Create New Test</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Test Metadata */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Academic Reading Test 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Brief description of the test"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                  max={120}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Passages */}
        {passages.map((passage, pIndex) => (
          <div key={pIndex} className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Passage {passage.passage_number}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passage Title</label>
                <input
                  type="text"
                  value={passage.title}
                  onChange={(e) => updatePassage(pIndex, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., The History of Coffee"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={passage.content}
                  onChange={(e) => updatePassage(pIndex, 'content', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={10}
                  placeholder="Paste the reading passage text here..."
                />
              </div>
            </div>

            {/* Questions for this passage */}
            <div className="mt-6 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Questions for Passage {passage.passage_number} ({questions.filter(q => q.passage_index === pIndex).length})
                </h3>
                <button
                  type="button"
                  onClick={() => addQuestion(pIndex)}
                  className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Add Question
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((question, qIndex) => {
                  if (question.passage_index !== pIndex) return null
                  return (
                    <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium">Question {question.question_number}</span>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={question.question_type}
                            onChange={(e) => updateQuestion(qIndex, 'question_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            {QUESTION_TYPES.map(type => (
                              <option key={type} value={type}>
                                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                          <textarea
                            value={question.question_text}
                            onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                          />
                        </div>

                        {needsOptions(question.question_type) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                            {question.options.map((opt, optIdx) => (
                              <input
                                key={optIdx}
                                type="text"
                                value={opt}
                                onChange={(e) => updateOption(qIndex, optIdx, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                                placeholder={`Option ${optIdx + 1}`}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setQuestions(prev => prev.map((q, i) =>
                                  i === qIndex ? { ...q, options: [...q.options, ''] } : q
                                ))
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Add Option
                            </button>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                          <input
                            type="text"
                            value={question.correct_answer}
                            onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="The correct answer"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                          <textarea
                            value={question.explanation}
                            onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                            placeholder="Optional explanation for the answer"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Submit Buttons */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Publish'}
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
