'use client'

import { useState, useEffect, useMemo } from 'react'
import { Player, Course, Trip, Round } from '@/lib/types'
import {
  calculateStats,
  calculatePlayerStats,
  calculateCourseTimesPlayedMap,
  getTripYear,
  getTripChampionName,
  groupBy,
  indexById,
} from '@/lib/utils'
import { getData } from '../lib/data'
import Link from 'next/link'
import TabbedContainer from '@/components/TabbedContainer'
import ParallaxCard from '@/components/ParallaxCard'

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    trips: Trip[]
    players: Player[]
    courses: Course[]
  }>({ trips: [], players: [], courses: [] })
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    try {
      const data = getData()
      setPlayers(data.players)
      setCourses(data.courses)
      setTrips(data.trips)
      setRounds(data.rounds)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const playersById = useMemo(() => indexById(players), [players])
  const roundsByTripId = useMemo(() => groupBy(rounds, round => round.tripId), [rounds])
  const roundsByPlayerId = useMemo(() => groupBy(rounds, round => round.playerId), [rounds])
  const roundsByCourseId = useMemo(() => groupBy(rounds, round => round.courseId), [rounds])
  const courseTimesPlayed = useMemo(() => calculateCourseTimesPlayedMap(rounds), [rounds])
  const championshipCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const trip of trips) {
      if (!trip.championPlayerId) continue
      counts.set(trip.championPlayerId, (counts.get(trip.championPlayerId) || 0) + 1)
    }
    return counts
  }, [trips])

  const stats = useMemo(() => {
    const newStats = calculateStats(players, rounds)
    return {
      ...newStats,
      totalCourses: courses.length,
      totalTrips: trips.length
    }
  }, [players, courses, trips, rounds])

  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => getTripYear(b.startDate) - getTripYear(a.startDate)),
    [trips]
  )

  const courseScoreStatsById = useMemo(() => {
    const statsById = new Map<string, { averageScore: number | null; variance: number | null; roundsCount: number }>()

    for (const course of courses) {
      const courseRounds = roundsByCourseId.get(course.id) || []
      if (courseRounds.length === 0) {
        statsById.set(course.id, { averageScore: null, variance: null, roundsCount: 0 })
        continue
      }

      const scores = courseRounds.map(round => round.score)
      statsById.set(course.id, {
        averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
        variance: Math.max(...scores) - Math.min(...scores),
        roundsCount: scores.length
      })
    }

    return statsById
  }, [courses, roundsByCourseId])

  const { hardestCourseId, easiestCourseId, mostVarianceCourseId } = useMemo(() => {
    const coursesWithScores = courses
      .map(course => ({ courseId: course.id, ...(courseScoreStatsById.get(course.id) || { averageScore: null, variance: null, roundsCount: 0 }) }))
      .filter(stat => stat.roundsCount > 0)

    if (coursesWithScores.length === 0) {
      return { hardestCourseId: null, easiestCourseId: null, mostVarianceCourseId: null }
    }

    return {
      hardestCourseId: coursesWithScores.reduce((max, current) =>
        (current.averageScore ?? 0) > (max.averageScore ?? 0) ? current : max
      ).courseId,
      easiestCourseId: coursesWithScores.reduce((min, current) =>
        (current.averageScore ?? 0) < (min.averageScore ?? 0) ? current : min
      ).courseId,
      mostVarianceCourseId: coursesWithScores.reduce((max, current) =>
        (current.variance ?? 0) > (max.variance ?? 0) ? current : max
      ).courseId,
    }
  }, [courses, courseScoreStatsById])

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => {
      const aTimesPlayed = courseTimesPlayed.get(a.id) || 0
      const bTimesPlayed = courseTimesPlayed.get(b.id) || 0
      if (aTimesPlayed !== bTimesPlayed) {
        return bTimesPlayed - aTimesPlayed
      }
      return a.name.localeCompare(b.name)
    }),
    [courses, courseTimesPlayed]
  )

  const sortedPlayers = useMemo(
    () => players
      .map(player => calculatePlayerStats(player, rounds, trips, roundsByPlayerId))
      .sort((a, b) => {
        if (a.averageScore === 0 && b.averageScore !== 0) return 1
        if (a.averageScore !== 0 && b.averageScore === 0) return -1
        if (a.averageScore === 0 && b.averageScore === 0) return a.name.localeCompare(b.name)
        return a.averageScore - b.averageScore
      }),
    [players, rounds, trips, roundsByPlayerId]
  )

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults({ trips: [], players: [], courses: [] })
      setShowSearchResults(false)
      return
    }

    const lowerQuery = query.toLowerCase()

    const matchingTrips = trips.filter(trip =>
      trip.location.toLowerCase().includes(lowerQuery) ||
      trip.description?.toLowerCase().includes(lowerQuery) ||
      getTripYear(trip.startDate).toString().includes(lowerQuery)
    )

    const matchingPlayers = players.filter(player =>
      player.name.toLowerCase().includes(lowerQuery)
    )

    const matchingCourses = courses.filter(course =>
      course.name.toLowerCase().includes(lowerQuery) ||
      course.location.toLowerCase().includes(lowerQuery) ||
      course.description?.toLowerCase().includes(lowerQuery)
    )

    setSearchResults({
      trips: matchingTrips,
      players: matchingPlayers,
      courses: matchingCourses
    })
    setShowSearchResults(true)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    performSearch(query)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults({ trips: [], players: [], courses: [] })
    setShowSearchResults(false)
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1><i className="fas fa-golf-ball"></i> Golf Trip Dashboard</h1>
          <p>Historical results and statistics from our annual golf trips</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="admin-link">
              <Link href="/admin" className="btn btn-secondary">
                <i className="fas fa-cog"></i> Admin Panel
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search trips, players, or courses..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="search-clear">
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="search-results">
              <div className="search-results-header">
                <h3>Search Results</h3>
                <button onClick={clearSearch} className="close-search">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {searchResults.trips.length === 0 && 
               searchResults.players.length === 0 && 
               searchResults.courses.length === 0 ? (
                <div className="no-results">
                  <p>No results found for &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                <div className="search-results-content">
                  {/* Trips Results */}
                  {searchResults.trips.length > 0 && (
                    <div className="search-category">
                      <h4><i className="fas fa-plane"></i> Trips ({searchResults.trips.length})</h4>
                      <div className="search-items">
                        {searchResults.trips.map(trip => (
                            <Link 
                              key={trip.id} 
                              href={`/trips/${trip.id}`}
                              className="search-item"
                              onClick={clearSearch}
                            >
                              <div className="search-item-content">
                                <div className="search-item-title">{trip.location}</div>
                                <div className="search-item-subtitle">{getTripYear(trip.startDate)}</div>
                              </div>
                              <i className="fas fa-arrow-right"></i>
                            </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Players Results */}
                  {searchResults.players.length > 0 && (
                    <div className="search-category">
                      <h4><i className="fas fa-user"></i> Players ({searchResults.players.length})</h4>
                      <div className="search-items">
                        {searchResults.players.map(player => (
                          <Link 
                            key={player.id} 
                            href={`/players/${player.id}`}
                            className="search-item"
                            onClick={clearSearch}
                          >
                            <div className="search-item-content">
                              <div className="search-item-title">{player.name}</div>
                            </div>
                            <i className="fas fa-arrow-right"></i>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Courses Results */}
                  {searchResults.courses.length > 0 && (
                    <div className="search-category">
                      <h4><i className="fas fa-map-marker-alt"></i> Courses ({searchResults.courses.length})</h4>
                      <div className="search-items">
                        {searchResults.courses.map(course => (
                          <Link 
                            key={course.id} 
                            href={`/courses/${course.id}`}
                            className="search-item"
                            onClick={clearSearch}
                          >
                            <div className="search-item-content">
                              <div className="search-item-title">{course.name}</div>
                              <div className="search-item-subtitle">{course.location} • Par {course.par}</div>
                            </div>
                            <i className="fas fa-arrow-right"></i>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Overview */}
        {isLoading ? (
          <div className="stats-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`stat-skeleton-${index}`} className="stat-card skeleton-card">
                <div className="stat-icon skeleton-block skeleton-icon"></div>
                <div className="stat-content">
                  <div className="skeleton-line skeleton-line-lg"></div>
                  <div className="skeleton-line skeleton-line-sm"></div>
                  <div className="skeleton-line skeleton-line-xs"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.totalPlayers}</h3>
                <p>Total Players</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.bestAverage}</h3>
                <p>Best Average</p>
                {stats.bestAveragePlayer && (
                  <small title={stats.bestAveragePlayer}>{stats.bestAveragePlayer}</small>
                )}
              </div>
            </div>
            {stats.bestScore && (
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.bestScore}</h3>
                  <p>Best Single Score</p>
                  {stats.bestScorePlayer && (
                    <small title={`${stats.bestScorePlayer} (${stats.bestScoreYear})`}>
                      {stats.bestScorePlayer} ({stats.bestScoreYear})
                    </small>
                  )}
                </div>
              </div>
            )}

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.totalTrips}</h3>
                <p>Total Trips</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabbed Content */}
        <TabbedContainer
          defaultTab="recent-trips"
          tabs={[
            {
              id: 'recent-trips',
              label: 'Trips',
              content: isLoading ? (
                <div className="recent-trips-section">
                  <div className="trips-grid">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={`trip-skeleton-${index}`} className="trip-card skeleton-card">
                        <div className="trip-photo-thumbnail skeleton-block"></div>
                        <div className="trip-header">
                          <div className="skeleton-line skeleton-line-md"></div>
                          <div className="trip-header-right">
                            <div className="skeleton-pill"></div>
                            <div className="skeleton-circle"></div>
                          </div>
                        </div>
                        <div className="trip-details">
                          <div className="skeleton-line skeleton-line-sm"></div>
                          <div className="skeleton-line skeleton-line-sm"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : sortedTrips.length > 0 ? (
                <div className="recent-trips-section">
                  <div className="trips-grid">
                    {sortedTrips.map(trip => {
                      const tripRounds = roundsByTripId.get(trip.id) || []
                      const tripPlayersWithScores = new Set(tripRounds.map(round => round.playerId))
                      const attendeesWithoutScores = (trip.attendees || []).filter(
                        playerId => !tripPlayersWithScores.has(playerId)
                      )
                      const totalTripPlayers = tripPlayersWithScores.size + attendeesWithoutScores.length

                      return (
                        <Link key={trip.id} href={`/trips/${trip.id}`} className="trip-card-link">
                          <ParallaxCard className="trip-card" intensity={8} rotationIntensity={2}>
                            <div className="trip-photo-thumbnail">
                              {trip.photos && trip.photos.length > 0 ? (
                                <>
                                  <img 
                                    src={trip.photos[0].thumbnailUrl || trip.photos[0].url} 
                                    alt={`${trip.location} trip photo`}
                                    loading="lazy"
                                  />
                                  <div className="photo-count">
                                    <i className="fas fa-camera"></i>
                                    <span>{trip.photos.length}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="trip-photo-placeholder">
                                    <span className="golf-emoji">🏌️</span>
                                    <span className="fore-text">Fore!</span>
                                  </div>
                                  <div className="photo-count placeholder">
                                    <i className="fas fa-camera"></i>
                                    <span>0</span>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            <div className="trip-header">
                            <h3 title={trip.location}>{trip.location}</h3>
                              <div className="trip-header-right">
                                <span className="trip-year">{getTripYear(trip.startDate)}</span>
                                <div className="trip-actions">
                                  <div className="action-btn" title="View Details">
                                    <i className="fas fa-arrow-right"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="trip-details">
                              <p><i className="fas fa-users"></i> {totalTripPlayers} players</p>
                              <p><i className="fas fa-trophy"></i> {getTripChampionName(trip, playersById)}</p>
                            </div>
                          </ParallaxCard>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No trips found. Add some trips in the admin panel to get started.</p>
                </div>
              )
            },
            {
              id: 'all-players',
              label: 'Players',
              content: players.length > 0 ? (
                <div className="all-players-section">
                  <div className="players-grid">
                    {sortedPlayers.map((player, index) => {
                        const championshipCount = championshipCounts.get(player.id) || 0
                        const playerRoundCount = roundsByPlayerId.get(player.id)?.length || 0
                        return (
                        <Link key={player.id} href={`/players/${player.id}`} className="player-card-link">
                          <ParallaxCard className="player-card" intensity={12} rotationIntensity={4}>
                            <div className="player-header">
                              <div className='player-header_group'>
                                <div className="player-rank">#{index + 1}</div>
                                <div className="player-name">{player.name}</div>
                              </div>
                              <div className="player-actions">
                                {championshipCount > 0 && (
                                  <div className="player-championships-badge" title={`${championshipCount} Trip Championship${championshipCount > 1 ? 's' : ''}`}>
                                    <i className="fas fa-trophy"></i> {championshipCount}
                                  </div>
                                )}
                                <div className="action-btn" title="View Details">
                                  <i className="fas fa-arrow-right"></i>
                                </div>
                              </div>
                            </div>
                            <div className="player-stats">
                              <div className="stat-item">
                                <span className="stat-value">{player.averageScore}</span>
                                <span className="stat-label">Average</span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-value">{player.totalTrips}</span>
                                <span className="stat-label">Trips</span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-value">{playerRoundCount}</span>
                                <span className="stat-label">Rounds</span>
                              </div>
                            </div>
                            
                            {player.bestScore && (
                              <div className="player-best-score">
                                <div className="best-score-header">
                                  <i className="fas fa-star"></i>
                                  <span>Best Round</span>
                                </div>
                                <div className="best-score-content">
                                  <div className="best-score-value">{player.bestScore}</div>
                                  <div className="best-score-details">
                                    <span className="best-score-year">{player.bestScoreYear}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </ParallaxCard>
                        </Link>
                      )})}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No players found. Add some players in the admin panel to get started.</p>
                </div>
              )
            },
            {
              id: 'courses-played',
              label: 'Courses Played',
              content: sortedCourses.length > 0 ? (
                <div className="courses-section">
                  <div className="courses-grid">
                    {sortedCourses.map(course => (
                      <Link key={course.id} href={`/courses/${course.id}`} className="course-card-link">
                        <ParallaxCard className="course-card" intensity={8} rotationIntensity={2}>
                          <div className="course-header">
                            <h3 title={course.name}>{course.name}</h3>
                            <div className="course-header-right">
                              <span className="course-par">Par {course.par}</span>
                              <div className="course-actions">
                                <div className="action-btn" title="View Details">
                                  <i className="fas fa-arrow-right"></i>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="course-details">
                            <p><i className="fas fa-map-marker-alt"></i> {course.location}</p>
                            <p><i className="fas fa-play"></i> Played {courseTimesPlayed.get(course.id) || 0} times</p>
                            <div className='course-stats'>
                                                          <p>
                              <i className="fas fa-chart-line"></i> Avg Score: {
                                courseScoreStatsById.get(course.id)?.averageScore ?? '--'
                              }
                            </p>
                              <div className="course-tags">
                                {course.id === hardestCourseId && (
                                  <span className="course-tag course-tag-hardest">🔥 Hardest</span>
                                )}
                                {course.id === easiestCourseId && (
                                  <span className="course-tag course-tag-easiest">🪶 Easiest</span>
                                )}
                                {course.id === mostVarianceCourseId && (
                                  <span className="course-tag course-tag-variance">🎢 Most Variance</span>
                                )}
                              </div>
                            </div>
                            {course.lastPlayed && (
                              <p><i className="fas fa-calendar"></i> Last: {course.lastPlayed}</p>
                            )}
                          </div>
                        </ParallaxCard>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No courses found. Add some courses in the admin panel to get started.</p>
                </div>
              )
            }
          ]}
        />
      </main>
    </div>
  )
}
