'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Player, Course, Trip, Round } from '@/lib/types'
import { calculatePlayerStats } from '@/lib/utils'
import { getData } from '../../../lib/data'



interface PlayerRound {
  round: Round
  course: Course
  trip: Trip
}

interface PlayerTripStats {
  trip: Trip
  rounds: PlayerRound[]
  totalScore: number
  averageScore: number
  bestScore: number
  worstScore: number
  roundsPlayed: number
  rank?: number
}

interface PlayerCourseStats {
  course: Course
  rounds: PlayerRound[]
  averageScore: number
  bestScore: number
  worstScore: number
  timesPlayed: number
}

export default function PlayerDetails() {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string
  
  const [player, setPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [playerRounds, setPlayerRounds] = useState<PlayerRound[]>([])
  const [tripStats, setTripStats] = useState<PlayerTripStats[]>([])
  const [courseStats, setCourseStats] = useState<PlayerCourseStats[]>([])
  const [yearStats, setYearStats] = useState<{ [year: number]: { rounds: number, average: number, best: number } }>({})

  useEffect(() => {
    // Load data from static source
    const loadData = () => {
      try {
        const data = getData()
        const foundPlayer = data.players.find((p: Player) => p.id === playerId)
        setPlayer(foundPlayer || null)
        setPlayers(data.players)
        setCourses(data.courses)
        setTrips(data.trips)
        setRounds(data.rounds)
      } catch (error) {
        console.error('Error loading data:', error)
        // Set empty arrays to prevent further errors
        setPlayer(null)
        setPlayers([])
        setCourses([])
        setTrips([])
        setRounds([])
      }
    }
    
    loadData()
  }, [playerId])

  useEffect(() => {
    if (!player || courses.length === 0 || trips.length === 0 || rounds.length === 0) return

    // Get all rounds for this player
    const playerRoundData = rounds
      .filter(round => round.playerId === playerId)
      .map(round => {
        const course = courses.find(c => c.id === round.courseId)
        const trip = trips.find(t => t.id === round.tripId)
        
        // Only include rounds that have valid course and trip data
        if (!course || !trip) {
          console.warn(`Skipping round ${round.id} - missing course or trip data`)
          return null
        }
        
        return {
          round,
          course,
          trip
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => new Date(b.round.date).getTime() - new Date(a.round.date).getTime())

    setPlayerRounds(playerRoundData)

    // Calculate trip statistics
    const tripStatsMap = new Map<string, PlayerTripStats>()
    
    playerRoundData.forEach(({ round, course, trip }) => {
      if (!tripStatsMap.has(trip.id)) {
        tripStatsMap.set(trip.id, {
          trip,
          rounds: [],
          totalScore: 0,
          averageScore: 0,
          bestScore: Infinity,
          worstScore: 0,
          roundsPlayed: 0
        })
      }
      
      const stats = tripStatsMap.get(trip.id)!
      stats.rounds.push({ round, course, trip })
      stats.totalScore += round.score
      stats.roundsPlayed += 1
      stats.bestScore = Math.min(stats.bestScore, round.score)
      stats.worstScore = Math.max(stats.worstScore, round.score)
    })

    // Calculate averages and sort by year
    const tripStatsArray = Array.from(tripStatsMap.values()).map(stats => ({
      ...stats,
      averageScore: Math.round(stats.totalScore / stats.roundsPlayed)
    })).sort((a, b) => new Date(b.trip.startDate).getTime() - new Date(a.trip.startDate).getTime())

    setTripStats(tripStatsArray)

    // Calculate course statistics
    const courseStatsMap = new Map<string, PlayerCourseStats>()
    
    playerRoundData.forEach(({ round, course, trip }) => {
      if (!courseStatsMap.has(course.id)) {
        courseStatsMap.set(course.id, {
          course,
          rounds: [],
          averageScore: 0,
          bestScore: Infinity,
          worstScore: 0,
          timesPlayed: 0
        })
      }
      
      const stats = courseStatsMap.get(course.id)!
      stats.rounds.push({ round, course, trip })
      stats.timesPlayed += 1
      stats.bestScore = Math.min(stats.bestScore, round.score)
      stats.worstScore = Math.max(stats.worstScore, round.score)
    })

    // Calculate course averages
    const courseStatsArray = Array.from(courseStatsMap.values()).map(stats => ({
      ...stats,
      averageScore: Math.round(stats.rounds.reduce((sum, r) => sum + r.round.score, 0) / stats.rounds.length)
    })).sort((a, b) => a.averageScore - b.averageScore)

    setCourseStats(courseStatsArray)

    // Calculate year statistics
    const yearStatsMap: { [year: number]: { rounds: number, average: number, best: number } } = {}
    
    playerRoundData.forEach(({ round }) => {
      if (!yearStatsMap[round.year]) {
        yearStatsMap[round.year] = { rounds: 0, average: 0, best: Infinity }
      }
      
      yearStatsMap[round.year].rounds += 1
      yearStatsMap[round.year].best = Math.min(yearStatsMap[round.year].best, round.score)
    })

    // Calculate year averages
    Object.keys(yearStatsMap).forEach(yearStr => {
      const year = parseInt(yearStr)
      const yearRounds = playerRoundData.filter(pr => pr.round.year === year)
      yearStatsMap[year].average = Math.round(yearRounds.reduce((sum, pr) => sum + pr.round.score, 0) / yearRounds.length)
    })

    setYearStats(yearStatsMap)
  }, [player, courses, trips, rounds, playerId])

  if (!player) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Player not found</h2>
          <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const playerStats = calculatePlayerStats(player, rounds)
  const uniqueYears = Object.keys(yearStats).map(y => parseInt(y)).sort((a, b) => b - a)
  const bestScore = Math.min(...playerRounds.map(pr => pr.round.score))
  const worstScore = Math.max(...playerRounds.map(pr => pr.round.score))
  const bestScoreRound = playerRounds.find(pr => pr.round.score === bestScore)

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div className="header-top">
            <Link href="/" className="back-link">
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </Link>
          </div>
          <h1><i className="fas fa-user"></i> {player.name}</h1>
          <p>Golf Trip Statistics & Performance History</p>
        </div>
      </header>

      <main className="main-content">
        {/* Player Overview */}
        <div className="player-overview">
          <div className="overview-grid">
            <div className="overview-item">
              <i className="fas fa-calendar"></i>
              <span className="overview-value">{playerStats.yearsPlayed}</span>
              <span className="overview-label">Years Active</span>
            </div>
            <div className="overview-item">
              <i className="fas fa-golf-ball"></i>
              <span className="overview-value">{playerRounds.length}</span>
              <span className="overview-label">Total Rounds</span>
            </div>
            <div className="overview-item">
              <i className="fas fa-map-marker-alt"></i>
              <span className="overview-value">{playerStats.totalTrips}</span>
              <span className="overview-label">Trips Attended</span>
            </div>
            <div className="overview-item">
              <i className="fas fa-flag"></i>
              <span className="overview-value">{courseStats.length}</span>
              <span className="overview-label">Courses Played</span>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="performance-stats">
          <h2>Performance Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-content">
                <h3>{playerStats.averageScore}</h3>
                <p>Average Score</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-content">
                <h3>{bestScore}</h3>
                <p>Best Round</p>
                {bestScoreRound && (
                  <small>{bestScoreRound.course.name} ({bestScoreRound.round.year})</small>
                )}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <div className="stat-content">
                <h3>{worstScore}</h3>
                <p>Worst Round</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-arrows-alt-h"></i>
              </div>
              <div className="stat-content">
                <h3>{worstScore - bestScore}</h3>
                <p>Score Range</p>
              </div>
            </div>
          </div>
        </div>

        {/* All Rounds */}
        <div className="recent-rounds">
          <h2>All Rounds</h2>
          <div className="recent-rounds-card">
            <div className="recent-rounds-header">
              <div className="recent-rounds-info">
                <span className="recent-rounds-label">All Rounds</span>
                <span className="recent-rounds-count">{playerRounds.length} rounds</span>
              </div>
              <div className="recent-rounds-stats">
                <div className="recent-rounds-stat">
                  <span className="stat-value">{Math.round(playerRounds.reduce((sum, pr) => sum + pr.round.score, 0) / playerRounds.length)}</span>
                  <span className="stat-label">Avg</span>
                </div>
                <div className="recent-rounds-stat">
                  <span className="stat-value">{Math.min(...playerRounds.map(pr => pr.round.score))}</span>
                  <span className="stat-label">Best</span>
                </div>
                <div className="recent-rounds-stat">
                  <span className="stat-value">{Math.max(...playerRounds.map(pr => pr.round.score))}</span>
                  <span className="stat-label">Worst</span>
                </div>
              </div>
            </div>
            
            <div className="recent-rounds-table">
              <div className="rounds-header">
                <div className="round-col">Date</div>
                <div className="round-col">Course & Trip</div>
                <div className="round-col">Score</div>
                <div className="round-col">To Par</div>
              </div>
              {playerRounds.map(({ round, course, trip }) => {
                const toPar = round.score - course.par
                const toParDisplay = toPar > 0 ? `+${toPar}` : toPar.toString()
                
                return (
                  <div key={round.id} className="round-row">
                    <div className="round-col">{new Date(round.date).toLocaleDateString()}</div>
                    <div className="round-col course-trip-col">
                      <div className="course-name">{course.name}</div>
                      <div className="trip-info">{new Date(trip.startDate).getFullYear()} {trip.location}</div>
                    </div>
                    <div className="round-col">{round.score}</div>
                    <div className={`round-col ${toPar <= 0 ? 'under-par' : 'over-par'}`}>
                      {toParDisplay}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Course Performance */}
        <div className="course-performance">
          <h2>Course Performance</h2>
          <div className="courses-grid">
            {courseStats.map((courseStat) => (
              <div key={courseStat.course.id} className="course-card">
                <div className="course-header">
                  <h3>{courseStat.course.name}</h3>
                  <span className="course-par">Par {courseStat.course.par}</span>
                </div>
                <div className="course-details">
                  <p><i className="fas fa-map-marker-alt"></i> {courseStat.course.location}</p>
                  <p><i className="fas fa-play"></i> Played {courseStat.timesPlayed} times</p>
                </div>
                <div className="course-stats">
                  <div className="course-stat">
                    <span className="stat-value">{courseStat.averageScore}</span>
                    <span className="stat-label">Average</span>
                  </div>
                  <div className="course-stat">
                    <span className="stat-value">{courseStat.bestScore}</span>
                    <span className="stat-label">Best</span>
                  </div>
                  <div className="course-stat">
                    <span className="stat-value">{courseStat.worstScore}</span>
                    <span className="stat-label">Worst</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>




      </main>
    </div>
  )
}
