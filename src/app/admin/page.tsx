'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Player, Course, Trip, Round } from '@/lib/types'
import { calculatePlayerStats } from '@/lib/utils'
import { getStaticData } from '@/lib/data'
import { requireAuth, logout } from '@/lib/auth'
import Link from 'next/link'
import Toast from '@/components/Toast'
import PlayerEditForm from '@/components/PlayerEditForm'
import CourseEditForm from '@/components/CourseEditForm'
import TripEditForm from '@/components/TripEditForm'
import RoundEditForm from '@/components/RoundEditForm'

export default function Admin() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'courses' | 'trips' | 'rounds' | 'export' | 'editor'>('overview')
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false
  })

  // Import state
  const [csvData, setCsvData] = useState('')
  const [importType, setImportType] = useState<'players' | 'courses' | 'trips' | 'rounds' | 'trip-scores'>('trip-scores')
  const [showImportSection, setShowImportSection] = useState(false)

  // Editor state
  const [editorContent, setEditorContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editorError, setEditorError] = useState('')
  const [showEditor, setShowEditor] = useState(false)

  // Inline editing state
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState<string | null>(null)
  const [editingTrip, setEditingTrip] = useState<string | null>(null)
  const [editingRound, setEditingRound] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState<'player' | 'course' | 'trip' | 'round' | null>(null)

  useEffect(() => {
    // Check authentication in production
    if (!requireAuth()) {
      router.push('/admin/login')
      return
    }

    // Load static data
    const loadData = () => {
      const data = getStaticData()
      setPlayers(data.players)
      setCourses(data.courses)
      setTrips(data.trips)
      setRounds(data.rounds)
    }
    
    loadData()
  }, [router])

  // Load editor content when editor tab is opened
  useEffect(() => {
    if (activeTab === 'editor' && !editorContent) {
      loadEditorContent()
    }
  }, [activeTab, editorContent])

  useEffect(() => {
    // Handle tab parameter from URL
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'players', 'courses', 'trips', 'rounds', 'export', 'editor'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview' | 'players' | 'courses' | 'trips' | 'rounds' | 'export' | 'editor')
    }

    // Handle toast messages from URL
    const message = searchParams.get('message')
    const type = searchParams.get('type') as 'success' | 'error'
    if (message && type) {
      setToast({
        message: decodeURIComponent(message),
        type,
        isVisible: true
      })
    }
  }, [searchParams])

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  const generateTypeScriptContent = () => {
    return `import { Player, Course, Trip, Round } from '@/lib/types'

// Static data for public deployment
// This data will be embedded in the application and served statically
// Update this file when you want to update the public data

export const staticPlayers: Player[] = ${JSON.stringify(players, null, 2)}

export const staticCourses: Course[] = ${JSON.stringify(courses, null, 2)}

export const staticTrips: Trip[] = ${JSON.stringify(trips, null, 2)}

export const staticRounds: Round[] = ${JSON.stringify(rounds, null, 2)}
`
  }

  const loadEditorContent = () => {
    setEditorContent(generateTypeScriptContent())
    setEditorError('')
    setIsEditing(false)
  }

  const validateEditorContent = (content: string): { isValid: boolean; error?: string; data?: any } => {
    try {
      // Remove the import statement and export declarations to get just the data
      const dataSection = content.replace(/import.*?from.*?;?\s*/g, '')
        .replace(/export const staticPlayers: Player\[\] = /, '')
        .replace(/export const staticCourses: Course\[\] = /, '')
        .replace(/export const staticTrips: Trip\[\] = /, '')
        .replace(/export const staticRounds: Round\[\] = /, '')
        .replace(/\/\/.*$/gm, '') // Remove comments
        .trim()

      // Try to parse the data
      const dataMatch = dataSection.match(/(\[[\s\S]*?\])\s*(\[[\s\S]*?\])\s*(\[[\s\S]*?\])\s*(\[[\s\S]*?\])\s*$/)
      
      if (!dataMatch) {
        return { isValid: false, error: 'Could not parse data structure. Please ensure the file has the correct format.' }
      }

      const [, playersStr, coursesStr, tripsStr, roundsStr] = dataMatch
      
      const players = JSON.parse(playersStr)
      const courses = JSON.parse(coursesStr)
      const trips = JSON.parse(tripsStr)
      const rounds = JSON.parse(roundsStr)

      // Basic validation
      if (!Array.isArray(players) || !Array.isArray(courses) || !Array.isArray(trips) || !Array.isArray(rounds)) {
        return { isValid: false, error: 'All data must be arrays.' }
      }

      return { isValid: true, data: { players, courses, trips, rounds } }
    } catch (error) {
      return { isValid: false, error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  const saveEditorContent = async () => {
    const validation = validateEditorContent(editorContent)
    
    if (!validation.isValid) {
      setEditorError(validation.error || 'Invalid content')
      return
    }

    try {
      const response = await fetch('/api/admin/save-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editorContent,
          data: validation.data
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setToast({
          message: 'Data saved successfully! The application will reload to reflect changes.',
          type: 'success',
          isVisible: true
        })
        setIsEditing(false)
        setEditorError('')
        
        // Reload the data
        const data = getStaticData()
        setPlayers(data.players)
        setCourses(data.courses)
        setTrips(data.trips)
        setRounds(data.rounds)
      } else {
        throw new Error(result.error || 'Failed to save data')
      }
    } catch (error) {
      setEditorError(`Save error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const exportStaticData = () => {
    try {
      const data = {
        players,
        courses,
        trips,
        rounds,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `golf-trip-manager-static-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setToast({
        message: 'Static data exported successfully!',
        type: 'success',
        isVisible: true
      })
    } catch (error: unknown) {
      console.error('Error exporting data:', error)
      setToast({
        message: 'Error exporting data: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error',
        isVisible: true
      })
    }
  }

  const exportTypeScriptFile = () => {
    try {
      const tsContent = generateTypeScriptContent()
      
      const blob = new Blob([tsContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'golf-data.ts'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setToast({
        message: 'TypeScript file exported! Replace src/data/golf-data.ts with this file.',
        type: 'success',
        isVisible: true
      })
    } catch (error: unknown) {
      console.error('Error exporting TypeScript file:', error)
      setToast({
        message: 'Error exporting TypeScript file: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error',
        isVisible: true
      })
    }
  }

  const getTemplate = () => {
    switch (importType) {
      case 'trip-scores':
        return `Trip Year,Golfer Name,Round 1 Score,Round 1 Course,Round 1 Date,Round 2 Score,Round 2 Course,Round 2 Date,Round 3 Score,Round 3 Course,Round 3 Date
2024,John Smith,85,Pebble Beach,2024-06-15,82,Spyglass Hill,2024-06-16,79,Spanish Bay,2024-06-17
2024,Jane Doe,78,Pebble Beach,2024-06-15,75,Spyglass Hill,2024-06-16,77,Spanish Bay,2024-06-17
2024,Mike Johnson,88,Pebble Beach,2024-06-15,85,Spyglass Hill,2024-06-16,83,Spanish Bay,2024-06-17`
      case 'players':
        return `Player Name
John Smith
Jane Doe
Mike Johnson
Sarah Wilson`
      case 'courses':
        return `Course Name,Location,Par
Pebble Beach Golf Links,Pebble Beach CA,72
Augusta National Golf Club,Augusta GA,72
St. Andrews Old Course,St. Andrews Scotland,72`
      case 'trips':
        return `Start Date,End Date,Location,Description,Weather,Notes
2024-06-15,2024-06-18,Myrtle Beach SC,Annual golf trip,Sunny 75F,Great weather
2023-07-20,2023-07-23,Pebble Beach CA,West coast trip,Overcast 65F,Beautiful views`
      case 'rounds':
        return `Player ID,Trip ID,Course ID,Score,Date,Year,Notes
player1,trip1,course1,85,2024-06-15,2024,Great round
player2,trip1,course1,78,2024-06-15,2024,Personal best`
      default:
        return ''
    }
  }

  const downloadTemplate = () => {
    const template = getTemplate()
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importType}-template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    try {
      // This is a simplified import that just shows the data structure
      // In a real implementation, you would process the CSV and update the static data
      setToast({
        message: 'Import functionality would process CSV and update static data file. For now, use the export feature to get the current data structure.',
        type: 'success',
        isVisible: true
      })
      setCsvData('')
    } catch (error: unknown) {
      setToast({
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        isVisible: true
      })
    }
  }

  // Inline editing functions
  const saveAllData = async (newData: { players: Player[], courses: Course[], trips: Trip[], rounds: Round[] }) => {
    try {
      const content = `import { Player, Course, Trip, Round } from '@/lib/types'

// Static data for public deployment
// This data will be embedded in the application and served statically
// Update this file when you want to update the public data

export const staticPlayers: Player[] = ${JSON.stringify(newData.players, null, 2)}

export const staticCourses: Course[] = ${JSON.stringify(newData.courses, null, 2)}

export const staticTrips: Trip[] = ${JSON.stringify(newData.trips, null, 2)}

export const staticRounds: Round[] = ${JSON.stringify(newData.rounds, null, 2)}
`

      const response = await fetch('/api/admin/save-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          data: newData
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setToast({
          message: 'Data saved successfully!',
          type: 'success',
          isVisible: true
        })
        
        // Update local state
        setPlayers(newData.players)
        setCourses(newData.courses)
        setTrips(newData.trips)
        setRounds(newData.rounds)
        
        // Clear editing states
        setEditingPlayer(null)
        setEditingCourse(null)
        setEditingTrip(null)
        setEditingRound(null)
        setShowAddForm(null)
      } else {
        throw new Error(result.error || 'Failed to save data')
      }
    } catch (error) {
      setToast({
        message: `Save error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        isVisible: true
      })
    }
  }

  const addPlayer = (playerData: Omit<Player, 'id'>) => {
    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString()
    }
    const newData = {
      players: [...players, newPlayer],
      courses,
      trips,
      rounds
    }
    saveAllData(newData)
  }

  const updatePlayer = (id: string, playerData: Partial<Player>) => {
    const newPlayers = players.map(player => 
      player.id === id ? { ...player, ...playerData } : player
    )
    const newData = {
      players: newPlayers,
      courses,
      trips,
      rounds
    }
    saveAllData(newData)
  }

  const deletePlayer = (id: string) => {
    if (confirm('Are you sure you want to delete this player? This will also delete all their rounds.')) {
      const newPlayers = players.filter(player => player.id !== id)
      const newRounds = rounds.filter(round => round.playerId !== id)
      const newData = {
        players: newPlayers,
        courses,
        trips,
        rounds: newRounds
      }
      saveAllData(newData)
    }
  }

  const addCourse = (courseData: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...courseData,
      id: Date.now().toString()
    }
    const newData = {
      players,
      courses: [...courses, newCourse],
      trips,
      rounds
    }
    saveAllData(newData)
  }

  const updateCourse = (id: string, courseData: Partial<Course>) => {
    const newCourses = courses.map(course => 
      course.id === id ? { ...course, ...courseData } : course
    )
    const newData = {
      players,
      courses: newCourses,
      trips,
      rounds
    }
    saveAllData(newData)
  }

  const deleteCourse = (id: string) => {
    if (confirm('Are you sure you want to delete this course? This will also delete all rounds played on this course.')) {
      const newCourses = courses.filter(course => course.id !== id)
      const newRounds = rounds.filter(round => round.courseId !== id)
      const newData = {
        players,
        courses: newCourses,
        trips,
        rounds: newRounds
      }
      saveAllData(newData)
    }
  }

  const addTrip = (tripData: Omit<Trip, 'id'>) => {
    const newTrip: Trip = {
      ...tripData,
      id: Date.now().toString()
    }
    const newData = {
      players,
      courses,
      trips: [...trips, newTrip],
      rounds
    }
    saveAllData(newData)
  }

  const updateTrip = (id: string, tripData: Partial<Trip>) => {
    const newTrips = trips.map(trip => 
      trip.id === id ? { ...trip, ...tripData } : trip
    )
    const newData = {
      players,
      courses,
      trips: newTrips,
      rounds
    }
    saveAllData(newData)
  }

  const deleteTrip = (id: string) => {
    if (confirm('Are you sure you want to delete this trip? This will also delete all rounds from this trip.')) {
      const newTrips = trips.filter(trip => trip.id !== id)
      const newRounds = rounds.filter(round => round.tripId !== id)
      const newData = {
        players,
        courses,
        trips: newTrips,
        rounds: newRounds
      }
      saveAllData(newData)
    }
  }

  const addRound = (roundData: Omit<Round, 'id'>) => {
    const newRound: Round = {
      ...roundData,
      id: Date.now().toString()
    }
    const newData = {
      players,
      courses,
      trips,
      rounds: [...rounds, newRound]
    }
    saveAllData(newData)
  }

  const updateRound = (id: string, roundData: Partial<Round>) => {
    const newRounds = rounds.map(round => 
      round.id === id ? { ...round, ...roundData } : round
    )
    const newData = {
      players,
      courses,
      trips,
      rounds: newRounds
    }
    saveAllData(newData)
  }

  const deleteRound = (id: string) => {
    if (confirm('Are you sure you want to delete this round?')) {
      const newRounds = rounds.filter(round => round.id !== id)
      const newData = {
        players,
        courses,
        trips,
        rounds: newRounds
      }
      saveAllData(newData)
    }
  }

  return (
    <div className="container">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
      <header className="header">
        <div className="header-content">
          <h1><i className="fas fa-cog"></i> Admin Panel</h1>
          <p>Manage static data for public deployment</p>
          <div className="admin-links">
            <Link href="/" className="btn btn-secondary">
              <i className="fas fa-home"></i> Home
            </Link>
            <Link href="/dashboard" className="btn btn-secondary">
              <i className="fas fa-chart-bar"></i> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-pie"></i> Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            <i className="fas fa-users"></i> Players ({players.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <i className="fas fa-flag"></i> Courses ({courses.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
            onClick={() => setActiveTab('trips')}
          >
            <i className="fas fa-map-marker-alt"></i> Trips ({trips.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'rounds' ? 'active' : ''}`}
            onClick={() => setActiveTab('rounds')}
          >
            <i className="fas fa-golf-ball"></i> Rounds ({rounds.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <i className="fas fa-download"></i> Export/Import
          </button>
          <button 
            className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <i className="fas fa-edit"></i> Direct Editor
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Data Overview</h2>
            </div>
            
            <div className="overview-grid">
              <div className="overview-card">
                <h3><i className="fas fa-users"></i> Players</h3>
                <div className="overview-stats">
                  <p><strong>Total:</strong> {players.length}</p>
                  <p><strong>Active:</strong> {players.filter(p => rounds.some(r => r.playerId === p.id)).length}</p>
                </div>
              </div>
              
              <div className="overview-card">
                <h3><i className="fas fa-flag"></i> Courses</h3>
                <div className="overview-stats">
                  <p><strong>Total:</strong> {courses.length}</p>
                  <p><strong>Played:</strong> {courses.filter(c => rounds.some(r => r.courseId === c.id)).length}</p>
                </div>
              </div>
              
              <div className="overview-card">
                <h3><i className="fas fa-map-marker-alt"></i> Trips</h3>
                <div className="overview-stats">
                  <p><strong>Total:</strong> {trips.length}</p>
                  <p><strong>Years:</strong> {new Set(trips.map(t => new Date(t.startDate).getFullYear())).size}</p>
                </div>
              </div>
              
              <div className="overview-card">
                <h3><i className="fas fa-golf-ball"></i> Rounds</h3>
                <div className="overview-stats">
                  <p><strong>Total:</strong> {rounds.length}</p>
                  <p><strong>Average Score:</strong> {Math.round(rounds.reduce((sum, r) => sum + r.score, 0) / rounds.length)}</p>
                </div>
              </div>
            </div>

            <div className="info-box">
              <h3>📋 How to Update Data</h3>
              <p>This admin panel shows the current static data from <code>src/data/golf-data.ts</code>. To update the data:</p>
              <ol>
                <li>Go to the <strong>Direct Editor</strong> tab to edit the file directly</li>
                <li>Or use the <strong>Export/Import</strong> tab to download, edit, and re-upload</li>
                <li>Make your changes to the data</li>
                <li>Save the changes (they will be applied immediately)</li>
                <li>Redeploy your application to see the changes live</li>
              </ol>
              <p><strong>Note:</strong> Changes are saved to the file immediately but require a redeployment to take effect in production.</p>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Players</h2>
              <button 
                onClick={() => setShowAddForm('player')}
                className="btn btn-primary"
              >
                <i className="fas fa-plus"></i> Add Player
              </button>
            </div>
            <div className="admin-grid">
              {players.map(player => {
                const playerStats = calculatePlayerStats(player, rounds, trips)
                return (
                  <div key={player.id} className="admin-card">
                    <div className="card-header">
                      <h3>{player.name}</h3>
                      <div className="card-actions">
                        <button 
                          onClick={() => setEditingPlayer(player.id)}
                          className="btn btn-edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => deletePlayer(player.id)}
                          className="btn btn-danger"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="card-content">
                      <p><strong>Years:</strong> {playerStats.yearsPlayed}</p>
                      <p><strong>Average:</strong> {playerStats.averageScore}</p>
                      <p><strong>Total Rounds:</strong> {rounds.filter(r => r.playerId === player.id).length}</p>
                      <p><strong>Best Score:</strong> {playerStats.bestScore || 'N/A'}</p>
                    </div>
                  </div>
                )
              })}
              {players.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-users"></i>
                  <h3>No Players</h3>
                  <p>No players found in static data.</p>
                </div>
              )}
            </div>

            {/* Add Player Form */}
            {showAddForm === 'player' && (
              <PlayerEditForm
                onSave={addPlayer}
                onCancel={() => setShowAddForm(null)}
                isEditing={false}
              />
            )}

            {/* Edit Player Form */}
            {editingPlayer && (
              <PlayerEditForm
                player={players.find(p => p.id === editingPlayer)}
                onSave={(playerData) => {
                  updatePlayer(editingPlayer, playerData)
                }}
                onCancel={() => setEditingPlayer(null)}
                isEditing={true}
              />
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Courses</h2>
              <button 
                onClick={() => setShowAddForm('course')}
                className="btn btn-primary"
              >
                <i className="fas fa-plus"></i> Add Course
              </button>
            </div>
            <div className="admin-grid">
              {courses.map(course => {
                const courseRounds = rounds.filter(round => round.courseId === course.id)
                const uniqueTrips = new Set(courseRounds.map(round => round.tripId))
                return (
                  <div key={course.id} className="admin-card">
                    <div className="card-header">
                      <h3>{course.name}</h3>
                      <div className="card-actions">
                        <button 
                          onClick={() => setEditingCourse(course.id)}
                          className="btn btn-edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => deleteCourse(course.id)}
                          className="btn btn-danger"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="card-content">
                      <p><strong>Location:</strong> {course.location}</p>
                      <p><strong>Par:</strong> {course.par}</p>
                      <p><strong>Times Played:</strong> {uniqueTrips.size}</p>
                      <p><strong>Total Rounds:</strong> {courseRounds.length}</p>
                    </div>
                  </div>
                )
              })}
              {courses.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-flag"></i>
                  <h3>No Courses</h3>
                  <p>No courses found in static data.</p>
                </div>
              )}
            </div>

            {/* Add Course Form */}
            {showAddForm === 'course' && (
              <CourseEditForm
                onSave={addCourse}
                onCancel={() => setShowAddForm(null)}
                isEditing={false}
              />
            )}

            {/* Edit Course Form */}
            {editingCourse && (
              <CourseEditForm
                course={courses.find(c => c.id === editingCourse)}
                onSave={(courseData) => {
                  updateCourse(editingCourse, courseData)
                }}
                onCancel={() => setEditingCourse(null)}
                isEditing={true}
              />
            )}
          </div>
        )}

        {/* Trips Tab */}
        {activeTab === 'trips' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Trips</h2>
              <button 
                onClick={() => setShowAddForm('trip')}
                className="btn btn-primary"
              >
                <i className="fas fa-plus"></i> Add Trip
              </button>
            </div>
            <div className="admin-grid">
              {trips.map(trip => {
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
                  <div key={trip.id} className="admin-card">
                    <div className="card-header">
                      <h3>{tripName}</h3>
                      <div className="card-actions">
                        <button 
                          onClick={() => setEditingTrip(trip.id)}
                          className="btn btn-edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => deleteTrip(trip.id)}
                          className="btn btn-danger"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="card-content">
                      <p><strong>Year:</strong> {tripYear}</p>
                      <p><strong>Dates:</strong> {trip.startDate} to {trip.endDate}</p>
                      <p><strong>Location:</strong> {trip.location}</p>
                      <p><strong>Rounds:</strong> {tripRounds.length}</p>
                      <p><strong>Players:</strong> {totalTripPlayers}</p>
                      <p><strong>Courses:</strong> {tripCourses.size}</p>
                      {trip.championPlayerId && (
                        <p><strong>Champion:</strong> {players.find(p => p.id === trip.championPlayerId)?.name || 'Unknown'}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {trips.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-map-marker-alt"></i>
                  <h3>No Trips</h3>
                  <p>No trips found in static data.</p>
                </div>
              )}
            </div>

            {/* Add Trip Form */}
            {showAddForm === 'trip' && (
              <TripEditForm
                players={players}
                onSave={addTrip}
                onCancel={() => setShowAddForm(null)}
                isEditing={false}
              />
            )}

            {/* Edit Trip Form */}
            {editingTrip && (
              <TripEditForm
                trip={trips.find(t => t.id === editingTrip)}
                players={players}
                onSave={(tripData: Omit<Trip, 'id'>) => {
                  updateTrip(editingTrip, tripData)
                }}
                onCancel={() => setEditingTrip(null)}
                isEditing={true}
              />
            )}
          </div>
        )}

        {/* Rounds Tab */}
        {activeTab === 'rounds' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Rounds</h2>
              <button 
                onClick={() => setShowAddForm('round')}
                className="btn btn-primary"
              >
                <i className="fas fa-plus"></i> Add Round
              </button>
            </div>
            <div className="admin-grid">
              {rounds.map(round => {
                const player = players.find(p => p.id === round.playerId)
                const trip = trips.find(t => t.id === round.tripId)
                const course = courses.find(c => c.id === round.courseId)
                
                return (
                  <div key={round.id} className="admin-card">
                    <div className="card-header">
                      <h3>{player?.name} - {course?.name}</h3>
                      <div className="card-actions">
                        <button 
                          onClick={() => setEditingRound(round.id)}
                          className="btn btn-edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => deleteRound(round.id)}
                          className="btn btn-danger"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="card-content">
                      <p><strong>Score:</strong> {round.score}</p>
                      <p><strong>Date:</strong> {round.date}</p>
                      <p><strong>Trip:</strong> {trip ? `${new Date(trip.startDate).getFullYear()} ${trip.location}` : 'Unknown'}</p>
                      <p><strong>Course:</strong> {course?.name || 'Unknown'}</p>
                      {round.notes && (
                        <p><strong>Notes:</strong> {round.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {rounds.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-golf-ball"></i>
                  <h3>No Rounds</h3>
                  <p>No rounds found in static data.</p>
                </div>
              )}
            </div>

            {/* Add Round Form */}
            {showAddForm === 'round' && (
              <RoundEditForm
                players={players}
                courses={courses}
                trips={trips}
                onSave={addRound}
                onCancel={() => setShowAddForm(null)}
                isEditing={false}
              />
            )}

            {/* Edit Round Form */}
            {editingRound && (
              <RoundEditForm
                round={rounds.find(r => r.id === editingRound)}
                players={players}
                courses={courses}
                trips={trips}
                onSave={(roundData) => {
                  updateRound(editingRound, roundData)
                }}
                onCancel={() => setEditingRound(null)}
                isEditing={true}
              />
            )}
          </div>
        )}

        {/* Export/Import Tab */}
        {activeTab === 'export' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Export & Import Data</h2>
            </div>
            
            <div className="export-section">
              <h3>Export Current Data</h3>
              <p>Export the current static data for backup or modification.</p>
              
              <div className="export-buttons">
                <button 
                  onClick={exportStaticData}
                  className="btn btn-primary"
                >
                  <i className="fas fa-download"></i> Export as JSON
                </button>
                <button 
                  onClick={exportTypeScriptFile}
                  className="btn btn-success"
                >
                  <i className="fas fa-file-code"></i> Export as TypeScript File
                </button>
              </div>
              
              <div className="info-box">
                <h4>📋 Instructions</h4>
                <ol>
                  <li><strong>JSON Export:</strong> Download as JSON for backup or data analysis</li>
                  <li><strong>TypeScript Export:</strong> Download as TypeScript file to replace <code>src/data/golf-data.ts</code></li>
                  <li>Make your changes to the exported file</li>
                  <li>Replace the content of <code>src/data/golf-data.ts</code> with your updated data</li>
                  <li>Redeploy your application to see the changes</li>
                </ol>
              </div>
            </div>

            <div className="import-section">
              <h3>Import Data (Coming Soon)</h3>
              <p>Import CSV data to update the static data file.</p>
              
              <div className="info-box">
                <h4>📋 CSV Import</h4>
                <p>This feature will allow you to import CSV data and automatically generate the TypeScript file for <code>src/data/golf-data.ts</code>.</p>
                <p><strong>Supported formats:</strong></p>
                <ul>
                  <li>Trip Scores (recommended) - Import scores with player names, courses, and dates</li>
                  <li>Players - Simple list of player names</li>
                  <li>Courses - Course information with location and par</li>
                  <li>Trips - Trip details with dates and locations</li>
                  <li>Rounds - Individual round data</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Direct Editor Tab */}
        {activeTab === 'editor' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Direct File Editor</h2>
              <div className="section-actions">
                <button 
                  onClick={loadEditorContent}
                  className="btn btn-secondary"
                >
                  <i className="fas fa-sync"></i> Reload
                </button>
                <button 
                  onClick={() => setShowEditor(!showEditor)}
                  className="btn btn-primary"
                >
                  <i className="fas fa-edit"></i> {showEditor ? 'Hide' : 'Show'} Editor
                </button>
              </div>
            </div>

            <div className="info-box">
              <h3>📋 Direct File Editing</h3>
              <p>Edit the <code>src/data/golf-data.ts</code> file directly in your browser. Changes are validated and saved immediately.</p>
              <ul>
                <li><strong>Syntax Validation:</strong> Your changes are validated before saving</li>
                <li><strong>Auto-formatting:</strong> Data is automatically formatted for consistency</li>
                <li><strong>Immediate Save:</strong> Changes are saved directly to the file</li>
                <li><strong>Error Handling:</strong> Invalid changes are caught and reported</li>
              </ul>
            </div>

            {showEditor && (
              <div className="editor-section">
                <div className="editor-header">
                  <h3>Editing golf-data.ts</h3>
                  <div className="editor-actions">
                    <button 
                      onClick={loadEditorContent}
                      className="btn btn-small btn-secondary"
                      disabled={isEditing}
                    >
                      <i className="fas fa-undo"></i> Reset
                    </button>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="btn btn-small btn-primary"
                    >
                      <i className="fas fa-edit"></i> {isEditing ? 'Cancel Edit' : 'Edit'}
                    </button>
                    {isEditing && (
                      <button 
                        onClick={saveEditorContent}
                        className="btn btn-small btn-success"
                      >
                        <i className="fas fa-save"></i> Save
                      </button>
                    )}
                  </div>
                </div>

                {editorError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    {editorError}
                  </div>
                )}

                <div className="editor-container">
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    disabled={!isEditing}
                    className="code-editor"
                    placeholder="Loading file content..."
                    spellCheck={false}
                  />
                </div>

                <div className="editor-info">
                  <p><strong>File:</strong> <code>src/data/golf-data.ts</code></p>
                  <p><strong>Status:</strong> {isEditing ? 'Editing' : 'Read-only'}</p>
                  <p><strong>Validation:</strong> {editorError ? 'Errors found' : 'Valid'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

