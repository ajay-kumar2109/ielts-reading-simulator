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

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { profile } = await getCurrentUser()
    if (!profile) {
      window.location.href = '/login'
      return
    }
    setUser(profile)
    await loadData(profile.id)
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
              {user?.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Admin
                </Link>
              )}
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
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Available Tests</h2>
            {tests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No tests available yet
              </div>
            ) : (
              <div className="space-y-4">
                {tests.map((test) => (
                  <div key={test.id} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-semibold mb-2">{test.title}</h3>
                    {test.description && (
                      <p className="text-gray-600 mb-2">{test.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mb-4">
                      Difficulty: {test.difficulty} · {test.time_limit_minutes} minutes
                    </p>
                    <Link
                      href={`/test/${test.id}`}
                      className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                      Start Test
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Recent Attempts</h2>
            {attempts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No attempts yet. Start a test to see your results here.
              </div>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => {
                  const test = tests.find(t => t.id === attempt.test_id)
                  return (
                    <div key={attempt.id} className="bg-white rounded-lg shadow p-6">
                      <h3 className="font-semibold mb-2">
                        {test?.title || 'Test'}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
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
                        className="inline-block mt-4 text-blue-600 hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
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
