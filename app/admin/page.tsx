'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut, isAdmin } from '@/lib/auth'
import { supabase, ReadingTest, User } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<ReadingTest[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const admin = await isAdmin()
    if (!admin) {
      router.push('/dashboard')
      return
    }
    await loadData()
  }

  const loadData = async () => {
    const { data: testsData } = await supabase
      .from('reading_tests')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (testsData) setTests(testsData)
    if (usersData) setUsers(usersData)
    setLoading(false)
  }

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This will also delete all related data.')) {
      return
    }

    await supabase.from('reading_answers').delete().eq('question_id', testId)
    await supabase.from('reading_attempts').delete().eq('test_id', testId)
    await supabase.from('reading_questions').delete().eq('test_id', testId)
    await supabase.from('reading_passages').delete().eq('test_id', testId)
    await supabase.from('reading_tests').delete().eq('id', testId)

    setTests(tests.filter(t => t.id !== testId))
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
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
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <div className="flex space-x-4">
              <Link 
                href="/dashboard"
                className="bg-purple-700 px-4 py-2 rounded hover:bg-purple-800"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-purple-700 px-4 py-2 rounded hover:bg-purple-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Tests Management</h2>
            <Link
              href="/admin/create-test"
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
            >
              Create New Test
            </Link>
          </div>

          {tests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No tests created yet
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tests.map((test) => (
                    <tr key={test.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{test.title}</div>
                        {test.description && (
                          <div className="text-sm text-gray-500">{test.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(test.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteTest(test.id)}
                          className="text-red-600 hover:text-red-900 ml-4"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
