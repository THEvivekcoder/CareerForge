import React, { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import {
  Globe, Loader2, ExternalLink, Clock, Sparkles,
  TrendingUp, TrendingDown, X, RefreshCw, Briefcase,
  Zap, AlertTriangle, ChevronRight, Newspaper,
} from 'lucide-react'
import { PageShell } from '../components/Navbar'

// ─── helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const IMPACT_COLOR = {
  'Very High': '#ef4444', 'High': '#f97316', 'Medium': '#f59e0b', 'Low': '#10b981',
}

const ImpactBadge = ({ level }) => {
  const c = IMPACT_COLOR[level] || '#9ca3af'
  return (
    <span className='cf-tag' style={{ color: c, borderColor: c + '50', background: c + '12' }}>
      <span className='size-1.5 rounded-full' style={{ background: c }} />{level}
    </span>
  )
}

const CATEGORIES = [
  { id: 'all',      label: 'All Tech' },
  { id: 'ai',       label: 'AI & ML' },
  { id: 'itjobs',   label: 'IT Jobs' },
  { id: 'startups', label: 'Startups' },
  { id: 'bigtech',  label: 'Big Tech' },
  { id: 'india',    label: '🇮🇳 India' },
  { id: 'global',   label: '🌐 Global' },
]

// ─── Article card ─────────────────────────────────────────────────────────────

const ArticleCard = ({ article, onAnalyze, isAnalyzing }) => (
  <div className='cf-surface overflow-hidden flex flex-col group transition-all hover:border-opacity-60'
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--a-hi)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b0)'}>
    {article.image && (
      <img src={article.image} alt={article.title} className='w-full h-36 object-cover'
        onError={e => { e.target.style.display = 'none' }} />
    )}
    <div className='p-3.5 flex flex-col flex-1'>
      <div className='flex items-center gap-2 mb-2'>
        <span className='text-xs font-semibold px-1.5 py-0.5 rounded'
          style={{ background: 'var(--a-glow)', color: 'var(--a-hi)' }}>
          {article.source?.name || 'News'}
        </span>
        <span className='flex items-center gap-1 text-xs' style={{ color: 'var(--t3)' }}>
          <Clock className='size-3' />{timeAgo(article.publishedAt)}
        </span>
      </div>
      <h3 className='text-xs font-semibold leading-snug mb-2 line-clamp-2' style={{ color: 'var(--t0)' }}>
        {article.title}
      </h3>
      <p className='text-xs line-clamp-3 flex-1' style={{ color: 'var(--t2)' }}>{article.description}</p>
      <div className='flex items-center gap-2 mt-3'>
        <button onClick={() => onAnalyze(article)} disabled={isAnalyzing}
          className='cf-btn cf-btn-primary text-xs h-7 px-2.5 disabled:opacity-50'>
          {isAnalyzing ? <Loader2 className='size-3 animate-spin' /> : <Sparkles className='size-3' />}
          Analyse
        </button>
        <a href={article.url} target='_blank' rel='noopener noreferrer'
          className='cf-btn cf-btn-ghost text-xs h-7 px-2.5'>
          Read <ExternalLink className='size-3' />
        </a>
      </div>
    </div>
  </div>
)

// ─── Analysis modal ───────────────────────────────────────────────────────────

