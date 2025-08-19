'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page since dashboard is now the main page
    router.replace('/')
  }, [router])

  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
