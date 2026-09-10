import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../app/features/authSlice'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutGrid, ScanSearch, Briefcase, Mic2, IndianRupee,
  Newspaper, LogOut, Sun, Moon, Monitor, Menu, X, Zap,
} from 'lucide-react'

const NAV = [
  { to: '/app',                   icon: LayoutGrid,   label: 'Dashboard',        exact: true },
  { to: '/app/ats-checker',       icon: ScanSearch,   label: 'ATS Checker'       },
  { to: '/app/job-recommendation',icon: Briefcase,    label: 'Job Match'         },
  { to: '/app/interview',         icon: Mic2,         label: 'AI Interview'      },
  { to: '/app/salary',            icon: IndianRupee,  label: 'Salary'            },
  { to: '/app/news',              icon: Newspaper,    label: 'Career News'       },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const opts = [
    { v: 'light', icon: Sun   },
    { v: 'dark',  icon: Moon  },
    { v: 'system',icon: Monitor },
  ]
  return (
    <div className='flex items-center gap-0.5 rounded-lg p-0.5'
      style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)' }}>
      {opts.map(({ v, icon: Icon }) => (
        <button key={v} onClick={() => setTheme(v)} title={v}
          className='p-1.5 rounded-md transition-all'
          style={{
            background: theme === v ? 'var(--a-glow)' : 'transparent',
            color: theme === v ? '#c4b5fd' : 'var(--rail-t)',
          }}>
          <Icon className='size-3.5' />
        </button>
      ))}
    </div>
  )
}

