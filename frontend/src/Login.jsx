import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Headset, Mail, Lock, ArrowRight } from 'lucide-react'
import { apiRequest } from './api'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      // Adjust these fields if your API response uses different names.
      const token = data.token || data.accessToken
      const user = data.user || data

      if (!token) {
        throw new Error('Login succeeded, but no token was returned. Check your API response.')
      }

      localStorage.setItem('helpdesk_token', token)

      onLogin({
        id: user.id || user.userId,
        name: user.name || user.email || email,
        email: user.email || email,
        role: user.role || 'user',
      })

      navigate('/')
    } catch (err) {
      setError(err.message || 'Unable to log in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><Headset size={28} /></div>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your HelpDesk workspace.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <div className="auth-input">
            <Mail size={18} />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="auth-input">
            <Lock size={18} />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
