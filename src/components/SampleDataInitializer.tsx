'use client'

import { useEffect } from 'react'
import { initializeSampleData } from '@/lib/sample-data'

export default function SampleDataInitializer() {
  useEffect(() => {
    // Initialize sample data if no data exists
    initializeSampleData()
  }, [])

  // This component doesn't render anything
  return null
}