// The rail that shows in the /app shell
export default function AppRail() {
  const { user }  = useSelector(s => s.auth)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [exp, setExp] = useState(false)  // expanded label mode

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)

  const logoutUser = () => { navigate('/'); dispatch(logout()) }

  return (
    <>
      {/* ── Desktop rail ── */}
      <nav
        className='cf-rail hidden lg:flex flex-col'
        onMouseEnter={() => setExp(true)}
        onMouseLeave={() => setExp(false)}
        style={{ width: exp ? '220px' : '56px' }}
      >
        {/* Logo mark */}
        <div className='flex items-center gap-2.5 px-3.5 py-4 mb-1' style={{ minHeight: 56 }}>
          <div className='flex-shrink-0 size-7 rounded-lg flex items-center justify-center'
            style={{ background: 'var(--a)', boxShadow: '0 0 12px var(--a-glow)' }}>
            <Zap className='size-3.5 text-white' strokeWidth={2.5} />
          </div>
          {exp && (
            <span className='text-white font-bold text-sm tracking-tight whitespace-nowrap cf-enter'>
              CareerForge
            </span>
          )}
        </div>

        <div className='flex-1 flex flex-col gap-0.5 px-1.5 overflow-y-auto overflow-x-hidden'>
          {NAV.map(item => {
            const Icon  = item.icon
            const active = isActive(item)
            return (
              <Link key={item.to} to={item.to}
                className='cf-rail-item'
                style={active ? { background: 'var(--a-glow)', color: '#c4b5fd' } : {}}>
                <Icon className='icon flex-shrink-0' strokeWidth={active ? 2 : 1.75} />
                {exp && (
                  <span className='truncate cf-enter text-xs'>{item.label}</span>
                )}
                {active && !exp && (
                  <span className='absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r'
                    style={{ background: 'var(--a)' }} />
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom controls */}
        <div className='p-2 flex flex-col gap-2 items-center' style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
          {exp ? <ThemeToggle /> : null}
          <button onClick={logoutUser} title='Logout'
            className='cf-rail-item justify-center' style={{ width: 'auto', padding: '.5rem' }}>
            <LogOut className='size-4' strokeWidth={1.75} />
            {exp && <span className='text-xs cf-enter'>Sign out</span>}
          </button>
          {/* Avatar */}
          <div className='flex items-center gap-2 px-1'>
            <div className='size-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0'
              style={{ background: 'var(--a)', boxShadow: '0 0 8px var(--a-glow)' }}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {exp && (
              <div className='min-w-0 cf-enter'>
                <p className='text-xs font-medium text-white truncate leading-tight'>{user?.name}</p>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile top bar (only rendered inside /app Layout) ── */}
      <MobileBar user={user} onLogout={logoutUser} />
    </>
  )
}

function MobileBar({ user, onLogout }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const currentLabel = NAV.find(n =>
    n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )?.label ?? 'App'

  return (
    <>
      <header className='lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-12'
        style={{ background: 'var(--s0)', borderBottom: '1px solid var(--b0)' }}>
        <div className='flex items-center gap-2'>
          <div className='size-6 rounded-md flex items-center justify-center'
            style={{ background: 'var(--a)' }}>
            <Zap className='size-3 text-white' strokeWidth={2.5} />
          </div>
          <span className='text-xs font-bold' style={{ color: 'var(--t0)' }}>CareerForge</span>
          <span className='text-xs' style={{ color: 'var(--t2)' }}>/ {currentLabel}</span>
        </div>
        <button onClick={() => setOpen(true)} style={{ color: 'var(--t1)' }}>
          <Menu className='size-5' />
        </button>
      </header>

      {open && (
        <div className='fixed inset-0 z-50 lg:hidden'>
          <div className='absolute inset-0 bg-black/70' onClick={() => setOpen(false)} />
          <nav className='absolute left-0 top-0 bottom-0 w-64 flex flex-col cf-enter'
            style={{ background: 'var(--rail-bg)', borderRight: '1px solid rgba(255,255,255,.06)' }}>
            <div className='flex items-center justify-between px-4 py-3.5' style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div className='flex items-center gap-2'>
                <div className='size-6 rounded-md flex items-center justify-center' style={{ background: 'var(--a)' }}>
                  <Zap className='size-3 text-white' strokeWidth={2.5} />
                </div>
                <span className='text-sm font-bold text-white'>CareerForge</span>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--rail-t)' }}>
                <X className='size-4' />
              </button>
            </div>
            <div className='flex-1 p-2 overflow-y-auto'>
              {NAV.map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                    className='cf-rail-item' style={{ width: '100%' }}>
                    <Icon className='icon' strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className='p-3 flex items-center justify-between' style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <div className='flex items-center gap-2'>
                <div className='size-7 rounded-full flex items-center justify-center text-xs font-bold text-white'
                  style={{ background: 'var(--a)' }}>
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className='text-xs font-medium text-white'>{user?.name}</span>
              </div>
              <button onClick={onLogout} style={{ color: 'var(--rail-t)' }}>
                <LogOut className='size-4' />
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}

/* ── PageShell — used by every tool page ── */
export function PageShell({ children, title, eyebrow, action }) {
  const { theme, setTheme } = useTheme()
  return (
    <div className='flex-1 flex flex-col min-h-dvh' style={{ background: 'var(--bg)' }}>
      {/* Top strip */}
      <div className='hidden lg:flex items-center justify-between px-7 py-3 sticky top-0 z-20'
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--b0)' }}>
        <div>
          {eyebrow && (
            <p className='cf-section-label mb-0.5'>{eyebrow}</p>
          )}
          {title && (
            <h1 className='text-base font-semibold tracking-tight' style={{ color: 'var(--t0)' }}>{title}</h1>
          )}
        </div>
        <div className='flex items-center gap-3'>
          {action}
          {/* Theme toggle in top bar for desktop */}
          <div className='flex items-center gap-0.5 rounded-lg p-0.5'
            style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
            {[['light', Sun], ['dark', Moon], ['system', Monitor]].map(([v, Icon]) => (
              <button key={v} onClick={() => setTheme(v)} title={v}
                className='p-1.5 rounded-md transition-all'
                style={{
                  background: theme === v ? 'var(--a-glow)' : 'transparent',
                  color: theme === v ? 'var(--a-hi)' : 'var(--t2)',
                }}>
                <Icon className='size-3.5' />
              </button>
            ))}
          </div>
        </div>
      </div>
      <main className='flex-1 w-full'>
        {children}
      </main>
    </div>
  )
}
