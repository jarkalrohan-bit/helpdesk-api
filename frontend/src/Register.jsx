import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Headset, User, Mail, Lock, ArrowRight } from 'lucide-react'
import { apiRequest } from './api'

export default function Register() {
  const [name, setName] = useState('')
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
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })

      // Registration does not automatically grant admin privileges.
      navigate('/login', {
        state: { message: 'Account created. Please sign in.' },
      })
    } catch (err) {
      setError(err.message || 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><Headset size={28} /></div>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Join your HelpDesk workspace.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <div className="auth-input">
            <User size={18} />
            <input
              id="name"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <label htmlFor="register-email">Email address</label>
          <div className="auth-input">
            <Mail size={18} />
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label htmlFor="register-password">Password</label>
          <div className="auth-input">
            <Lock size={18} />
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
