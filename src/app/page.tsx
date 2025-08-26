'use client'

import { useState, useEffect } from 'react'
import { Player, Stats, Course, Trip, Round } from '@/lib/types'
import { calculateStats, getAvailableYears, calculatePlayerStats, calculateCourseTimesPlayed } from '@/lib/utils'
import { getData } from '../lib/data'
import Link from 'next/link'
import TabbedContainer from '@/components/TabbedContainer'
import ParallaxCard from '@/components/ParallaxCard'

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
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

  const availableYears = getAvailableYears(rounds)
  const sortedTrips = [...trips].sort((a, b) => new Date(b.startDate).getFullYear() - new Date(a.startDate).getFullYear())
  const sortedCourses = [...courses].sort((a, b) => {
    const aTimesPlayed = calculateCourseTimesPlayed(a.id, rounds)
    const bTimesPlayed = calculateCourseTimesPlayed(b.id, rounds)
    if (aTimesPlayed !== bTimesPlayed) {
      return bTimesPlayed - aTimesPlayed // Sort by trips played (descending)
    }
    return a.name.localeCompare(b.name) // Then by name alphabetically
  })

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
                  <p>No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="search-results-content">
                  {/* Trips Results */}
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
                <small>{stats.bestAveragePlayer}</small>
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
                  <small>{stats.bestScorePlayer} ({stats.bestScoreYear})</small>
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

        {/* Tabbed Content */}
        <TabbedContainer
          defaultTab="recent-trips"
          tabs={[
            {
              id: 'recent-trips',
              label: 'Trips',
              content: sortedTrips.length > 0 ? (
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
                          <ParallaxCard className="trip-card" intensity={8} rotationIntensity={2}>
                            <div className="trip-header">
                              <h3>{trip.location}</h3>
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
                              {tripRounds.length > 0 || attendeesWithoutScores.length > 0 ? (
                                <>
                                  <p><i className="fas fa-golf-ball"></i> {tripRounds.length} rounds</p>
                                  <p><i className="fas fa-users"></i> {totalTripPlayers} players</p>
                                  {attendeesWithoutScores.length > 0 && (
                                    <p><i className="fas fa-info-circle"></i> {attendeesWithoutScores.length} without scores</p>
                                  )}
                                  {trip.championPlayerId && (
                                    <p><i className="fas fa-trophy"></i> Champion: {players.find(p => p.id === trip.championPlayerId)?.name || 'Unknown'}</p>
                                  )}
                                </>
                              ) : (
                                <div className="trip-empty-state">
                                  <p><i className="fas fa-info-circle"></i> No players tracked</p>
                                </div>
                              )}
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
                    {players
                      .map(player => calculatePlayerStats(player, rounds, trips))
                      .sort((a, b) => {
                        // Put players without scores at the end
                        if (a.averageScore === 0 && b.averageScore !== 0) return 1
                        if (a.averageScore !== 0 && b.averageScore === 0) return -1
                        if (a.averageScore === 0 && b.averageScore === 0) return a.name.localeCompare(b.name)
                        return a.averageScore - b.averageScore
                      })
                      .map((player, index) => (
                        <Link key={player.id} href={`/players/${player.id}`} className="player-card-link">
                          <ParallaxCard className="player-card" intensity={12} rotationIntensity={4}>
                            <div className="player-header">
                              <div className="player-rank">#{index + 1}</div>
                              <div className="player-name">{player.name}</div>
                              <div className="player-actions">
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
                      ))}
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
                            <h3>{course.name}</h3>
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
