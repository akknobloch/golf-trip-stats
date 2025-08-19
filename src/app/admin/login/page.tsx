'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authenticate, isAuthenticated } from '@/lib/auth'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // If already authenticated, redirect to admin
    if (isAuthenticated()) {
      router.push('/admin')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (authenticate(password)) {
      router.push('/admin')
    } else {
      setError('Invalid password')
      setPassword('')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="container">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1><i className="fas fa-lock"></i> Admin Access</h1>
            <p>Enter password to access admin panel</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter admin password"
                required
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
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
                  <i className="fas fa-spinner fa-spin"></i>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Login
                </>
              )}
            </button>
          </form>
          
          <div className="login-footer">
            <a href="/" className="back-link">
              <i className="fas fa-arrow-left"></i>
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        .login-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          padding: 40px;
          width: 100%;
          max-width: 400px;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .login-header h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 24px;
        }
        
        .login-header p {
          color: #666;
          margin: 0;
        }
        
        .login-form {
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 500;
        }
        
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s ease;
          box-sizing: border-box;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .form-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        
        .error-message {
          background: #fee;
          color: #c53030;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .login-btn {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .login-footer {
          text-align: center;
        }
        
        .back-link {
          color: #667eea;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
