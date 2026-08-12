import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_MODE, supabase, supabaseEnabled } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState('')
  const configured = supabaseEnabled && AUTH_MODE === 'supabase'

  useEffect(() => {
    if (!supabase) {
      setInitializing(false)
      return undefined
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitializing(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setInitializing(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null

  const signIn = async (email, password) => {
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(cleanAuthError(err.message))
      throw err
    }
  }

  const signUp = async (email, password) => {
    setError('')
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/app/dashboard' },
    })
    if (err) {
      setError(cleanAuthError(err.message))
      throw err
    }
    return data.user && data.user.identities?.length === 0 ? 'confirm' : 'session'
  }

  const resetPassword = async (email) => {
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/app/settings',
    })
    if (err) {
      setError(cleanAuthError(err.message))
      throw err
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = useMemo(
    () => ({
      user,
      session,
      signIn,
      signUp,
      resetPassword,
      signOut,
      configured,
      initializing,
      error,
      isSupabase: configured,
    }),
    [user, session, configured, initializing, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function cleanAuthError(message = '') {
  const m = String(message)
  if (m.includes('Invalid login credentials')) return 'Incorrect email or password.'
  if (m.includes('Email not confirmed')) return 'Please confirm your email first — check your inbox.'
  if (m.toLowerCase().includes('rate limit') || m.includes('429')) return 'Too many attempts. Wait a moment and try again.'
  if (m.includes('Password should be')) return 'Password is too weak (min 6 characters).'
  return m
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}