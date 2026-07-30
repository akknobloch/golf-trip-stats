'use client'

import { useRouter } from 'next/navigation'
import LoadingState from '@/components/LoadingState'
import AdminShell from '@/components/admin/AdminShell'
import TripEditForm from '@/components/TripEditForm'
import { useAdminDataset } from '@/hooks/useAdminDataset'
import { createId } from '@/lib/admin-data'
import { Player, Trip } from '@/lib/types'

export default function AdminNewTripPage() {
  const router = useRouter()
  const {
    dataset,
    capabilities,
    canEdit,
    loading,
    saving,
    toast,
    closeToast,
    saveDataset
  } = useAdminDataset()

  if (loading || !dataset) {
    return <LoadingState label="Loading admin…" />
  }

  const handleSave = async (tripData: Omit<Trip, 'id'>, newPlayers: Player[] = []) => {
    if (!canEdit || saving) return

    const newTrip: Trip = {
      ...tripData,
      id: createId()
    }

    const result = await saveDataset({
      players: [...dataset.players, ...newPlayers],
      courses: dataset.courses,
      trips: [...dataset.trips, newTrip],
      rounds: dataset.rounds
    })

    if (result.success) {
      router.push(`/admin/trips/${newTrip.id}`)
    }
  }

  return (
    <AdminShell
      title="New Trip"
      subtitle="Save a scheduled trip now; add scores later"
      capabilities={capabilities}
      toast={toast}
      onCloseToast={closeToast}
    >
      <div className="admin-section">
        {!canEdit && (
          <div className="info-box">
            <h3>View only</h3>
            <p>Production cannot create trips. Run locally to save a placeholder trip.</p>
          </div>
        )}
        <TripEditForm
          players={dataset.players}
          trips={dataset.trips}
          embedded
          disabled={!canEdit || saving}
          submitLabel={saving ? 'Saving…' : 'Save placeholder trip'}
          onSave={handleSave}
          onCancel={() => router.push('/admin')}
          isEditing={false}
        />
      </div>
    </AdminShell>
  )
}
