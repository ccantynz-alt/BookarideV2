import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()
  // Pages with full-bleed hero sections that extend behind the transparent header
  const isHeroPage = location.pathname === '/'

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-1 ${isHeroPage ? '' : 'pt-[76px]'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
