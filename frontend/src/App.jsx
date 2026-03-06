import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './components/pages/Home'
import Services from './components/pages/Services'
import BookNow from './components/pages/BookNow'
import About from './components/pages/About'
import Contact from './components/pages/Contact'
import PaymentSuccess from './components/pages/PaymentSuccess'
import NotFound from './components/pages/NotFound'
import AdminLayout from './components/admin/AdminLayout'

export default function App() {
  return (
    <Routes>
      {/* Public routes with header/footer */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="book-now" element={<BookNow />} />
        <Route path="about" element={<About />} />
        <Route path="payment/success" element={<PaymentSuccess />} />
        <Route path="contact" element={<Contact />} />

        {/* Placeholder routes — will be built in later sessions */}
        <Route path="shared-shuttle" element={<Services />} />
        <Route path="cruise-transfers" element={<Services />} />
        <Route path="hobbiton-transfers" element={<Services />} />

        {/* Catch-all (exclude admin) */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin routes (no header/footer — standalone layout) */}
      <Route path="admin/*" element={<AdminLayout />} />
    </Routes>
  )
}
