'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Player, Course, Trip, Round } from '@/lib/types'
import { formatDate, getDateValue, calculateTripDuration } from '@/lib/utils'
import { getData } from '../../../lib/data'
import PhotoGallery from '@/components/PhotoGallery'
import SortableTable from '@/components/SortableTable'
import { type ColumnDef } from '@tanstack/react-table'



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

interface PlayerRankRow {
  playerId: string
  playerName: string
  round1Score: number | null
  round2Score: number | null
  round3Score: number | null
  averageScore: number
}

interface CourseRoundRow {
  id: string
  dateValue: number
  dateLabel: string
  playerName: string
  score: number
  toPar: number
  toParDisplay: string
  toParClassName: string
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
        const foundTrip = data.trips.find((t: Trip) => t.id === tripId)
        
        if (!foundTrip) {
          console.warn(`Trip not found: ${tripId}`)
          setTrip(null)
          setPlayers([])
          setCourses([])
          setRounds([])
          return
        }
        
        setTrip(foundTrip)
        setPlayers(data.players)
        setCourses(data.courses)
        setRounds(data.rounds)
      } catch (error) {
        console.error('Error loading data:', error)
        // Set empty arrays to prevent further errors
        setPlayers([])
        setCourses([])
        setRounds([])
        setTrip(null)
      } finally {
        setLoading(false)
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

  // Calculate attendees and total players
  const attendeesWithoutScores = trip?.attendees && players.length > 0 && rounds.length > 0
    ? players.filter(player => {
        if (!player || !player.id) return false
        const isAttendee = trip.attendees!.includes(player.id)
        const hasScores = rounds.some(round => round.tripId === tripId && round.playerId === player.id)
        return isAttendee && !hasScores
      })
    : []

  // Total players on the trip (with scores + attendees without scores)
  const totalTripPlayers = playerStats.length + attendeesWithoutScores.length

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading trip details...</div>
      </div>
    )
  }

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
  const rankingsTableData: PlayerRankRow[] = playerStats.map(playerStat => ({
    playerId: playerStat.player.id,
    playerName: playerStat.player.name,
    round1Score: playerStat.round1Score ?? null,
    round2Score: playerStat.round2Score ?? null,
    round3Score: playerStat.round3Score ?? null,
    averageScore: playerStat.averageScore
  }))
  const rankingsColumns: ColumnDef<PlayerRankRow>[] = [
    {
      id: 'rank',
      header: 'Rank',
      enableSorting: false,
      cell: info => {
        const rankIndex = info.row.index
        if (rankIndex === 0) return '🥇'
        if (rankIndex === 1) return '🥈'
        if (rankIndex === 2) return '🥉'
        return `#${rankIndex + 1}`
      },
      meta: { headerClassName: 'rank-col', cellClassName: 'rank-col' }
    },
    {
      accessorKey: 'playerName',
      header: 'Player',
      meta: { headerClassName: 'player-col', cellClassName: 'player-col' }
    },
    {
      id: 'round1',
      header: 'Round 1',
      accessorFn: row => row.round1Score ?? Number.MAX_SAFE_INTEGER,
      cell: info => info.row.original.round1Score ?? '-',
      meta: { headerClassName: 'stat-col', cellClassName: 'stat-col' }
    },
    {
      id: 'round2',
      header: 'Round 2',
      accessorFn: row => row.round2Score ?? Number.MAX_SAFE_INTEGER,
      cell: info => info.row.original.round2Score ?? '-',
      meta: { headerClassName: 'stat-col', cellClassName: 'stat-col' }
    },
    {
      id: 'round3',
      header: 'Round 3',
      accessorFn: row => row.round3Score ?? Number.MAX_SAFE_INTEGER,
      cell: info => info.row.original.round3Score ?? '-',
      meta: { headerClassName: 'stat-col', cellClassName: 'stat-col' }
    },
    {
      accessorKey: 'averageScore',
      header: 'Average',
      meta: { headerClassName: 'stat-col', cellClassName: 'stat-col' }
    }
  ]
  const courseRoundsColumns: ColumnDef<CourseRoundRow>[] = [
    {
      accessorKey: 'dateValue',
      header: 'Date',
      cell: info => info.row.original.dateLabel,
      meta: { headerClassName: 'round-col', cellClassName: 'round-col' }
    },
    {
      accessorKey: 'playerName',
      header: 'Player',
      meta: { headerClassName: 'round-col', cellClassName: 'round-col' }
    },
    {
      accessorKey: 'score',
      header: 'Score',
      meta: { headerClassName: 'round-col', cellClassName: 'round-col' }
    },
    {
      accessorKey: 'toPar',
      header: 'To Par',
      cell: info => info.row.original.toParDisplay,
      meta: { headerClassName: 'round-col', cellClassName: 'round-col' }
    }
  ]

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
            {tripRounds.length === 0 && attendeesWithoutScores.length === 0 && (
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

            {/* Attendees Without Scores */}
            {attendeesWithoutScores.length > 0 && (
              <div className="attendees-section">
                <h2>📋 Trip Attendees (No Scores Recorded)</h2>
                <div className="attendees-grid">
                  {attendeesWithoutScores.map(player => (
                    <div key={player.id} className="attendee-card">
                      <div className="attendee-info">
                        <h3>{player.name}</h3>
                        <p className="attendee-note">
                          <i className="fas fa-info-circle"></i>
                          Attended but scores not recorded
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

        {/* Content sections - only show when there are rounds */}
        {tripRounds.length > 0 && (
          <>
            {/* Champion Highlight */}
            {champion && (
              <div className="champion-section">
                <div className="champion-card">
                  <div className="champion-content">
                    <div className="champion-player">
                      <h3>🏆 {champion.player.name}</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Gallery */}
        {trip.photos && trip.photos.length > 0 && (
          <div className="trip-photos-section">
            <PhotoGallery 
              photos={trip.photos} 
              title="📸 Trip Photos" 
              className="trip-photo-gallery"
            />
          </div>
        )}

            {/* Trip Overview */}
            <div className="trip-overview">
              <h2>Trip Overview</h2>
              <div className="overview-grid">
                <div className="overview-item">
                  <i className="fas fa-users"></i>
                  <span className="overview-value">{totalTripPlayers}</span>
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
              <SortableTable
                data={rankingsTableData}
                columns={rankingsColumns}
                tableClassName="rankings-table"
                headerRowClassName="rankings-header"
                rowClassName="rankings-row"
                getRowClassName={row => (row.index === 0 ? 'champion-row' : '')}
              />
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
                const courseRoundRows: CourseRoundRow[] = [...courseRounds]
                  .sort((a, b) => a.round.score - b.round.score)
                  .map(({ round, player }) => {
                    const toPar = round.score - course.par
                    const toParDisplay = toPar > 0 ? `+${toPar}` : toPar.toString()
                    const toParClassName = toPar <= 0 ? 'under-par' : 'over-par'

                    return {
                      id: round.id,
                      dateValue: getDateValue(round.date),
                      dateLabel: formatDate(round.date),
                      playerName: player.name,
                      score: round.score,
                      toPar,
                      toParDisplay,
                      toParClassName
                    }
                  })

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
                    
                    <SortableTable
                      data={courseRoundRows}
                      columns={courseRoundsColumns}
                      tableClassName="course-rounds-table"
                      headerRowClassName="rounds-header"
                      rowClassName="round-row"
                      headerCellClassName="round-col"
                      cellClassName="round-col"
                      getCellClassName={cell => (
                        cell.column.id === 'toPar' ? cell.row.original.toParClassName : ''
                      )}
                    />
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
