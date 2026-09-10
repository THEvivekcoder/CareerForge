import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { login } from '../app/features/authSlice'
import api from '../configs/api'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react'

const FEATURES = [
  { label: 'ATS Checker',     desc: 'Score vs real job descriptions' },
  { label: 'AI Interview',    desc: 'Adaptive mock interviews'        },
  { label: 'Job Match',       desc: 'AI-ranked role recommendations'  },
  { label: 'Salary Intel',    desc: 'Market salary from your resume'  },
]

function Field({ icon: Icon, type, name, placeholder, value, onChange, right }) {
  return (
    <div className='relative'>
      <Icon className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none'
        style={{ color: 'var(--t2)' }} />
      <input
        type={type} name={name} placeholder={placeholder}
        value={value} onChange={onChange} required
        style={{ paddingLeft: '2.25rem', paddingRight: right ? '2.5rem' : '.75rem' }}
      />
      {right && (
        <div className='absolute right-3 top-1/2 -translate-y-1/2'>{right}</div>
      )}
    </div>
  )
}

export default function Login() {
  const dispatch = useDispatch()
  const query    = new URLSearchParams(window.location.search)
  const [state,   setState]   = useState(query.get('state') || 'login')
  const [showPw,  setShowPw]  = useState(false)
  const [form,    setForm]    = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await api.post(`/api/users/${state}`, form)
      dispatch(login(data))
      localStorage.setItem('token', data.token)
      toast.success(data.message)
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className='min-h-dvh flex' style={{ background: 'var(--bg)' }}>

      {/* ── Left brand panel ── */}
      <div className='hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden'
        style={{ background: 'var(--rail-bg)', borderRight: '1px solid rgba(255,255,255,.06)' }}>
        {/* Grid texture */}
        <div className='absolute inset-0 opacity-[.03]'
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
        {/* Accent blob */}
        <div className='absolute bottom-0 left-0 w-64 h-64 rounded-full -translate-x-1/2 translate-y-1/2'
          style={{ background: 'var(--a)', filter: 'blur(80px)', opacity: .2 }} />

        <div className='relative'>
          <div className='flex items-center gap-2.5 mb-12'>
            <div className='size-8 rounded-xl flex items-center justify-center'
              style={{ background: 'var(--a)', boxShadow: '0 0 16px var(--a-glow)' }}>
              <Zap className='size-4 text-white' strokeWidth={2.5} />
            </div>
            <span className='text-white font-bold text-sm tracking-tight'>CareerForge</span>
          </div>

          <h2 className='text-3xl font-bold text-white leading-tight mb-3'>
            Your AI<br />career studio.
          </h2>
          <p className='text-sm leading-relaxed mb-10' style={{ color: '#6b6b85' }}>
            Build, analyse, practise, predict — everything your career needs, in one place.
          </p>

          <div className='space-y-2.5'>
            {FEATURES.map(f => (
              <div key={f.label} className='flex items-center gap-3 py-2.5 px-3 rounded-lg'
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                <div className='size-1.5 rounded-full flex-shrink-0' style={{ background: 'var(--a-hi)' }} />
                <div>
                  <p className='text-xs font-semibold text-white'>{f.label}</p>
                  <p className='text-xs' style={{ color: '#6b6b85' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className='relative text-xs' style={{ color: '#3a3a50' }}>© 2025 CareerForge</p>
      </div>

      {/* ── Auth form ── */}
      <div className='flex-1 flex items-center justify-center px-6'>
        <div className='w-full max-w-sm cf-enter'>

          {/* Mobile logo */}
          <div className='flex items-center gap-2 mb-8 lg:hidden'>
            <div className='size-7 rounded-lg flex items-center justify-center'
              style={{ background: 'var(--a)' }}>
              <Zap className='size-3.5 text-white' strokeWidth={2.5} />
            </div>
            <span className='text-sm font-bold' style={{ color: 'var(--t0)' }}>CareerForge</span>
          </div>

          <h1 className='text-2xl font-bold mb-1' style={{ color: 'var(--t0)' }}>
            {state === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className='text-sm mb-7' style={{ color: 'var(--t2)' }}>
            {state === 'login' ? 'Sign in to your workspace' : 'Start your AI career journey'}
          </p>

          <form onSubmit={onSubmit} className='space-y-3'>
            {state === 'register' && (
              <Field icon={User} type='text' name='name' placeholder='Full name'
                value={form.name} onChange={onChange} />
            )}
            <Field icon={Mail} type='email' name='email' placeholder='Email'
              value={form.email} onChange={onChange} />
            <Field icon={Lock} type={showPw ? 'text' : 'password'} name='password' placeholder='Password'
              value={form.password} onChange={onChange}
              right={
                <button type='button' onClick={() => setShowPw(v => !v)}
                  className='p-0.5 transition-opacity hover:opacity-70'
                  style={{ color: 'var(--t2)' }}>
                  {showPw ? <EyeOff className='size-3.5' /> : <Eye className='size-3.5' />}
                </button>
              }
            />

            {state === 'login' && (
              <div className='text-right'>
                <button type='button' className='text-xs hover:opacity-70 transition-opacity'
                  style={{ color: 'var(--a)' }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button type='submit' disabled={loading}
              className='cf-btn cf-btn-primary w-full h-10 text-sm mt-1 disabled:opacity-60'>
              {loading
                ? <span className='size-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                : <>{state === 'login' ? 'Sign in' : 'Create account'} <ArrowRight className='size-4' /></>}
            </button>
          </form>

          <p className='text-center text-xs mt-6' style={{ color: 'var(--t2)' }}>
            {state === 'login' ? "No account? " : 'Have an account? '}
            <button onClick={() => setState(s => s === 'login' ? 'register' : 'login')}
              className='font-semibold hover:opacity-70 transition-opacity'
              style={{ color: 'var(--a)' }}>
              {state === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
