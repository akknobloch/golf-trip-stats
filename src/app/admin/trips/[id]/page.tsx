'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import LoadingState from '@/components/LoadingState'
import AdminShell from '@/components/admin/AdminShell'
import TripEditForm from '@/components/TripEditForm'
import TripScoreGrid from '@/components/admin/TripScoreGrid'
import { useAdminDataset } from '@/hooks/useAdminDataset'
import {
  tripDisplayName,
  tripRoundCount,
  tripStatusLabel
} from '@/lib/admin-data'
import { Player, Trip } from '@/lib/types'

type HubTab = 'details' | 'roster' | 'scores'

export default function AdminTripHubPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string
  const [activeTab, setActiveTab] = useState<HubTab>('details')
  const [editingDetails, setEditingDetails] = useState(false)

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

  const trip = useMemo(
    () => dataset?.trips.find(item => item.id === tripId) || null,
    [dataset, tripId]
  )

  if (loading || !dataset) {
    return <LoadingState label="Loading trip…" />
  }

  if (!trip) {
    return (
      <AdminShell
        title="Trip not found"
        capabilities={capabilities}
        toast={toast}
        onCloseToast={closeToast}
      >
        <div className="empty-state">
          <h3>Trip not found</h3>
          <Link href="/admin" className="btn btn-secondary">Back to trips</Link>
        </div>
      </AdminShell>
    )
  }

  const roundCount = tripRoundCount(trip.id, dataset.rounds)
  const status = tripStatusLabel(trip, dataset.rounds)
  const scoredPlayerIds = new Set(
    dataset.rounds.filter(round => round.tripId === trip.id).map(round => round.playerId)
  )
  const attendees = (trip.attendees || [])
    .map(id => dataset.players.find(player => player.id === id))
    .filter((player): player is Player => Boolean(player))
  const scoredPlayers = dataset.players.filter(player => scoredPlayerIds.has(player.id))

  const handleUpdateTrip = async (tripData: Omit<Trip, 'id'>, newPlayers: Player[] = []) => {
    if (!canEdit) return
    const result = await saveDataset({
      players: [...dataset.players, ...newPlayers],
      courses: dataset.courses,
      trips: dataset.trips.map(item => (item.id === trip.id ? { ...tripData, id: trip.id } : item)),
      rounds: dataset.rounds
    })
    if (result.success) {
      setEditingDetails(false)
    }
  }

  const handleDeleteTrip = async () => {
    if (!canEdit) return
    if (!confirm('Delete this trip and all of its scores?')) return
    const result = await saveDataset({
      players: dataset.players,
      courses: dataset.courses,
      trips: dataset.trips.filter(item => item.id !== trip.id),
      rounds: dataset.rounds.filter(round => round.tripId !== trip.id)
    })
    if (result.success) {
      router.push('/admin')
    }
  }

  return (
    <AdminShell
      title={tripDisplayName(trip)}
      subtitle={status}
      capabilities={capabilities}
      toast={toast}
      onCloseToast={closeToast}
      actions={
        <div className="admin-inline-actions">
          <Link href="/admin" className="btn btn-secondary">All trips</Link>
          <Link href={`/trips/${trip.id}`} className="btn btn-secondary">Public page</Link>
          {canEdit && (
            <button type="button" className="btn btn-danger" onClick={handleDeleteTrip} disabled={saving}>
              Delete trip
            </button>
          )}
        </div>
      }
    >
      <div className="admin-section">
        <div className={`trip-status-banner ${roundCount === 0 ? 'scheduled' : 'scored'}`}>
          <strong>{status}</strong>
          {roundCount === 0 && (
            <span> This is a placeholder trip. Add courses and scores when you have them.</span>
          )}
        </div>

        <div className="admin-tabs hub-tabs" role="tablist" aria-label="Trip sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'details'}
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'roster'}
            className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveTab('roster')}
          >
            Roster
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scores'}
            className={`tab-btn ${activeTab === 'scores' ? 'active' : ''}`}
            onClick={() => setActiveTab('scores')}
          >
            Scores
          </button>
        </div>

        {activeTab === 'details' && (
          <div>
            {!editingDetails ? (
              <div className="admin-card">
                <div className="card-content">
                  <p><strong>Dates:</strong> {trip.startDate} to {trip.endDate}</p>
                  <p><strong>Location:</strong> {trip.location}</p>
                  {trip.description && <p><strong>Description:</strong> {trip.description}</p>}
                  {trip.weather && <p><strong>Weather:</strong> {trip.weather}</p>}
                  {trip.notes && <p><strong>Notes:</strong> {trip.notes}</p>}
                  <p>
                    <strong>Champion:</strong>{' '}
                    {trip.championPlayerId
                      ? dataset.players.find(player => player.id === trip.championPlayerId)?.name || 'Unknown'
                      : 'Not set'}
                  </p>
                  <p><strong>Photos:</strong> {trip.photos?.length || 0}</p>
                </div>
                {canEdit && (
                  <div className="form-actions">
                    <button type="button" className="btn btn-primary" onClick={() => setEditingDetails(true)}>
                      Edit details
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <TripEditForm
                trip={trip}
                players={dataset.players}
                trips={dataset.trips}
                embedded
                disabled={!canEdit || saving}
                isEditing
                onSave={handleUpdateTrip}
                onCancel={() => setEditingDetails(false)}
              />
            )}
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="admin-card">
            <div className="card-content">
              <h3>Players with scores ({scoredPlayers.length})</h3>
              {scoredPlayers.length > 0 ? (
                <ul className="admin-simple-list">
                  {scoredPlayers
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(player => (
                      <li key={player.id}>{player.name}</li>
                    ))}
                </ul>
              ) : (
                <p>No scores recorded yet.</p>
              )}

              <h3>Attendees without scores ({attendees.filter(p => !scoredPlayerIds.has(p.id)).length})</h3>
              {attendees.filter(p => !scoredPlayerIds.has(p.id)).length > 0 ? (
                <ul className="admin-simple-list">
                  {attendees
                    .filter(p => !scoredPlayerIds.has(p.id))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(player => (
                      <li key={player.id}>{player.name}</li>
                    ))}
                </ul>
              ) : (
                <p>None listed.</p>
              )}

              <p className="form-help">
                Edit the roster from Details, or add players while entering scores.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'scores' && (
          <TripScoreGrid
            trip={trip}
            players={dataset.players}
            courses={dataset.courses}
            rounds={dataset.rounds}
            canEdit={canEdit}
            saving={saving}
            onSave={async ({ courses, players, rounds, attendees }) => {
              await saveDataset({
                players,
                courses,
                trips: dataset.trips.map(item =>
                  item.id === trip.id ? { ...item, attendees } : item
                ),
                rounds
              })
            }}
          />
        )}
      </div>
    </AdminShell>
  )
}
