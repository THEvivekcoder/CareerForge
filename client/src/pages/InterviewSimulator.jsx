import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import {
  Mic, MicOff, Send, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertCircle, Trophy, BarChart3, BookOpen,
  Sparkles, User, Briefcase, Cpu, Building2, RotateCcw,
  Target, TrendingUp, MessageSquare,
} from 'lucide-react'
import pdfToText from 'react-pdftotext'
import PageWrapper from '../components/PageWrapper'

// ─── constants ───────────────────────────────────────────────────────────────

const INTERVIEW_TYPES = [
  { id: 'hr',           label: 'HR Interview',      icon: User,      color: 'blue',  desc: 'Behavioural & situational questions' },
  { id: 'technical',    label: 'Technical',          icon: Cpu,       color: 'violet',desc: 'Coding, frameworks & concepts' },
  { id: 'system-design',label: 'System Design',      icon: Building2, color: 'amber', desc: 'Architecture & scalability problems' },
]

const EXPERIENCE_LEVELS = [
  { id: 'fresher',      label: 'Fresher',      sub: '0 – 1 year' },
  { id: 'junior',       label: 'Junior',       sub: '1 – 3 years' },
  { id: 'intermediate', label: 'Intermediate', sub: '3 – 5 years' },
  { id: 'senior',       label: 'Senior',       sub: '5+ years' },
]

const DIFFICULTY_STYLE = {
  easy:   { label: 'Easy',   cls: 'bg-green-50  text-green-700  border-green-200' },
  medium: { label: 'Medium', cls: 'bg-amber-50  text-amber-700  border-amber-200' },
  hard:   { label: 'Hard',   cls: 'bg-red-50    text-red-700    border-red-200' },
}

const TYPE_COLOR = { hr: 'blue', technical: 'violet', 'system-design': 'amber' }

const scoreColor = (s) =>
  s >= 80 ? 'text-green-600' : s >= 60 ? 'text-amber-600' : 'text-red-600'
const scoreBg = (s) =>
  s >= 80 ? 'bg-green-50 border-green-200' : s >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

// ─── sub-components ──────────────────────────────────────────────────────────

const ScoreCircle = ({ score, size = 'lg' }) => {
  const r = size === 'lg' ? 54 : 36
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
  const dim = size === 'lg' ? 130 : 88
  const fs = size === 'lg' ? 22 : 14
  const fy1 = size === 'lg' ? 60 : 42
  const fy2 = size === 'lg' ? 78 : 56

  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
      <circle cx={dim/2} cy={dim/2} r={r} fill='none' stroke='#e5e7eb' strokeWidth={size==='lg'?10:7}/>
      <circle cx={dim/2} cy={dim/2} r={r} fill='none' stroke={color} strokeWidth={size==='lg'?10:7}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap='round'
        transform={`rotate(-90 ${dim/2} ${dim/2})`} style={{transition:'stroke-dashoffset 1s ease'}}/>
      <text x={dim/2} y={fy1} textAnchor='middle' fontSize={fs} fontWeight='700' fill={color}>{score}</text>
      <text x={dim/2} y={fy2} textAnchor='middle' fontSize={size==='lg'?11:9} fill='#6b7280'>/100</text>
    </svg>
  )
}

const ProgressBar = ({ value, color = '#8b5cf6' }) => (
  <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
    <div className='h-full rounded-full transition-all duration-700' style={{ width: `${value}%`, backgroundColor: color }}/>
  </div>
)

// ─── SCREEN 1: Setup ─────────────────────────────────────────────────────────

