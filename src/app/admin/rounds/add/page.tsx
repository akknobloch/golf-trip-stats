'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Round, Trip, Course, Player } from '@/lib/types'
import Link from 'next/link'

export default function AddRound() {
  const router = useRouter()
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

  useEffect(() => {
    // Load trips, courses, and players for dropdowns
    const savedTrips = localStorage.getItem('golfTrips')
    const savedCourses = localStorage.getItem('golfCourses')
    const savedPlayers = localStorage.getItem('golfPlayers')
    
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips))
    }
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses))
    }
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedTrip = trips.find(t => t.id === formData.tripId)
    if (!selectedTrip) return
    
    const newRound: Round = {
      id: Date.now().toString(),
      playerId: formData.playerId,
      tripId: formData.tripId,
      courseId: formData.courseId,
      score: parseInt(formData.score),
      date: formData.date,
      year: new Date(selectedTrip.startDate).getFullYear(),
      notes: formData.notes || undefined
    }
    
    // Load existing rounds and add new one
    const existingRounds = JSON.parse(localStorage.getItem('golfRounds') || '[]')
    const updatedRounds = [...existingRounds, newRound]
    localStorage.setItem('golfRounds', JSON.stringify(updatedRounds))
    
    // Update course times played
    const existingCourses = JSON.parse(localStorage.getItem('golfCourses') || '[]')
    const updatedCourses = existingCourses.map((course: Course) => 
      course.id === formData.courseId 
        ? { ...course, timesPlayed: course.timesPlayed + 1, lastPlayed: new Date(selectedTrip.startDate).getFullYear() }
        : course
    )
    localStorage.setItem('golfCourses', JSON.stringify(updatedCourses))
    
    router.push('/admin')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const selectedTrip = trips.find(t => t.id === formData.tripId)
  const tripYear = selectedTrip ? new Date(selectedTrip.startDate).getFullYear() : new Date().getFullYear()

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1><i className="fas fa-golf-ball"></i> Add New Round</h1>
          <p>Record a player's score for a specific course during a trip</p>
          <div className="admin-links">
            <Link href="/admin" className="btn btn-secondary">
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
              <Link href="/admin" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Add Round
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
