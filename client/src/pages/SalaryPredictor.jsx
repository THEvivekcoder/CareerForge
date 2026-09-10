import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import {
  IndianRupee, Loader2, Sparkles, TrendingUp, CheckCircle2,
  AlertCircle, Target, MapPin, Zap, BarChart3, BookOpen,
  ChevronDown, ChevronUp, RefreshCw, User,
} from 'lucide-react'
import pdfToText from 'react-pdftotext'
import PageWrapper from '../components/PageWrapper'

/* ── helpers ── */
const DEMAND_COLOR = { 'Very High': '#10b981', 'High': '#3b82f6', 'Medium': '#f59e0b', 'Low': '#ef4444' }
const IMPACT_COLOR = { 'Very High': '#10b981', 'High': '#3b82f6', 'Medium': '#f59e0b', 'Low': '#9ca3af' }
const TIMEFRAME_ACCENT = { '0-3 months': '#3b82f6', '3-6 months': '#8b5cf6', '6-12 months': '#10b981' }

const confLabel = (n) => n >= 80 ? 'High' : n >= 60 ? 'Moderate' : 'Low'
const confColor = (n) => n >= 80 ? '#10b981' : n >= 60 ? '#f59e0b' : '#ef4444'

/* ── Salary range visual ── */
const SalaryBar = ({ min, max, median }) => {
  const lo  = Math.max(0, min - 2)
  const hi  = max + 2
  const span = hi - lo
  const pct  = v => ((v - lo) / span) * 100
  return (
    <div className='relative h-6 rounded-full mt-4 mb-8' style={{ background: 'var(--s2)' }}>
      <div className='absolute top-0 h-full rounded-full' style={{
        left: `${pct(min)}%`, width: `${pct(max) - pct(min)}%`,
        background: 'var(--a)', opacity: .25,
      }} />
      {[
        { v: min,    size: 10, label: `₹${min}L`, pos: 'bottom' },
        { v: median, size: 14, label: `₹${median}L`, pos: 'top', bold: true },
        { v: max,    size: 10, label: `₹${max}L`, pos: 'bottom' },
      ].map(({ v, size, label, pos, bold }) => (
        <div key={v} className='absolute top-1/2 -translate-y-1/2 flex flex-col items-center' style={{ left: `${pct(v)}%` }}>
          <div className='rounded-full border-2 border-white' style={{ width: size, height: size, background: 'var(--a)' }} />
          <span className='absolute whitespace-nowrap text-xs'
            style={{
              [pos === 'top' ? 'bottom' : 'top']: '100%',
              color: 'var(--a-hi)',
              fontWeight: bold ? 700 : 500,
              fontSize: bold ? '0.75rem' : '0.6875rem',
            }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Expandable skill pill ── */
const SkillPill = ({ skill, impact, premiumNote }) => {
  const [open, setOpen] = useState(false)
  const color = IMPACT_COLOR[impact] || '#9ca3af'
  return (
    <div style={{ border: '1px solid var(--b0)', borderRadius: 8, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)}
        className='w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors'
        style={{ background: open ? 'var(--s1)' : 'transparent' }}>
        <span className='size-2 rounded-full flex-shrink-0' style={{ background: color }} />
        <span className='flex-1 text-xs font-medium' style={{ color: 'var(--t0)' }}>{skill}</span>
        <span className='text-xs font-semibold px-2 py-0.5 rounded'
          style={{ color, background: color + '18', border: `1px solid ${color}35` }}>{impact}</span>
        {open ? <ChevronUp className='size-3' style={{ color: 'var(--t3)' }} /> : <ChevronDown className='size-3' style={{ color: 'var(--t3)' }} />}
      </button>
      {open && premiumNote && (
        <p className='px-3 pb-2.5 text-xs' style={{ color: 'var(--t2)', borderTop: '1px solid var(--b0)' }}>
          {premiumNote}
        </p>
      )}
    </div>
  )
}

/* ── Page ── */
export default function SalaryPredictor() {
  const { token } = useSelector(s => s.auth)
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [mode,       setMode]       = useState('text')
  const [analyzing,  setAnalyzing]  = useState(false)
  const [result,     setResult]     = useState(null)
  const [step,       setStep]       = useState('idle')

  const onFile = async (e) => {
    const f = e.target.files[0]; if (!f) return
    setResumeFile(f)
    try { setResumeText(await pdfToText(f)); toast.success('PDF parsed') }
    catch { toast.error('Could not read PDF') }
  }

  const predict = async () => {
    if (!resumeText.trim()) return toast.error('Add your resume first')
    setAnalyzing(true); setResult(null); setStep('parsing')
    try {
      setTimeout(() => setStep('predicting'), 2500)
      const { data } = await api.post('/api/ai/salary-predict',
        { resumeText: resumeText.trim() }, { headers: { Authorization: token } })
      setResult(data); setStep('done')
    } catch (e) { toast.error(e?.response?.data?.message || e.message); setStep('idle') }
    finally { setAnalyzing(false) }
  }

  const reset = () => { setResult(null); setResumeText(''); setResumeFile(null); setStep('idle') }

  const Card = ({ children, className = '' }) => (
    <div className={`cf-surface p-5 ${className}`}>{children}</div>
  )
  const SecLabel = ({ icon: Icon, iconColor = 'var(--a)', children }) => (
    <p className='cf-section-label mb-3 flex items-center gap-1.5'>
      <Icon className='size-3' style={{ color: iconColor }} />{children}
    </p>
  )
  const ModeBtn = ({ v, label }) => (
    <button onClick={() => setMode(v)} className='px-2.5 py-1 text-xs rounded-md font-medium transition-all'
      style={{ background: mode === v ? 'var(--s0)' : 'transparent', color: mode === v ? 'var(--t0)' : 'var(--t2)' }}>
      {label}
    </button>
  )

  return (
    <PageWrapper eyebrow='Career Intelligence' title='Salary Predictor' maxWidth='60rem'>

      {!result && (
        <div className='max-w-xl mx-auto space-y-4'>
          <Card>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-xs font-bold' style={{ color: 'var(--t0)' }}>Your Resume</p>
              <div className='flex p-0.5 rounded-md' style={{ background: 'var(--s2)' }}>
                <ModeBtn v='text' label='Paste' />
                <ModeBtn v='pdf'  label='PDF'   />
              </div>
            </div>

            {mode === 'text'
              ? <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={12}
                  placeholder='Paste your full resume — skills, experience, education…' />
              : (
                <label className='flex flex-col items-center gap-2 py-10 cursor-pointer rounded-xl'
                  style={{ border: '1px dashed var(--b1)', background: 'var(--s1)' }}>
                  <IndianRupee className='size-7' style={{ color: resumeFile ? 'var(--ok)' : 'var(--t3)' }} />
                  <p className='text-xs' style={{ color: resumeFile ? 'var(--ok)' : 'var(--t2)' }}>
                    {resumeFile ? resumeFile.name : 'Click to upload PDF'}
                  </p>
                  <input type='file' accept='.pdf' hidden onChange={onFile} />
                </label>
              )}

            {analyzing && (
              <div className='mt-3 flex flex-col gap-2 p-3 rounded-xl' style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
                {[
                  { k: 'parsing',    label: 'Extracting candidate profile…' },
                  { k: 'predicting', label: 'Running salary analysis…' },
                ].map(({ k, label }) => {
                  const done = step === 'done' || (step === 'predicting' && k === 'parsing')
                  return (
                    <div key={k} className='flex items-center gap-2 text-xs'>
                      {step === k
                        ? <Loader2 className='size-3.5 animate-spin' style={{ color: 'var(--a)' }} />
                        : <CheckCircle2 className='size-3.5' style={{ color: done ? 'var(--ok)' : 'var(--t3)' }} />}
                      <span style={{ color: done ? 'var(--t2)' : step === k ? 'var(--t0)' : 'var(--t3)', textDecoration: done ? 'line-through' : 'none' }}>
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <button onClick={predict} disabled={analyzing}
              className='cf-btn cf-btn-primary w-full h-10 text-sm mt-4 disabled:opacity-50'>
              {analyzing
                ? <><Loader2 className='size-4 animate-spin' /> Analyzing…</>
                : <><Sparkles className='size-4' /> Predict My Salary</>}
            </button>
          </Card>
        </div>
      )}

      {result && (
        <div className='space-y-4'>
          {/* Profile strip */}
          <Card>
            <div className='flex items-center gap-3 flex-wrap'>
              <div className='size-8 rounded-lg flex items-center justify-center'
                style={{ background: 'var(--a-glow)', color: 'var(--a-hi)' }}>
                <User className='size-4' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-bold' style={{ color: 'var(--t0)' }}>{result.profile?.jobRole || 'Your Profile'}</p>
                <p className='text-xs' style={{ color: 'var(--t2)' }}>
                  {result.profile?.yearsOfExperience > 0
                    ? `${result.profile.yearsOfExperience}y exp`
                    : 'Fresher'} · {result.profile?.experienceLevel} · {result.profile?.education}
                  {result.profile?.location ? ` · ${result.profile.location}` : ''}
                </p>
              </div>
              <div className='flex flex-wrap gap-1'>
                {result.profile?.topSkills?.map(s => (
                  <span key={s} className='cf-tag' style={{ color: 'var(--a-hi)', borderColor: 'var(--a-lo)', background: 'var(--a-glow)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Salary hero */}
          <Card>
            <SecLabel icon={IndianRupee}>Estimated Annual Salary</SecLabel>
            <div className='flex items-start justify-between gap-4 flex-wrap'>
              <div>
                <div className='flex items-baseline gap-1.5'>
                  <span className='text-4xl font-black tracking-tight' style={{ color: 'var(--t0)' }}>
                    ₹{result.salaryRange?.min}–{result.salaryRange?.max}
                  </span>
                  <span className='text-base font-semibold' style={{ color: 'var(--t2)' }}>LPA</span>
                </div>
                <p className='text-xs mt-1' style={{ color: 'var(--t2)' }}>
                  Median estimate: <span className='font-bold' style={{ color: 'var(--a-hi)' }}>₹{result.medianEstimate} LPA</span>
                </p>
              </div>
              <div className='flex flex-col gap-2 items-end'>
                <div className='cf-tag' style={{ color: confColor(result.confidenceScore), borderColor: confColor(result.confidenceScore) + '40', background: confColor(result.confidenceScore) + '10' }}>
                  <Target className='size-3' /> {result.confidenceScore}% · {confLabel(result.confidenceScore)} confidence
                </div>
                {result.marketDemand && (
                  <div className='cf-tag'
                    style={{ color: DEMAND_COLOR[result.marketDemand] || '#9ca3af', borderColor: (DEMAND_COLOR[result.marketDemand] || '#9ca3af') + '40', background: (DEMAND_COLOR[result.marketDemand] || '#9ca3af') + '10' }}>
                    <span className='size-1.5 rounded-full' style={{ background: DEMAND_COLOR[result.marketDemand] || '#9ca3af' }} />
                    {result.marketDemand} demand
                  </div>
                )}
              </div>
            </div>
            <SalaryBar min={result.salaryRange?.min} max={result.salaryRange?.max} median={result.medianEstimate} />
            {result.locationImpact?.label && (
              <div className='flex items-center gap-2 p-2.5 rounded-lg' style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
                <MapPin className='size-3.5 flex-shrink-0' style={{ color: 'var(--info)' }} />
                <p className='text-xs' style={{ color: 'var(--t1)' }}>
                  <span className='font-semibold'>{result.locationImpact.label}</span>
                  {result.locationImpact.adjustment && ` · ${result.locationImpact.adjustment}`}
                </p>
              </div>
            )}
          </Card>

          {/* Strengths + Skills to improve */}
          <div className='grid sm:grid-cols-2 gap-4'>
            {result.strengths?.length > 0 && (
              <Card>
                <SecLabel icon={CheckCircle2} iconColor='var(--ok)'>Strengths</SecLabel>
                <ul className='space-y-1.5'>
                  {result.strengths.map((s, i) => (
                    <li key={i} className='flex items-start gap-2 text-xs' style={{ color: 'var(--t1)' }}>
                      <span style={{ color: 'var(--ok)' }}>✓</span>{s}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {result.skillsToImprove?.length > 0 && (
              <Card>
                <SecLabel icon={TrendingUp} iconColor='var(--warn)'>Skills to Improve</SecLabel>
                <div className='space-y-2.5'>
                  {result.skillsToImprove.map((item, i) => (
                    <div key={i} className='flex items-start gap-2'>
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs font-semibold' style={{ color: 'var(--t0)' }}>{item.skill}</p>
                        <p className='text-xs mt-0.5' style={{ color: 'var(--t2)' }}>{item.reason}</p>
                      </div>
                      {item.potentialUplift && (
                        <span className='cf-tag flex-shrink-0' style={{ color: 'var(--ok)', borderColor: 'rgba(16,185,129,.3)', background: 'rgba(16,185,129,.08)' }}>
                          {item.potentialUplift}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Skill impact */}
          {result.skillImpact?.length > 0 && (
            <Card>
              <SecLabel icon={Zap}>Skill Market Impact</SecLabel>
              <div className='space-y-1'>
                {result.skillImpact.map((item, i) => <SkillPill key={i} {...item} />)}
              </div>
            </Card>
          )}

          {/* Roadmap */}
          {result.growthRoadmap?.length > 0 && (
            <Card>
              <div className='flex items-center justify-between mb-3'>
                <SecLabel icon={BookOpen}>6–12 Month Roadmap</SecLabel>
                {result.targetSalaryAt12Months && (
                  <span className='cf-tag' style={{ color: 'var(--ok)', borderColor: 'rgba(16,185,129,.3)', background: 'rgba(16,185,129,.08)' }}>
                    Target ₹{result.targetSalaryAt12Months} LPA
                  </span>
                )}
              </div>
              <div className='space-y-2'>
                {result.growthRoadmap.map((s, i) => {
                  const accent = TIMEFRAME_ACCENT[s.timeframe] || 'var(--a)'
                  return (
                    <div key={i} className='flex gap-3 p-3 rounded-xl'
                      style={{ background: accent + '0c', border: `1px solid ${accent}30` }}>
                      <div className='size-1.5 rounded-full mt-1.5 flex-shrink-0' style={{ background: accent }} />
                      <div>
                        <p className='text-xs font-bold uppercase tracking-wide mb-0.5' style={{ color: accent }}>{s.timeframe}</p>
                        <p className='text-xs font-medium' style={{ color: 'var(--t0)' }}>{s.action}</p>
                        <p className='text-xs mt-0.5' style={{ color: 'var(--t2)' }}>{s.impact}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Market insight */}
          {result.marketInsight && (
            <Card>
              <SecLabel icon={BarChart3}>Market Insight</SecLabel>
              <p className='text-xs leading-relaxed' style={{ color: 'var(--t1)' }}>{result.marketInsight}</p>
            </Card>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className='flex items-start gap-2 p-3 rounded-xl text-xs'
              style={{ background: 'var(--s1)', border: '1px solid var(--b0)', color: 'var(--t3)' }}>
              <AlertCircle className='size-3.5 flex-shrink-0 mt-0.5' />
              {result.disclaimer}
            </div>
          )}

          <button onClick={reset} className='cf-btn cf-btn-ghost w-full h-9 text-xs'>
            <RefreshCw className='size-3.5' /> Predict Another Resume
          </button>
        </div>
      )}
    </PageWrapper>
  )
}
