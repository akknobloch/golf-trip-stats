export function exportCurrentData() {
  if (typeof window === 'undefined') return null
  
  const players = localStorage.getItem('golfPlayers')
  const courses = localStorage.getItem('golfCourses')
  const trips = localStorage.getItem('golfTrips')
  const rounds = localStorage.getItem('golfRounds')
  
  return {
    players: players ? JSON.parse(players) : [],
    courses: courses ? JSON.parse(courses) : [],
    trips: trips ? JSON.parse(trips) : [],
    rounds: rounds ? JSON.parse(rounds) : []
  }
}

// Function to update course timesPlayed values based on actual rounds data
function updateCourseTimesPlayed(courses: any[], rounds: any[]) {
  return courses.map(course => {
    const courseRounds = rounds.filter(round => round.courseId === course.id)
    const uniqueTrips = new Set(courseRounds.map(round => round.tripId))
    const lastPlayed = courseRounds.length > 0 
      ? Math.max(...courseRounds.map(round => round.year))
      : 0
    
    return {
      ...course,
      timesPlayed: uniqueTrips.size,
      lastPlayed
    }
  })
}

export function generateStaticDataFile() {
  const data = exportCurrentData()
  if (!data) return ''
  
  // Update course timesPlayed values based on actual rounds data
  const updatedCourses = updateCourseTimesPlayed(data.courses, data.rounds)
  
  return `import { Player, Course, Trip, Round } from '@/lib/types'

export const staticPlayers: Player[] = ${JSON.stringify(data.players, null, 2)}

export const staticCourses: Course[] = ${JSON.stringify(updatedCourses, null, 2)}

export const staticTrips: Trip[] = ${JSON.stringify(data.trips, null, 2)}

export const staticRounds: Round[] = ${JSON.stringify(data.rounds, null, 2)}
`
}

// Function to copy data to clipboard for easy pasting
export function copyDataToClipboard() {
  const dataFile = generateStaticDataFile()
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(dataFile)
    return true
  }
  return false
}

// Function to download data as a file
export function downloadDataFile() {
  const dataFile = generateStaticDataFile()
  const blob = new Blob([dataFile], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'golf-data.ts'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
