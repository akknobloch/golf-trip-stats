'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Player, Course, Trip, Round } from '@/lib/types'
import Link from 'next/link'

export default function ImportData() {
  const router = useRouter()
  const [importType, setImportType] = useState<'players' | 'courses' | 'trips' | 'rounds' | 'trip-scores'>('players')
  const [csvData, setCsvData] = useState('')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')

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
        }
        
        if (trips.length > 0) {
          const updatedTrips = [...existingTrips, ...trips]
          localStorage.setItem('golfTrips', JSON.stringify(updatedTrips))
        }
        
        if (courses.length > 0) {
          const updatedCourses = [...existingCourses, ...courses]
          localStorage.setItem('golfCourses', JSON.stringify(updatedCourses))
        }
        
        if (rounds.length > 0) {
          const updatedRounds = [...existingRounds, ...rounds]
          localStorage.setItem('golfRounds', JSON.stringify(updatedRounds))
        }
        
        setImportMessage(`Successfully imported ${players.length} new players, ${trips.length} new trips, ${courses.length} new courses, and ${rounds.length} rounds`)
      }
      
      setImportStatus('success')
      setCsvData('')
    } catch (error) {
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

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1><i className="fas fa-upload"></i> Import Data</h1>
          <p>Import CSV data to get started with your golf trip manager</p>
          <div className="admin-links">
            <Link href="/admin" className="btn btn-secondary">
              <i className="fas fa-arrow-left"></i> Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="admin-form-container">
          <div className="import-section">
            <h2>Import {importType === 'trip-scores' ? 'Trip Scores' : importType.charAt(0).toUpperCase() + importType.slice(1)}</h2>
            
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
                <h3>📋 Trip Scores Import</h3>
                <p>This is the easiest way to import your golf data! You can use either format:</p>
                
                <h4>Basic Format (Scores Only):</h4>
                <ul>
                  <li><strong>Trip Year:</strong> The year of the golf trip</li>
                  <li><strong>Golfer Name:</strong> The player's name</li>
                  <li><strong>Round Scores:</strong> Up to 3 round scores (leave blank if no score)</li>
                </ul>
                
                <h4>Extended Format (Scores + Courses):</h4>
                <ul>
                  <li><strong>Trip Year:</strong> The year of the golf trip</li>
                  <li><strong>Golfer Name:</strong> The player's name</li>
                  <li><strong>Round Scores & Courses:</strong> Score and course name for each round</li>
                </ul>
                
                <h4>Extended Format with Dates (Scores + Courses + Dates):</h4>
                <ul>
                  <li><strong>Trip Year:</strong> The year of the golf trip</li>
                  <li><strong>Golfer Name:</strong> The player's name</li>
                  <li><strong>Round Scores, Courses & Dates:</strong> Score, course name, and date for each round (YYYY-MM-DD format)</li>
                </ul>
                
                <p>The system will automatically create players, trips, courses, and rounds for you. If dates are not provided, they will default to June 1-3 of the trip year.</p>
              </div>
            )}

            <div className="template-section">
              <h3>CSV Template</h3>
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
              <h3>Paste CSV Data</h3>
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
                {importStatus === 'success' && (
                  <Link href="/admin" className="btn btn-secondary">
                    Go to Admin Panel
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
