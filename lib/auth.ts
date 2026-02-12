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
    return { error: { message: passwordError } }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) return { error }

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
    // First try getSession
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        resolve(session)
        return
      }
      
      // If no session yet, wait for onAuthStateChange INITIAL_SESSION event
      const timeout = setTimeout(() => {
        resolve(null)
      }, 3000)
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          clearTimeout(timeout)
          subscription.unsubscribe()
          resolve(session)
        }
      })
    })
  })
}

export const getCurrentUser = async () => {
  const session = await waitForSession()
  
  if (!session?.user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return { user: session.user, profile }
}

export const isAdmin = async () => {
  const { profile } = await getCurrentUser()
  return profile?.role === 'admin'
}
