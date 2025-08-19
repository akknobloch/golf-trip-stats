// Simple authentication utility for admin protection
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'golf2024'

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

export const authenticate = (password: string): boolean => {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem('adminAuthenticated', 'true')
    return true
  }
  return false
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
