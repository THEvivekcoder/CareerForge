import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import {
  Briefcase, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp,
  Sparkles, UserCircle2,
  BookOpen,
} from 'lucide-react'
import pdfToText from 'react-pdftotext'
import PageWrapper from '../components/PageWrapper'

const MatchBar = ({ value }) => {
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className='flex items-center gap-3'>
      <div className='flex-1 h-2 rounded-full overflow-hidden' style={{ background: 'var(--s2)' }}>
        <div className='h-full rounded-full transition-all duration-700' style={{ width: `${value}%`, background: color }} />
      </div>
      <span className='text-xs font-bold w-9 text-right mono' style={{ color }}>{value}%</span>
    </div>
  )
}

const LEVEL_COLOR = {
  Fresher: '#3b82f6', Junior: '#6366f1', 'Mid-level': '#8b5cf6', Senior: '#f59e0b', Lead: '#ef4444',
}

const RoleCard = ({ role, rank }) => {
  const [expanded, setExpanded] = useState(rank === 0)
  const matchColor = role.match >= 80 ? '#10b981' : role.match >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className='cf-surface overflow-hidden'>
      <button onClick={() => setExpanded(v => !v)}
        className='w-full p-4 flex items-center gap-3 text-left transition-colors'
        style={{ background: expanded ? 'var(--s1)' : 'transparent' }}>
        <div className='flex-shrink-0 size-7 rounded-lg flex items-center justify-center text-xs font-bold'
          style={{ background: 'var(--a-glow)', color: 'var(--a-hi)' }}>
          {rank + 1}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-xs font-semibold mb-1' style={{ color: 'var(--t0)' }}>{role.title}</p>
          <MatchBar value={role.match} />
        </div>
        <span className='cf-tag flex-shrink-0' style={{ color: matchColor, borderColor: matchColor + '50', background: matchColor + '12' }}>
          {role.match}%
        </span>
        {expanded ? <ChevronUp className='size-3.5 flex-shrink-0' style={{ color: 'var(--t3)' }} /> : <ChevronDown className='size-3.5 flex-shrink-0' style={{ color: 'var(--t3)' }} />}
      </button>

      {expanded && (
        <div className='px-4 pb-4 space-y-3' style={{ borderTop: '1px solid var(--b0)' }}>
          {role.reason && (
            <p className='text-xs leading-relaxed pt-3' style={{ color: 'var(--t1)' }}>{role.reason}</p>
          )}
          <div className='grid sm:grid-cols-2 gap-3'>
            {role.matchedSkills?.length > 0 && (
              <div>
                <p className='cf-section-label mb-1.5 flex items-center gap-1'>
                  <CheckCircle2 className='size-3' style={{ color: 'var(--ok)' }} /> Matched
                </p>
                <div className='flex flex-wrap gap-1'>
                  {role.matchedSkills.map(s => (
                    <span key={s} className='cf-tag' style={{ color: 'var(--ok)', borderColor: 'rgba(16,185,129,.3)', background: 'rgba(16,185,129,.08)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {role.skillGaps?.length > 0 && (
              <div>
                <p className='cf-section-label mb-1.5 flex items-center gap-1'>
                  <XCircle className='size-3' style={{ color: 'var(--err)' }} /> Gaps
                </p>
                <div className='flex flex-wrap gap-1'>
                  {role.skillGaps.map(s => (
                    <span key={s} className='cf-tag' style={{ color: 'var(--err)', borderColor: 'rgba(220,38,38,.3)', background: 'rgba(220,38,38,.08)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {role.topSkillsToLearn?.length > 0 && (
            <div>
              <p className='cf-section-label mb-1.5 flex items-center gap-1'>
                <BookOpen className='size-3' style={{ color: 'var(--info)' }} /> Learn
              </p>
              <div className='flex flex-wrap gap-1'>
                {role.topSkillsToLearn.map(s => (
                  <span key={s} className='cf-tag' style={{ color: 'var(--info)', borderColor: 'rgba(2,132,199,.3)', background: 'rgba(2,132,199,.08)' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const JobRecommendation = () => {
  const { token } = useSelector(state => state.auth)

  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [inputMode, setInputMode] = useState('text')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResumeFile(file)
    try {
      const text = await pdfToText(file)
      setResumeText(text)
      toast.success('PDF parsed successfully')
    } catch {
      toast.error('Failed to read PDF. Try pasting text instead.')
    }
  }

  const handleAnalyze = async () => {
    const text = resumeText.trim()
    if (!text) return toast.error('Please provide your resume text')

    setIsAnalyzing(true)
    setResult(null)
    try {
      const { data } = await api.post(
        '/api/ai/recommend-roles',
        { resumeText: text },
        { headers: { Authorization: token } }
      )
      setResult(data)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const levelColor = result ? (LEVEL_COLOR[result.experienceLevel] || 'var(--a)') : null

  return (
    <PageWrapper eyebrow='Career Tools' title='Job Role Recommendation' maxWidth='56rem'>
      <div className='space-y-4'>
        {!result && !isAnalyzing && (
          <div className='cf-surface p-5 space-y-4 max-w-xl mx-auto'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-bold' style={{ color: 'var(--t0)' }}>Your Resume</p>
              <div className='flex p-0.5 rounded-md' style={{ background: 'var(--s2)' }}>
                {['text','pdf'].map(m => (
                  <button key={m} onClick={() => setInputMode(m)} className='px-2.5 py-1 text-xs rounded-md font-medium transition-all'
                    style={{ background: inputMode === m ? 'var(--s0)' : 'transparent', color: inputMode === m ? 'var(--t0)' : 'var(--t2)' }}>
                    {m === 'text' ? 'Paste' : 'PDF'}
                  </button>
                ))}
              </div>
            </div>
            {inputMode === 'text'
              ? <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={12}
                  placeholder='Paste your full resume — skills, experience, education, projects…' />
              : (
                <label className='flex flex-col items-center gap-2 py-10 cursor-pointer rounded-xl'
                  style={{ border: '1px dashed var(--b1)', background: 'var(--s1)' }}>
                  <Briefcase className='size-7' style={{ color: resumeFile ? 'var(--ok)' : 'var(--t3)' }} />
                  <p className='text-xs' style={{ color: resumeFile ? 'var(--ok)' : 'var(--t2)' }}>
                    {resumeFile ? resumeFile.name : 'Click to upload PDF'}
                  </p>
                  <input type='file' accept='.pdf' hidden onChange={handleFileChange} />
                </label>
              )}
            <button onClick={handleAnalyze} disabled={isAnalyzing}
              className='cf-btn cf-btn-primary w-full h-10 text-sm disabled:opacity-50'>
              <Sparkles className='size-4' /> Find My Best Roles
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className='cf-surface py-20 flex flex-col items-center gap-3'>
            <Loader2 className='size-8 animate-spin' style={{ color: 'var(--a)' }} />
            <p className='text-xs' style={{ color: 'var(--t2)' }}>Matching roles to your profile…</p>
          </div>
        )}

        {result && !isAnalyzing && (
          <>
            <div className='cf-surface p-4 flex items-start gap-3'>
              <div className='size-8 rounded-lg flex items-center justify-center flex-shrink-0'
                style={{ background: 'var(--a-glow)', color: 'var(--a-hi)' }}>
                <UserCircle2 className='size-4' />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 flex-wrap mb-1'>
                  <p className='text-xs font-semibold' style={{ color: 'var(--t0)' }}>Profile Summary</p>
                  {result.experienceLevel && (
                    <span className='cf-tag' style={{ color: levelColor, borderColor: levelColor + '50', background: levelColor + '12' }}>
                      {result.experienceLevel}
                    </span>
                  )}
                </div>
                <p className='text-xs leading-relaxed' style={{ color: 'var(--t1)' }}>{result.candidateSummary}</p>
              </div>
            </div>
            <div>
              <p className='cf-section-label mb-3 flex items-center gap-1.5'>
                <Briefcase className='size-3' /> Recommended Roles
              </p>
              <div className='space-y-2.5'>
                {result.roles?.map((role, i) => <RoleCard key={i} role={role} rank={i} />)}
              </div>
            </div>
            <button onClick={() => { setResult(null); setResumeText(''); setResumeFile(null) }}
              className='cf-btn cf-btn-ghost w-full h-9 text-xs'>
              Analyse Another Resume
            </button>
          </>
        )}
      </div>
    </PageWrapper>
  )
}

export default JobRecommendation
