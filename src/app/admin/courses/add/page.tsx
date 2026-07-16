'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCoursesAddRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin?tab=courses')
  }, [router])

  return <div className="container"><div className="loading">Redirecting to admin...</div></div>
}
