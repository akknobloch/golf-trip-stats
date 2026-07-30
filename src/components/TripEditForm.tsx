'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trip, Player, TripPhoto } from '@/lib/types'
import { createId } from '@/lib/admin-data'
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
    attendees: [] as string[]
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
        attendees: trip.attendees || []
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
    onSave({ ...formData, photos }, newPlayers)
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
