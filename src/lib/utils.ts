import { Player, Stats, YearStats, Round, Trip, Course, CourseStats } from './types'

export function calculateStats(players: Player[], rounds: Round[]): Stats {
  if (players.length === 0) {
    return {
      totalPlayers: 0,
      totalYears: 0,
      bestAverage: '--',
      totalCourses: 0,
      totalTrips: 0
    }
  }

  const totalPlayers = players.length
  
  // Calculate total years from unique years in rounds
  const uniqueYears = new Set(rounds.map(round => round.year))
  const totalYears = uniqueYears.size
  
  // Calculate best average by computing each player's average from their rounds
  let bestAverage = '--'
  let bestAveragePlayer: string | undefined
  if (rounds.length > 0) {
    const playerAverages = players
      .map(player => {
        const playerRounds = rounds.filter(round => round.playerId === player.id)
        if (playerRounds.length === 0) return { player, average: Infinity }
        const average = playerRounds.reduce((sum, round) => sum + round.score, 0) / playerRounds.length
        return { player, average }
      })
      .filter(p => p.average !== Infinity)
    
    if (playerAverages.length > 0) {
      const bestPlayer = playerAverages.reduce((best, current) => 
        current.average < best.average ? current : best
      )
      bestAverage = bestPlayer.average.toFixed(1)
      bestAveragePlayer = bestPlayer.player.name
    }
  }

  // Find best single score across all rounds
  let bestScore: number | undefined
  let bestScoreYear: number | undefined
  let bestScorePlayer: string | undefined

  rounds.forEach(round => {
    if (!bestScore || round.score < bestScore) {
      bestScore = round.score
      bestScoreYear = round.year
      const player = players.find(p => p.id === round.playerId)
      bestScorePlayer = player?.name
    }
  })

  return {
    totalPlayers,
    totalYears,
    bestAverage,
    bestAveragePlayer,
    bestScore,
    bestScoreYear,
    bestScorePlayer,
    totalCourses: 0,
    totalTrips: 0
  }
}

export function calculateYearStats(players: Player[], rounds: Round[], year: number): YearStats {
  const yearRounds = rounds.filter(round => round.year === year)
  
  if (yearRounds.length === 0) {
    return {
      year,
      totalPlayers: 0,
      averageScore: 0,
      bestScore: 0,
      bestPlayer: '',
      worstScore: 0,
      worstPlayer: '',
      totalRounds: 0
    }
  }

  const scores = yearRounds.map(round => ({
    player: players.find(p => p.id === round.playerId)?.name || 'Unknown',
    score: round.score
  }))

  const totalPlayers = new Set(yearRounds.map(round => round.playerId)).size
  const averageScore = yearRounds.reduce((sum, round) => sum + round.score, 0) / yearRounds.length
  const bestScore = Math.min(...yearRounds.map(round => round.score))
  const worstScore = Math.max(...yearRounds.map(round => round.score))
  const bestPlayer = scores.find(s => s.score === bestScore)?.player || ''
  const worstPlayer = scores.find(s => s.score === worstScore)?.player || ''

  return {
    year,
    totalPlayers,
    averageScore: Math.round(averageScore * 10) / 10,
    bestScore,
    bestPlayer,
    worstScore,
    worstPlayer,
    totalRounds: yearRounds.length
  }
}

export function getAvailableYears(rounds: Round[]): number[] {
  const years = new Set<number>()
  rounds.forEach(round => {
    years.add(round.year)
  })
  return Array.from(years).sort((a, b) => b - a) // Sort descending (newest first)
}

export function calculatePlayerAverage(player: Player, rounds: Round[]): number {
  const playerRounds = rounds.filter(round => round.playerId === player.id)
  if (playerRounds.length === 0) return 0
  const totalScore = playerRounds.reduce((sum, round) => sum + round.score, 0)
  return Math.round((totalScore / playerRounds.length) * 10) / 10
}

export function calculatePlayerStats(player: Player, rounds: Round[]): Player {
  const playerRounds = rounds.filter(round => round.playerId === player.id)
  
  if (playerRounds.length === 0) {
    return {
      ...player,
      yearsPlayed: 0,
      averageScore: 0,
      totalTrips: 0
    }
  }

  const uniqueYears = new Set(playerRounds.map(round => round.year))
  const uniqueTrips = new Set(playerRounds.map(round => round.tripId))
  
  const averageScore = calculatePlayerAverage(player, rounds)
  const bestScore = Math.min(...playerRounds.map(round => round.score))
  const bestScoreRound = playerRounds.find(round => round.score === bestScore)
  
  return {
    ...player,
    yearsPlayed: uniqueYears.size,
    averageScore,
    totalTrips: uniqueTrips.size,
    firstTrip: Math.min(...Array.from(uniqueYears)),
    lastTrip: Math.max(...Array.from(uniqueYears)),
    bestScore,
    bestScoreYear: bestScoreRound?.year,
    bestScoreCourse: bestScoreRound?.courseId
  }
}

