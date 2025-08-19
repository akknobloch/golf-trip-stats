import { Player, Course, Trip, Round } from './types'
import { staticPlayers, staticCourses, staticTrips, staticRounds } from '@/data/golf-data'

export function getStaticData() {
  return {
    players: staticPlayers,
    courses: staticCourses,
    trips: staticTrips,
    rounds: staticRounds
  }
}

// For admin functionality, you can still use localStorage as a fallback
export function getData() {
  if (typeof window !== 'undefined') {
    // Check if we have localStorage data (for admin use)
    const savedPlayers = localStorage.getItem('golfPlayers')
    if (savedPlayers) {
      return {
        players: JSON.parse(savedPlayers),
        courses: JSON.parse(localStorage.getItem('golfCourses') || '[]'),
        trips: JSON.parse(localStorage.getItem('golfTrips') || '[]'),
        rounds: JSON.parse(localStorage.getItem('golfRounds') || '[]')
      }
    }
  }
  
  // Return static data for public viewing
  return getStaticData()
}

// Helper function to check if we're in admin mode (has localStorage data)
export function isAdminMode(): boolean {
  if (typeof window === 'undefined') return false
  const savedPlayers = localStorage.getItem('golfPlayers')
  return !!savedPlayers
}
