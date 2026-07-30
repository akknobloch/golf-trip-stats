import { Player, Course, Trip, Round } from '@/lib/types'

type GolfDataset = {
  players: Player[]
  courses: Course[]
  trips: Trip[]
  rounds: Round[]
}

export function exportCurrentData(): GolfDataset | null {
  if (typeof window === 'undefined') return null

  try {
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
  } catch {
    return {
      players: [],
      courses: [],
      trips: [],
      rounds: []
    }
  }
}

function updateCourseTimesPlayed(courses: Course[], rounds: Round[]): Course[] {
  return courses.map(course => {
    const courseRounds = rounds.filter(round => round.courseId === course.id)
    const uniqueTrips = new Set(courseRounds.map(round => round.tripId))
    const years = courseRounds.map(round => round.year)
    const lastPlayed = years.length > 0 ? Math.max(...years) : 0

    return {
      ...course,
      timesPlayed: uniqueTrips.size,
      lastPlayed
    }
  })
}

export function generateGolfDataFileContent(data: GolfDataset): string {
  const updatedCourses = updateCourseTimesPlayed(data.courses, data.rounds)

  return `import { Player, Course, Trip, Round } from '@/lib/types'

// Static data for public deployment
// This data will be embedded in the application and served statically
// Update this file when you want to update the public data

export const staticPlayers: Player[] = ${JSON.stringify(data.players, null, 2)}

export const staticCourses: Course[] = ${JSON.stringify(updatedCourses, null, 2)}

export const staticTrips: Trip[] = ${JSON.stringify(data.trips, null, 2)}

export const staticRounds: Round[] = ${JSON.stringify(data.rounds, null, 2)}
`
}

export function generateStaticDataFile() {
  const data = exportCurrentData()
  if (!data) return ''
  return generateGolfDataFileContent(data)
}

export function copyDataToClipboard() {
  const dataFile = generateStaticDataFile()
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(dataFile)
    return true
  }
  return false
}

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
