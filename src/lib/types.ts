export interface Round {
  id: string
  playerId: string
  tripId: string
  courseId: string
  score: number
  date: string
  year: number
  notes?: string
}

export interface Course {
  id: string
  name: string
  location: string
  par: number
  description?: string
  imageUrl?: string
  firstPlayed?: number
  lastPlayed?: number
  timesPlayed: number
}

export interface Trip {
  id: string
  startDate: string
  endDate: string
  location: string
  description?: string
  weather?: string
  notes?: string
  championPlayerId?: string
}

export interface Player {
  id: string
  name: string
  yearsPlayed: number
  averageScore: number
  firstTrip?: number
  lastTrip?: number
  totalTrips: number
  bestScore?: number
  bestScoreYear?: number
  bestScoreCourse?: string
}

export interface Stats {
  totalPlayers: number
  totalYears: number
  bestAverage: string
  bestAveragePlayer?: string
  bestScore?: number
  bestScoreYear?: number
  bestScorePlayer?: string
  totalCourses: number
  totalTrips: number
}

export interface YearStats {
  year: number
  totalPlayers: number
  averageScore: number
  bestScore: number
  bestPlayer: string
  worstScore: number
  worstPlayer: string
  totalRounds: number
}

export interface CourseStats {
  courseId: string
  courseName: string
  timesPlayed: number
  averageScore: number
  bestScore: number
  bestPlayer: string
  worstScore: number
  worstPlayer: string
  lastPlayed: number
}

export interface TripStats {
  tripId: string
  tripName: string
  year: number
  location: string
  totalRounds: number
  totalPlayers: number
  averageScore: number
  bestScore: number
  bestPlayer: string
  worstScore: number
  worstPlayer: string
  coursesPlayed: string[]
}
