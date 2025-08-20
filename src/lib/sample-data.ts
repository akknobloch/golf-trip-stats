import { Player, Course, Trip, Round } from './types'

export const samplePlayers: Player[] = [
  {
    id: 'player-1',
    name: 'John Smith',
    yearsPlayed: 3,
    averageScore: 82.3,
    firstTrip: 2022,
    lastTrip: 2024,
    totalTrips: 3,
    bestScore: 75,
    bestScoreYear: 2024,
    bestScoreCourse: 'Pebble Beach Golf Links'
  },
  {
    id: 'player-2',
    name: 'Jane Doe',
    yearsPlayed: 3,
    averageScore: 78.7,
    firstTrip: 2022,
    lastTrip: 2024,
    totalTrips: 3,
    bestScore: 72,
    bestScoreYear: 2023,
    bestScoreCourse: 'Augusta National Golf Club'
  },
  {
    id: 'player-3',
    name: 'Mike Johnson',
    yearsPlayed: 2,
    averageScore: 85.2,
    firstTrip: 2023,
    lastTrip: 2024,
    totalTrips: 2,
    bestScore: 79,
    bestScoreYear: 2024,
    bestScoreCourse: 'Pebble Beach Golf Links'
  },
  {
    id: 'player-4',
    name: 'Sarah Wilson',
    yearsPlayed: 2,
    averageScore: 87.8,
    firstTrip: 2023,
    lastTrip: 2024,
    totalTrips: 2,
    bestScore: 82,
    bestScoreYear: 2024,
    bestScoreCourse: 'Spyglass Hill'
  }
]

export const sampleCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Pebble Beach Golf Links',
    location: 'Pebble Beach, CA',
    par: 72,
    description: 'Iconic coastal golf course with stunning ocean views',
    imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
    firstPlayed: 2022,
    lastPlayed: 2024,
    timesPlayed: 6
  },
  {
    id: 'course-2',
    name: 'Spyglass Hill',
    location: 'Pebble Beach, CA',
    par: 72,
    description: 'Challenging course with dramatic elevation changes',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    firstPlayed: 2024,
    lastPlayed: 2024,
    timesPlayed: 3
  },
  {
    id: 'course-3',
    name: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    par: 72,
    description: 'Home of the Masters Tournament',
    imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
    firstPlayed: 2023,
    lastPlayed: 2023,
    timesPlayed: 3
  },
  {
    id: 'course-4',
    name: 'Spanish Bay',
    location: 'Pebble Beach, CA',
    par: 72,
    description: 'Links-style course with Scottish influence',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    firstPlayed: 2024,
    lastPlayed: 2024,
    timesPlayed: 3
  }
]

export const sampleTrips: Trip[] = [
  {
    id: 'trip-1',
    startDate: '2024-06-15',
    endDate: '2024-06-18',
    location: 'Pebble Beach, CA',
    description: 'Annual West Coast Golf Trip',
    weather: 'Sunny, 65-70°F',
    notes: 'Perfect weather for golf, amazing ocean views',
    championPlayerId: 'player-2'
  },
  {
    id: 'trip-2',
    startDate: '2023-07-20',
    endDate: '2023-07-23',
    location: 'Augusta, GA',
    description: 'Southern Golf Adventure',
    weather: 'Hot and humid, 85-90°F',
    notes: 'Challenging conditions but great course',
    championPlayerId: 'player-2'
  },
  {
    id: 'trip-3',
    startDate: '2022-08-10',
    endDate: '2022-08-13',
    location: 'Pebble Beach, CA',
    description: 'First Annual Golf Trip',
    weather: 'Overcast, 60-65°F',
    notes: 'Inaugural trip, everyone had a great time',
    championPlayerId: 'player-1'
  }
]

