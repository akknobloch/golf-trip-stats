'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Player, Course, Trip, Round } from '@/lib/types'
import { calculatePlayerStats } from '@/lib/utils'
import { combineSlagelRecords, findPotentialDuplicates, mergePlayerRecords } from '@/lib/data-migration'
import { copyDataToClipboard, downloadDataFile } from '@/lib/export-data'
import { requireAuth, logout } from '@/lib/auth'
import Link from 'next/link'
import Toast from '@/components/Toast'

export default function Admin() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [activeTab, setActiveTab] = useState<'players' | 'courses' | 'trips' | 'rounds' | 'data'>('players')
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
  const [importType, setImportType] = useState<'players' | 'courses' | 'trips' | 'rounds' | 'trip-scores'>('players')
  const [csvData, setCsvData] = useState('')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const [showImportSection, setShowImportSection] = useState(false)

  // Recovery tool state
  const [backupData, setBackupData] = useState('')
  const [showRecoverySection, setShowRecoverySection] = useState(false)

  useEffect(() => {
    // Check authentication in production
    if (!requireAuth()) {
      router.push('/admin/login')
      return
    }

    // Load data from localStorage
    const loadData = () => {
      try {
        const savedPlayers = localStorage.getItem('golfPlayers')
        const savedCourses = localStorage.getItem('golfCourses')
        const savedTrips = localStorage.getItem('golfTrips')
        const savedRounds = localStorage.getItem('golfRounds')
        
        if (savedPlayers) {
          setPlayers(JSON.parse(savedPlayers))
        }
        if (savedCourses) {
          setCourses(JSON.parse(savedCourses))
        }
        if (savedTrips) {
          setTrips(JSON.parse(savedTrips))
        }
        if (savedRounds) {
          setRounds(JSON.parse(savedRounds))
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [router])

  useEffect(() => {
    // Handle tab parameter from URL
    const tabParam = searchParams.get('tab')
    if (tabParam && ['players', 'courses', 'trips', 'rounds', 'data'].includes(tabParam)) {
      setActiveTab(tabParam as 'players' | 'courses' | 'trips' | 'rounds' | 'data')
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

  const saveData = (type: 'players' | 'courses' | 'trips' | 'rounds', data: any[]) => {
    try {
      localStorage.setItem(`golf${type.charAt(0).toUpperCase() + type.slice(1)}`, JSON.stringify(data))
    } catch (error) {
      console.error(`Error saving ${type}:`, error)
    }
  }

  const deletePlayer = (id: string) => {
    const updatedPlayers = players.filter(player => player.id !== id)
    setPlayers(updatedPlayers)
    saveData('players', updatedPlayers)
  }

  const deleteCourse = (id: string) => {
    const updatedCourses = courses.filter(course => course.id !== id)
    setCourses(updatedCourses)
    saveData('courses', updatedCourses)
  }

  const deleteTrip = (id: string) => {
    const updatedTrips = trips.filter(trip => trip.id !== id)
    setTrips(updatedTrips)
    saveData('trips', updatedTrips)
  }

  const deleteRound = (id: string) => {
    const updatedRounds = rounds.filter(round => round.id !== id)
    setRounds(updatedRounds)
    saveData('rounds', updatedRounds)
  }

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  // Import functionality
  const handleImport = () => {
    try {
      if (importType === 'players') {
        // Simple CSV import for players
        const lines = csvData.trim().split('\n')
        const players: Player[] = []
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line) {
            const playerName = line.replace(/"/g, '')
            if (playerName && playerName !== 'Player Name') {
              players.push({
                id: Date.now().toString() + i,
                name: playerName,
                yearsPlayed: 0,
                averageScore: 0,
                totalTrips: 0
              })
            }
          }
        }
        
        const existingPlayers = JSON.parse(localStorage.getItem('golfPlayers') || '[]')
        const updatedPlayers = [...existingPlayers, ...players]
        localStorage.setItem('golfPlayers', JSON.stringify(updatedPlayers))
        setPlayers(updatedPlayers)
        setImportMessage(`Successfully imported ${players.length} players`)
      } else if (importType === 'courses') {
        // Simple CSV import for courses
        const lines = csvData.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        const courses: Course[] = []
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          if (values.length >= 3) {
            courses.push({
              id: Date.now().toString() + i,
              name: values[0],
              location: values[1],
              par: parseInt(values[2]) || 72,
              timesPlayed: 0
            })
          }
        }
        
        const existingCourses = JSON.parse(localStorage.getItem('golfCourses') || '[]')
        const updatedCourses = [...existingCourses, ...courses]
        localStorage.setItem('golfCourses', JSON.stringify(updatedCourses))
        setCourses(updatedCourses)
        setImportMessage(`Successfully imported ${courses.length} courses`)
      } else if (importType === 'trips') {
        // Simple CSV import for trips
        const lines = csvData.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        const trips: Trip[] = []
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          if (values.length >= 3) {
            trips.push({
              id: Date.now().toString() + i,
              startDate: values[0],
              endDate: values[1],
              location: values[2],
              description: values[3] || undefined,
              weather: values[4] || undefined,
              notes: values[5] || undefined,
              championPlayerId: values[6] || undefined
            })
          }
        }
        
        const existingTrips = JSON.parse(localStorage.getItem('golfTrips') || '[]')
        const updatedTrips = [...existingTrips, ...trips]
        localStorage.setItem('golfTrips', JSON.stringify(updatedTrips))
        setTrips(updatedTrips)
        setImportMessage(`Successfully imported ${trips.length} trips`)
      } else if (importType === 'rounds') {
        // Simple CSV import for rounds
        const lines = csvData.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        const rounds: Round[] = []
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          if (values.length >= 6) {
            rounds.push({
              id: Date.now().toString() + i,
              playerId: values[0],
              tripId: values[1],
              courseId: values[2],
              score: parseInt(values[3]) || 0,
              date: values[4],
              year: parseInt(values[5]) || new Date().getFullYear(),
              notes: values[6] || undefined
            })
          }
        }
        
        const existingRounds = JSON.parse(localStorage.getItem('golfRounds') || '[]')
        const updatedRounds = [...existingRounds, ...rounds]
        localStorage.setItem('golfRounds', JSON.stringify(updatedRounds))
        setRounds(updatedRounds)
        setImportMessage(`Successfully imported ${rounds.length} rounds`)
      } else if (importType === 'trip-scores') {
        // Import trip scores with the new format: Trip Year, Golfer Name, Round 1 Score, Round 2 Score, Round 3 Score
        // Optional: Round 1 Course, Round 2 Course, Round 3 Course
        const lines = csvData.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        // Check if this is the basic format, extended format with courses, or extended format with dates
        const basicHeaders = ['Trip Year', 'Golfer Name', 'Round 1 Score', 'Round 2 Score', 'Round 3 Score']
        const extendedHeaders = ['Trip Year', 'Golfer Name', 'Round 1 Score', 'Round 1 Course', 'Round 2 Score', 'Round 2 Course', 'Round 3 Score', 'Round 3 Course']
        const extendedWithDatesHeaders = ['Trip Year', 'Golfer Name', 'Round 1 Score', 'Round 1 Course', 'Round 1 Date', 'Round 2 Score', 'Round 2 Course', 'Round 2 Date', 'Round 3 Score', 'Round 3 Course', 'Round 3 Date']
        
        const isBasicFormat = basicHeaders.every(header => headers.includes(header))
        const isExtendedFormat = extendedHeaders.every(header => headers.includes(header))
        const isExtendedWithDatesFormat = extendedWithDatesHeaders.every(header => headers.includes(header))
        
        if (!isBasicFormat && !isExtendedFormat && !isExtendedWithDatesFormat) {
          throw new Error('Invalid CSV format. Expected headers: Trip Year, Golfer Name, Round 1 Score, Round 2 Score, Round 3 Score (or with course names: Round 1 Course, Round 2 Course, Round 3 Course, or with dates: Round 1 Date, Round 2 Date, Round 3 Date)')
        }
        
        const hasCourses = isExtendedFormat || isExtendedWithDatesFormat
        const hasDates = isExtendedWithDatesFormat
        
        console.log('CSV Format Detection:', {
          headers,
          isBasicFormat,
          isExtendedFormat,
          isExtendedWithDatesFormat,
          hasCourses,
          hasDates
        })
        
        const players: Player[] = []
        const trips: Trip[] = []
        const courses: Course[] = []
        const rounds: Round[] = []
        const existingPlayers = JSON.parse(localStorage.getItem('golfPlayers') || '[]')
        const existingTrips = JSON.parse(localStorage.getItem('golfTrips') || '[]')
        const existingCourses = JSON.parse(localStorage.getItem('golfCourses') || '[]')
        const existingRounds = JSON.parse(localStorage.getItem('golfRounds') || '[]')
        
        // Track unique players, trips, and courses to avoid duplicates
        const playerMap = new Map<string, string>() // name -> id
        const tripMap = new Map<number, string>() // year -> id
        const courseMap = new Map<string, string>() // name -> id
        
        // Initialize player map with existing players
        existingPlayers.forEach((player: Player) => {
          playerMap.set(player.name, player.id)
        })
        
        // Initialize trip map with existing trips
        existingTrips.forEach((trip: Trip) => {
          const tripYear = new Date(trip.startDate).getFullYear()
          tripMap.set(tripYear, trip.id)
        })
        
        // Initialize course map with existing courses
        existingCourses.forEach((course: Course) => {
          courseMap.set(course.name, course.id)
        })
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          console.log(`Processing line ${i}:`, values)
          
          if (values.length >= 5) {
            const tripYear = parseInt(values[0])
            const golferName = values[1].replace(/"/g, '')
            
            if (isNaN(tripYear) || !golferName) continue
            
            // Parse scores, courses, and dates based on format
            let round1Score, round2Score, round3Score
            let round1Course, round2Course, round3Course
            let round1Date, round2Date, round3Date
            
            if (hasDates) {
              // Extended format with courses and dates
              round1Score = parseInt(values[2])
              round1Course = values[3].replace(/"/g, '')
              round1Date = values[4].replace(/"/g, '')
              round2Score = parseInt(values[5])
              round2Course = values[6].replace(/"/g, '')
              round2Date = values[7].replace(/"/g, '')
              round3Score = parseInt(values[8])
              round3Course = values[9].replace(/"/g, '')
              round3Date = values[10].replace(/"/g, '')
            } else if (hasCourses) {
              // Extended format with courses only
              round1Score = parseInt(values[2])
              round1Course = values[3].replace(/"/g, '')
              round2Score = parseInt(values[4])
              round2Course = values[5].replace(/"/g, '')
              round3Score = parseInt(values[6])
              round3Course = values[7].replace(/"/g, '')
              // Generate default dates with proper formatting
              round1Date = `${tripYear}-06-01`
              round2Date = `${tripYear}-06-02`
              round3Date = `${tripYear}-06-03`
            } else {
              // Basic format without courses
              round1Score = parseInt(values[2])
              round2Score = parseInt(values[3])
              round3Score = parseInt(values[4])
              round1Course = `Course ${tripYear}-1`
              round2Course = `Course ${tripYear}-2`
              round3Course = `Course ${tripYear}-3`
              // Generate default dates with proper formatting
              round1Date = `${tripYear}-06-01`
              round2Date = `${tripYear}-06-02`
              round3Date = `${tripYear}-06-03`
            }
            
            // Create or get player
            let playerId = playerMap.get(golferName)
            if (!playerId) {
              playerId = Date.now().toString() + i + 'p'
              playerMap.set(golferName, playerId)
              players.push({
                id: playerId,
                name: golferName,
                yearsPlayed: 0,
                averageScore: 0,
                totalTrips: 0
              })
            }
            
            // Create or get trip
            let tripId = tripMap.get(tripYear)
            if (!tripId) {
              tripId = Date.now().toString() + i + 't'
              tripMap.set(tripYear, tripId)
              trips.push({
                id: tripId,
                startDate: `${tripYear}-06-01`,
                endDate: `${tripYear}-06-03`,
                location: `Trip ${tripYear}`,
                description: `Imported trip from ${tripYear}`
              })
            }
            
            // Create or get courses for each round
            const courseNames = [round1Course, round2Course, round3Course]
            const courseIds: string[] = []
            
            courseNames.forEach((courseName, courseIndex) => {
              let courseId = courseMap.get(courseName)
              if (!courseId) {
                courseId = Date.now().toString() + i + 'c' + courseIndex
                courseMap.set(courseName, courseId)
                courses.push({
                  id: courseId,
                  name: courseName,
                  location: hasCourses ? 'Imported Location' : `Trip ${tripYear} Location`,
                  par: 72, // Default par
                  timesPlayed: 0
                })
              }
              courseIds.push(courseId)
            })
            
            // Create rounds for each valid score
            const scores = [round1Score, round2Score, round3Score]
            const dates = [round1Date, round2Date, round3Date]
            scores.forEach((score, roundIndex) => {
              if (!isNaN(score) && score > 0) {
                // Validate and format the date
                let roundDate = dates[roundIndex]
                if (roundDate && roundDate.trim()) {
                  // Ensure the date is in YYYY-MM-DD format
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(roundDate)) {
                    // If the date format is invalid, use the default
                    roundDate = `${tripYear}-06-${String(roundIndex + 1).padStart(2, '0')}`
                    console.log(`Invalid date format for round ${roundIndex + 1}, using default: ${roundDate}`)
                  }
                } else {
                  // If no date provided, use the default
                  roundDate = `${tripYear}-06-${String(roundIndex + 1).padStart(2, '0')}`
                  console.log(`No date provided for round ${roundIndex + 1}, using default: ${roundDate}`)
                }
                
                console.log(`Processing round ${roundIndex + 1}: score=${score}, date=${roundDate}, course=${courseIds[roundIndex]}`)
                
                rounds.push({
                  id: Date.now().toString() + i + roundIndex,
                  playerId,
                  tripId,
                  courseId: courseIds[roundIndex],
                  score,
                  date: roundDate,
                  year: tripYear,
                  notes: `Round ${roundIndex + 1}`
                })
              }
            })
          }
        }
        
        // Save all data
        if (players.length > 0) {
          const updatedPlayers = [...existingPlayers, ...players]
          localStorage.setItem('golfPlayers', JSON.stringify(updatedPlayers))
          setPlayers(updatedPlayers)
        }
        
        if (trips.length > 0) {
          const updatedTrips = [...existingTrips, ...trips]
          localStorage.setItem('golfTrips', JSON.stringify(updatedTrips))
          setTrips(updatedTrips)
        }
        
        if (courses.length > 0) {
          const updatedCourses = [...existingCourses, ...courses]
          localStorage.setItem('golfCourses', JSON.stringify(updatedCourses))
          setCourses(updatedCourses)
        }
        
        if (rounds.length > 0) {
          const updatedRounds = [...existingRounds, ...rounds]
          localStorage.setItem('golfRounds', JSON.stringify(updatedRounds))
          setRounds(updatedRounds)
        }
        
        setImportMessage(`Successfully imported ${players.length} new players, ${trips.length} new trips, ${courses.length} new courses, and ${rounds.length} rounds`)
      }
      
      setImportStatus('success')
      setCsvData('')
    } catch (error: unknown) {
      setImportStatus('error')
      setImportMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Helper function to parse CSV line with quoted values
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    values.push(current.trim())
    return values
  }

  const getTemplate = () => {
    switch (importType) {
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
St. Andrews Old Course,St. Andrews Scotland,72
Whistling Straits,Kohler WI,72`
      case 'trips':
        return `Start Date,End Date,Location,Description,Weather,Notes
2024-06-15,2024-06-18,Myrtle Beach SC,Annual golf trip,Sunny 75F,Great weather
2023-07-20,2023-07-23,Pebble Beach CA,West coast trip,Overcast 65F,Beautiful views
2022-08-10,2022-08-13,Scottsdale AZ,Desert golf,Hot 95F,Early morning rounds`
      case 'rounds':
        return `Player ID,Trip ID,Course ID,Score,Date,Year,Notes
player1,trip1,course1,85,2024-06-15,2024,Great round
player2,trip1,course1,78,2024-06-15,2024,Personal best
player1,trip1,course2,82,2024-06-16,2024,Windy conditions`
      case 'trip-scores':
        return `Trip Year,Golfer Name,Round 1 Score,Round 1 Course,Round 1 Date,Round 2 Score,Round 2 Course,Round 2 Date,Round 3 Score,Round 3 Course,Round 3 Date
2024,John Smith,85,Pebble Beach,2024-06-15,82,Spyglass Hill,2024-06-16,79,Spanish Bay,2024-06-17
2024,Jane Doe,78,Pebble Beach,2024-06-15,75,Spyglass Hill,2024-06-16,77,Spanish Bay,2024-06-17
2024,Mike Johnson,88,Pebble Beach,2024-06-15,85,Spyglass Hill,2024-06-16,83,Spanish Bay,2024-06-17
2023,John Smith,87,Augusta National,2023-04-08,84,Augusta National,2023-04-09,81,Augusta National,2023-04-10
2023,Jane Doe,79,Augusta National,2023-04-08,76,Augusta National,2023-04-09,78,Augusta National,2023-04-10
2023,Sarah Wilson,90,Augusta National,2023-04-08,88,Augusta National,2023-04-09,85,Augusta National,2023-04-10`
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

  // Recovery tool functionality
  const restoreFromBackup = () => {
    try {
      if (!backupData.trim()) {
        setToast({
          message: 'Please paste backup data first!',
          type: 'error',
          isVisible: true
        })
        return
      }

      const backupDataParsed = JSON.parse(backupData)
      
      if (backupDataParsed.players) {
        localStorage.setItem('golfPlayers', JSON.stringify(backupDataParsed.players))
        setPlayers(backupDataParsed.players)
      }
      if (backupDataParsed.courses) {
        localStorage.setItem('golfCourses', JSON.stringify(backupDataParsed.courses))
        setCourses(backupDataParsed.courses)
      }
      if (backupDataParsed.trips) {
        localStorage.setItem('golfTrips', JSON.stringify(backupDataParsed.trips))
        setTrips(backupDataParsed.trips)
      }
      if (backupDataParsed.rounds) {
        localStorage.setItem('golfRounds', JSON.stringify(backupDataParsed.rounds))
        setRounds(backupDataParsed.rounds)
      }
      
      setToast({
        message: 'Data restored successfully!',
        type: 'success',
        isVisible: true
      })
      setBackupData('')
    } catch (error: unknown) {
      setToast({
        message: `Error parsing backup data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        isVisible: true
      })
    }
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      localStorage.removeItem('golfPlayers')
      localStorage.removeItem('golfCourses')
      localStorage.removeItem('golfTrips')
      localStorage.removeItem('golfRounds')
      setPlayers([])
      setCourses([])
      setTrips([])
      setRounds([])
      setToast({
        message: 'All data cleared!',
        type: 'success',
        isVisible: true
      })
    }
  }

  const exportBackup = () => {
    try {
      const backupData = {
        players,
        courses,
        trips,
        rounds,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `golf-trip-manager-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setToast({
        message: 'Backup exported successfully!',
        type: 'success',
        isVisible: true
      })
    } catch (error: unknown) {
      console.error('Error exporting backup:', error)
      setToast({
        message: 'Error exporting backup: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error',
        isVisible: true
      })
    }
  }

  const exportTripScores = () => {
    try {
      // Group rounds by trip year and player
      const tripScoresMap = new Map<string, Map<string, Round[]>>()
      
      let skippedRounds = 0
      let skippedNoTrip = 0
      let skippedNoPlayer = 0
      
      rounds.forEach(round => {
        const trip = trips.find(t => t.id === round.tripId)
        if (!trip) {
          skippedNoTrip++
          return
        }
        
        const tripYear = new Date(trip.startDate).getFullYear().toString()
        const player = players.find(p => p.id === round.playerId)
        if (!player) {
          skippedNoPlayer++
          return
        }
        
        if (!tripScoresMap.has(tripYear)) {
          tripScoresMap.set(tripYear, new Map())
        }
        
        const yearMap = tripScoresMap.get(tripYear)!
        if (!yearMap.has(player.name)) {
          yearMap.set(player.name, [])
        }
        
        yearMap.get(player.name)!.push(round)
      })
      
      if (skippedNoTrip > 0 || skippedNoPlayer > 0) {
        console.log(`Export Debug: Skipped ${skippedNoTrip} rounds with no trip, ${skippedNoPlayer} rounds with no player`)
      }
      
      // Convert to CSV format
      const csvRows: string[] = []
      
      // Add header - use extended format with courses and dates
      csvRows.push('Trip Year,Golfer Name,Round 1 Score,Round 1 Course,Round 1 Date,Round 2 Score,Round 2 Course,Round 2 Date,Round 3 Score,Round 3 Course,Round 3 Date')
      
      // Sort by trip year (descending) and then by player name
      const sortedYears = Array.from(tripScoresMap.keys()).sort((a, b) => parseInt(b) - parseInt(a))
      
      sortedYears.forEach(tripYear => {
        const yearMap = tripScoresMap.get(tripYear)!
        const sortedPlayers = Array.from(yearMap.keys()).sort()
        
        sortedPlayers.forEach(playerName => {
          const playerRounds = yearMap.get(playerName)!
          
          // Sort rounds by date
          playerRounds.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          
          // Create multiple rows if player has more than 3 rounds
          for (let roundGroup = 0; roundGroup < Math.ceil(playerRounds.length / 3); roundGroup++) {
            const row: string[] = [tripYear, playerName]
            
            for (let i = 0; i < 3; i++) {
              const roundIndex = roundGroup * 3 + i
              const round = playerRounds[roundIndex]
              if (round) {
                const course = courses.find(c => c.id === round.courseId)
                row.push(
                  round.score.toString(),
                  course?.name || 'Unknown Course',
                  round.date
                )
              } else {
                row.push('', '', '') // Empty values for missing rounds
              }
            }
            
            csvRows.push(row.join(','))
          }
        })
      })
      
      const csvContent = csvRows.join('\n')
      
      // Calculate total rounds exported for verification
      let totalRoundsExported = 0
      tripScoresMap.forEach(yearMap => {
        yearMap.forEach(playerRounds => {
          totalRoundsExported += playerRounds.length
        })
      })
      
      console.log(`Export Summary: ${totalRoundsExported} rounds exported from ${rounds.length} total rounds`)
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `golf-trip-scores-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setToast({
        message: `Trip Scores exported successfully! (${totalRoundsExported} rounds)`,
        type: 'success',
        isVisible: true
      })
    } catch (error: unknown) {
      console.error('Error exporting trip scores:', error)
      setToast({
        message: 'Error exporting trip scores: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error',
        isVisible: true
      })
    }
  }

  const handleSlagelMerge = () => {
    const result = combineSlagelRecords()
    if (result.success) {
      setToast({
        message: result.message,
        type: 'success',
        isVisible: true
      })
      // Reload data
      const loadData = () => {
        try {
          const savedPlayers = localStorage.getItem('golfPlayers')
          const savedRounds = localStorage.getItem('golfRounds')
          const savedTrips = localStorage.getItem('golfTrips')
          
          if (savedPlayers) {
            setPlayers(JSON.parse(savedPlayers))
          }
          if (savedRounds) {
            setRounds(JSON.parse(savedRounds))
          }
          if (savedTrips) {
            setTrips(JSON.parse(savedTrips))
          }
        } catch (error) {
          console.error('Error reloading data:', error)
        }
      }
      loadData()
    } else {
      setToast({
        message: result.message,
        type: 'error',
        isVisible: true
      })
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
          <p>Manage players, courses, and trips</p>
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
            className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <i className="fas fa-database"></i> Data Management
          </button>
        </div>

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Players</h2>
              <Link href="/admin/players/add" className="btn btn-primary">
                <i className="fas fa-plus"></i> Add Player
              </Link>
            </div>
            <div className="admin-grid">
              {players.map(player => (
                <div key={player.id} className="admin-card">
                  <div className="card-header">
                    <h3>{player.name}</h3>
                    <div className="card-actions">
                      <Link href={`/admin/players/${player.id}`} className="btn btn-small">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button 
                        onClick={() => deletePlayer(player.id)}
                        className="btn btn-small btn-danger"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="card-content">
                    <p><strong>Years:</strong> {calculatePlayerStats(player, rounds).yearsPlayed}</p>
                    <p><strong>Average:</strong> {calculatePlayerStats(player, rounds).averageScore}</p>
                    <p><strong>Total Rounds:</strong> {rounds.filter(r => r.playerId === player.id).length}</p>
                    <p><strong>Best Score:</strong> {calculatePlayerStats(player, rounds).bestScore || 'N/A'}</p>
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-users"></i>
                  <h3>No Players</h3>
                  <p>Add your first player to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Courses</h2>
              <Link href="/admin/courses/add" className="btn btn-primary">
                <i className="fas fa-plus"></i> Add Course
              </Link>
            </div>
            <div className="admin-grid">
              {courses.map(course => (
                <div key={course.id} className="admin-card">
                  <div className="card-header">
                    <h3>{course.name}</h3>
                    <div className="card-actions">
                      <Link href={`/admin/courses/${course.id}`} className="btn btn-small">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button 
                        onClick={() => deleteCourse(course.id)}
                        className="btn btn-small btn-danger"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="card-content">
                    <p><strong>Location:</strong> {course.location}</p>
                    <p><strong>Par:</strong> {course.par}</p>
                    <p><strong>Times Played:</strong> {new Set(rounds.filter(round => round.courseId === course.id).map(round => round.tripId)).size}</p>
                    {course.lastPlayed && (
                      <p><strong>Last Played:</strong> {course.lastPlayed}</p>
                    )}
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-flag"></i>
                  <h3>No Courses</h3>
                  <p>Add your first course to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trips Tab */}
        {activeTab === 'trips' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Trips</h2>
              <div className="section-actions">
                <Link href="/admin/trips/add" className="btn btn-primary">
                  <i className="fas fa-plus"></i> Add Trip
                </Link>
                <Link href="/admin/rounds/add" className="btn btn-secondary">
                  <i className="fas fa-golf-ball"></i> Add Round
                </Link>
              </div>
            </div>
            <div className="admin-grid">
              {trips.map(trip => {
                const tripRounds = rounds.filter(round => round.tripId === trip.id)
                const tripPlayers = new Set(tripRounds.map(round => round.playerId))
                const tripCourses = new Set(tripRounds.map(round => round.courseId))
                const tripYear = new Date(trip.startDate).getFullYear()
                const tripName = `${tripYear} ${trip.location}`
                
                return (
                  <div key={trip.id} className="admin-card">
                    <div className="card-header">
                      <h3>{tripName}</h3>
                      <div className="card-actions">
                        <Link href={`/admin/trips/${trip.id}`} className="btn btn-small">
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button 
                          onClick={() => deleteTrip(trip.id)}
                          className="btn btn-small btn-danger"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="card-content">
                      <p><strong>Year:</strong> {new Date(trip.startDate).getFullYear()}</p>
                      <p><strong>Dates:</strong> {trip.startDate} to {trip.endDate}</p>
                      <p><strong>Location:</strong> {trip.location}</p>
                      <p><strong>Rounds:</strong> {tripRounds.length}</p>
                      <p><strong>Players:</strong> {tripPlayers.size}</p>
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
                  <p>Add your first trip to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rounds Tab */}
        {activeTab === 'rounds' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Rounds</h2>
              <Link href="/admin/rounds/add" className="btn btn-primary">
                <i className="fas fa-plus"></i> Add Round
              </Link>
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
                        <Link href={`/admin/rounds/${round.id}`} className="btn btn-small">
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button 
                          onClick={() => deleteRound(round.id)}
                          className="btn btn-small btn-danger"
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
                  <p>Add your first round to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Data Management</h2>
            </div>
            
            <div className="data-management-section">
              <h3>Backup & Export</h3>
              <p>Create a backup of all your current data for safekeeping.</p>
              
              <div className="backup-section">
                <h4>Export Options</h4>
                <div className="export-buttons">
                  <button 
                    onClick={exportBackup}
                    className="btn btn-primary"
                  >
                    <i className="fas fa-download"></i> Export All Data as Backup (JSON)
                  </button>
                  <button 
                    onClick={exportTripScores}
                    className="btn btn-secondary"
                  >
                    <i className="fas fa-file-csv"></i> Export Trip Scores (CSV)
                  </button>
                </div>
                <p className="help-text">
                  <strong>Backup (JSON):</strong> Complete data backup for recovery purposes.<br/>
                  <strong>Trip Scores (CSV):</strong> Formatted for easy import/reimport in "Trip Scores" format.
                </p>
              </div>

              <h3>Static Data Export</h3>
              <p>Export your data for public deployment. This creates a static data file that can be embedded in your application.</p>
              
              <div className="static-export-section">
                <h4>Export for Public Deployment</h4>
                <div className="export-buttons">
                  <button 
                    onClick={downloadDataFile}
                    className="btn btn-success"
                  >
                    <i className="fas fa-file-code"></i> Download Static Data File
                  </button>
                  <button 
                    onClick={() => {
                      if (copyDataToClipboard()) {
                        setToast({
                          message: 'Static data copied to clipboard!',
                          type: 'success',
                          isVisible: true
                        })
                      } else {
                        setToast({
                          message: 'Failed to copy to clipboard',
                          type: 'error',
                          isVisible: true
                        })
                      }
                    }}
                    className="btn btn-secondary"
                  >
                    <i className="fas fa-copy"></i> Copy to Clipboard
                  </button>
                </div>
                <p className="help-text">
                  <strong>Static Data File:</strong> Creates a TypeScript file with your data that can be embedded in the application for public deployment.<br/>
                  <strong>Instructions:</strong> Download the file, replace the content in <code>src/data/golf-data.ts</code>, and redeploy your application.
                </p>
              </div>

              <h3>Import Data</h3>
              <p>Import CSV data to add new players, courses, trips, or rounds to your system.</p>
              
              <div className="import-section">
                <button 
                  onClick={() => setShowImportSection(!showImportSection)}
                  className="btn btn-primary"
                >
                  <i className="fas fa-upload"></i> {showImportSection ? 'Hide' : 'Show'} Import Options
                </button>
                
                {showImportSection && (
                  <div className="import-options">
                    <div className="import-type-selector">
                      <label>Import Type:</label>
                      <select 
                        value={importType} 
                        onChange={(e) => setImportType(e.target.value as any)}
                        className="import-select"
                      >
                        <option value="players">Players</option>
                        <option value="courses">Courses</option>
                        <option value="trips">Trips</option>
                        <option value="rounds">Rounds</option>
                        <option value="trip-scores">Trip Scores (Recommended)</option>
                      </select>
                    </div>

                    {importType === 'trip-scores' && (
                      <div className="info-box">
                        <h4>📋 Trip Scores Import</h4>
                        <p>This is the easiest way to import your golf data! You can use either format:</p>
                        
                        <h5>Basic Format (Scores Only):</h5>
                        <ul>
                          <li><strong>Trip Year:</strong> The year of the golf trip</li>
                          <li><strong>Golfer Name:</strong> The player's name</li>
                          <li><strong>Round Scores:</strong> Up to 3 round scores (leave blank if no score)</li>
                        </ul>
                        
                        <h5>Extended Format (Scores + Courses):</h5>
                        <ul>
                          <li><strong>Trip Year:</strong> The year of the golf trip</li>
                          <li><strong>Golfer Name:</strong> The player's name</li>
                          <li><strong>Round Scores & Courses:</strong> Score and course name for each round</li>
                        </ul>
                        
                        <h5>Extended Format with Dates (Scores + Courses + Dates):</h5>
                        <ul>
                          <li><strong>Trip Year:</strong> The year of the golf trip</li>
                          <li><strong>Golfer Name:</strong> The player's name</li>
                          <li><strong>Round Scores, Courses & Dates:</strong> Score, course name, and date for each round (YYYY-MM-DD format)</li>
                        </ul>
                        
                        <p>The system will automatically create players, trips, courses, and rounds for you. If dates are not provided, they will default to June 1-3 of the trip year.</p>
                      </div>
                    )}

                    <div className="template-section">
                      <h4>CSV Template</h4>
                      <p>Use this format for your CSV file:</p>
                      <div className="template-preview">
                        <pre>{getTemplate()}</pre>
                      </div>
                      <button 
                        type="button" 
                        onClick={downloadTemplate}
                        className="btn btn-secondary"
                      >
                        <i className="fas fa-download"></i> Download Template
                      </button>
                    </div>

                    <div className="csv-input-section">
                      <h4>Paste CSV Data</h4>
                      <textarea
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        placeholder="Paste your CSV data here..."
                        rows={10}
                        className="csv-textarea"
                      />
                    </div>

                    <div className="import-actions">
                      <button 
                        type="button" 
                        onClick={handleImport}
                        disabled={!csvData.trim()}
                        className="btn btn-primary"
                      >
                        <i className="fas fa-upload"></i> Import Data
                      </button>
                    </div>

                    {importStatus !== 'idle' && (
                      <div className={`import-status ${importStatus}`}>
                        <p>{importMessage}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <h3>Data Recovery</h3>
              <p>Recover data from backups or manage your current data.</p>
              
              <div className="recovery-section">
                <button 
                  onClick={() => setShowRecoverySection(!showRecoverySection)}
                  className="btn btn-secondary"
                >
                  <i className="fas fa-tools"></i> {showRecoverySection ? 'Hide' : 'Show'} Recovery Options
                </button>
                
                {showRecoverySection && (
                  <div className="recovery-options">
                    <div className="restore-section">
                      <h4>Restore from Backup</h4>
                      <p>If you have a backup of your data, you can restore it here:</p>
                      
                      <div>
                        <label htmlFor="backupData">Paste your backup JSON data:</label><br/>
                        <textarea 
                          id="backupData"
                          value={backupData}
                          onChange={(e) => setBackupData(e.target.value)}
                          rows={10} 
                          cols={80} 
                          placeholder='Paste your backup data here...'
                          className="backup-textarea"
                        />
                      </div>
                      
                      <button 
                        onClick={restoreFromBackup}
                        className="btn btn-success"
                      >
                        <i className="fas fa-undo"></i> Restore Data
                      </button>
                    </div>

                    <div className="clear-section">
                      <h4>Clear All Data</h4>
                      <p>⚠️ <strong>Warning:</strong> This will permanently delete all your data!</p>
                      <button 
                        onClick={clearAllData}
                        className="btn btn-danger"
                      >
                        <i className="fas fa-trash"></i> Clear All Data (Danger!)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <h3>Player Record Merging</h3>
              <p>Combine duplicate player records to consolidate their statistics.</p>
              
              <div className="merge-section">
                <h4>Quick Actions</h4>
                <button 
                  onClick={handleSlagelMerge}
                  className="btn btn-primary"
                >
                  <i className="fas fa-merge"></i> Combine Matt Slagel & Matthew Slagel
                </button>
                <p className="help-text">This will merge Matthew Slagel into Matt Slagel, keeping Matt Slagel as the primary record.</p>
              </div>

              <div className="duplicates-section">
                <h4>Potential Duplicates</h4>
                <p>Players with similar names that might be duplicates:</p>
                {(() => {
                  const duplicates = findPotentialDuplicates()
                  return duplicates.length > 0 ? (
                    <div className="duplicates-list">
                      {duplicates.map((group, index) => (
                        <div key={index} className="duplicate-group">
                          <h5>Group {index + 1}:</h5>
                          <ul>
                            {group.map(player => (
                              <li key={player.id}>
                                {player.name} (ID: {player.id})
                                <br />
                                <small>Rounds: {rounds.filter(r => r.playerId === player.id).length}</small>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-duplicates">No potential duplicates found.</p>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

