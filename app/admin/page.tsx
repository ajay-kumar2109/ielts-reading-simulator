'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase, ReadingTest, User } from '@/lib/supabase'

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tests, setTests] = useState<ReadingTest[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

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
        <div className="text-lg sm:text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-lg sm:text-2xl font-bold text-blue-600">
              IELTS Reading Simulator
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-gray-600 text-sm truncate max-w-[200px]">{user?.email}</span>
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm min-h-[44px] flex items-center"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm min-h-[44px]"
              >
                Logout
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-gray-200 space-y-3 pb-2">
              <p className="text-gray-600 text-sm truncate">{user?.email}</p>
              <Link
                href="/dashboard"
                className="block bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 text-sm text-center min-h-[44px]"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-600 text-white px-4 py-3 rounded hover:bg-gray-700 text-sm min-h-[44px]"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
          <Link
            href="/admin/create-test"
            className="inline-flex items-center justify-center bg-green-600 text-white px-5 sm:px-6 py-2.5 sm:py-2 rounded hover:bg-green-700 text-sm sm:text-base min-h-[44px]"
          >
            Create New Test
          </Link>
        </div>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">All Tests ({tests.length})</h2>
          {tests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-5 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
              No tests created yet. Click &quot;Create New Test&quot; to get started.
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {tests.map((test) => (
                <div key={test.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-xl font-semibold">{test.title}</h3>
                        <span className={`px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${
                          test.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {test.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {test.description && (
                        <p className="text-gray-600 mb-2 text-sm">{test.description}</p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-500">
                        Difficulty: {test.difficulty} &middot; {test.time_limit_minutes} minutes &middot; Created: {new Date(test.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                      <Link
                        href={`/admin/create-test?edit=${test.id}`}
                        className="px-3 sm:px-4 py-2 rounded text-xs sm:text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 min-h-[44px] flex items-center"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => togglePublish(test)}
                        className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm min-h-[44px] ${
                          test.is_published
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {test.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => deleteTest(test.id)}
                        className="px-3 sm:px-4 py-2 rounded text-xs sm:text-sm bg-red-100 text-red-800 hover:bg-red-200 min-h-[44px]"
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

      <footer className="bg-gray-900 text-white py-6 sm:py-8 mt-8 sm:mt-12">
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
