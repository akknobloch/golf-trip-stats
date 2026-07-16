'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRoundsEditRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin?tab=rounds')
  }, [router])

  return <div className="container"><div className="loading">Redirecting to admin...</div></div>
}
