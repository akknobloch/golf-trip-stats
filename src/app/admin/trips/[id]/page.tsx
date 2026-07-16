'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminTripsEditRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin?tab=trips')
  }, [router])

  return <div className="container"><div className="loading">Redirecting to admin...</div></div>
}
