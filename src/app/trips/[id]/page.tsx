'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Player, Course, Trip, Round } from '@/lib/types'
import { formatDate, getDateValue, calculateTripDuration } from '@/lib/utils'



interface TripRound {
  round: Round
  player: Player
  course: Course
}

interface PlayerTripStats {
  player: Player
  rounds: TripRound[]
  totalScore: number
  averageScore: number
  bestScore: number
  worstScore: number
  roundsPlayed: number
  round1Score?: number
  round2Score?: number
  round3Score?: number
}

export default function TripDetails() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string
  
  const [trip, setTrip] = useState<Trip | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [tripRounds, setTripRounds] = useState<TripRound[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerTripStats[]>([])
  const [champion, setChampion] = useState<PlayerTripStats | null>(null)

  useEffect(() => {
    // Load data from localStorage
    const loadData = () => {
      try {
        const savedPlayers = localStorage.getItem('golfPlayers')
        const savedCourses = localStorage.getItem('golfCourses')
        const savedTrips = localStorage.getItem('golfTrips')
        const savedRounds = localStorage.getItem('golfRounds')
        
        if (savedPlayers) {
          const players = JSON.parse(savedPlayers)
          if (Array.isArray(players)) {
            setPlayers(players)
          } else {
            console.warn('Invalid players data format')
            setPlayers([])
          }
        }
        
        if (savedCourses) {
          const courses = JSON.parse(savedCourses)
          if (Array.isArray(courses)) {
            setCourses(courses)
          } else {
            console.warn('Invalid courses data format')
            setCourses([])
          }
        }
        
        if (savedTrips) {
          const trips = JSON.parse(savedTrips)
          if (Array.isArray(trips)) {
            const foundTrip = trips.find((t: Trip) => t.id === tripId)
            setTrip(foundTrip || null)
          } else {
            console.warn('Invalid trips data format')
            setTrip(null)
          }
        }
        
        if (savedRounds) {
          const rounds = JSON.parse(savedRounds)
          if (Array.isArray(rounds)) {
            setRounds(rounds)
          } else {
            console.warn('Invalid rounds data format')
            setRounds([])
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
        // Set empty arrays to prevent further errors
        setPlayers([])
        setCourses([])
        setRounds([])
        setTrip(null)
      }
    }
    
    loadData()
  }, [tripId])

  useEffect(() => {
    if (!trip || players.length === 0 || courses.length === 0 || rounds.length === 0) return

    // Get all rounds for this trip
    const tripRoundData = rounds
      .filter(round => round.tripId === tripId)
      .map(round => {
        const player = players.find(p => p.id === round.playerId)
        const course = courses.find(c => c.id === round.courseId)
        
        // Only include rounds that have valid player and course data
        if (!player || !course) {
          console.warn(`Skipping round ${round.id} - missing player or course data`)
          return null
        }
        
        return {
          round,
          player,
          course
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => getDateValue(a.round.date) - getDateValue(b.round.date))

    setTripRounds(tripRoundData)

    // Calculate player statistics for this trip
    const playerStatsMap = new Map<string, PlayerTripStats>()
    
    tripRoundData.forEach(({ round, player, course }) => {
      if (!playerStatsMap.has(player.id)) {
        playerStatsMap.set(player.id, {
          player,
          rounds: [],
          totalScore: 0,
          averageScore: 0,
          bestScore: Infinity,
          worstScore: 0,
          roundsPlayed: 0
        })
      }
      
      const stats = playerStatsMap.get(player.id)!
      stats.rounds.push({ round, player, course })
      stats.totalScore += round.score
      stats.roundsPlayed += 1
      stats.bestScore = Math.min(stats.bestScore, round.score)
      stats.worstScore = Math.max(stats.worstScore, round.score)
    })

    // Add individual round scores and calculate averages
    const playerStatsArray = Array.from(playerStatsMap.values()).map(stats => {
      const sortedRounds = stats.rounds.sort((a, b) => getDateValue(a.round.date) - getDateValue(b.round.date))
      return {
        ...stats,
        averageScore: Math.round(stats.totalScore / stats.roundsPlayed),
        round1Score: sortedRounds[0]?.round.score,
        round2Score: sortedRounds[1]?.round.score,
        round3Score: sortedRounds[2]?.round.score
      }
    }).sort((a, b) => {
      // Sort by final round score (best to worst)
      const aFinalRound = a.round3Score || a.round2Score || a.round1Score || Infinity
      const bFinalRound = b.round3Score || b.round2Score || b.round1Score || Infinity
      return aFinalRound - bFinalRound
    })

    setPlayerStats(playerStatsArray)
    
    // Set champion (player with best average score)
    if (playerStatsArray.length > 0) {
      setChampion(playerStatsArray[0])
    }
  }, [trip, players, courses, rounds, tripId])

  if (!trip) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Trip not found</h2>
          <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const tripYear = (() => {
    try {
      const date = new Date(trip.startDate)
      return isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()
    } catch {
      return new Date().getFullYear()
    }
  })()
  const tripName = `${tripYear} ${trip.location}`
  const uniqueCourses = Array.from(new Set(tripRounds.map(tr => tr.course.id)))
    .map(courseId => courses.find(c => c.id === courseId))
    .filter((course): course is Course => course !== undefined)

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div className="header-top">
            <Link href="/" className="back-link">
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </Link>
          </div>
          <h1><i className="fas fa-trophy"></i> {tripName}</h1>
          <p>{formatDate(trip.startDate)} to {formatDate(trip.endDate)}</p>
          {trip.description && <p className="trip-description">{trip.description}</p>}
        </div>
      </header>

      <main className="main-content">
        {/* Empty State for No Rounds */}
        {tripRounds.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem'
          }}>
            <h2 style={{
              fontSize: '2rem',
              color: '#666',
              marginBottom: '1rem'
            }}>🏌️‍♂️ No Rounds Found 🏌️‍♀️</h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#888',
              marginBottom: '2rem'
            }}>
              Rounds not tracked for this trip
            </p>
            <Link href="/" className="btn btn-secondary">
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </Link>
          </div>
        )}

        {/* Content sections - only show when there are rounds */}
        {tripRounds.length > 0 && (
          <>
            {/* Champion Highlight */}
            {champion && (
              <div className="champion-section">
                <div className="champion-card">
                  <div className="champion-header">
                    <i className="fas fa-crown"></i>
                    <h2>🏆 Trip Champion</h2>
                  </div>
                  <div className="champion-content">
                    <div className="champion-player">
                      <h3>{champion.player.name}</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trip Overview */}
            <div className="trip-overview">
              <h2>Trip Overview</h2>
              <div className="overview-grid">
                <div className="overview-item">
                  <i className="fas fa-users"></i>
                  <span className="overview-value">{playerStats.length}</span>
                  <span className="overview-label">Players</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-golf-ball"></i>
                  <span className="overview-value">{tripRounds.length}</span>
                  <span className="overview-label">Total Rounds</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-flag"></i>
                  <span className="overview-value">{uniqueCourses.length}</span>
                  <span className="overview-label">Courses</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-calendar"></i>
                  <span className="overview-value">{calculateTripDuration(trip.startDate, trip.endDate)}</span>
                  <span className="overview-label">Days</span>
                </div>
              </div>
            </div>

            {/* Fun Stats */}
            <div className="fun-stats">
              <h2>Fun Stats</h2>
              <div className="fun-stats-grid">
                <div className="fun-stat-card">
                  <i className="fas fa-fire"></i>
                  <h3>Best Single Round</h3>
                  <p className="fun-stat-value">
                    {Math.min(...tripRounds.map(tr => tr.round.score))}
                  </p>
                  <p className="fun-stat-player">
                    by {(() => {
                      const bestRound = tripRounds.find(tr => tr.round.score === Math.min(...tripRounds.map(tr => tr.round.score)))
                      return bestRound ? `${bestRound.player.name} @ ${bestRound.course.name}` : 'N/A'
                    })()}
                  </p>
                </div>
                
                <div className="fun-stat-card">
                  <i className="fas fa-chart-line"></i>
                  <h3>Most Consistent</h3>
                  <p className="fun-stat-value">
                    {(() => {
                      const eligiblePlayers = playerStats.filter(player => player.roundsPlayed > 1)
                      if (eligiblePlayers.length === 0) return 'N/A'
                      const mostConsistent = eligiblePlayers.reduce((min, current) => 
                        (current.worstScore - current.bestScore) < (min.worstScore - min.bestScore) ? current : min
                      )
                      return mostConsistent.player.name
                    })()}
                  </p>
                  <p className="fun-stat-player">
                    {(() => {
                      const eligiblePlayers = playerStats.filter(player => player.roundsPlayed > 1)
                      if (eligiblePlayers.length === 0) return 'N/A'
                      const mostConsistent = eligiblePlayers.reduce((min, current) => 
                        (current.worstScore - current.bestScore) < (min.worstScore - min.bestScore) ? current : min
                      )
                      const scoreRange = mostConsistent.worstScore - mostConsistent.bestScore
                      return `${scoreRange} stroke range (${mostConsistent.bestScore}-${mostConsistent.worstScore})`
                    })()}
                  </p>
                </div>
                
                <div className="fun-stat-card">
                  <i className="fas fa-arrow-up"></i>
                  <h3>Biggest Improvement</h3>
                  <p className="fun-stat-value">
                    {(() => {
                      const improvements = playerStats
                        .filter(player => player.round1Score && (player.round2Score || player.round3Score))
                        .map(player => {
                          const firstRound = player.round1Score!
                          const lastRound = player.round3Score || player.round2Score!
                          return {
                            player: player.player.name,
                            improvement: firstRound - lastRound
                          }
                        })
                        .filter(item => item.improvement > 0)
                        .sort((a, b) => b.improvement - a.improvement)
                      
                      return improvements.length > 0 ? improvements[0].improvement : 0
                    })()}
                  </p>
                  <p className="fun-stat-player">
                    by {(() => {
                      const improvements = playerStats
                        .filter(player => player.round1Score && (player.round2Score || player.round3Score))
                        .map(player => {
                          const firstRound = player.round1Score!
                          const lastRound = player.round3Score || player.round2Score!
                          return {
                            player: player.player.name,
                            improvement: firstRound - lastRound
                          }
                        })
                        .filter(item => item.improvement > 0)
                        .sort((a, b) => b.improvement - a.improvement)
                      
                      return improvements.length > 0 ? improvements[0].player : 'N/A'
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Player Rankings */}
            <div className="player-rankings">
              <h2>Player Rankings</h2>
              <div className="rankings-table">
                <div className="rankings-header">
                  <div className="rank-col">Rank</div>
                  <div className="player-col">Player</div>
                  <div className="stat-col">Round 1</div>
                  <div className="stat-col">Round 2</div>
                  <div className="stat-col">Round 3</div>
                  <div className="stat-col">Average</div>
                </div>
                {playerStats.map((playerStat, index) => (
                  <div key={playerStat.player.id} className={`rankings-row ${index === 0 ? 'champion-row' : ''}`}>
                    <div className="rank-col">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="player-col">{playerStat.player.name}</div>
                    <div className="stat-col">{playerStat.round1Score || '-'}</div>
                    <div className="stat-col">{playerStat.round2Score || '-'}</div>
                    <div className="stat-col">{playerStat.round3Score || '-'}</div>
                    <div className="stat-col">{playerStat.averageScore}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Rounds */}
            <div className="course-rounds">
              <h2>Course Rounds</h2>
              {uniqueCourses.map(course => {
                const courseRounds = tripRounds.filter(tr => tr.course.id === course.id)
                const courseStats = {
                  averageScore: Math.round(courseRounds.reduce((sum, tr) => sum + tr.round.score, 0) / courseRounds.length),
                  bestScore: Math.min(...courseRounds.map(tr => tr.round.score)),
                  worstScore: Math.max(...courseRounds.map(tr => tr.round.score)),
                  bestPlayer: courseRounds.find(tr => tr.round.score === Math.min(...courseRounds.map(tr => tr.round.score)))?.player.name
                }

                return (
                  <div key={course.id} className="course-round-card">
                    <div className="course-round-header">
                      <h3>{course.name}</h3>
                      <div className="course-info">
                        <span className="course-location">{course.location}</span>
                        <span className="course-par">Par {course.par}</span>
                      </div>
                      <div className="course-stats">
                        <div className="course-stat">
                          <span className="stat-value">{courseStats.averageScore}</span>
                          <span className="stat-label">Avg</span>
                        </div>
                        <div className="course-stat">
                          <span className="stat-value">{courseStats.bestScore}</span>
                          <span className="stat-label">Best</span>
                        </div>
                        <div className="course-stat">
                          <span className="stat-value">{courseRounds.length}</span>
                          <span className="stat-label">Rounds</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="course-rounds-table">
                      <div className="rounds-header">
                        <div className="round-col">Date</div>
                        <div className="round-col">Player</div>
                        <div className="round-col">Score</div>
                        <div className="round-col">To Par</div>
                      </div>
                      {courseRounds
                        .sort((a, b) => a.round.score - b.round.score)
                        .map(({ round, player }) => {
                          const toPar = round.score - course.par
                          const toParDisplay = toPar > 0 ? `+${toPar}` : toPar.toString()
                          
                          return (
                            <div key={round.id} className="round-row">
                              <div className="round-col">{formatDate(round.date)}</div>
                              <div className="round-col">{player.name}</div>
                              <div className="round-col">{round.score}</div>
                              <div className={`round-col ${toPar <= 0 ? 'under-par' : 'over-par'}`}>
                                {toParDisplay}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

      </main>
    </div>
  )
}
