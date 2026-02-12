'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase, ReadingTest, User } from '@/lib/supabase'

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tests, setTests] = useState<ReadingTest[]>([])
  const [loading, setLoading] = useState(true)

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
      await loadTests()
    } catch (err) {
      console.error('Auth check failed:', err)
      window.location.href = '/login'
    }
  }

  const loadTests = async () => {
    const { data } = await supabase
      .from('reading_tests')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setTests(data)
    setLoading(false)
  }

  const togglePublish = async (test: ReadingTest) => {
    const { error } = await supabase
      .from('reading_tests')
      .update({ is_published: !test.is_published })
      .eq('id', test.id)

    if (!error) {
      setTests(tests.map(t => t.id === test.id ? { ...t, is_published: !t.is_published } : t))
    }
  }

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This will also delete all associated passages, questions, and attempts.')) {
      return
    }

    const { error } = await supabase
      .from('reading_tests')
      .delete()
      .eq('id', testId)

    if (!error) {
      setTests(tests.filter(t => t.id !== testId))
    }
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
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
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
              IELTS Reading Simulator
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user?.email}</span>
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Link
            href="/admin/create-test"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Create New Test
          </Link>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-4">All Tests ({tests.length})</h2>
          {tests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No tests created yet. Click &quot;Create New Test&quot; to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <div key={test.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold">{test.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          test.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {test.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {test.description && (
                        <p className="text-gray-600 mb-2">{test.description}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Difficulty: {test.difficulty} · {test.time_limit_minutes} minutes · Created: {new Date(test.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => togglePublish(test)}
                        className={`px-4 py-2 rounded text-sm ${
                          test.is_published
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {test.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => deleteTest(test.id)}
                        className="px-4 py-2 rounded text-sm bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
