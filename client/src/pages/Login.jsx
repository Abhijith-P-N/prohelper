import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, User, ArrowRight, Loader2, AlertTriangle, CheckCircle2, Settings2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabaseEnabled } from '../lib/supabase'

export default function Login() {
  const { signIn, signUp, resetPassword, configured, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (user) navigate('/app/dashboard', { replace: true })
  }, [user, navigate])

  if (user) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/app/dashboard')
      } else {
        const result = await signUp(email, password, name)
        if (result === 'confirm') {
          setNotice('Account created. Confirm your email to finish signing in.')
        } else {
          navigate('/app/dashboard')
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const forgot = async () => {
    if (!email) return setError('Enter your email first, then click reset.')
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setNotice('Password reset link sent — check your inbox.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="mesh-bg absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[640px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dim shadow-glow">
            <Shield size={19} className="text-base-950" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Secure<span className="text-accent">Sync</span>
          </span>
        </div>

        {!supabaseEnabled && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn/10 p-4 text-xs leading-relaxed text-warn">
            <Settings2 size={15} className="mt-0.5 shrink-0" />
            <span>
              Supabase is not configured yet. Create a project at{' '}
              <span className="font-mono">supabase.com</span>, run{' '}
              <span className="font-mono">supabase/schema.sql</span>, then set{' '}
              <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> in{' '}
              <span className="font-mono">client/.env</span> and restart.
            </span>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="panel p-6">
          <div className="flex gap-1 rounded-lg border border-white/5 bg-base-900/70 p-1">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setNotice(''); setName(''); setPassword('') }}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize transition-colors ${
                  mode === m ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Display name</label>
                <div className="relative">
                  <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
                </div>
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@team.com" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {mode === 'login' && (
                <button type="button" onClick={forgot} disabled={loading} className="mt-1.5 text-[11px] font-medium text-slate-500 hover:text-accent">
                  Forgot password?
                </button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            {notice && (
              <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
                <CheckCircle2 size={14} /> {notice}
              </div>
            )}

            <button type="submit" disabled={loading || !configured} className="btn-primary w-full">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
              {loading ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {configured && (
            <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-600">
              Protected by Supabase Auth · sessions rotate automatically · failed attempts are
              rate-limited and logged
            </p>
          )}
        </motion.div>

        <p className="mt-5 text-center font-mono text-[10px] tracking-widest text-slate-600">
          ENCRYPTED SESSION · SINGLE SOURCE OF TRUTH · LIVE SUPABASE POSTGRES
        </p>
      </div>
    </div>
  )
}