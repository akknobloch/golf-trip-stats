'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCoursesEditRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin?tab=courses')
  }, [router])

  return <div className="container"><div className="loading">Redirecting to admin...</div></div>
}
