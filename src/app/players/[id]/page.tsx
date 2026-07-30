'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Player, Course, Trip, Round } from '@/lib/types'
import { calculatePlayerStats } from '@/lib/utils'
import { getData } from '../../../lib/data'
import SortableTable from '@/components/SortableTable'
import PageShell from '@/components/PageShell'
import EmptyState from '@/components/EmptyState'
import LoadingState from '@/components/LoadingState'
import { type ColumnDef } from '@tanstack/react-table'



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
  const [tripStats, setTripStats] = useState<PlayerTripStats[]>([])
  const [courseStats, setCourseStats] = useState<PlayerCourseStats[]>([])
  const [yearStats, setYearStats] = useState<{ [year: number]: { rounds: number, average: number, best: number } }>({})
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
    if (!player || courses.length === 0 || trips.length === 0) return

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

  if (loading) {
    return (
      <PageShell title="Player" backHref="/">
        <LoadingState label="Loading player..." />
      </PageShell>
    )
  }

  if (!player) {
    return (
      <PageShell title="Player not found" backHref="/">
        <EmptyState
          title="Player not found"
          description="This player may have been removed or the link is out of date."
          icon="fa-user"
          actionHref="/"
        />
      </PageShell>
    )
  }

  // Calculate player stats
  const playerStats = calculatePlayerStats(player, rounds, trips)
  const uniqueYears = Object.keys(yearStats).map(y => parseInt(y)).sort((a, b) => b - a)
  const scores = playerRounds.map(pr => pr.round.score)
  const bestScore = scores.length > 0 ? Math.min(...scores) : null
  const worstScore = scores.length > 0 ? Math.max(...scores) : null
  const bestScoreRound = bestScore != null
    ? playerRounds.find(pr => pr.round.score === bestScore)
    : undefined
  const championshipCount = trips.filter(trip => trip.championPlayerId === playerId).length
  const roundsTableData: PlayerRoundTableRow[] = playerRounds.map(({ round, course, trip }) => {
    const toPar = round.score - course.par
    const toParDisplay = toPar > 0 ? `+${toPar}` : toPar.toString()
    const toParClassName = toPar <= 0 ? 'under-par' : 'over-par'

    return {
      id: round.id,
      dateValue: new Date(round.date).getTime(),
      dateLabel: new Date(round.date).toLocaleDateString(),
      courseName: course.name,
      tripName: `${new Date(trip.startDate).getFullYear()} ${trip.location}`,
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
    <PageShell
      title={player.name}
      icon="fa-user"
      backHref="/"
      className={championshipCount > 0 ? 'has-champion' : undefined}
    >
        {championshipCount > 0 && (
          <div className="champion-section">
            <div className="champion-card">
              <div className="champion-player">
                <h3>{championshipCount}x Trip Winner</h3>
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
          <h2 className="section-title">Performance Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{playerStats.averageScore}</span>
                <p>Average Score</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{bestScore ?? '—'}</span>
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
                <span className="stat-value">{worstScore ?? '—'}</span>
                <p>Worst Round</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-arrows-alt-h"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{bestScore != null && worstScore != null ? worstScore - bestScore : '—'}</span>
                <p>Score Range</p>
              </div>
            </div>
          </div>
        </div>

        {/* All Rounds */}
        <div className="recent-rounds">
          <h2 className="section-title">All Rounds</h2>
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
          <h2 className="section-title">Course Performance</h2>
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




    </PageShell>
  )
}
