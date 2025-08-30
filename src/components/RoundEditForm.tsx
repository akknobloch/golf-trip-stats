'use client'

import { useState, useEffect } from 'react'
import { Round, Player, Course, Trip } from '@/lib/types'

interface RoundEditFormProps {
  round?: Round
  players: Player[]
  courses: Course[]
  trips: Trip[]
  onSave: (roundData: Omit<Round, 'id'>) => void
  onCancel: () => void
  isEditing?: boolean
}

export default function RoundEditForm({ round, players, courses, trips, onSave, onCancel, isEditing = false }: RoundEditFormProps) {
  const [formData, setFormData] = useState({
    playerId: '',
    tripId: '',
    courseId: '',
    score: 0,
    date: '',
    year: new Date().getFullYear(),
    notes: ''
  })

  useEffect(() => {
    if (round) {
      setFormData({
        playerId: round.playerId,
        tripId: round.tripId,
        courseId: round.courseId,
        score: round.score,
        date: round.date,
        year: round.year,
        notes: round.notes || ''
      })
    } else {
      // Set default values for new rounds
      const today = new Date()
      setFormData(prev => ({
        ...prev,
        date: today.toISOString().split('T')[0],
        year: today.getFullYear()
      }))
    }
  }, [round])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.playerId) {
      alert('Player is required')
      return
    }
    if (!formData.tripId) {
      alert('Trip is required')
      return
    }
    if (!formData.courseId) {
      alert('Course is required')
      return
    }
    if (!formData.date) {
      alert('Date is required')
      return
    }
    if (formData.score <= 0) {
      alert('Score must be greater than 0')
      return
    }
    onSave(formData)
  }

  return (
    <div className="edit-form-overlay">
      <div className="edit-form">
        <div className="edit-form-header">
          <h3>{isEditing ? 'Edit Round' : 'Add New Round'}</h3>
          <button onClick={onCancel} className="btn-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="playerId">Player *</label>
            <select
              id="playerId"
              value={formData.playerId}
              onChange={(e) => setFormData(prev => ({ ...prev, playerId: e.target.value }))}
              required
            >
              <option value="">Select a player</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tripId">Trip *</label>
            <select
              id="tripId"
              value={formData.tripId}
              onChange={(e) => setFormData(prev => ({ ...prev, tripId: e.target.value }))}
              required
            >
              <option value="">Select a trip</option>
              {trips.map(trip => {
                const tripYear = new Date(trip.startDate).getFullYear()
                return (
                  <option key={trip.id} value={trip.id}>
                    {tripYear} - {trip.location}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="courseId">Course *</label>
            <select
              id="courseId"
              value={formData.courseId}
              onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.location}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="score">Score *</label>
              <input
                id="score"
                type="number"
                value={formData.score}
                onChange={(e) => setFormData(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                min="1"
                max="200"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">Year</label>
              <input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                min="2000"
                max="2100"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="roundDate">Date *</label>
            <input
              id="roundDate"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter round notes"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Update Round' : 'Add Round'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

