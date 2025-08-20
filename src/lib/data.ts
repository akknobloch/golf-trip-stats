import { Player, Course, Trip, Round } from './types'
import { staticPlayers, staticCourses, staticTrips, staticRounds } from '../data/golf-data'

export function getStaticData() {
  return {
    players: staticPlayers,
    courses: staticCourses,
    trips: staticTrips,
    rounds: staticRounds
  }
}

// Always return static data for public viewing
export function getData() {
  // Return static data for all users
  return getStaticData()
}

// Helper function to check if we're in admin mode (has localStorage data)
export function isAdminMode(): boolean {
  if (typeof window === 'undefined') return false
  const savedPlayers = localStorage.getItem('golfPlayers')
  return !!savedPlayers
}
