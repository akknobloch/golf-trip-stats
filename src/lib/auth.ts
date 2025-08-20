// Simple authentication utility for admin protection
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // Check for admin session
  const adminSession = localStorage.getItem('adminAuthenticated')
  return adminSession === 'true'
}

export const authenticate = async (password: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })
    
    const data = await response.json()
    
    if (data.success) {
      localStorage.setItem('adminAuthenticated', 'true')
      return true
    }
    return false
  } catch (error) {
    console.error('Authentication error:', error)
    return false
  }
}

export const logout = (): void => {
  localStorage.removeItem('adminAuthenticated')
}

export const requireAuth = (): boolean => {
  // Always allow in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // Check authentication in production
  return isAuthenticated()
}
