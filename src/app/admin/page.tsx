'use client'

import Link from 'next/link'
import LoadingState from '@/components/LoadingState'
import AdminShell from '@/components/admin/AdminShell'
import { useAdminDataset } from '@/hooks/useAdminDataset'
import {
  sortTripsNewestFirst,
  tripCourseCount,
  tripDisplayName,
  tripPlayerCount,
  tripRoundCount,
  tripStatusLabel,
  getTripYear
} from '@/lib/admin-data'

export default function Admin() {
  const {
    dataset,
    capabilities,
    canEdit,
    loading,
    toast,
    closeToast
  } = useAdminDataset()

  if (loading || !dataset) {
    return <LoadingState label="Loading admin…" />
  }

  const trips = sortTripsNewestFirst(dataset.trips)

  return (
    <AdminShell
      title="Admin"
      subtitle="Manage golf trips, then add courses and scores"
      capabilities={capabilities}
      toast={toast}
      onCloseToast={closeToast}
      actions={
        canEdit ? (
          <Link href="/admin/trips/new" className="btn btn-primary">
            <i className="fas fa-plus" aria-hidden="true"></i> New Trip
          </Link>
        ) : (
          <span className="btn btn-primary btn-disabled" aria-disabled="true">
            <i className="fas fa-plus" aria-hidden="true"></i> New Trip
          </span>
        )
      }
    >
      <div className="admin-section">
        <div className="section-header section-header-stack">
          <div>
            <h2 className="section-title">Trips</h2>
            <p className="section-help">
              Start with a trip (even as a September placeholder with no scores). Open a trip to add courses and scores later.
            </p>
          </div>
        </div>

        <div className="admin-grid">
          {trips.map(trip => {
            const roundCount = tripRoundCount(trip.id, dataset.rounds)
            const playerCount = tripPlayerCount(trip, dataset.rounds)
            const courseCount = tripCourseCount(trip.id, dataset.rounds)
            const status = tripStatusLabel(trip, dataset.rounds)

            return (
              <Link key={trip.id} href={`/admin/trips/${trip.id}`} className="admin-card admin-card-link">
                <div className="card-header">
                  <h3>{tripDisplayName(trip)}</h3>
                  <span className={`trip-status-badge ${roundCount === 0 ? 'scheduled' : 'scored'}`}>
                    {status}
                  </span>
                </div>
                <div className="card-content">
                  <p><strong>Year:</strong> {getTripYear(trip)}</p>
                  <p><strong>Dates:</strong> {trip.startDate} to {trip.endDate}</p>
                  <p><strong>Location:</strong> {trip.location}</p>
                  <p><strong>Players:</strong> {playerCount}</p>
                  <p><strong>Courses:</strong> {courseCount}</p>
                  <p><strong>Scores:</strong> {roundCount}</p>
                </div>
              </Link>
            )
          })}
          {trips.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
              <h3>No Trips</h3>
              <p>Create a trip to get started.</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
