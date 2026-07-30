'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Player, Course, Trip, Round } from '@/lib/types'
import { formatDate, getDateValue, calculateTripDuration } from '@/lib/utils'
import { getData } from '../../../lib/data'
import PhotoGallery from '@/components/PhotoGallery'
import SortableTable from '@/components/SortableTable'
import PageShell from '@/components/PageShell'
import EmptyState from '@/components/EmptyState'
import LoadingState from '@/components/LoadingState'
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
    if (!trip || players.length === 0 || courses.length === 0) return

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

    // Add individual round scores and calculate averages; rank by best average
    const playerStatsArray = Array.from(playerStatsMap.values()).map(stats => {
      const sortedRounds = stats.rounds.sort((a, b) => getDateValue(a.round.date) - getDateValue(b.round.date))
      return {
        ...stats,
        averageScore: Math.round(stats.totalScore / stats.roundsPlayed),
        round1Score: sortedRounds[0]?.round.score,
        round2Score: sortedRounds[1]?.round.score,
        round3Score: sortedRounds[2]?.round.score
      }
    }).sort((a, b) => a.averageScore - b.averageScore)

    setPlayerStats(playerStatsArray)

    // Prefer stored champion when present; otherwise best average
    if (playerStatsArray.length > 0) {
      const storedChampion = trip.championPlayerId
        ? playerStatsArray.find(stat => stat.player.id === trip.championPlayerId)
        : undefined
      setChampion(storedChampion ?? playerStatsArray[0])
    } else {
      setChampion(null)
    }
  }, [trip, players, courses, rounds, tripId])

  // Calculate attendees and total players (works even when no rounds exist yet)
  const attendeesWithoutScores = trip?.attendees && players.length > 0
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
      <PageShell title="Trip" backHref="/">
        <LoadingState label="Loading trip..." />
      </PageShell>
    )
  }

  if (!trip) {
    return (
      <PageShell title="Trip not found" backHref="/">
        <EmptyState
          title="Trip not found"
          description="This trip may have been removed or the link is out of date."
          icon="fa-map-marker-alt"
          actionHref="/"
        />
      </PageShell>
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
        return (
          <span className={`rank-badge ${rankIndex < 3 ? `rank-badge-${rankIndex + 1}` : ''}`}>
            #{rankIndex + 1}
          </span>
        )
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
    <PageShell
      title={tripName}
      icon="fa-trophy"
      backHref="/"
      subtitle={`${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`}
      className={champion ? 'has-champion' : undefined}
    >
            {/* Champion Highlight - first so it stays attached under the header */}
            {champion && (
              <div className="champion-section">
                <div className="champion-card">
                  <div className="champion-player">
                    <h3>{champion.player.name}</h3>
                  </div>
                </div>
              </div>
            )}

            {tripRounds.length === 0 && attendeesWithoutScores.length === 0 && !(trip.photos && trip.photos.length > 0) && (
              <EmptyState
                title="No rounds recorded"
                description="Rounds were not tracked for this trip."
                icon="fa-golf-ball"
              />
            )}

            {/* Attendees Without Scores */}
            {attendeesWithoutScores.length > 0 && (
              <div className="attendees-section">
                <h2 className="section-title">Trip Attendees</h2>
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

        {/* Photos are available even when rounds were not recorded */}
        {trip.photos && trip.photos.length > 0 && (
          <div className="trip-photos-section">
            <PhotoGallery
              photos={trip.photos}
              title="📸 Trip Photos"
              className="trip-photo-gallery"
            />
          </div>
        )}

        {/* Content sections - only show when there are rounds */}
        {tripRounds.length > 0 && (
          <>
            {/* Trip Overview */}
            <div className="trip-overview">
              <h2 className="section-title">Trip Overview</h2>
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
              <h2 className="section-title">Fun Stats</h2>
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
              <h2 className="section-title">Player Rankings</h2>
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
              <h2 className="section-title">Course Rounds</h2>
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

    </PageShell>
  )
}
