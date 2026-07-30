'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStaticData } from '@/lib/data'
import { requireAuth } from '@/lib/auth'
import {
  AdminCapabilities,
  GolfDataset,
  SaveResult,
  fetchAdminCapabilities,
  saveGolfDataset
} from '@/lib/admin-data'

type ToastState = {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
}

const emptyToast: ToastState = {
  message: '',
  type: 'success',
  isVisible: false
}

export function useAdminDataset() {
  const router = useRouter()
  const [dataset, setDataset] = useState<GolfDataset | null>(null)
  const [capabilities, setCapabilities] = useState<AdminCapabilities | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState>(emptyToast)

  const reloadDataset = useCallback(() => {
    setDataset(getStaticData())
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const ok = await requireAuth()
      if (cancelled) return
      if (!ok) {
        router.push('/admin/login')
        return
      }

      const caps = await fetchAdminCapabilities()
      if (cancelled) return

      setCapabilities(caps)
      setDataset(getStaticData())
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true })
  }, [])

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  const saveDataset = useCallback(
    async (next: GolfDataset): Promise<SaveResult> => {
      if (capabilities && !capabilities.canEdit) {
        const result: SaveResult = {
          success: false,
          status: 403,
          error:
            'Editing only works on localhost. Run the app locally, save changes, commit src/data/golf-data.ts, then redeploy.'
        }
        showToast(result.error, 'error')
        return result
      }

      setSaving(true)
      const result = await saveGolfDataset(next)
      setSaving(false)

      if (result.success) {
        setDataset(next)
        showToast('Data saved successfully!', 'success')
      } else {
        showToast(result.error, 'error')
      }

      return result
    },
    [capabilities, showToast]
  )

  return {
    dataset,
    setDataset,
    capabilities,
    canEdit: capabilities?.canEdit === true,
    loading,
    saving,
    toast,
    showToast,
    closeToast,
    saveDataset,
    reloadDataset
  }
}
