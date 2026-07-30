'use client'

import { useState, useEffect, useId } from 'react'
import { useRouter } from 'next/navigation'
import { authenticate, isAuthenticated } from '@/lib/auth'
import Link from 'next/link'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const passwordId = useId()

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const ok = await isAuthenticated()
      if (cancelled) return
      if (ok) {
        router.push('/admin')
        return
      }
      setCheckingSession(false)
    }
    check()
    return () => {
      cancelled = true
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const success = await authenticate(password)
      if (success) {
        router.push('/admin')
      } else {
        setError('Invalid password')
        setPassword('')
      }
    } catch {
      setError('Authentication failed. Please try again.')
      setPassword('')
    }

    setIsLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="login-checking">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Admin</h1>
          <p>Sign in to update golf trip data</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor={passwordId}>Password</label>
            <input
              type="password"
              id={passwordId}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter admin password"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                Authenticating...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                Login
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <Link href="/" className="back-link">
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
