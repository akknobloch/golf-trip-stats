'use client'

import { useState, useEffect, useRef } from 'react'
import { Player, Stats, Course, Trip, Round } from '@/lib/types'
import { calculateStats, calculatePlayerStats, calculateCourseTimesPlayed } from '@/lib/utils'
import { getData } from '../lib/data'
import Link from 'next/link'
import TabbedContainer from '@/components/TabbedContainer'
import ParallaxCard from '@/components/ParallaxCard'
import PageShell from '@/components/PageShell'
import EmptyState from '@/components/EmptyState'

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalPlayers: 0,
    totalYears: 0,
    bestAverage: '--',
    totalCourses: 0,
    totalTrips: 0
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    trips: Trip[]
    players: Player[]
    courses: Course[]
  }>({ trips: [], players: [], courses: [] })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load data from static source or localStorage
    const loadData = () => {
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
    }
    
    loadData()
  }, [])

  useEffect(() => {
    // Update stats whenever data changes
    const newStats = calculateStats(players, rounds)
    setStats({
      ...newStats,
      totalCourses: courses.length,
      totalTrips: trips.length
    })
  }, [players, courses, trips, rounds])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchQuery('')
        setSearchResults({ trips: [], players: [], courses: [] })
        setShowSearchResults(false)
      }
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!searchSectionRef.current?.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [])

  // Search functionality
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
      new Date(trip.startDate).getFullYear().toString().includes(lowerQuery)
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

  const sortedTrips = [...trips].sort((a, b) => new Date(b.startDate).getFullYear() - new Date(a.startDate).getFullYear())
  const sortedCourses = [...courses].sort((a, b) => {
    const aTimesPlayed = calculateCourseTimesPlayed(a.id, rounds)
    const bTimesPlayed = calculateCourseTimesPlayed(b.id, rounds)
    if (aTimesPlayed !== bTimesPlayed) {
      return bTimesPlayed - aTimesPlayed // Sort by trips played (descending)
    }
    return a.name.localeCompare(b.name) // Then by name alphabetically
  })
  const courseScoreStats = courses.map(course => {
    const courseRounds = rounds.filter(round => round.courseId === course.id)
    if (courseRounds.length === 0) {
      return {
        courseId: course.id,
        averageScore: null,
        variance: null,
        roundsCount: 0
      }
    }

    const scores = courseRounds.map(round => round.score)
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    const variance = Math.max(...scores) - Math.min(...scores)

    return {
      courseId: course.id,
      averageScore,
      variance,
      roundsCount: scores.length
    }
  })
  const coursesWithScores = courseScoreStats.filter(stat => stat.roundsCount > 0)
  const hardestCourseId = coursesWithScores.length > 0
    ? coursesWithScores.reduce((max, current) => (
      (current.averageScore ?? 0) > (max.averageScore ?? 0) ? current : max
    )).courseId
    : null
  const easiestCourseId = coursesWithScores.length > 0
    ? coursesWithScores.reduce((min, current) => (
      (current.averageScore ?? 0) < (min.averageScore ?? 0) ? current : min
    )).courseId
    : null
  const mostVarianceCourseId = coursesWithScores.length > 0
    ? coursesWithScores.reduce((max, current) => (
      (current.variance ?? 0) > (max.variance ?? 0) ? current : max
    )).courseId
    : null

  return (
    <PageShell
      title="Golf Trip Dashboard"
      icon="fa-golf-ball"
      subtitle="Historical results and statistics from our annual golf trips"
      actions={process.env.NODE_ENV === 'development' ? (
        <Link href="/admin" className="btn btn-secondary">
          <i className="fas fa-cog" aria-hidden="true"></i> Admin
        </Link>
      ) : undefined}
    >
        {/* Search Bar */}
        <div className="search-section" ref={searchSectionRef}>
          <div className="search-container">
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon" aria-hidden="true"></i>
              <label htmlFor="site-search" className="visually-hidden">
                Search trips, players, or courses
              </label>
              <input
                id="site-search"
                type="search"
                placeholder="Search trips, players, or courses..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchResults(true)
                }}
                className="search-input"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="search-clear"
                  aria-label="Clear search"
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              )}
            </div>

            {showSearchResults && (
              <div className="search-results">
                <div className="search-results-header">
                  <h3>Search Results</h3>
                  <button type="button" onClick={clearSearch} className="close-search" aria-label="Close search results">
                    <i className="fas fa-times" aria-hidden="true"></i>
                  </button>
                </div>
                
                {searchResults.trips.length === 0 && 
                 searchResults.players.length === 0 && 
                 searchResults.courses.length === 0 ? (
                  <div className="no-results">
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="search-results-content">
                    {searchResults.trips.length > 0 && (
                      <div className="search-category">
                        <h4><i className="fas fa-plane"></i> Trips ({searchResults.trips.length})</h4>
                        <div className="search-items">
                          {searchResults.trips.map(trip => {
                            const tripYear = new Date(trip.startDate).getFullYear()
                            return (
                              <Link 
                                key={trip.id} 
                                href={`/trips/${trip.id}`}
                                className="search-item"
                                onClick={clearSearch}
                              >
                                <div className="search-item-content">
                                  <div className="search-item-title">{trip.location}</div>
                                  <div className="search-item-subtitle">{tripYear}</div>
                                </div>
                                <i className="fas fa-arrow-right"></i>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}

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
                <span className="stat-value">{stats.totalPlayers}</span>
                <p>Total Players</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.bestAverage}</span>
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
                  <span className="stat-value">{stats.bestScore}</span>
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
                <span className="stat-value">{stats.totalTrips}</span>
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
                      const tripRounds = rounds.filter(round => round.tripId === trip.id)
                      const tripPlayersWithScores = new Set(tripRounds.map(round => round.playerId))
                      const tripCourses = new Set(tripRounds.map(round => round.courseId))
                      const tripYear = new Date(trip.startDate).getFullYear()
                      const tripName = `${tripYear} ${trip.location}`
                      
                      // Include attendees who don't have scores
                      const attendeesWithoutScores = trip.attendees 
                        ? players.filter(player => 
                            trip.attendees!.includes(player.id) && 
                            !tripRounds.some(round => round.playerId === player.id)
                          )
                        : []
                      
                      // Total players = players with scores + attendees without scores
                      const totalTripPlayers = tripPlayersWithScores.size + attendeesWithoutScores.length
                      
                      return (
                        <Link key={trip.id} href={`/trips/${trip.id}`} className="trip-card-link">
                          <ParallaxCard className="trip-card" intensity={5} rotationIntensity={1.5}>
                            {/* Trip Photo Thumbnail */}
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
                                    <i className="fas fa-golf-ball" aria-hidden="true"></i>
                                    <span className="fore-text">{new Date(trip.startDate).getFullYear()}</span>
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
                                <span className="trip-year">{new Date(trip.startDate).getFullYear()}</span>
                                <div className="trip-actions">
                                  <div className="action-btn" title="View Details">
                                    <i className="fas fa-arrow-right"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="trip-details">
                              <p><i className="fas fa-users"></i> {totalTripPlayers} players</p>
                              <p><i className="fas fa-trophy"></i> {trip.championPlayerId ? players.find(p => p.id === trip.championPlayerId)?.name || 'TBD' : 'TBD'}</p>
                            </div>
                          </ParallaxCard>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No trips yet"
                  description="Trip results will show up here once trips are added."
                  icon="fa-plane"
                />
              )
            },
            {
              id: 'all-players',
              label: 'Players',
              content: players.length > 0 ? (
                <div className="all-players-section">
                  <div className="players-grid">
                    {players
                      .map(player => calculatePlayerStats(player, rounds, trips))
                      .sort((a, b) => {
                        // Put players without scores at the end
                        if (a.averageScore === 0 && b.averageScore !== 0) return 1
                        if (a.averageScore !== 0 && b.averageScore === 0) return -1
                        if (a.averageScore === 0 && b.averageScore === 0) return a.name.localeCompare(b.name)
                        return a.averageScore - b.averageScore
                      })
                      .map((player, index) => {
                        const championshipCount = trips.filter(trip => trip.championPlayerId === player.id).length
                        return (
                        <Link key={player.id} href={`/players/${player.id}`} className="player-card-link">
                          <ParallaxCard className="player-card" intensity={6} rotationIntensity={2}>
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
                                <span className="stat-value">{rounds.filter(r => r.playerId === player.id).length}</span>
                                <span className="stat-label">Rounds</span>
                              </div>
                            </div>
                            
                            {/* Best Score Highlight */}
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
                <EmptyState
                  title="No players yet"
                  description="Player results will show up here once players are added."
                  icon="fa-users"
                />
              )
            },
            {
              id: 'courses-played',
              label: 'Courses',
              content: sortedCourses.length > 0 ? (
                <div className="courses-section">
                  <div className="courses-grid">
                    {sortedCourses.map(course => (
                      <Link key={course.id} href={`/courses/${course.id}`} className="course-card-link">
                        <ParallaxCard className="course-card" intensity={5} rotationIntensity={1.5}>
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
                            <p><i className="fas fa-play"></i> Played {calculateCourseTimesPlayed(course.id, rounds)} times</p>
                            <div className='course-stats'>
                                                          <p>
                              <i className="fas fa-chart-line"></i> Avg Score: {
                                courseScoreStats.find(stat => stat.courseId === course.id)?.averageScore ?? '--'
                              }
                            </p>
                              <div className="course-tags">
                                {course.id === hardestCourseId && (
                                  <span className="course-tag course-tag-hardest">Hardest</span>
                                )}
                                {course.id === easiestCourseId && (
                                  <span className="course-tag course-tag-easiest">Easiest</span>
                                )}
                                {course.id === mostVarianceCourseId && (
                                  <span className="course-tag course-tag-variance">Most Variance</span>
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
                <EmptyState
                  title="No courses yet"
                  description="Course results will show up here once courses are added."
                  icon="fa-flag"
                />
              )
            }
          ]}
        />
    </PageShell>
  )
}