export const sampleRounds: Round[] = [
  // 2024 Trip - Pebble Beach
  {
    id: 'round-1',
    playerId: 'player-1',
    tripId: 'trip-1',
    courseId: 'course-1',
    score: 85,
    date: '2024-06-15',
    year: 2024,
    notes: 'Great round, birdied 18th'
  },
  {
    id: 'round-2',
    playerId: 'player-2',
    tripId: 'trip-1',
    courseId: 'course-1',
    score: 78,
    date: '2024-06-15',
    year: 2024,
    notes: 'Personal best on this course'
  },
  {
    id: 'round-3',
    playerId: 'player-3',
    tripId: 'trip-1',
    courseId: 'course-1',
    score: 88,
    date: '2024-06-15',
    year: 2024,
    notes: 'First time playing here'
  },
  {
    id: 'round-4',
    playerId: 'player-4',
    tripId: 'trip-1',
    courseId: 'course-1',
    score: 92,
    date: '2024-06-15',
    year: 2024,
    notes: 'Struggled with the wind'
  },
  {
    id: 'round-5',
    playerId: 'player-1',
    tripId: 'trip-1',
    courseId: 'course-2',
    score: 82,
    date: '2024-06-16',
    year: 2024,
    notes: 'Better second day'
  },
  {
    id: 'round-6',
    playerId: 'player-2',
    tripId: 'trip-1',
    courseId: 'course-2',
    score: 75,
    date: '2024-06-16',
    year: 2024,
    notes: 'Excellent round!'
  },
  {
    id: 'round-7',
    playerId: 'player-3',
    tripId: 'trip-1',
    courseId: 'course-2',
    score: 85,
    date: '2024-06-16',
    year: 2024,
    notes: 'Improved from yesterday'
  },
  {
    id: 'round-8',
    playerId: 'player-4',
    tripId: 'trip-1',
    courseId: 'course-2',
    score: 89,
    date: '2024-06-16',
    year: 2024,
    notes: 'Still windy but better'
  },
  {
    id: 'round-9',
    playerId: 'player-1',
    tripId: 'trip-1',
    courseId: 'course-4',
    score: 79,
    date: '2024-06-17',
    year: 2024,
    notes: 'Great final round'
  },
  {
    id: 'round-10',
    playerId: 'player-2',
    tripId: 'trip-1',
    courseId: 'course-4',
    score: 77,
    date: '2024-06-17',
    year: 2024,
    notes: 'Consistent play throughout'
  },
  {
    id: 'round-11',
    playerId: 'player-3',
    tripId: 'trip-1',
    courseId: 'course-4',
    score: 83,
    date: '2024-06-17',
    year: 2024,
    notes: 'Solid finish'
  },
  {
    id: 'round-12',
    playerId: 'player-4',
    tripId: 'trip-1',
    courseId: 'course-4',
    score: 86,
    date: '2024-06-17',
    year: 2024,
    notes: 'Good improvement'
  },
  // 2023 Trip - Augusta
  {
    id: 'round-13',
    playerId: 'player-1',
    tripId: 'trip-2',
    courseId: 'course-3',
    score: 87,
    date: '2023-07-20',
    year: 2023,
    notes: 'Amazing course'
  },
  {
    id: 'round-14',
    playerId: 'player-2',
    tripId: 'trip-2',
    courseId: 'course-3',
    score: 79,
    date: '2023-07-20',
    year: 2023,
    notes: 'Personal best!'
  },
  {
    id: 'round-15',
    playerId: 'player-1',
    tripId: 'trip-2',
    courseId: 'course-3',
    score: 84,
    date: '2023-07-21',
    year: 2023,
    notes: 'Better second round'
  },
  {
    id: 'round-16',
    playerId: 'player-2',
    tripId: 'trip-2',
    courseId: 'course-3',
    score: 76,
    date: '2023-07-21',
    year: 2023,
    notes: 'Even better!'
  },
  {
    id: 'round-17',
    playerId: 'player-1',
    tripId: 'trip-2',
    courseId: 'course-3',
    score: 81,
    date: '2023-07-22',
    year: 2023,
    notes: 'Great final round'
  },
  {
    id: 'round-18',
    playerId: 'player-2',
    tripId: 'trip-2',
    courseId: 'course-3',
    score: 78,
    date: '2023-07-22',
    year: 2023,
    notes: 'Champion performance'
  },
  // 2022 Trip - First Trip
  {
    id: 'round-19',
    playerId: 'player-1',
    tripId: 'trip-3',
    courseId: 'course-1',
    score: 89,
    date: '2022-08-10',
    year: 2022,
    notes: 'First time here'
  },
  {
    id: 'round-20',
    playerId: 'player-2',
    tripId: 'trip-3',
    courseId: 'course-1',
    score: 82,
    date: '2022-08-10',
    year: 2022,
    notes: 'Great start'
  },
  {
    id: 'round-21',
    playerId: 'player-1',
    tripId: 'trip-3',
    courseId: 'course-1',
    score: 86,
    date: '2022-08-11',
    year: 2022,
    notes: 'Getting better'
  },
  {
    id: 'round-22',
    playerId: 'player-2',
    tripId: 'trip-3',
    courseId: 'course-1',
    score: 80,
    date: '2022-08-11',
    year: 2022,
    notes: 'Excellent round'
  }
]

export function initializeSampleData() {
  // Check if data already exists
  const existingPlayers = localStorage.getItem('golfPlayers')
  const existingCourses = localStorage.getItem('golfCourses')
  const existingTrips = localStorage.getItem('golfTrips')
  const existingRounds = localStorage.getItem('golfRounds')

  // Only initialize if no data exists
  if (!existingPlayers) {
    localStorage.setItem('golfPlayers', JSON.stringify(samplePlayers))
  }
  if (!existingCourses) {
    localStorage.setItem('golfCourses', JSON.stringify(sampleCourses))
  }
  if (!existingTrips) {
    localStorage.setItem('golfTrips', JSON.stringify(sampleTrips))
  }
  if (!existingRounds) {
    localStorage.setItem('golfRounds', JSON.stringify(sampleRounds))
  }
}
