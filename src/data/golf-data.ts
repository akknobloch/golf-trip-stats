import { Player, Course, Trip, Round } from '@/lib/types'

// Static data for public deployment
// This data will be embedded in the application and served statically
// Update this file when you want to update the public data

export const staticPlayers: Player[] = [
  // Add your players data here
  // Example:
  // {
  //   id: "1",
  //   name: "John Doe",
  //   yearsPlayed: 5,
  //   averageScore: 85.2,
  //   totalTrips: 5,
  //   firstTrip: 2019,
  //   lastTrip: 2023,
  //   bestScore: 78,
  //   bestScoreYear: 2022,
  //   bestScoreCourse: "course-1"
  // }
]

export const staticCourses: Course[] = [
  // Add your courses data here
  // Example:
  // {
  //   id: "course-1",
  //   name: "Pebble Beach Golf Links",
  //   location: "Pebble Beach, CA",
  //   par: 72,
  //   description: "Famous coastal golf course",
  //   imageUrl: "/images/pebble-beach.jpg",
  //   firstPlayed: 2019,
  //   lastPlayed: 2023,
  //   timesPlayed: 3
  // }
]

export const staticTrips: Trip[] = [
  // Add your trips data here
  // Example:
  // {
  //   id: "trip-1",
  //   startDate: "2023-06-15",
  //   endDate: "2023-06-18",
  //   location: "Pebble Beach, CA",
  //   description: "Annual golf trip to California",
  //   weather: "Sunny, 75°F",
  //   notes: "Great weather, amazing views",
  //   championPlayerId: "player-1"
  // }
]

export const staticRounds: Round[] = [
  // Add your rounds data here
  // Example:
  // {
  //   id: "round-1",
  //   playerId: "player-1",
  //   tripId: "trip-1",
  //   courseId: "course-1",
  //   score: 82,
  //   date: "2023-06-15",
  //   year: 2023,
  //   notes: "Great round, birdied the 7th"
  // }
]
