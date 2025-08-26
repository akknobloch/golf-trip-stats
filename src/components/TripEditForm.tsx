'use client'

import { useState, useEffect } from 'react'
import { Trip, Player } from '@/lib/types'

interface TripEditFormProps {
  trip?: Trip
  players: Player[]
  onSave: (tripData: Omit<Trip, 'id'>) => void
  onCancel: () => void
  isEditing?: boolean
}

export default function TripEditForm({ trip, players, onSave, onCancel, isEditing = false }: TripEditFormProps) {
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
    } else {
      // Set default dates for new trips
      const today = new Date()
      const nextYear = new Date(today.getFullYear() + 1, 5, 1) // June 1st next year
      setFormData(prev => ({
        ...prev,
        startDate: nextYear.toISOString().split('T')[0],
        endDate: new Date(nextYear.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days later
      }))
    }
  }, [trip])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
    onSave(formData)
  }

  const handleAttendeeChange = (playerId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      attendees: checked 
        ? [...prev.attendees, playerId]
        : prev.attendees.filter(id => id !== playerId)
    }))
  }

  return (
    <div className="edit-form-overlay">
      <div className="edit-form">
        <div className="edit-form-header">
          <h3>{isEditing ? 'Edit Trip' : 'Add New Trip'}</h3>
          <button onClick={onCancel} className="btn-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
              placeholder="Enter trip location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, weather: e.target.value }))}
              placeholder="e.g., Sunny 75F"
            />
          </div>

          <div className="form-group">
            <label htmlFor="championPlayerId">Champion</label>
            <select
              id="championPlayerId"
              value={formData.championPlayerId}
              onChange={(e) => setFormData(prev => ({ ...prev, championPlayerId: e.target.value }))}
            >
              <option value="">No champion selected</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Attendees (No Scores Recorded)</label>
            <div className="attendees-list">
              {players.map(player => (
                <label key={player.id} className="attendee-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.attendees.includes(player.id)}
                    onChange={(e) => handleAttendeeChange(player.id, e.target.checked)}
                  />
                  <span>{player.name}</span>
                </label>
              ))}
            </div>
            <small className="form-help">
              Select players who attended this trip but don't have scores recorded
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter additional notes"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Update Trip' : 'Add Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
