import { staticPlayers, staticCourses, staticTrips, staticRounds } from '../data/golf-data'

export function getStaticData() {
  return {
    players: staticPlayers,
    courses: staticCourses,
    trips: staticTrips,
    rounds: staticRounds
  }
}

/** Public and admin reads share the same static data source. */
export function getData() {
  return getStaticData()
}