const AnalysisModal = ({ article, analysis, isLoading, onClose }) => {
  const rows = analysis ? [
    { label: 'Market',     value: analysis.impactScores?.marketImpact },
    { label: 'Technology', value: analysis.impactScores?.technologyImpact },
    { label: 'Jobs',       value: analysis.impactScores?.jobImpact },
    { label: 'Startups',   value: analysis.impactScores?.startupImpact },
  ] : []

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,.72)' }} onClick={onClose}>
      <div className='cf-surface w-full max-w-xl max-h-[88vh] overflow-y-auto'
        style={{ background: 'var(--s0)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className='sticky top-0 flex items-start justify-between gap-3 px-5 py-4'
          style={{ background: 'var(--s0)', borderBottom: '1px solid var(--b0)' }}>
          <div className='flex items-center gap-2.5'>
            <div className='size-7 rounded-lg flex items-center justify-center flex-shrink-0'
              style={{ background: 'var(--a-glow)' }}>
              <Sparkles className='size-3.5' style={{ color: 'var(--a-hi)' }} />
            </div>
            <div>
              <p className='cf-section-label'>AI Impact Analysis</p>
              <p className='text-xs font-semibold line-clamp-1 mt-0.5' style={{ color: 'var(--t0)' }}>{article?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className='cf-btn cf-btn-subtle p-1.5 flex-shrink-0'>
            <X className='size-3.5' />
          </button>
        </div>

        <div className='p-5 space-y-4'>
          {isLoading && (
            <div className='py-14 flex flex-col items-center gap-3'>
              <Loader2 className='size-8 animate-spin' style={{ color: 'var(--a)' }} />
              <p className='text-xs' style={{ color: 'var(--t2)' }}>Analysing article…</p>
            </div>
          )}

          {!isLoading && analysis && (<>
            <div>
              <p className='cf-section-label mb-1.5'>What happened</p>
              <p className='text-xs leading-relaxed' style={{ color: 'var(--t1)' }}>{analysis.summary}</p>
            </div>
            <div>
              <p className='cf-section-label mb-1.5'>Why it matters</p>
              <p className='text-xs leading-relaxed' style={{ color: 'var(--t1)' }}>{analysis.whyItMatters}</p>
            </div>
            <div>
              <p className='cf-section-label mb-2'>Impact scores</p>
              <div className='grid grid-cols-2 gap-2'>
                {rows.map(r => (
                  <div key={r.label} className='flex items-center justify-between px-3 py-2 rounded-lg'
                    style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
                    <span className='text-xs' style={{ color: 'var(--t2)' }}>{r.label}</span>
                    <ImpactBadge level={r.value || 'Low'} />
                  </div>
                ))}
              </div>
            </div>
            <div className='grid sm:grid-cols-2 gap-3'>
              {analysis.jobsGrowing?.length > 0 && (
                <div className='p-3 rounded-xl' style={{ background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.2)' }}>
                  <p className='text-xs font-bold mb-2 flex items-center gap-1' style={{ color: '#10b981' }}>
                    <TrendingUp className='size-3' /> Growing
                  </p>
                  {analysis.jobsGrowing.map(r => (
                    <p key={r} className='flex items-center gap-1.5 text-xs mb-1' style={{ color: 'var(--t1)' }}>
                      <ChevronRight className='size-3 flex-shrink-0' />{r}
                    </p>
                  ))}
                </div>
              )}
              {analysis.jobsAtRisk?.length > 0 && (
                <div className='p-3 rounded-xl' style={{ background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)' }}>
                  <p className='text-xs font-bold mb-2 flex items-center gap-1' style={{ color: '#ef4444' }}>
                    <TrendingDown className='size-3' /> At Risk
                  </p>
                  {analysis.jobsAtRisk.map(r => (
                    <p key={r} className='flex items-center gap-1.5 text-xs mb-1' style={{ color: 'var(--t1)' }}>
                      <ChevronRight className='size-3 flex-shrink-0' />{r}
                    </p>
                  ))}
                </div>
              )}
            </div>
            {analysis.skillsInDemand?.length > 0 && (
              <div>
                <p className='cf-section-label mb-2 flex items-center gap-1'><Zap className='size-3' /> Skills in Demand</p>
                <div className='flex flex-wrap gap-1.5'>
                  {analysis.skillsInDemand.map(s => (
                    <span key={s} className='cf-tag' style={{ color: 'var(--a-hi)', borderColor: 'var(--a-lo)', background: 'var(--a-glow)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.keyTakeaway && (
              <div className='flex items-start gap-2.5 p-3 rounded-xl'
                style={{ background: 'var(--a-glow)', border: '1px solid var(--a-lo)' }}>
                <Briefcase className='size-3.5 flex-shrink-0 mt-0.5' style={{ color: 'var(--a-hi)' }} />
                <p className='text-xs' style={{ color: 'var(--a-hi)' }}>{analysis.keyTakeaway}</p>
              </div>
            )}
            {analysis.disclaimer && (
              <p className='text-xs flex items-start gap-1.5' style={{ color: 'var(--t3)' }}>
                <AlertTriangle className='size-3 flex-shrink-0 mt-0.5' />{analysis.disclaimer}
              </p>
            )}
          </>)}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const NewsIntelligence = () => {
  const { token } = useSelector(state => state.auth)

  const [activeCategory, setActiveCategory] = useState('all')
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [selectedArticle, setSelectedArticle] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzingId, setAnalyzingId] = useState(null)

  const fetchNews = useCallback(async (category) => {
    setIsLoading(true)
    setArticles([])
    try {
      const { data } = await api.get(`/api/news?category=${category}`, {
        headers: { Authorization: token },
      })
      setArticles(data.articles || [])
      setLastUpdated(new Date())
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load news. Check your GNews API key.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchNews(activeCategory)
  }, [activeCategory])

  const handleAnalyze = async (article) => {
    setSelectedArticle(article)
    setAnalysis(null)
    setIsAnalyzing(true)
    setAnalyzingId(article.url)

    try {
      const { data } = await api.post(
        '/api/ai/analyze-news',
        { title: article.title, description: article.description, content: article.content },
        { headers: { Authorization: token } }
      )
      setAnalysis(data)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Analysis failed')
      setSelectedArticle(null)
    } finally {
      setIsAnalyzing(false)
      setAnalyzingId(null)
    }
  }

  const closeModal = () => {
    setSelectedArticle(null)
    setAnalysis(null)
    setIsAnalyzing(false)
  }

  return (
    <PageShell eyebrow='Career Intelligence' title='Tech & Career News'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 py-6'>

        {/* Controls bar */}
        <div className='flex items-center justify-between gap-3 mb-5 flex-wrap'>
          <div className='flex items-center gap-2 flex-wrap'>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className='flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all'
                style={{
                  background: activeCategory === cat.id ? 'var(--a)' : 'var(--s1)',
                  color: activeCategory === cat.id ? '#fff' : 'var(--t2)',
                  border: `1px solid ${activeCategory === cat.id ? 'var(--a)' : 'var(--b0)'}`,
                }}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className='flex items-center gap-3'>
            <span className='flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold'
              style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)' }}>
              <span className='size-1.5 rounded-full bg-red-500 animate-pulse' /> LIVE
            </span>
            {lastUpdated && (
              <span className='text-xs' style={{ color: 'var(--t3)' }}>
                Updated {timeAgo(lastUpdated)}
              </span>
            )}
            <button onClick={() => fetchNews(activeCategory)} disabled={isLoading}
              className='cf-btn cf-btn-subtle h-7 px-2.5 text-xs'>
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className='grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className='cf-surface p-4 space-y-3'>
                <div className='cf-skeleton h-32 rounded-lg' />
                <div className='cf-skeleton h-3 w-1/3' />
                <div className='cf-skeleton h-4' />
                <div className='cf-skeleton h-4 w-5/6' />
              </div>
            ))}
          </div>
        )}

        {/* Articles grid */}
        {!isLoading && articles.length > 0 && (
          <div className='grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {articles.map((article, i) => (
              <ArticleCard key={article.url || i} article={article}
                onAnalyze={handleAnalyze} isAnalyzing={analyzingId === article.url} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && articles.length === 0 && (
          <div className='flex flex-col items-center justify-center py-24 gap-4 text-center'>
            <Newspaper className='size-12' style={{ color: 'var(--t3)' }} />
            <p className='text-xs' style={{ color: 'var(--t2)' }}>
              No articles found. Make sure <code className='mono'>GNEWS_API_KEY</code> is set in <code className='mono'>server/.env</code>
            </p>
            <button onClick={() => fetchNews(activeCategory)} className='cf-btn cf-btn-primary h-8 px-4 text-xs'>
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Analysis modal */}
      {selectedArticle && (
        <AnalysisModal article={selectedArticle} analysis={analysis}
          isLoading={isAnalyzing} onClose={closeModal} />
      )}
    </PageShell>
  )
}

export default NewsIntelligence
