import { useState, useEffect } from 'react'
import {
  Mail,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
} from 'lucide-react'
import api from '../../lib/api'

export default function AdminEmail() {
  const [testEmail, setTestEmail] = useState('')
  const [testSubject, setTestSubject] = useState('BookARide — Test Email')
  const [testMessage, setTestMessage] = useState('This is a test email from the BookARide admin panel. If you receive this, email delivery is working correctly.')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)

  async function fetchLogs() {
    setLogsLoading(true)
    try {
      const { data } = await api.get('/admin/email/logs')
      setLogs(data.logs || [])
    } catch {
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  async function sendTest(e) {
    e.preventDefault()
    if (!testEmail) return
    setSending(true)
    setResult(null)
    try {
      const { data } = await api.post('/admin/email/test', {
        to: testEmail,
        subject: testSubject,
        message: testMessage,
      })
      setResult({ success: true, message: data.message })
      fetchLogs()
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.detail || 'Failed to send email' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Send test email */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#d4a843]" />
          Test Email Delivery
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Send a test email to verify that the Mailgun email delivery system is configured and working correctly.
        </p>

        <form onSubmit={sendTest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input
              type="text"
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843] resize-none"
            />
          </div>

          {result && (
            <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
              result.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {result.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !testEmail}
            className="bg-[#d4a843] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#c49a3a] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-5 h-5" /> Send Test Email</>
            )}
          </button>
        </form>
      </div>

      {/* Email configuration status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Email Configuration</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Provider: <strong>Mailgun</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Domain: <strong>bookaride.co.nz</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">From: <strong>noreply@bookaride.co.nz</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Booking confirmation: <strong>Automatic</strong></span>
          </div>
        </div>
      </div>

      {/* Email logs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Recent Email Logs
          </h2>
          <button
            onClick={fetchLogs}
            disabled={logsLoading}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {logsLoading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No email logs yet. Send a test email to get started.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div
                key={log.id || i}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-sm"
              >
                {log.status === 'sent' ? (
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-gray-700 font-medium truncate">{log.subject}</div>
                  <div className="text-gray-400 text-xs truncate">To: {log.to}</div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