const SetupScreen = ({ onStart }) => {
  const { token } = useSelector(s => s.auth)
  const [role, setRole]             = useState('')
  const [type, setType]             = useState('technical')
  const [experience, setExperience] = useState('fresher')
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [inputMode, setInputMode]   = useState('text')
  const [isStarting, setIsStarting] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResumeFile(file)
    try {
      const text = await pdfToText(file)
      setResumeText(text)
      toast.success('Resume parsed — AI will personalise questions')
    } catch { toast.error('Could not read PDF. Paste text instead.') }
  }

  const handleStart = async () => {
    if (!role.trim()) return toast.error('Please enter a target role')
    setIsStarting(true)
    try {
      const { data } = await api.post('/api/interview/start',
        { role: role.trim(), type, experience, resumeText },
        { headers: { Authorization: token } }
      )
      onStart(data.interviewId, { role: role.trim(), type, experience })
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
    } finally { setIsStarting(false) }
  }

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      <div className='cf-surface p-6 space-y-6'>

        {/* Role input */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>Target Role</label>
          <input
            value={role} onChange={e => setRole(e.target.value)}
            placeholder='e.g. Backend Developer, Frontend Engineer, Data Scientist…'
            className='w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition'
          />
        </div>

        {/* Interview type */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-3'>Interview Type</label>
          <div className='grid grid-cols-3 gap-3'>
            {INTERVIEW_TYPES.map(t => {
              const Icon = t.icon
              const active = type === t.id
              return (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                    active ? `border-${t.color}-500 bg-${t.color}-50` : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <Icon className={`size-6 ${active ? `text-${t.color}-600` : 'text-gray-400'}`}/>
                  <span className={`text-xs font-semibold ${active ? `text-${t.color}-700` : 'text-gray-600'}`}>{t.label}</span>
                  <span className='text-[10px] text-gray-400 leading-tight'>{t.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-3'>Experience Level</label>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
            {EXPERIENCE_LEVELS.map(e => (
              <button key={e.id} onClick={() => setExperience(e.id)}
                className={`py-3 px-2 rounded-xl border-2 transition-all text-center ${
                  experience === e.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <p className={`text-sm font-semibold ${experience === e.id ? 'text-violet-700' : 'text-gray-700'}`}>{e.label}</p>
                <p className='text-[10px] text-gray-400 mt-0.5'>{e.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Resume (optional) */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <label className='text-sm font-semibold text-gray-700'>
              Your Resume <span className='font-normal text-gray-400'>(optional — personalises questions)</span>
            </label>
            <div className='flex gap-1 bg-gray-100 rounded-lg p-1'>
              {['text','pdf'].map(m => (
                <button key={m} onClick={() => setInputMode(m)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${inputMode===m ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                  {m === 'text' ? 'Paste' : 'PDF'}
                </button>
              ))}
            </div>
          </div>
          {inputMode === 'text' ? (
            <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={5}
              placeholder='Paste resume content here…'
              className='w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 transition'/>
          ) : (
            <label className='flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-violet-400 transition-colors'>
              <Sparkles className='size-8 text-gray-300'/>
              {resumeFile
                ? <p className='text-sm text-green-600 font-medium'>{resumeFile.name}</p>
                : <p className='text-sm text-gray-400'>Click to upload PDF</p>}
              <input type='file' accept='.pdf' hidden onChange={handleFile}/>
            </label>
          )}
        </div>

        <button onClick={handleStart} disabled={isStarting}
          className='w-full py-3.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-violet-200'>
          {isStarting ? <><Loader2 className='size-5 animate-spin'/> Starting…</> : <><Sparkles className='size-5'/> Start Interview</>}
        </button>
      </div>
    </div>
  )
}

// ─── SCREEN 2: Interview ──────────────────────────────────────────────────────

const InterviewScreen = ({ interviewId, meta, onComplete }) => {
  const { token } = useSelector(s => s.auth)

  const [phase, setPhase]         = useState('loading') // loading | question | evaluating | feedback
  const [qData, setQData]         = useState(null)
  const [answer, setAnswer]       = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [qNumber, setQNumber]     = useState(0)
  const [isLast, setIsLast]       = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showHint, setShowHint]   = useState(false)

  const recognitionRef = useRef(null)
  const answerRef      = useRef(null)

  // load first question on mount
  useEffect(() => { fetchNextQuestion() }, [])

  const fetchNextQuestion = async () => {
    setPhase('loading')
    setAnswer('')
    setEvaluation(null)
    setShowHint(false)
    try {
      const { data } = await api.post('/api/interview/question',
        { interviewId }, { headers: { Authorization: token } }
      )
      setQData(data)
      setQNumber(data.questionNumber)
      setPhase('question')
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return toast.error('Please type or speak your answer first')
    setPhase('evaluating')
    try {
      const { data } = await api.post('/api/interview/evaluate',
        { interviewId, answer: answer.trim() }, { headers: { Authorization: token } }
      )
      setEvaluation(data.evaluation)
      setIsLast(data.isLastQuestion)
      setPhase('feedback')
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
      setPhase('question')
    }
  }

  const handleNext = () => {
    if (isLast) { onComplete() }
    else { fetchNextQuestion() }
  }

  // Voice input (Web Speech API)
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Voice input is not supported in this browser. Try Chrome.')

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec

    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setAnswer(transcript)
    }
    rec.onerror = () => setIsListening(false)
    rec.onend   = () => setIsListening(false)

    rec.start()
    setIsListening(true)
  }

  const diffStyle = qData ? DIFFICULTY_STYLE[qData.difficulty] || DIFFICULTY_STYLE.medium : DIFFICULTY_STYLE.medium
  const typeColor = TYPE_COLOR[meta.type] || 'violet'

  return (
    <div className='max-w-2xl mx-auto space-y-4'>
      {/* Progress bar */}
      <div className='cf-surface px-5 py-3'>
        <div className='flex items-center justify-between text-sm mb-2'>
          <span className='font-semibold text-gray-700'>{meta.role} · {meta.type.replace('-',' ').replace(/\b\w/g,c=>c.toUpperCase())} Interview</span>
          <span className='text-gray-400'>Question {qNumber || '…'} of 10</span>
        </div>
        <ProgressBar value={((qNumber || 0) / 10) * 100} />
      </div>

      {/* Question card */}
      {(phase === 'loading' || phase === 'question' || phase === 'evaluating' || phase === 'feedback') && (
        <div className='cf-surface p-6 space-y-4'>
          {phase === 'loading' && (
            <div className='flex flex-col items-center py-10 gap-3'>
              <Loader2 className='size-10 text-violet-500 animate-spin'/>
              <p className='text-gray-400 text-sm'>Generating your next question…</p>
            </div>
          )}

          {phase !== 'loading' && qData && (
            <>
              <div className='flex items-center gap-2 flex-wrap'>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${diffStyle.cls}`}>
                  {diffStyle.label}
                </span>
                {qData.topic && (
                  <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200'>
                    {qData.topic}
                  </span>
                )}
              </div>

              <p className='text-gray-900 font-medium text-base leading-relaxed'>{qData.question}</p>

              {/* Hint toggle */}
              {qData.hint && (
                <button onClick={() => setShowHint(v => !v)}
                  className='flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors'>
                  {showHint ? <ChevronUp className='size-3'/> : <ChevronDown className='size-3'/>}
                  {showHint ? 'Hide hint' : 'Show hint'}
                </button>
              )}
              {showHint && qData.hint && (
                <p className='text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2'>{qData.hint}</p>
              )}

              {/* Answer area */}
              {(phase === 'question' || phase === 'evaluating') && (
                <div className='space-y-3'>
                  <textarea
                    ref={answerRef}
                    value={answer} onChange={e => setAnswer(e.target.value)}
                    rows={6} disabled={phase === 'evaluating'}
                    placeholder='Type your answer here, or click the mic to speak…'
                    className='w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 transition disabled:bg-gray-50'
                  />
                  <div className='flex items-center gap-2'>
                    <button onClick={toggleVoice} disabled={phase === 'evaluating'}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        isListening
                          ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}>
                      {isListening ? <><MicOff className='size-4'/> Stop</> : <><Mic className='size-4'/> Speak</>}
                    </button>
                    <button onClick={submitAnswer} disabled={phase === 'evaluating' || !answer.trim()}
                      className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all disabled:opacity-50'>
                      {phase === 'evaluating'
                        ? <><Loader2 className='size-4 animate-spin'/> Evaluating…</>
                        : <><Send className='size-4'/> Submit Answer</>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Feedback card */}
      {phase === 'feedback' && evaluation && (
        <div className='cf-surface p-6 space-y-5'>
          <div className='flex items-center justify-between'>
            <h3 className='font-bold text-gray-800 flex items-center gap-2'>
              <BarChart3 className='size-5 text-violet-600'/> Answer Evaluation
            </h3>
            <span className={`text-2xl font-bold ${evaluation.overall >= 7 ? 'text-green-600' : evaluation.overall >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
              {evaluation.overall?.toFixed(1)}/10
            </span>
          </div>

          {/* Score breakdown */}
          <div className='grid grid-cols-2 gap-3'>
            {[
              { label: 'Technical Accuracy', key: 'technicalAccuracy', color: '#8b5cf6' },
              { label: 'Completeness',        key: 'completeness',       color: '#3b82f6' },
              { label: 'Clarity',             key: 'clarity',            color: '#10b981' },
              { label: 'Depth',               key: 'depth',              color: '#f59e0b' },
            ].map(item => (
              <div key={item.key} className='space-y-1'>
                <div className='flex justify-between text-xs'>
                  <span className='text-gray-500'>{item.label}</span>
                  <span className='font-semibold text-gray-700'>{evaluation[item.key]}/10</span>
                </div>
                <ProgressBar value={(evaluation[item.key] / 10) * 100} color={item.color}/>
              </div>
            ))}
          </div>

          {/* Strengths */}
          {evaluation.strengths?.length > 0 && (
            <div>
              <p className='text-xs font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1'>
                <CheckCircle2 className='size-3.5'/> What you did well
              </p>
              <ul className='space-y-1'>
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                    <span className='text-green-500 flex-shrink-0 mt-0.5'>✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing */}
          {evaluation.missing?.length > 0 && (
            <div>
              <p className='text-xs font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1'>
                <XCircle className='size-3.5'/> Key points missing
              </p>
              <ul className='space-y-1'>
                {evaluation.missing.map((m, i) => (
                  <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                    <span className='text-red-400 flex-shrink-0 mt-0.5'>✗</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coaching tip */}
          {evaluation.improvement && (
            <div className='flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl'>
              <AlertCircle className='size-4 text-blue-600 flex-shrink-0 mt-0.5'/>
              <div>
                <p className='text-xs font-bold text-blue-700 mb-0.5'>Coaching Tip</p>
                <p className='text-sm text-blue-800'>{evaluation.improvement}</p>
              </div>
            </div>
          )}

          {/* Ideal answer */}
          {evaluation.idealAnswer && (
            <details className='group'>
              <summary className='cursor-pointer text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1'>
                <ChevronDown className='size-3.5 group-open:rotate-180 transition-transform'/> Show ideal answer
              </summary>
              <p className='mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 leading-relaxed'>
                {evaluation.idealAnswer}
              </p>
            </details>
          )}

          <button onClick={handleNext}
            className='w-full py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all flex items-center justify-center gap-2'>
            {isLast ? <><Trophy className='size-4'/> Finish & View Report</> : <>Next Question <ChevronDown className='size-4 rotate-[-90deg]'/></>}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── SCREEN 3: Report ─────────────────────────────────────────────────────────

const ReportScreen = ({ interviewId, meta, onRestart }) => {
  const { token } = useSelector(s => s.auth)
  const [report, setReport]       = useState(null)
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [expanded, setExpanded]   = useState(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await api.post('/api/interview/report',
          { interviewId }, { headers: { Authorization: token } }
        )
        setReport(data.report)
        setQuestions(data.questions)
      } catch (err) {
        toast.error(err?.response?.data?.message || err.message)
      } finally { setIsLoading(false) }
    }
    fetchReport()
  }, [interviewId])

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-24 gap-4'>
        <Loader2 className='size-14 text-violet-500 animate-spin'/>
        <p className='text-gray-400 text-sm'>Gemini is generating your performance report…</p>
      </div>
    )
  }

  if (!report) return null

  const scoreItems = [
    { label: 'Technical Knowledge', value: report.technicalScore,     color: '#8b5cf6' },
    { label: 'Communication',       value: report.communicationScore,  color: '#3b82f6' },
    { label: 'Problem Solving',     value: report.problemSolvingScore, color: '#f59e0b' },
  ]

  return (
    <div className='max-w-2xl mx-auto space-y-5'>

      {/* Overall score */}
      <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-6'>
        <div className='flex items-center gap-6'>
          <ScoreCircle score={report.overallScore}/>
          <div className='flex-1 space-y-3'>
            <div>
              <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5'>Interview Complete</p>
              <p className='font-bold text-gray-900 text-lg'>{meta.role}</p>
              <p className='text-sm text-gray-500 capitalize'>{meta.type.replace('-',' ')} · {meta.experience}</p>
            </div>
            <div className='space-y-2'>
              {scoreItems.map(item => (
                <div key={item.label} className='space-y-0.5'>
                  <div className='flex justify-between text-xs'>
                    <span className='text-gray-500'>{item.label}</span>
                    <span className='font-semibold' style={{ color: item.color }}>{item.value}%</span>
                  </div>
                  <ProgressBar value={item.value} color={item.color}/>
                </div>
              ))}
            </div>
          </div>
        </div>
        {report.summary && (
          <p className='mt-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed'>
            {report.summary}
          </p>
        )}
      </div>

      {/* Strengths & Weaknesses */}
      <div className='grid sm:grid-cols-2 gap-4'>
        {report.strengths?.length > 0 && (
          <div className='cf-surface p-5'>
            <h3 className='text-xs font-bold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-1'>
              <TrendingUp className='size-3.5'/> Strengths
            </h3>
            <ul className='space-y-2'>
              {report.strengths.map((s, i) => (
                <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                  <CheckCircle2 className='size-4 text-green-500 flex-shrink-0 mt-0.5'/>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.weaknesses?.length > 0 && (
          <div className='cf-surface p-5'>
            <h3 className='text-xs font-bold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1'>
              <AlertCircle className='size-3.5'/> Areas to Improve
            </h3>
            <ul className='space-y-2'>
              {report.weaknesses.map((w, i) => (
                <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                  <AlertCircle className='size-4 text-amber-500 flex-shrink-0 mt-0.5'/>{w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommended topics */}
      {report.recommendedTopics?.length > 0 && (
        <div className='cf-surface p-5'>
          <h3 className='text-xs font-bold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-1'>
            <BookOpen className='size-3.5'/> Study Recommendations
          </h3>
          <div className='flex flex-wrap gap-2'>
            {report.recommendedTopics.map((t, i) => (
              <span key={i} className='flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200 font-medium'>
                <span className='text-xs text-blue-400 font-bold'>{i + 1}</span> {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Question-wise breakdown */}
      {questions.length > 0 && (
        <div className='cf-surface p-5'>
          <h3 className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1'>
            <MessageSquare className='size-3.5'/> Question-wise Analysis
          </h3>
          <div className='space-y-2'>
            {questions.map((q, i) => {
              const score = q.evaluation?.overall ?? 0
              const isOpen = expanded === i
              return (
                <div key={i} className={`rounded-xl border overflow-hidden ${scoreBg(score * 10)}`}>
                  <button onClick={() => setExpanded(isOpen ? null : i)}
                    className='w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity'>
                    <span className='flex-shrink-0 w-6 h-6 rounded-full bg-white border text-xs font-bold flex items-center justify-center text-gray-600'>
                      {i + 1}
                    </span>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-800 truncate'>{q.topic || 'General'}</p>
                      <div className='flex items-center gap-2 mt-0.5'>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${DIFFICULTY_STYLE[q.difficulty]?.cls || DIFFICULTY_STYLE.medium.cls}`}>
                          {DIFFICULTY_STYLE[q.difficulty]?.label}
                        </span>
                      </div>
                    </div>
                    <span className={`text-base font-bold flex-shrink-0 ${scoreColor(score * 10)}`}>{score.toFixed(1)}/10</span>
                    {isOpen ? <ChevronUp className='size-4 text-gray-400 flex-shrink-0'/> : <ChevronDown className='size-4 text-gray-400 flex-shrink-0'/>}
                  </button>

                  {isOpen && (
                    <div className='px-4 pb-4 space-y-3 border-t border-white/60'>
                      <p className='text-sm font-medium text-gray-800 mt-3'>{q.question}</p>
                      {q.answer && (
                        <div className='bg-white rounded-lg p-3 border border-gray-100'>
                          <p className='text-xs font-bold text-gray-500 mb-1'>Your Answer</p>
                          <p className='text-sm text-gray-700 leading-relaxed'>{q.answer}</p>
                        </div>
                      )}
                      {q.evaluation?.idealAnswer && (
                        <div className='bg-white rounded-lg p-3 border border-gray-100'>
                          <p className='text-xs font-bold text-green-700 mb-1'>Model Answer</p>
                          <p className='text-sm text-gray-700 leading-relaxed'>{q.evaluation.idealAnswer}</p>
                        </div>
                      )}
                      {q.evaluation?.improvement && (
                        <p className='text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100'>
                          💡 {q.evaluation.improvement}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button onClick={onRestart}
        className='w-full py-3 border-2 border-violet-200 text-violet-700 font-semibold rounded-xl hover:bg-violet-50 transition-colors flex items-center justify-center gap-2'>
        <RotateCcw className='size-4'/> Start Another Interview
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const InterviewSimulator = () => {
  const [screen, setScreen]         = useState('setup')   // setup | interview | report
  const [interviewId, setInterviewId] = useState(null)
  const [meta, setMeta]             = useState({})

  const handleStart = (id, m) => {
    setInterviewId(id)
    setMeta(m)
    setScreen('interview')
  }

  const handleComplete = () => setScreen('report')

  const handleRestart = () => {
    setInterviewId(null)
    setMeta({})
    setScreen('setup')
  }

  const subtitles = {
    setup:     'Adaptive mock interview powered by Gemini AI',
    interview: `${meta.role || ''} · ${meta.type?.replace('-',' ') || ''} · ${meta.experience || ''}`,
    report:    'Your interview performance report',
  }

  return (
    <PageWrapper title='AI Interview Simulator' subtitle={subtitles[screen]}>
      {screen === 'setup'     && <SetupScreen onStart={handleStart}/>}
      {screen === 'interview' && <InterviewScreen interviewId={interviewId} meta={meta} onComplete={handleComplete}/>}
      {screen === 'report'    && <ReportScreen interviewId={interviewId} meta={meta} onRestart={handleRestart}/>}
    </PageWrapper>
  )
}

export default InterviewSimulator
