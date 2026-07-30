'use client'

import { useState } from 'react'
import LoadingState from '@/components/LoadingState'
import AdminShell from '@/components/admin/AdminShell'
import PlayerEditForm from '@/components/PlayerEditForm'
import { useAdminDataset } from '@/hooks/useAdminDataset'
import { createId } from '@/lib/admin-data'
import { calculatePlayerStats } from '@/lib/utils'
import { Player } from '@/lib/types'

export default function AdminPlayersPage() {
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
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (loading || !dataset) {
    return <LoadingState label="Loading players…" />
  }

  const addPlayer = async (playerData: Omit<Player, 'id'>) => {
    if (!canEdit) return
    const result = await saveDataset({
      ...dataset,
      players: [...dataset.players, { ...playerData, id: createId() }]
    })
    if (result.success) setShowAdd(false)
  }

  const updatePlayer = async (id: string, playerData: Omit<Player, 'id'>) => {
    if (!canEdit) return
    const result = await saveDataset({
      ...dataset,
      players: dataset.players.map(player =>
        player.id === id ? { ...player, ...playerData } : player
      )
    })
    if (result.success) setEditingId(null)
  }

  const deletePlayer = async (id: string) => {
    if (!canEdit) return
    if (!confirm('Delete this player and all their rounds?')) return
    await saveDataset({
      ...dataset,
      players: dataset.players.filter(player => player.id !== id),
      rounds: dataset.rounds.filter(round => round.playerId !== id),
      trips: dataset.trips.map(trip => ({
        ...trip,
        attendees: (trip.attendees || []).filter(attendeeId => attendeeId !== id),
        championPlayerId: trip.championPlayerId === id ? undefined : trip.championPlayerId
      }))
    })
  }

  return (
    <AdminShell
      title="Players"
      subtitle="Secondary management for player names"
      capabilities={capabilities}
      toast={toast}
      onCloseToast={closeToast}
      actions={
        canEdit ? (
          <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <i className="fas fa-plus" aria-hidden="true"></i> Add Player
          </button>
        ) : null
      }
    >
      <div className="admin-section">
        <div className="admin-grid">
          {[...dataset.players]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(player => {
              const stats = calculatePlayerStats(player, dataset.rounds, dataset.trips)
              return (
                <div key={player.id} className="admin-card">
                  <div className="card-header">
                    <h3>{player.name}</h3>
                    {canEdit && (
                      <div className="card-actions">
                        <button type="button" className="btn btn-edit" onClick={() => setEditingId(player.id)}>
                          <i className="fas fa-edit" aria-hidden="true"></i>
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => deletePlayer(player.id)} disabled={saving}>
                          <i className="fas fa-trash" aria-hidden="true"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="card-content">
                    <p><strong>Years:</strong> {stats.yearsPlayed}</p>
                    <p><strong>Average:</strong> {stats.averageScore}</p>
                    <p><strong>Rounds:</strong> {dataset.rounds.filter(round => round.playerId === player.id).length}</p>
                  </div>
                </div>
              )
            })}
        </div>

        {showAdd && (
          <PlayerEditForm
            onSave={addPlayer}
            onCancel={() => setShowAdd(false)}
            isEditing={false}
          />
        )}

        {editingId && (
          <PlayerEditForm
            player={dataset.players.find(player => player.id === editingId)}
            onSave={playerData => updatePlayer(editingId, playerData)}
            onCancel={() => setEditingId(null)}
            isEditing
          />
        )}
      </div>
    </AdminShell>
  )
}
