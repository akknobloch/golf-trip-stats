// Client-side auth helpers. Real protection is the httpOnly session cookie + middleware.

export const isAuthenticated = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false

  try {
    const response = await fetch('/api/auth', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    })
    if (!response.ok) return false
    const data = await response.json()
    return data.authenticated === true
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}

export const authenticate = async (password: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Authentication error:', error)
    return false
  }
}

export const logout = async (): Promise<void> => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    })
  } catch (error) {
    console.error('Logout error:', error)
  }
}

export const requireAuth = async (): Promise<boolean> => {
  return isAuthenticated()
}
