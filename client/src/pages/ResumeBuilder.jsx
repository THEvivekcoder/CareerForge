import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Briefcase, ChevronLeft, ChevronRight, Download,
  Eye, EyeOff, FileText, Folder, GraduationCap, Share2, Sparkles, User,
} from 'lucide-react'
import PersonalInfoForm     from '../components/PersonalInfoForm'
import ResumePreview        from '../components/ResumePreview'
import TemplateSelector     from '../components/TemplateSelector'
import ColorPicker          from '../components/ColorPicker'
import ProfessionalSummaryForm from '../components/ProfessionalSummaryForm'
import ExperienceForm       from '../components/ExperienceForm'
import EducationForm        from '../components/EducationForm'
import ProjectForm          from '../components/ProjectForm'
import SkillsForm           from '../components/SkillsForm'
import { useSelector }      from 'react-redux'
import api                  from '../configs/api'
import toast                from 'react-hot-toast'

const SECTIONS = [
  { id: 'personal',   name: 'Personal',   icon: User          },
  { id: 'summary',    name: 'Summary',    icon: FileText       },
  { id: 'experience', name: 'Experience', icon: Briefcase      },
  { id: 'education',  name: 'Education',  icon: GraduationCap  },
  { id: 'projects',   name: 'Projects',   icon: Folder         },
  { id: 'skills',     name: 'Skills',     icon: Sparkles       },
]

