import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import pdfToText from 'react-pdftotext'
import { PageShell } from '../components/Navbar'
import {
  Plus, UploadCloud, ScanSearch, Briefcase, Globe,
  Mic2, IndianRupee, FilePen, Trash2, Pencil, X,
  LoaderCircle, ChevronRight, ArrowUpRight, Zap,
} from 'lucide-react'

/* ── Tool definitions ── */
const TOOLS = [
  {
    to: '/app/ats-checker',
    label: 'ATS Checker',
    icon: ScanSearch,
    desc: 'Score your resume against any job description',
    accent: '#f97316',
  },
  {
    to: '/app/job-recommendation',
    label: 'Job Match',
    icon: Briefcase,
    desc: 'AI-ranked roles that fit your profile',
    accent: '#06b6d4',
  },
  {
    to: '/app/interview',
    label: 'AI Interview',
    icon: Mic2,
    desc: 'Adaptive mock interviews, then a full report',
    accent: '#a855f7',
  },
  {
    to: '/app/salary',
    label: 'Salary Intel',
    icon: IndianRupee,
    desc: 'Market salary range from your resume',
    accent: '#10b981',
  },
  {
    to: '/app/news',
    label: 'Career News',
    icon: Globe,
    desc: 'Live tech & career intelligence',
    accent: '#3b82f6',
  },
]

const RESUME_ACCENTS = ['#7c3aed', '#f97316', '#06b6d4', '#ec4899', '#10b981']

/* ── Small modal ── */
function Modal({ onClose, title, children }) {
  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,.72)' }} onClick={onClose}>
      <div className='w-full max-w-sm cf-surface p-6 relative cf-enter'
        style={{ background: 'var(--s0)' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className='absolute top-4 right-4 p-1.5 rounded-md'
          style={{ color: 'var(--t2)', background: 'var(--s1)' }}>
          <X className='size-3.5' />
        </button>
        <p className='text-sm font-bold mb-4' style={{ color: 'var(--t0)' }}>{title}</p>
        {children}
      </div>
    </div>
  )
}

function Skel() {
  return (
    <div className='cf-surface p-4 space-y-3'>
      <div className='cf-skeleton h-5 w-5 rounded-md' />
      <div className='cf-skeleton h-3 w-2/3' />
      <div className='cf-skeleton h-3 w-1/2' />
    </div>
  )
}

