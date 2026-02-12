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

  if (data.user) {
    const { error: dbError } = await supabase
      .from('users')
      .insert([{ id: data.user.id, email: data.user.email, role: 'user' }])
    
    if (dbError) return { error: dbError }
  }

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

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}

export const isAdmin = async () => {
  const { profile } = await getCurrentUser()
  return profile?.role === 'admin'
}
