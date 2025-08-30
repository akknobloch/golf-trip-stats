'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Course, Round, Player, Trip } from '@/lib/types'
import { calculateCourseStats } from '@/lib/utils'
import { getData } from '../../../lib/data'
import Link from 'next/link'



export default function CourseDetails() {
  const params = useParams()
  const courseId = params.id as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [courseStats, setCourseStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    // Load data from static source
    const loadData = () => {
      try {
        const data = getData()
        const foundCourse = data.courses.find((c: Course) => c.id === courseId)
        setCourse(foundCourse || null)
        setRounds(data.rounds)
        setTrips(data.trips)
        setPlayers(data.players)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [courseId])

  useEffect(() => {
    if (course && rounds.length > 0) {
      const stats = calculateCourseStats(course, rounds)
      
      // Get course-specific rounds and enhance with player names
      const courseRounds = rounds.filter(round => round.courseId === course.id)
      const enhancedStats = {
        ...stats,
        yearsPlayed: [...new Set(courseRounds.map(round => round.year))].sort((a, b) => b - a),
        totalRounds: courseRounds.length,
        uniquePlayers: [...new Set(courseRounds.map(round => round.playerId))].length,
        roundsWithPlayers: courseRounds.map(round => ({
          ...round,
          playerName: players.find(p => p.id === round.playerId)?.name || 'Unknown Player',
          tripName: trips.find(t => t.id === round.tripId)?.location || 'Unknown Trip'
        }))
      }
      
      setCourseStats(enhancedStats)
    }
  }, [course, rounds, players, trips])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading course details...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container">
        <div className="error">Course not found</div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div className="header-top">
            <Link href="/" className="back-link">
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </Link>
          </div>
          <h1><i className="fas fa-flag"></i> {course.name}</h1>
          <p>{course.location} • Par {course.par}</p>
          {course.description && (
            <p className="course-description">{course.description}</p>
          )}
        </div>
      </header>

      <main className="main-content">

        {/* Score Highlights */}
        {courseStats && (
          <div className="score-highlights">
            <div className="highlight-card average-score">
              <div className="highlight-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="highlight-content">
                <h3>{courseStats.averageScore}</h3>
                <p>Average Score</p>
                <small>All players combined</small>
              </div>
            </div>

            <div className="highlight-card best-score">
              <div className="highlight-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="highlight-content">
                <h3>{courseStats.bestScore}</h3>
                <p>Best Score</p>
                {courseStats.roundsWithPlayers.find((r: any) => r.score === courseStats.bestScore) && (
                  <small>
                    {courseStats.roundsWithPlayers.find((r: any) => r.score === courseStats.bestScore)?.playerName}
                  </small>
                )}
              </div>
            </div>

            <div className="highlight-card worst-score">
              <div className="highlight-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="highlight-content">
                <h3>{courseStats.worstScore}</h3>
                <p>Worst Score</p>
                {courseStats.roundsWithPlayers.find((r: any) => r.score === courseStats.worstScore) && (
                  <small>
                    {courseStats.roundsWithPlayers.find((r: any) => r.score === courseStats.worstScore)?.playerName}
                  </small>
                )}
              </div>
            </div>
          </div>
        )}



        {/* Trips Played */}
        {courseStats && courseStats.roundsWithPlayers.length > 0 && (
          <div className="trips-section">
            <h2>Trips Played</h2>
            <div className="trips-grid">
              {Array.from(new Set(courseStats.roundsWithPlayers.map((r: any) => r.tripId)))
                .map((tripId) => {
                  const tripIdStr = tripId as string
                  const trip = trips.find(t => t.id === tripIdStr)
                  const tripRounds = courseStats.roundsWithPlayers.filter((r: any) => r.tripId === tripIdStr)
                  const tripYear = new Date(trip?.startDate || '').getFullYear()
                  
                  return (
                    <Link key={tripIdStr} href={`/trips/${tripIdStr}`} className="trip-card-link">
                      <div className="trip-card">
                        <div className="trip-header">
                          <h3>{trip?.location || 'Unknown Trip'}</h3>
                          <div className="trip-header-right">
                            <span className="trip-year">{tripYear}</span>
                            <div className="trip-actions">
                              <div className="action-btn" title="View Details">
                                <i className="fas fa-arrow-right"></i>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="trip-details">
                          <p><i className="fas fa-golf-ball"></i> {tripRounds.length} round{tripRounds.length !== 1 ? 's' : ''}</p>
                          <p><i className="fas fa-users"></i> {Array.from(new Set(tripRounds.map((r: any) => r.playerId))).length} players</p>
                          {tripRounds.length > 0 && (
                            <p><i className="fas fa-trophy"></i> Best: {Math.min(...tripRounds.map((r: any) => r.score))}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