export default function Dashboard() {
  const { user, token } = useSelector(s => s.auth)
  const navigate = useNavigate()

  const [resumes,  setResumes]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)  // 'create' | 'upload' | 'rename'
  const [title,    setTitle]    = useState('')
  const [file,     setFile]     = useState(null)
  const [editId,   setEditId]   = useState('')
  const [busy,     setBusy]     = useState(false)

  useEffect(() => {
    api.get('/api/users/resumes', { headers: { Authorization: token } })
      .then(({ data }) => setResumes(data.resumes))
      .catch(e => toast.error(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }, [])

  const closeModal = () => { setModal(null); setTitle(''); setFile(null); setEditId('') }

  const createResume = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/api/resumes/create', { title }, { headers: { Authorization: token } })
      setResumes(p => [...p, data.resume])
      closeModal()
      navigate(`/app/builder/${data.resume._id}`)
    } catch (e) { toast.error(e?.response?.data?.message || e.message) }
  }

  const uploadResume = async (e) => {
    e.preventDefault(); setBusy(true)
    try {
      const resumeText = await pdfToText(file)
      const { data } = await api.post('/api/ai/upload-resume', { title, resumeText }, { headers: { Authorization: token } })
      closeModal(); navigate(`/app/builder/${data.resumeId}`)
    } catch (e) { toast.error(e?.response?.data?.message || e.message) }
    finally { setBusy(false) }
  }

  const renameResume = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put('/api/resumes/update', { resumeId: editId, resumeData: { title } }, { headers: { Authorization: token } })
      setResumes(p => p.map(r => r._id === editId ? { ...r, title } : r))
      closeModal(); toast.success(data.message)
    } catch (e) { toast.error(e?.response?.data?.message || e.message) }
  }

  const deleteResume = async (id) => {
    if (!confirm('Delete this resume?')) return
    try {
      const { data } = await api.delete(`/api/resumes/delete/${id}`, { headers: { Authorization: token } })
      setResumes(p => p.filter(r => r._id !== id)); toast.success(data.message)
    } catch (e) { toast.error(e?.response?.data?.message || e.message) }
  }

  const hour = new Date().getHours()
  const greet = hour < 5 ? 'Late night,' : hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'

  return (
    <PageShell>
      <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto cf-enter'>

        {/* ━━ Welcome ━━ */}
        <div className='mb-10'>
          <p className='cf-section-label mb-2'>{greet}</p>
          <h2 className='text-3xl font-bold tracking-tight' style={{ color: 'var(--t0)' }}>
            {user?.name?.split(' ')[0] ?? 'Welcome'}
          </h2>
          <p className='mt-1 text-sm' style={{ color: 'var(--t2)' }}>
            Your AI career workspace — {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ━━ Quick actions row ━━ */}
        <div className='flex items-center gap-2 mb-10 flex-wrap'>
          <button onClick={() => setModal('create')}
            className='cf-btn cf-btn-primary text-xs h-8 px-3.5'>
            <Plus className='size-3.5' /> New Resume
          </button>
          <button onClick={() => setModal('upload')}
            className='cf-btn cf-btn-ghost text-xs h-8 px-3.5'>
            <UploadCloud className='size-3.5' /> Import PDF
          </button>
        </div>

        {/* ━━ AI Tools ━━ */}
        <section className='mb-12'>
          <p className='cf-section-label mb-4 flex items-center gap-2'>
            <Zap className='size-3' style={{ color: 'var(--a)' }} />
            AI Tools
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
            {TOOLS.map(tool => {
              const Icon = tool.icon
              return (
                <button key={tool.to} onClick={() => navigate(tool.to)}
                  className='group cf-surface text-left p-4 flex flex-col gap-3 transition-all hover:border-opacity-60 focus-visible:outline-none relative overflow-hidden'
                  style={{ '--ha': tool.accent }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = tool.accent + '60' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b0)' }}>
                  {/* Top accent line */}
                  <div className='absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity'
                    style={{ background: tool.accent }} />
                  <div className='size-8 rounded-lg flex items-center justify-center'
                    style={{ background: tool.accent + '18', color: tool.accent }}>
                    <Icon className='size-4' strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className='text-xs font-bold' style={{ color: 'var(--t0)' }}>{tool.label}</p>
                    <p className='text-xs mt-0.5 leading-relaxed' style={{ color: 'var(--t2)' }}>{tool.desc}</p>
                  </div>
                  <ArrowUpRight className='size-3 absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity'
                    style={{ color: tool.accent }} />
                </button>
              )
            })}
          </div>
        </section>

        {/* ━━ Resumes ━━ */}
        <section>
          <div className='flex items-center justify-between mb-4'>
            <p className='cf-section-label'>Resumes</p>
            <button onClick={() => setModal('create')}
              className='cf-btn cf-btn-subtle text-xs h-7 px-2.5'>
              <Plus className='size-3' /> New
            </button>
          </div>

          {loading ? (
            <div className='grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
              {[1,2,3].map(i => <Skel key={i} />)}
            </div>
          ) : resumes.length === 0 ? (
            <div className='cf-surface py-16 flex flex-col items-center gap-4 text-center cf-grid relative overflow-hidden'>
              <div className='cf-noise' />
              <div className='size-10 rounded-xl flex items-center justify-center'
                style={{ background: 'var(--s2)' }}>
                <FilePen className='size-5' style={{ color: 'var(--t2)' }} />
              </div>
              <div>
                <p className='text-sm font-semibold' style={{ color: 'var(--t0)' }}>No resumes yet</p>
                <p className='text-xs mt-1' style={{ color: 'var(--t2)' }}>Create your first or import a PDF</p>
              </div>
              <button onClick={() => setModal('create')} className='cf-btn cf-btn-primary text-xs h-8 px-4'>
                <Plus className='size-3.5' /> Create Resume
              </button>
            </div>
          ) : (
            <div className='grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
              {resumes.map((r, i) => {
                const accent = RESUME_ACCENTS[i % RESUME_ACCENTS.length]
                return (
                  <div key={r._id}
                    className='group cf-surface p-4 flex flex-col gap-3 cursor-pointer transition-all hover:border-opacity-60 relative overflow-hidden'
                    onClick={() => navigate(`/app/builder/${r._id}`)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = accent + '60'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b0)'}>
                    <div className='absolute top-0 left-0 right-0 h-px' style={{ background: accent }} />
                    <div className='size-8 rounded-lg flex items-center justify-center'
                      style={{ background: accent + '18', color: accent }}>
                      <FilePen className='size-4' strokeWidth={1.75} />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-semibold truncate' style={{ color: 'var(--t0)' }}>{r.title}</p>
                      <p className='text-xs mt-0.5' style={{ color: 'var(--t2)' }}>
                        {new Date(r.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditId(r._id); setTitle(r.title); setModal('rename') }}
                        className='cf-btn cf-btn-subtle h-6 px-2 text-xs'>
                        <Pencil className='size-3' />
                      </button>
                      <button onClick={() => deleteResume(r._id)}
                        className='cf-btn h-6 px-2 text-xs'
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                        <Trash2 className='size-3' />
                      </button>
                    </div>
                    <ChevronRight className='size-3.5 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity'
                      style={{ color: accent }} />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* ━━ Modals ━━ */}
      {modal === 'create' && (
        <Modal onClose={closeModal} title='New resume'>
          <form onSubmit={createResume} className='space-y-3'>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder='e.g. Software Engineer 2025' required />
            <button type='submit' className='cf-btn cf-btn-primary w-full h-9 text-xs'>
              Create
            </button>
          </form>
        </Modal>
      )}

      {modal === 'upload' && (
        <Modal onClose={closeModal} title='Import PDF resume'>
          <form onSubmit={uploadResume} className='space-y-3'>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder='Resume title' required />
            <label className='flex flex-col items-center gap-2 py-6 rounded-xl cursor-pointer transition-colors'
              style={{ background: 'var(--s1)', border: '1px dashed var(--b1)' }}>
              <UploadCloud className='size-6' style={{ color: file ? 'var(--ok)' : 'var(--t2)' }} />
              <p className='text-xs' style={{ color: file ? 'var(--ok)' : 'var(--t1)' }}>
                {file ? file.name : 'Click to upload PDF'}
              </p>
              <input type='file' accept='.pdf' hidden onChange={e => setFile(e.target.files[0])} />
            </label>
            <button type='submit' disabled={busy || !file} className='cf-btn cf-btn-primary w-full h-9 text-xs disabled:opacity-50 flex items-center justify-center gap-2'>
              {busy && <LoaderCircle className='size-4 animate-spin' />}
              {busy ? 'Importing…' : 'Import with AI'}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'rename' && (
        <Modal onClose={closeModal} title='Rename resume'>
          <form onSubmit={renameResume} className='space-y-3'>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder='New title' required />
            <button type='submit' className='cf-btn cf-btn-primary w-full h-9 text-xs'>Save</button>
          </form>
        </Modal>
      )}
    </PageShell>
  )
}
