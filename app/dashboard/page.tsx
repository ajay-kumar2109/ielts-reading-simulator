'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase, ReadingTest, ReadingAttempt, User } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tests, setTests] = useState<ReadingTest[]>([])
  const [attempts, setAttempts] = useState<ReadingAttempt[]>([])
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
      setUser(profile)
      await loadData(profile.id)
    } catch (err) {
      console.error('Auth check failed:', err)
      window.location.href = '/login'
    }
  }

  const loadData = async (userId: string) => {
    const { data: testsData } = await supabase
      .from('reading_tests')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    const { data: attemptsData } = await supabase
      .from('reading_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(10)

    if (testsData) setTests(testsData)
    if (attemptsData) setAttempts(attemptsData)
    setLoading(false)
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
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm min-h-[44px] flex items-center"
                >
                  Admin
                </Link>
              )}
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
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="block bg-purple-600 text-white px-4 py-3 rounded hover:bg-purple-700 text-sm text-center min-h-[44px]"
                >
                  Admin Panel
                </Link>
              )}
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Available Tests</h2>
            {tests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-5 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                No tests available yet
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {tests.map((test) => (
                  <div key={test.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{test.title}</h3>
                    {test.description && (
                      <p className="text-gray-600 mb-2 text-sm sm:text-base">{test.description}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                      Difficulty: {test.difficulty} &middot; {test.time_limit_minutes} minutes
                    </p>
                    <Link
                      href={`/test/${test.id}`}
                      className="inline-flex items-center justify-center bg-blue-600 text-white px-5 sm:px-6 py-2.5 sm:py-2 rounded hover:bg-blue-700 text-sm sm:text-base min-h-[44px]"
                    >
                      Start Test
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Recent Attempts</h2>
            {attempts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-5 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                No attempts yet. Start a test to see your results here.
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {attempts.map((attempt) => {
                  const test = tests.find(t => t.id === attempt.test_id)
                  return (
                    <div key={attempt.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">
                        {test?.title || 'Test'}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">Score:</span>{' '}
                          <span className="font-semibold">{attempt.score}/40</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Band:</span>{' '}
                          <span className="font-semibold text-blue-600">{attempt.band_score}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Time:</span>{' '}
                          <span className="font-semibold">
                            {attempt.time_spent_seconds ? `${Math.floor(attempt.time_spent_seconds / 60)}m` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>{' '}
                          <span className="font-semibold">
                            {new Date(attempt.started_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/results/${attempt.id}`}
                        className="inline-block mt-3 sm:mt-4 text-blue-600 hover:underline text-sm sm:text-base min-h-[44px] flex items-center"
                      >
                        View Details &rarr;
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
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
