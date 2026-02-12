import { supabase } from './supabase'

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character'
  }
  return null
}

export const signUp = async (email: string, password: string) => {
  const passwordError = validatePassword(password)
  if (passwordError) {
    return { data: null, error: { message: passwordError } }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) return { data: null, error }

  return { data, error: null }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Wait for the auth state to be ready (handles the localStorage race condition)
const waitForSession = (): Promise<any> => {
  return new Promise((resolve) => {
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        subscription.unsubscribe()
        resolve(null)
      }
    }, 5000)

    // Register listener BEFORE getSession to avoid missing INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (resolved) return
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        resolved = true
        clearTimeout(timeout)
        subscription.unsubscribe()
        resolve(session)
      }
    })
  })
}

export const getCurrentUser = async () => {
  try {
    const session = await waitForSession()

    if (!session?.user) return { user: null, profile: null }

    // Try to fetch existing profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      return { user: session.user, profile }
    }

    // Profile doesn't exist yet - create one automatically
    // This handles the case where signUp didn't create a users table row
    const { data: newProfile } = await supabase
      .from('users')
      .insert([{
        id: session.user.id,
        email: session.user.email,
        role: 'user',
      }])
      .select()
      .single()

    return { user: session.user, profile: newProfile }
  } catch (err) {
    console.error('getCurrentUser error:', err)
    return { user: null, profile: null }
  }
}

export const isAdmin = async () => {
  const { profile } = await getCurrentUser()
  return profile?.role === 'admin'
}