// CSV Export functions
export function exportToCSV(players: Player[], rounds: Round[]): string {
  if (players.length === 0) return ''

  // Get all unique years from rounds
  const allYears = new Set<number>()
  rounds.forEach(round => {
    allYears.add(round.year)
  })
  const sortedYears = Array.from(allYears).sort((a, b) => a - b)

  // Create CSV header
  const headers = ['Player Name', 'Years Played', 'Average Score', ...sortedYears.map(year => `${year} Score`)]
  const csvRows = [headers.join(',')]

  // Add data rows
  players.forEach(player => {
    const row = [
      `"${player.name}"`,
      player.yearsPlayed.toString(),
      calculatePlayerAverage(player, rounds).toString(),
      ...sortedYears.map(year => {
        const yearRounds = rounds.filter(round => round.playerId === player.id && round.year === year)
        if (yearRounds.length === 0) return ''
        // If multiple rounds in a year, show the best score
        const bestScore = Math.min(...yearRounds.map(round => round.score))
        return bestScore.toString()
      })
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export function exportYearHistoryToCSV(players: Player[], rounds: Round[]): string {
  const availableYears = getAvailableYears(rounds)
  if (availableYears.length === 0) return ''

  const headers = ['Year', 'Total Players', 'Total Rounds', 'Average Score', 'Best Score', 'Best Player', 'Worst Score', 'Worst Player']
  const csvRows = [headers.join(',')]

  availableYears.forEach(year => {
    const yearStats = calculateYearStats(players, rounds, year)
    const row = [
      year.toString(),
      yearStats.totalPlayers.toString(),
      yearStats.totalRounds.toString(),
      yearStats.averageScore.toString(),
      yearStats.bestScore.toString(),
      `"${yearStats.bestPlayer}"`,
      yearStats.worstScore.toString(),
      `"${yearStats.worstPlayer}"`
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

// CSV Import functions
export function importFromCSV(csvText: string): { players: Player[], rounds: Round[] } {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return { players: [], rounds: [] }

  const headers = lines[0].split(',').map(h => h.trim())
  const players: Player[] = []
  const rounds: Round[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = parseCSVLine(line)
    
    if (values.length < 3) continue

    const playerName = values[0].replace(/"/g, '')
    const yearsPlayed = parseInt(values[1]) || 0
    const averageScore = parseFloat(values[2]) || 0

    const playerId = Date.now().toString() + i // Generate unique ID
    
    // Create player
    players.push({
      id: playerId,
      name: playerName,
      yearsPlayed: 0, // Will be calculated from rounds
      averageScore: 0, // Will be calculated from rounds
      totalTrips: 0
    })

    // Parse year scores starting from index 3
    for (let j = 3; j < values.length; j++) {
      const yearHeader = headers[j]
      const yearMatch = yearHeader.match(/(\d{4}) Score/)
      if (yearMatch) {
        const year = parseInt(yearMatch[1])
        const score = parseFloat(values[j])
        if (!isNaN(score) && score > 0) {
          // Create a round for this score
          rounds.push({
            id: Date.now().toString() + i + j, // Generate unique ID
            playerId,
            tripId: `imported-${year}`, // Placeholder trip ID
            courseId: `imported-course-${year}`, // Placeholder course ID
            score,
            date: `${year}-01-01`, // Placeholder date
            year
          })
        }
      }
    }
  }

  return { players, rounds }
}

// Helper function to parse CSV line with quoted values
function parseCSVLine(line: string): string[] {
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

// Date utility functions
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // If date is invalid, try to parse common formats
      const parts = dateString.split('-')
      if (parts.length === 3) {
        const [year, month, day] = parts
        const validDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        if (!isNaN(validDate.getTime())) {
          return validDate.toLocaleDateString()
        }
      }
      return 'Invalid Date'
    }
    return date.toLocaleDateString()
  } catch (error) {
    console.error('Error formatting date:', dateString, error)
    return 'Invalid Date'
  }
}

export function getDateValue(dateString: string): number {
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? 0 : date.getTime()
  } catch {
    return 0
  }
}

export function calculateTripDuration(startDate: string, endDate: string): number | string {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'N/A'
    }
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  } catch {
    return 'N/A'
  }
}

export function calculateCourseStats(course: Course, rounds: Round[]): CourseStats {
  const courseRounds = rounds.filter(round => round.courseId === course.id)
  
  if (courseRounds.length === 0) {
    return {
      courseId: course.id,
      courseName: course.name,
      timesPlayed: 0,
      averageScore: 0,
      bestScore: 0,
      bestPlayer: '',
      worstScore: 0,
      worstPlayer: '',
      lastPlayed: 0
    }
  }

  const scores = courseRounds.map(round => ({
    player: round.playerId, // We'll need to resolve player names elsewhere
    score: round.score,
    year: round.year
  }))

  const averageScore = courseRounds.reduce((sum, round) => sum + round.score, 0) / courseRounds.length
  const bestScore = Math.min(...courseRounds.map(round => round.score))
  const worstScore = Math.max(...courseRounds.map(round => round.score))
  const lastPlayed = Math.max(...courseRounds.map(round => round.year))

  const uniqueTrips = new Set(courseRounds.map(round => round.tripId))
  
  return {
    courseId: course.id,
    courseName: course.name,
    timesPlayed: uniqueTrips.size,
    averageScore: Math.round(averageScore * 10) / 10,
    bestScore,
    bestPlayer: '', // Will be resolved when players data is available
    worstScore,
    worstPlayer: '', // Will be resolved when players data is available
    lastPlayed
  }
}

export function calculateCourseTimesPlayed(courseId: string, rounds: Round[]): number {
  const courseRounds = rounds.filter(round => round.courseId === courseId)
  const uniqueTrips = new Set(courseRounds.map(round => round.tripId))
  return uniqueTrips.size
}
