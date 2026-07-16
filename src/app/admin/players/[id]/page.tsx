'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPlayersEditRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin?tab=players')
  }, [router])

  return <div className="container"><div className="loading">Redirecting to admin...</div></div>
}
