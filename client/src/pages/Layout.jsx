import React from 'react'
import { Outlet } from 'react-router-dom'
import AppRail from '../components/Navbar'
import { useSelector } from 'react-redux'
import Loader from '../components/Loader'
import Login from './Login'

export default function Layout() {
  const { user, loading } = useSelector(s => s.auth)

  if (loading) return <Loader />
  if (!user)   return <Login />

  return (
    <div className='flex min-h-dvh' style={{ background: 'var(--bg)' }}>
      <AppRail />
      <div className='flex-1 flex flex-col min-w-0 overflow-x-hidden'>
        <Outlet />
      </div>
    </div>
  )
}
