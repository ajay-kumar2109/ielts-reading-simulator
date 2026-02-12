'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type Passage = {
  passage_number: number
  title: string
  content: string
}

type Question = {
  passage_number: number
  question_number: number
  type: 'multiple_choice' | 'true_false_not_given' | 'fill_blank'
  question_text: string
  options: string[]
  correct_answer: string
}

export default function CreateTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [passages, setPassages] = useState<Passage[]>([
    { passage_number: 1, title: '', content: '' },
    { passage_number: 2, title: '', content: '' },
    { passage_number: 3, title: '', content: '' },
  ])
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const admin = await isAdmin()
    if (!admin) {
      router.push('/dashboard')
      return
    }
    const { profile } = await getCurrentUser()
    if (profile) {
      setUserId(profile.id)
    }
    setLoading(false)
  }

  const handlePassageChange = (index: number, field: keyof Passage, value: string) => {
    const updated = [...passages]
    updated[index] = { ...updated[index], [field]: value }
    setPassages(updated)
  }

  const addQuestion = (passageNumber: number) => {
    const newQuestionNumber = questions.length + 1
    setQuestions([
      ...questions,
      {
        passage_number: passageNumber,
        question_number: newQuestionNumber,
        type: 'multiple_choice',
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
      },
    ])
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions]
    const options = [...updated[qIndex].options]
    options[optIndex] = value
    updated[qIndex].options = options
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index)
    updated.forEach((q, i) => {
      q.question_number = i + 1
    })
    setQuestions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (questions.length !== 40) {
      alert('You must create exactly 40 questions')
      return
    }

    setSubmitting(true)

    const { data: testData, error: testError } = await supabase
      .from('reading_tests')
      .insert([{ title, description, created_by: userId }])
      .select()
      .single()

    if (testError || !testData) {
      alert('Error creating test')
      setSubmitting(false)
      return
    }

    const passagesData = passages.map(p => ({
      test_id: testData.id,
      passage_number: p.passage_number,
      title: p.title || null,
      content: p.content,
    }))

    const { data: insertedPassages, error: passagesError } = await supabase
      .from('reading_passages')
      .insert(passagesData)
      .select()

    if (passagesError || !insertedPassages) {
      alert('Error creating passages')
      setSubmitting(false)
      return
    }

    const questionsData = questions.map(q => {
      const passage = insertedPassages.find(p => p.passage_number === q.passage_number)
      return {
        test_id: testData.id,
        passage_id: passage?.id,
        question_number: q.question_number,
        type: q.type,
        question_text: q.question_text,
        options: q.type === 'fill_blank' ? null : q.options,
        correct_answer: q.correct_answer,
      }
    })

    const { error: questionsError } = await supabase
      .from('reading_questions')
      .insert(questionsData)

    if (questionsError) {
      alert('Error creating questions')
      setSubmitting(false)
      return
    }

    router.push('/admin')
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
      <header className="bg-purple-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Create New Test</h1>
            <Link href="/admin" className="bg-purple-700 px-4 py-2 rounded hover:bg-purple-800">
              Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {passages.map((passage, pIndex) => (
            <div key={pIndex} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Passage {passage.passage_number}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={passage.title}
                    onChange={(e) => handlePassageChange(pIndex, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={passage.content}
                    onChange={(e) => handlePassageChange(pIndex, 'content', e.target.value)}
                    required
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addQuestion(passage.passage_number)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Question to Passage {passage.passage_number}
                </button>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Questions ({questions.length}/40)
            </h2>
            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold">
                      Question {question.question_number} (Passage {question.passage_number})
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Type
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false_not_given">True/False/Not Given</option>
                        <option value="fill_blank">Fill in the Blank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text
                      </label>
                      <input
                        type="text"
                        value={question.question_text}
                        onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {question.type === 'multiple_choice' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options
                        </label>
                        {question.options.map((option, oIndex) => (
                          <input
                            key={oIndex}
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                          />
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correct Answer
                      </label>
                      <input
                        type="text"
                        value={question.correct_answer}
                        onChange={(e) => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder={question.type === 'true_false_not_given' ? 'TRUE, FALSE, or NOT GIVEN' : 'Enter correct answer'}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || questions.length !== 40}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </form>
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
