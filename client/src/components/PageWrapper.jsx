import React from 'react'
import { PageShell } from './Navbar'

export default function PageWrapper({ title, eyebrow, headerAction, children, maxWidth = '60rem' }) {
  return (
    <PageShell title={title} eyebrow={eyebrow} action={headerAction}>
      <div className='mx-auto w-full px-4 sm:px-6 py-6 cf-enter' style={{ maxWidth }}>
        {children}
      </div>
    </PageShell>
  )
}
