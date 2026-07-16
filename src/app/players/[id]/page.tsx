'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Player, Course, Trip, Round } from '@/lib/types'
import { calculatePlayerStats, formatDate, getDateValue, getTripYear } from '@/lib/utils'
import { getData } from '../../../lib/data'
import SortableTable from '@/components/SortableTable'
import { type ColumnDef } from '@tanstack/react-table'



interface PlayerRound {
  round: Round
  course: Course
  trip: Trip
}

interface PlayerCourseStats {
  course: Course
  rounds: PlayerRound[]
  averageScore: number
  bestScore: number
  worstScore: number
  timesPlayed: number
}

interface PlayerRoundTableRow {
  id: string
  dateValue: number
  dateLabel: string
  courseName: string
  tripName: string
  score: number
  toPar: number
  toParDisplay: string
  toParClassName: string
}

export default function PlayerDetails() {
  const params = useParams()
  const playerId = params.id as string
  
  const [player, setPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [playerRounds, setPlayerRounds] = useState<PlayerRound[]>([])
  const [courseStats, setCourseStats] = useState<PlayerCourseStats[]>([])
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
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [playerId])

  useEffect(() => {
    if (!player) return

    const tripsById = new Map(trips.map(trip => [trip.id, trip]))
    const coursesById = new Map(courses.map(course => [course.id, course]))

    const playerRoundData = rounds
      .filter(round => round.playerId === playerId)
      .map(round => {
        const course = coursesById.get(round.courseId)
        const trip = tripsById.get(round.tripId)

        if (!course || !trip) {
          console.warn(`Skipping round ${round.id} - missing course or trip data`)
          return null
        }

        return { round, course, trip }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => getDateValue(b.round.date) - getDateValue(a.round.date))

    setPlayerRounds(playerRoundData)

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

    const courseStatsArray = Array.from(courseStatsMap.values()).map(stats => ({
      ...stats,
      averageScore: Math.round(stats.rounds.reduce((sum, r) => sum + r.round.score, 0) / stats.rounds.length)
    })).sort((a, b) => a.averageScore - b.averageScore)

    setCourseStats(courseStatsArray)
  }, [player, courses, trips, rounds, playerId])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading player details...</div>
      </div>
    )
  }

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

  const playerStats = calculatePlayerStats(player, rounds, trips)
  const hasRounds = playerRounds.length > 0
  const bestScore = hasRounds ? Math.min(...playerRounds.map(pr => pr.round.score)) : null
  const worstScore = hasRounds ? Math.max(...playerRounds.map(pr => pr.round.score)) : null
  const bestScoreRound = hasRounds ? playerRounds.find(pr => pr.round.score === bestScore) : undefined
  const averageRoundScore = hasRounds
    ? Math.round(playerRounds.reduce((sum, pr) => sum + pr.round.score, 0) / playerRounds.length)
    : null
  const championshipCount = trips.filter(trip => trip.championPlayerId === playerId).length
  const roundsTableData: PlayerRoundTableRow[] = playerRounds.map(({ round, course, trip }) => {
    const toPar = round.score - course.par
    const toParDisplay = toPar > 0 ? `+${toPar}` : toPar.toString()
    const toParClassName = toPar <= 0 ? 'under-par' : 'over-par'

    return {
      id: round.id,
      dateValue: getDateValue(round.date),
      dateLabel: formatDate(round.date),
      courseName: course.name,
      tripName: `${getTripYear(trip.startDate)} ${trip.location}`,
      score: round.score,
      toPar,
      toParDisplay,
      toParClassName
    }
  })
  const roundsColumns: ColumnDef<PlayerRoundTableRow>[] = [
    {
      accessorKey: 'dateValue',
      header: 'Date',
      cell: info => info.row.original.dateLabel,
      meta: { headerClassName: 'round-col', cellClassName: 'round-col' }
    },
    {
      id: 'courseTrip',
      header: 'Course & Trip',
      accessorFn: row => `${row.courseName} ${row.tripName}`,
      cell: info => (
        <div className="course-trip-col">
          <div className="course-name">{info.row.original.courseName}</div>
          <div className="trip-info">{info.row.original.tripName}</div>
        </div>
      ),
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
          <h1><i className="fas fa-user"></i> {player.name}</h1>
          <p>Golf Trip Statistics & Performance History</p>
        </div>
      </header>

      <main className="main-content">
        {championshipCount > 0 && (
          <div className="champion-section">
            <div className="champion-card">
              <div className="champion-player">
                <h3>🏆 {championshipCount}x Champion</h3>
              </div>
            </div>
          </div>
        )}

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
          {hasRounds ? (
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
                    <small title={`${bestScoreRound.course.name} (${bestScoreRound.round.year})`}>
                      {bestScoreRound.course.name} ({bestScoreRound.round.year})
                    </small>
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
                  <h3>{(worstScore ?? 0) - (bestScore ?? 0)}</h3>
                  <p>Score Range</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No rounds recorded for this player yet.</p>
            </div>
          )}
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
              {hasRounds && (
                <div className="recent-rounds-stats">
                  <div className="recent-rounds-stat">
                    <span className="stat-value">{averageRoundScore}</span>
                    <span className="stat-label">Avg</span>
                  </div>
                  <div className="recent-rounds-stat">
                    <span className="stat-value">{bestScore}</span>
                    <span className="stat-label">Best</span>
                  </div>
                  <div className="recent-rounds-stat">
                    <span className="stat-value">{worstScore}</span>
                    <span className="stat-label">Worst</span>
                  </div>
                </div>
              )}
            </div>
            
            <SortableTable
              data={roundsTableData}
              columns={roundsColumns}
              tableClassName="recent-rounds-table"
              headerRowClassName="rounds-header"
              rowClassName="round-row"
              headerCellClassName="round-col"
              cellClassName="round-col"
              getCellClassName={cell => (
                cell.column.id === 'toPar' ? cell.row.original.toParClassName : ''
              )}
            />
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