export default function ResumeBuilder() {
  const { resumeId } = useParams()
  const { token }    = useSelector(s => s.auth)

  const [data, setData] = useState({
    _id: '', title: '', personal_info: {}, professional_summary: '',
    experience: [], education: [], project: [], skills: [],
    template: 'classic', accent_color: '#6366f1', public: false,
  })
  const [step, setStep]       = useState(0)
  const [rmBg, setRmBg]       = useState(false)

  useEffect(() => {
    api.get('/api/resumes/get/' + resumeId, { headers: { Authorization: token } })
      .then(({ data: d }) => { if (d.resume) { setData(d.resume); document.title = d.resume.title } })
      .catch(e => console.error(e.message))
  }, [])

  const toggleVisibility = async () => {
    const fd = new FormData()
    fd.append('resumeId', resumeId)
    fd.append('resumeData', JSON.stringify({ public: !data.public }))
    const { data: d } = await api.put('/api/resumes/update', fd, { headers: { Authorization: token } })
    setData(p => ({ ...p, public: !p.public }))
    toast.success(d.message)
  }

  const share = () => {
    const url = window.location.origin + '/view/' + resumeId
    navigator.share ? navigator.share({ url, text: 'My Resume' }) : alert('Share not supported')
  }

  const save = async () => {
    const copy = structuredClone(data)
    if (typeof data.personal_info.image === 'object') delete copy.personal_info.image
    const fd = new FormData()
    fd.append('resumeId', resumeId)
    fd.append('resumeData', JSON.stringify(copy))
    if (rmBg) fd.append('removeBackground', 'yes')
    if (typeof data.personal_info.image === 'object') fd.append('image', data.personal_info.image)
    const { data: d } = await api.put('/api/resumes/update', fd, { headers: { Authorization: token } })
    setData(d.resume); toast.success(d.message)
  }

  const progress = step / (SECTIONS.length - 1) * 100
  const cur = SECTIONS[step]

  return (
    <div className='flex-1 flex flex-col min-h-dvh' style={{ background: 'var(--bg)' }}>

      {/* ── Top bar ── */}
      <header className='flex items-center justify-between px-4 h-11 sticky top-0 z-20'
        style={{ background: 'var(--s0)', borderBottom: '1px solid var(--b0)' }}>
        <Link to='/app' className='flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity'
          style={{ color: 'var(--t2)' }}>
          <ArrowLeft className='size-3.5' /> Dashboard
        </Link>
        <p className='text-xs font-semibold truncate max-w-[180px]' style={{ color: 'var(--t0)' }}>
          {data.title || 'Resume'}
        </p>
        <div className='flex items-center gap-1.5'>
          {data.public && (
            <button onClick={share} className='cf-btn cf-btn-subtle h-7 text-xs px-2.5'>
              <Share2 className='size-3' /> Share
            </button>
          )}
          <button onClick={toggleVisibility} className='cf-btn cf-btn-subtle h-7 text-xs px-2.5'>
            {data.public ? <Eye className='size-3' /> : <EyeOff className='size-3' />}
            {data.public ? 'Public' : 'Private'}
          </button>
          <button onClick={() => window.print()} className='cf-btn cf-btn-subtle h-7 text-xs px-2.5'>
            <Download className='size-3' /> PDF
          </button>
          <button onClick={() => toast.promise(save(), { loading: 'Saving…', success: 'Saved', error: 'Error' })}
            className='cf-btn cf-btn-primary h-7 text-xs px-3'>
            Save
          </button>
        </div>
      </header>

      <div className='flex-1 max-w-7xl mx-auto w-full px-4 py-5'>
        <div className='grid lg:grid-cols-12 gap-5'>

          {/* ── Form panel ── */}
          <div className='lg:col-span-5 flex flex-col gap-3'>
            {/* Controls */}
            <div className='cf-surface p-3 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <TemplateSelector selectedTemplate={data.template}
                  onChange={t => setData(p => ({ ...p, template: t }))} />
                <ColorPicker selectedColor={data.accent_color}
                  onChange={c => setData(p => ({ ...p, accent_color: c }))} />
              </div>
              <div className='flex items-center gap-1'>
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className='cf-btn cf-btn-subtle h-7 px-2 text-xs'>
                    <ChevronLeft className='size-3.5' />
                  </button>
                )}
                <span className='text-xs font-mono px-2' style={{ color: 'var(--t2)' }}>
                  {step + 1}/{SECTIONS.length}
                </span>
                {step < SECTIONS.length - 1 && (
                  <button onClick={() => setStep(s => s + 1)}
                    className='cf-btn cf-btn-subtle h-7 px-2 text-xs'>
                    <ChevronRight className='size-3.5' />
                  </button>
                )}
              </div>
            </div>

            {/* Section tabs */}
            <div className='cf-surface p-1.5'>
              <div className='flex gap-1 overflow-x-auto'>
                {SECTIONS.map((s, i) => {
                  const Icon   = s.icon
                  const active = step === i
                  return (
                    <button key={s.id} onClick={() => setStep(i)}
                      className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium flex-shrink-0 transition-all'
                      style={{
                        background: active ? 'var(--a-glow)' : 'transparent',
                        color: active ? '#c4b5fd' : 'var(--t2)',
                      }}>
                      <Icon className='size-3.5' />
                      {s.name}
                    </button>
                  )
                })}
              </div>
              {/* Progress */}
              <div className='mt-1.5 h-px rounded-full overflow-hidden' style={{ background: 'var(--b0)' }}>
                <div className='h-full rounded-full transition-all duration-500'
                  style={{ width: `${progress}%`, background: 'var(--a)' }} />
              </div>
            </div>

            {/* Form content */}
            <div className='cf-surface p-5 flex-1'>
              {cur.id === 'personal'    && <PersonalInfoForm data={data.personal_info} onChange={d => setData(p => ({ ...p, personal_info: d }))} removeBackground={rmBg} setRemoveBackground={setRmBg} />}
              {cur.id === 'summary'     && <ProfessionalSummaryForm data={data.professional_summary} onChange={d => setData(p => ({ ...p, professional_summary: d }))} setResumeData={setData} />}
              {cur.id === 'experience'  && <ExperienceForm data={data.experience} onChange={d => setData(p => ({ ...p, experience: d }))} />}
              {cur.id === 'education'   && <EducationForm data={data.education} onChange={d => setData(p => ({ ...p, education: d }))} />}
              {cur.id === 'projects'    && <ProjectForm data={data.project} onChange={d => setData(p => ({ ...p, project: d }))} />}
              {cur.id === 'skills'      && <SkillsForm data={data.skills} onChange={d => setData(p => ({ ...p, skills: d }))} />}
            </div>
          </div>

          {/* ── Preview panel ── */}
          <div className='lg:col-span-7'>
            <ResumePreview data={data} template={data.template} accentColor={data.accent_color} />
          </div>

        </div>
      </div>
    </div>
  )
}
