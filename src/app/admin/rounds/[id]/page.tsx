'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Round, Trip, Course, Player } from '@/lib/types'
import Link from 'next/link'



export default function EditRound() {
  const router = useRouter()
  const params = useParams()
  const roundId = params.id as string
  
  const [trips, setTrips] = useState<Trip[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [formData, setFormData] = useState({
    playerId: '',
    tripId: '',
    courseId: '',
    score: '',
    date: '',
    notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load trips, courses, and players for dropdowns
    const loadData = () => {
      try {
        const savedTrips = localStorage.getItem('golfTrips')
        const savedCourses = localStorage.getItem('golfCourses')
        const savedPlayers = localStorage.getItem('golfPlayers')
        const savedRounds = localStorage.getItem('golfRounds')
        
        if (savedTrips) {
          setTrips(JSON.parse(savedTrips))
        }
        if (savedCourses) {
          setCourses(JSON.parse(savedCourses))
        }
        if (savedPlayers) {
          setPlayers(JSON.parse(savedPlayers))
        }
        
        // Load existing round data
        if (savedRounds) {
          const existingRounds = JSON.parse(savedRounds)
          const round = existingRounds.find((r: Round) => r.id === roundId)
          
          if (!round) {
            setError('Round not found')
            setLoading(false)
            return
          }
          
          setFormData({
            playerId: round.playerId,
            tripId: round.tripId,
            courseId: round.courseId,
            score: round.score.toString(),
            date: round.date,
            notes: round.notes || ''
          })
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Error loading round data')
        setLoading(false)
      }
    }
    
    loadData()
  }, [roundId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const selectedTrip = trips.find(t => t.id === formData.tripId)
      if (!selectedTrip) return
      
      const updatedRound: Round = {
        id: roundId,
        playerId: formData.playerId,
        tripId: formData.tripId,
        courseId: formData.courseId,
        score: parseInt(formData.score),
        date: formData.date,
        year: new Date(selectedTrip.startDate).getFullYear(),
        notes: formData.notes || undefined
      }
      
      // Load existing rounds and update the specific one
      const existingRounds = JSON.parse(localStorage.getItem('golfRounds') || '[]')
      const updatedRounds = existingRounds.map((round: Round) => 
        round.id === roundId ? updatedRound : round
      )
      
      localStorage.setItem('golfRounds', JSON.stringify(updatedRounds))
      router.push('/admin?tab=rounds&message=Round%20updated%20successfully&type=success')
    } catch (error) {
      console.error('Error updating round:', error)
      router.push('/admin?tab=rounds&message=Error%20updating%20round&type=error')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
          <Link href="/admin?tab=rounds" className="btn btn-primary">
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
          <h1><i className="fas fa-golf-ball"></i> Edit Round</h1>
          <p>Update round information</p>
          <div className="admin-links">
            <Link href="/admin?tab=rounds" className="btn btn-secondary">
              <i className="fas fa-arrow-left"></i> Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="admin-form-container">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="roundPlayer">Player</label>
              <select
                id="roundPlayer"
                name="playerId"
                value={formData.playerId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a player...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="roundTrip">Trip</label>
              <select
                id="roundTrip"
                name="tripId"
                value={formData.tripId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a trip...</option>
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
              <label htmlFor="roundCourse">Course</label>
              <select
                id="roundCourse"
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} - {course.location} (Par {course.par})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="roundScore">Score</label>
                <input
                  type="number"
                  id="roundScore"
                  name="score"
                  value={formData.score}
                  onChange={handleInputChange}
                  min="1"
                  max="200"
                  required
                  placeholder="e.g., 85"
                />
              </div>

              <div className="form-group">
                <label htmlFor="roundDate">Date</label>
                <input
                  type="date"
                  id="roundDate"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="roundNotes">Notes (Optional)</label>
              <textarea
                id="roundNotes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any additional notes about this round..."
              />
            </div>

            <div className="form-actions">
              <Link href="/admin?tab=rounds" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Update Round
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
