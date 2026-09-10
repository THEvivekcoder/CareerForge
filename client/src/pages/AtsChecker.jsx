import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertCircle, Loader2, ScanSearch, ChevronDown, ChevronUp } from 'lucide-react'
import pdfToText from 'react-pdftotext'
import PageWrapper from '../components/PageWrapper'

/* ── Sub-components ── */
const ScoreRing = ({ score }) => {
  const r    = 54
  const circ = 2 * Math.PI * r
  const off  = circ - (score / 100) * circ
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate' : 'Weak Match'
  return (
    <div className='flex flex-col items-center gap-2'>
      <svg width='120' height='120' viewBox='0 0 120 120'>
        <circle cx='60' cy='60' r={r} fill='none' stroke='var(--b0)' strokeWidth='8' />
        <circle cx='60' cy='60' r={r} fill='none' stroke={color} strokeWidth='8'
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap='round'
          transform='rotate(-90 60 60)' style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x='60' y='56' textAnchor='middle' fontSize='20' fontWeight='700' fill={color}>{score}</text>
        <text x='60' y='72' textAnchor='middle' fontSize='10' fill='var(--t2)'>/100</text>
      </svg>
      <span className='text-xs font-semibold' style={{ color }}>{label}</span>
    </div>
  )
}

const Bar = ({ label, value, color }) => (
  <div className='space-y-1'>
    <div className='flex justify-between text-xs'>
      <span style={{ color: 'var(--t1)' }}>{label}</span>
      <span className='font-semibold' style={{ color }}>{value}%</span>
    </div>
    <div className='h-1.5 rounded-full overflow-hidden' style={{ background: 'var(--b0)' }}>
      <div className='h-full rounded-full transition-all duration-700' style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
)

const KwBadge = ({ keyword, found }) => (
  <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium'
    style={{
      background: found ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
      color: found ? '#10b981' : '#ef4444',
      border: `1px solid ${found ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`,
    }}>
    {found ? <CheckCircle2 className='size-3' /> : <XCircle className='size-3' />}
    {keyword}
  </span>
)

