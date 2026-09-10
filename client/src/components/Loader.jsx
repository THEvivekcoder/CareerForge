import React from 'react'
import { Zap } from 'lucide-react'

export default function Loader() {
  return (
    <div className='flex items-center justify-center min-h-dvh' style={{ background: 'var(--bg)' }}>
      <div className='flex flex-col items-center gap-5'>
        <div className='relative size-10'>
          <div className='absolute inset-0 rounded-xl flex items-center justify-center'
            style={{ background: 'var(--a)', boxShadow: '0 0 20px var(--a-glow)' }}>
            <Zap className='size-5 text-white' strokeWidth={2.5} />
          </div>
          <div className='absolute -inset-2 rounded-2xl border border-dashed animate-spin'
            style={{ borderColor: 'var(--a)', opacity: .3, animationDuration: '3s' }} />
        </div>
        <p className='text-xs font-medium tracking-widest uppercase' style={{ color: 'var(--t2)' }}>
          CareerForge
        </p>
      </div>
    </div>
  )
}
