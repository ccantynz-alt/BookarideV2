import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './components/pages/Home'
import Services from './components/pages/Services'
import BookNow from './components/pages/BookNow'
import About from './components/pages/About'
import Contact from './components/pages/Contact'
import PaymentSuccess from './components/pages/PaymentSuccess'
import Terms from './components/pages/Terms'
import Privacy from './components/pages/Privacy'
import NotFound from './components/pages/NotFound'
import AdminLogin from './components/pages/admin/AdminLogin'
import AdminDashboard from './components/pages/admin/AdminDashboard'

function AdminGuard({ children }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public routes with header/footer */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="book-now" element={<BookNow />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="payment/success" element={<PaymentSuccess />} />
        <Route path="terms-and-conditions" element={<Terms />} />
        <Route path="privacy-policy" element={<Privacy />} />

        {/* Redirect old/placeholder service pages to book-now */}
        <Route path="shared-shuttle" element={<Navigate to="/book-now" replace />} />
        <Route path="cruise-transfers" element={<Navigate to="/book-now" replace />} />
        <Route path="hobbiton-transfers" element={<Navigate to="/book-now" replace />} />
        <Route path="website-usage-policy" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="drive-with-us" element={<Navigate to="/contact" replace />} />
        <Route path="travel-agents" element={<Navigate to="/contact" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin — no header/footer */}
      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="admin/dashboard" element={
        <AdminGuard><AdminDashboard /></AdminGuard>
      } />
      <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