/* ── Page ── */
export default function AtsChecker() {
  const { token } = useSelector(s => s.auth)
  const [resumeText,    setResumeText]    = useState('')
  const [jobDesc,       setJobDesc]       = useState('')
  const [resumeFile,    setResumeFile]    = useState(null)
  const [mode,          setMode]          = useState('text')
  const [analyzing,     setAnalyzing]     = useState(false)
  const [result,        setResult]        = useState(null)
  const [showAll,       setShowAll]       = useState(false)

  const onFile = async (e) => {
    const f = e.target.files[0]; if (!f) return
    setResumeFile(f)
    try { setResumeText(await pdfToText(f)); toast.success('PDF parsed') }
    catch { toast.error('Could not read PDF') }
  }

  const analyze = async () => {
    if (!resumeText.trim()) return toast.error('Add your resume')
    if (!jobDesc.trim())    return toast.error('Add a job description')
    setAnalyzing(true); setResult(null)
    try {
      const { data } = await api.post('/api/ai/ats-check',
        { resumeText: resumeText.trim(), jobDescription: jobDesc.trim() },
        { headers: { Authorization: token } })
      setResult(data)
    } catch (e) { toast.error(e?.response?.data?.message || e.message) }
    finally { setAnalyzing(false) }
  }

  const breakdown = result ? [
    { label: 'Skills',     value: result.scoreBreakdown?.skillMatch      ?? 0, color: 'var(--a-hi)' },
    { label: 'Keywords',   value: result.scoreBreakdown?.keywordMatch    ?? 0, color: '#3b82f6'     },
    { label: 'Experience', value: result.scoreBreakdown?.experienceMatch ?? 0, color: '#f59e0b'     },
    { label: 'Education',  value: result.scoreBreakdown?.educationMatch  ?? 0, color: '#10b981'     },
    { label: 'Format',     value: result.scoreBreakdown?.formatScore     ?? 0, color: '#6366f1'     },
  ] : []

  const shown = showAll ? result?.matchedKeywords ?? [] : (result?.matchedKeywords ?? []).slice(0, 8)

  const Card = ({ children, className = '' }) => (
    <div className={`cf-surface p-4 ${className}`}>{children}</div>
  )
  const CardTitle = ({ icon: Icon, iconColor, children }) => (
    <p className='text-xs font-bold mb-3 flex items-center gap-1.5 cf-section-label'>
      <Icon className='size-3.5' style={{ color: iconColor }} />{children}
    </p>
  )
  const ModeBtn = ({ v, label }) => (
    <button onClick={() => setMode(v)} className='px-2.5 py-1 text-xs rounded-md transition-all font-medium'
      style={{ background: mode === v ? 'var(--s0)' : 'transparent', color: mode === v ? 'var(--t0)' : 'var(--t2)', boxShadow: mode === v ? '0 1px 2px rgba(0,0,0,.15)' : 'none' }}>
      {label}
    </button>
  )

  return (
    <PageWrapper eyebrow='Career Tools' title='ATS Resume Checker' maxWidth='72rem'>
      <div className='grid lg:grid-cols-2 gap-5'>

        {/* ── Input column ── */}
        <div className='space-y-4'>
          {/* Resume */}
          <Card>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-xs font-bold' style={{ color: 'var(--t0)' }}>Your Resume</p>
              <div className='flex p-0.5 rounded-lg' style={{ background: 'var(--s2)' }}>
                <ModeBtn v='text' label='Paste' />
                <ModeBtn v='pdf'  label='PDF'   />
              </div>
            </div>
            {mode === 'text'
              ? <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={9} placeholder='Paste your resume here…' />
              : (
                <label className='flex flex-col items-center gap-2 py-8 cursor-pointer rounded-xl transition-colors'
                  style={{ border: '1px dashed var(--b1)', background: 'var(--s1)' }}>
                  <ScanSearch className='size-7' style={{ color: resumeFile ? 'var(--ok)' : 'var(--t3)' }} />
                  <p className='text-xs' style={{ color: resumeFile ? 'var(--ok)' : 'var(--t2)' }}>
                    {resumeFile ? resumeFile.name : 'Click to upload PDF'}
                  </p>
                  <input type='file' accept='.pdf' hidden onChange={onFile} />
                </label>
              )}
          </Card>

          {/* JD */}
          <Card>
            <p className='text-xs font-bold mb-3' style={{ color: 'var(--t0)' }}>Job Description</p>
            <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={9} placeholder='Paste the job description…' />
          </Card>

          <button onClick={analyze} disabled={analyzing}
            className='cf-btn cf-btn-primary w-full h-10 text-sm disabled:opacity-50'>
            {analyzing ? <><Loader2 className='size-4 animate-spin' /> Analyzing…</> : <><ScanSearch className='size-4' /> Analyze Resume</>}
          </button>
        </div>

        {/* ── Results column ── */}
        <div className='space-y-4'>
          {!result && !analyzing && (
            <Card className='py-16 flex flex-col items-center gap-3 text-center cf-grid relative overflow-hidden'>
              <ScanSearch className='size-10' style={{ color: 'var(--t3)' }} />
              <p className='text-xs' style={{ color: 'var(--t2)' }}>Paste your resume and job description,<br />then click Analyze</p>
            </Card>
          )}

          {analyzing && (
            <Card className='py-16 flex flex-col items-center gap-3'>
              <Loader2 className='size-8 animate-spin' style={{ color: 'var(--a)' }} />
              <p className='text-xs' style={{ color: 'var(--t2)' }}>AI is scoring your resume…</p>
            </Card>
          )}

          {result && !analyzing && (<>
            {/* Score */}
            <Card>
              <p className='cf-section-label mb-4'>ATS Score</p>
              <div className='flex items-center gap-6'>
                <ScoreRing score={result.atsScore} />
                <div className='flex-1 space-y-2.5'>
                  {breakdown.map(b => <Bar key={b.label} {...b} />)}
                </div>
              </div>
              {result.summary && (
                <p className='mt-4 text-xs leading-relaxed p-3 rounded-lg'
                  style={{ background: 'var(--s1)', color: 'var(--t1)', border: '1px solid var(--b0)' }}>
                  {result.summary}
                </p>
              )}
            </Card>

            {/* Matched */}
            {result.matchedKeywords?.length > 0 && (
              <Card>
                <CardTitle icon={CheckCircle2} iconColor='var(--ok)'>Matched Keywords</CardTitle>
                <div className='flex flex-wrap gap-1.5'>
                  {shown.map(kw => <KwBadge key={kw} keyword={kw} found />)}
                </div>
                {result.matchedKeywords.length > 8 && (
                  <button onClick={() => setShowAll(v => !v)}
                    className='mt-2 text-xs flex items-center gap-1 hover:opacity-70 transition-opacity'
                    style={{ color: 'var(--t2)' }}>
                    {showAll ? <><ChevronUp className='size-3'/>Less</> : <><ChevronDown className='size-3'/>+{result.matchedKeywords.length - 8} more</>}
                  </button>
                )}
              </Card>
            )}

            {/* Missing */}
            {result.missingKeywords?.length > 0 && (
              <Card>
                <CardTitle icon={XCircle} iconColor='var(--err)'>Missing Keywords</CardTitle>
                <div className='flex flex-wrap gap-1.5'>
                  {result.missingKeywords.map(kw => <KwBadge key={kw} keyword={kw} found={false} />)}
                </div>
              </Card>
            )}

            {/* Strengths / Weaknesses */}
            <div className='grid sm:grid-cols-2 gap-4'>
              {result.strengths?.length > 0 && (
                <Card>
                  <CardTitle icon={CheckCircle2} iconColor='var(--ok)'>Strengths</CardTitle>
                  <ul className='space-y-1.5'>
                    {result.strengths.map((s, i) => (
                      <li key={i} className='flex items-start gap-2 text-xs' style={{ color: 'var(--t1)' }}>
                        <span style={{ color: 'var(--ok)' }}>✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {result.weaknesses?.length > 0 && (
                <Card>
                  <CardTitle icon={AlertCircle} iconColor='var(--warn)'>Weaknesses</CardTitle>
                  <ul className='space-y-1.5'>
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className='flex items-start gap-2 text-xs' style={{ color: 'var(--t1)' }}>
                        <span style={{ color: 'var(--warn)' }}>⚠</span>{w}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {/* Suggestions */}
            {result.suggestions?.length > 0 && (
              <Card>
                <CardTitle icon={AlertCircle} iconColor='var(--info)'>AI Recommendations</CardTitle>
                <ol className='space-y-2.5'>
                  {result.suggestions.map((s, i) => (
                    <li key={i} className='flex items-start gap-3 text-xs' style={{ color: 'var(--t1)' }}>
                      <span className='flex-shrink-0 size-4 rounded flex items-center justify-center text-[10px] font-bold'
                        style={{ background: 'var(--a-glow)', color: 'var(--a-hi)' }}>{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            <button onClick={() => { setResult(null); setResumeText(''); setJobDesc(''); setResumeFile(null) }}
              className='cf-btn cf-btn-ghost w-full h-9 text-xs'>
              Start New Analysis
            </button>
          </>)}
        </div>
      </div>
    </PageWrapper>
  )
}
