'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trip, Player, TripPhoto, TripTeam } from '@/lib/types'
import { createId } from '@/lib/admin-data'
import { teamDisplayName } from '@/lib/utils'
import PhotoUpload from './PhotoUpload'

interface TripEditFormProps {
  trip?: Trip
  players: Player[]
  trips?: Trip[]
  onSave: (tripData: Omit<Trip, 'id'>, newPlayers?: Player[]) => void
  onCancel: () => void
  isEditing?: boolean
  embedded?: boolean
  disabled?: boolean
  submitLabel?: string
}

function defaultDates() {
  const now = new Date()
  const year = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
  const start = new Date(year, 8, 20)
  const end = new Date(year, 8, 22)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  }
}

export default function TripEditForm({
  trip,
  players,
  trips = [],
  onSave,
  onCancel,
  isEditing = false,
  embedded = false,
  disabled = false,
  submitLabel
}: TripEditFormProps) {
  const [mounted, setMounted] = useState(false)
  const [localPlayers, setLocalPlayers] = useState(players)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    weather: '',
    notes: '',
    championPlayerId: '',
    attendees: [] as string[],
    teams: [] as TripTeam[],
    teamChampionId: ''
  })
  const [photos, setPhotos] = useState<TripPhoto[]>([])
  const [createdPlayerIds, setCreatedPlayerIds] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setLocalPlayers(players)
  }, [players])

  useEffect(() => {
    if (trip) {
      setFormData({
        startDate: trip.startDate,
        endDate: trip.endDate,
        location: trip.location,
        description: trip.description || '',
        weather: trip.weather || '',
        notes: trip.notes || '',
        championPlayerId: trip.championPlayerId || '',
        attendees: trip.attendees || [],
        teams: trip.teams || [],
        teamChampionId: trip.teamChampionId || ''
      })
      setPhotos(trip.photos || [])
    } else {
      const dates = defaultDates()
      setFormData(prev => ({
        ...prev,
        ...dates
      }))
      setPhotos([])
    }
  }, [trip])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return
    if (!formData.startDate) {
      alert('Start date is required')
      return
    }
    if (!formData.endDate) {
      alert('End date is required')
      return
    }
    if (!formData.location.trim()) {
      alert('Location is required')
      return
    }
    const newPlayers = localPlayers.filter(player => createdPlayerIds.includes(player.id))
    const teams = formData.teams.filter(team => team.playerIds.length > 0)
    onSave(
      {
        ...formData,
        teams,
        teamChampionId: teams.some(team => team.id === formData.teamChampionId)
          ? formData.teamChampionId
          : undefined,
        photos
      },
      newPlayers
    )
  }

  const addTeam = () => {
    if (disabled) return
    setFormData(prev => ({
      ...prev,
      teams: [...prev.teams, { id: createId(), name: '', playerIds: [] }]
    }))
  }

  const removeTeam = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.filter(team => team.id !== teamId),
      teamChampionId: prev.teamChampionId === teamId ? '' : prev.teamChampionId
    }))
  }

  const updateTeamName = (teamId: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map(team => (team.id === teamId ? { ...team, name } : team))
    }))
  }

  // A player belongs to at most one team, so checking them into a team also
  // removes them from whichever team they were on before.
  const handleTeamMemberChange = (teamId: string, playerId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map(team => {
        if (team.id === teamId) {
          return checked
            ? { ...team, playerIds: [...team.playerIds, playerId] }
            : { ...team, playerIds: team.playerIds.filter(id => id !== playerId) }
        }
        return checked && team.playerIds.includes(playerId)
          ? { ...team, playerIds: team.playerIds.filter(id => id !== playerId) }
          : team
      })
    }))
  }

  const handleAttendeeChange = (playerId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      attendees: checked
        ? [...prev.attendees, playerId]
        : prev.attendees.filter(id => id !== playerId)
    }))
  }

  const addNewPlayer = () => {
    const name = newPlayerName.trim()
    if (!name || disabled) return
    if (localPlayers.some(player => player.name.toLowerCase() === name.toLowerCase())) {
      alert('A player with that name already exists')
      return
    }
    const player: Player = {
      id: createId(),
      name,
      yearsPlayed: 0,
      averageScore: 0,
      totalTrips: 0
    }
    setLocalPlayers(prev => [...prev, player])
    setCreatedPlayerIds(prev => [...prev, player.id])
    setFormData(prev => ({
      ...prev,
      attendees: [...prev.attendees, player.id]
    }))
    setNewPlayerName('')
  }

  const previousLocations = Array.from(
    new Set(trips.map(existingTrip => existingTrip.location.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  if (!mounted) return null

  const formBody = (
    <div className={embedded ? 'admin-embedded-form' : 'edit-form'}>
      <div className={embedded ? 'admin-embedded-form-header' : 'edit-form-header'}>
        <h3>{isEditing ? 'Edit Trip' : 'New Trip'}</h3>
        {!embedded && (
          <button type="button" onClick={onCancel} className="btn-close" aria-label="Close">
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        )}
      </div>

      {!isEditing && (
        <p className="form-help trip-placeholder-help">
          You can save a scheduled trip with no scores yet. Add courses and scores later from the trip page.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              id="startDate"
              type="date"
              value={formData.startDate}
              disabled={disabled}
              onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date *</label>
            <input
              id="endDate"
              type="date"
              value={formData.endDate}
              disabled={disabled}
              onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tripLocation">Location *</label>
          <input
            id="tripLocation"
            type="text"
            value={formData.location}
            disabled={disabled}
            onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
            required
            placeholder="Enter trip location"
            list="trip-location-options"
          />
          <datalist id="trip-location-options">
            {previousLocations.map(location => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            disabled={disabled}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter trip description"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="weather">Weather</label>
          <input
            id="weather"
            type="text"
            value={formData.weather}
            disabled={disabled}
            onChange={e => setFormData(prev => ({ ...prev, weather: e.target.value }))}
            placeholder="e.g., Sunny 75F"
          />
        </div>

        <div className="form-group">
          <label htmlFor="championPlayerId">Champion</label>
          <select
            id="championPlayerId"
            value={formData.championPlayerId}
            disabled={disabled}
            onChange={e => setFormData(prev => ({ ...prev, championPlayerId: e.target.value }))}
          >
            <option value="">No champion selected</option>
            {localPlayers.map(player => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Teams (optional)</label>
          <div className="teams-editor">
            {formData.teams.length === 0 && (
              <p className="form-help">No teams yet. Add one to start building this trip&apos;s teams.</p>
            )}
            {formData.teams.map((team, index) => (
              <div key={team.id} className="team-editor-card">
                <div className="team-editor-header">
                  <input
                    type="text"
                    value={team.name || ''}
                    disabled={disabled}
                    onChange={e => updateTeamName(team.id, e.target.value)}
                    placeholder={`Team ${index + 1} name (optional)`}
                    aria-label={`Team ${index + 1} name`}
                  />
                  {!disabled && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => removeTeam(team.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="attendees-list">
                  {[...localPlayers]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(player => {
                      const onAnotherTeam = formData.teams.some(
                        other => other.id !== team.id && other.playerIds.includes(player.id)
                      )
                      return (
                        <label
                          key={player.id}
                          className={`attendee-checkbox${onAnotherTeam ? ' is-taken' : ''}`}
                          title={onAnotherTeam ? 'Already on another team' : undefined}
                        >
                          <input
                            type="checkbox"
                            checked={team.playerIds.includes(player.id)}
                            disabled={disabled}
                            onChange={e =>
                              handleTeamMemberChange(team.id, player.id, e.target.checked)
                            }
                          />
                          <span>{player.name}</span>
                        </label>
                      )
                    })}
                </div>
              </div>
            ))}
            {!disabled && (
              <button type="button" className="btn btn-secondary" onClick={addTeam}>
                <i className="fas fa-plus" aria-hidden="true"></i> Add team
              </button>
            )}
          </div>
          <small className="form-help">
            Teams are specific to this trip. Checking a player into a team removes them from any
            other team.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="teamChampionId">Team Champion</label>
          <select
            id="teamChampionId"
            value={formData.teamChampionId}
            disabled={disabled || formData.teams.length === 0}
            onChange={e => setFormData(prev => ({ ...prev, teamChampionId: e.target.value }))}
          >
            <option value="">No team champion selected</option>
            {formData.teams
              .filter(team => team.playerIds.length > 0)
              .map(team => (
                <option key={team.id} value={team.id}>
                  {teamDisplayName(team, localPlayers)}
                </option>
              ))}
          </select>
          {formData.teams.length === 0 && (
            <small className="form-help">Add at least one team to pick a team champion.</small>
          )}
        </div>

        <div className="form-group">
          <label>Expected attendees (optional)</label>
          <div className="attendees-list">
            {[...localPlayers]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(player => (
                <label key={player.id} className="attendee-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.attendees.includes(player.id)}
                    disabled={disabled}
                    onChange={e => handleAttendeeChange(player.id, e.target.checked)}
                  />
                  <span>{player.name}</span>
                </label>
              ))}
          </div>
          <small className="form-help">
            For a placeholder trip, pick who is expected. Scores can be added later.
          </small>
          {!disabled && (
            <div className="inline-add-player">
              <input
                type="text"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                placeholder="Add new player name"
              />
              <button type="button" className="btn btn-secondary" onClick={addNewPlayer}>
                Add player
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            disabled={disabled}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Enter additional notes"
            rows={3}
          />
        </div>

        <div className="form-group">
          <PhotoUpload onPhotosAdded={setPhotos} existingPhotos={photos} />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={disabled}>
            {submitLabel || (isEditing ? 'Update Trip' : 'Save Trip')}
          </button>
        </div>
      </form>
    </div>
  )

  if (embedded) {
    return formBody
  }

  return createPortal(
    <div className="edit-form-overlay" role="dialog" aria-modal="true">
      {formBody}
    </div>,
    document.body
  )
}
