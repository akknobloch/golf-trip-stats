'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Trip, Player } from '@/lib/types'
import Link from 'next/link'

export default function EditTrip() {
  const router = useRouter()
  const params = useParams()
  const tripId = params.id as string
  
  const [players, setPlayers] = useState<Player[]>([])
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load existing trip data and players
    const loadTrip = () => {
      try {
        const existingTrips = JSON.parse(localStorage.getItem('golfTrips') || '[]')
        const existingPlayers = JSON.parse(localStorage.getItem('golfPlayers') || '[]')
        const trip = existingTrips.find((t: Trip) => t.id === tripId)
        
        if (!trip) {
          setError('Trip not found')
          setLoading(false)
          return
        }
        
        setPlayers(existingPlayers)
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
        setLoading(false)
      } catch (error) {
        console.error('Error loading trip:', error)
        setError('Error loading trip data')
        setLoading(false)
      }
    }
    
    loadTrip()
  }, [tripId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const updatedTrip: Trip = {
        id: tripId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        description: formData.description || undefined,
        weather: formData.weather || undefined,
        notes: formData.notes || undefined,
        championPlayerId: formData.championPlayerId || undefined,
        attendees: formData.attendees || undefined
      }
      
      // Load existing trips and update the specific one
      const existingTrips = JSON.parse(localStorage.getItem('golfTrips') || '[]')
      const updatedTrips = existingTrips.map((trip: Trip) => 
        trip.id === tripId ? updatedTrip : trip
      )
      
      localStorage.setItem('golfTrips', JSON.stringify(updatedTrips))
      router.push('/admin?tab=trips&message=Trip%20updated%20successfully&type=success')
    } catch (error) {
      console.error('Error updating trip:', error)
      router.push('/admin?tab=trips&message=Error%20updating%20trip&type=error')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/admin?tab=trips" className="btn btn-primary">
            Back to Admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1><i className="fas fa-map-marker-alt"></i> Edit Trip</h1>
          <p>Update trip information</p>
          <div className="admin-links">
            <Link href="/admin?tab=trips" className="btn btn-secondary">
              <i className="fas fa-arrow-left"></i> Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="admin-form-container">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tripStartDate">Start Date</label>
                <input
                  type="date"
                  id="tripStartDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tripEndDate">End Date</label>
                <input
                  type="date"
                  id="tripEndDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tripLocation">Location</label>
              <input
                type="text"
                id="tripLocation"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tripDescription">Description (Optional)</label>
              <textarea
                id="tripDescription"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief description of the trip..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="tripWeather">Weather (Optional)</label>
              <input
                type="text"
                id="tripWeather"
                name="weather"
                value={formData.weather}
                onChange={handleInputChange}
                placeholder="e.g., Sunny, 75°F"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tripNotes">Notes (Optional)</label>
              <textarea
                id="tripNotes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional notes about the trip..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="championPlayer">Champion Golfer (Optional)</label>
              <select
                id="championPlayer"
                name="championPlayerId"
                value={formData.championPlayerId}
                onChange={handleInputChange}
              >
                <option value="">Select a champion...</option>
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

            <div className="form-actions">
              <Link href="/admin?tab=trips" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Update Trip
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
