import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Check if we're in development mode (for security)
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: 'File editing is only available in development mode' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content, data } = body

    if (!content || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing content or data' },
        { status: 400 }
      )
    }

    console.log('API Debug: Received data structure:', {
      playersCount: data.players?.length,
      coursesCount: data.courses?.length,
      tripsCount: data.trips?.length,
      roundsCount: data.rounds?.length
    })

    // Validate the data structure
    const { players, courses, trips, rounds } = data

    if (!Array.isArray(players) || !Array.isArray(courses) || !Array.isArray(trips) || !Array.isArray(rounds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data structure. All data must be arrays.' },
        { status: 400 }
      )
    }

    // Validate each player has required fields
    for (const player of players) {
      if (!player.id || !player.name || player.name.trim() === '') {
        console.log('API Debug: Invalid player found:', player)
        return NextResponse.json(
          { success: false, error: 'Invalid player data. Each player must have id and name.' },
          { status: 400 }
        )
      }
    }

    // Validate each course has required fields
    for (const course of courses) {
      if (!course.id || !course.name || course.name.trim() === '' || !course.location || !course.par) {
        console.log('API Debug: Invalid course found:', course)
        return NextResponse.json(
          { success: false, error: 'Invalid course data. Each course must have id, name, location, and par.' },
          { status: 400 }
        )
      }
    }

    // Validate each trip has required fields
    for (const trip of trips) {
      if (!trip.id || !trip.startDate || !trip.endDate || !trip.location || trip.location.trim() === '') {
        console.log('API Debug: Invalid trip found:', trip)
        return NextResponse.json(
          { success: false, error: 'Invalid trip data. Each trip must have id, startDate, endDate, and location.' },
          { status: 400 }
        )
      }
    }

    // Validate each round has required fields
    for (const round of rounds) {
      if (!round.id || !round.playerId || !round.tripId || !round.courseId || !round.score || !round.date || !round.year) {
        console.log('API Debug: Invalid round found:', round)
        return NextResponse.json(
          { success: false, error: 'Invalid round data. Each round must have id, playerId, tripId, courseId, score, date, and year.' },
          { status: 400 }
        )
      }
    }

    // Validate references
    const playerIds = new Set(players.map(p => p.id))
    const courseIds = new Set(courses.map(c => c.id))
    const tripIds = new Set(trips.map(t => t.id))

    for (const round of rounds) {
      if (!playerIds.has(round.playerId)) {
        return NextResponse.json(
          { success: false, error: `Round references non-existent player: ${round.playerId}` },
          { status: 400 }
        )
      }
      if (!courseIds.has(round.courseId)) {
        return NextResponse.json(
          { success: false, error: `Round references non-existent course: ${round.courseId}` },
          { status: 400 }
        )
      }
      if (!tripIds.has(round.tripId)) {
        return NextResponse.json(
          { success: false, error: `Round references non-existent trip: ${round.tripId}` },
          { status: 400 }
        )
      }
    }

    // Get the file path
    const filePath = join(process.cwd(), 'src', 'data', 'golf-data.ts')

    // Write the content to the file
    await writeFile(filePath, content, 'utf8')

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
      stats: {
        players: players.length,
        courses: courses.length,
        trips: trips.length,
        rounds: rounds.length
      }
    })

  } catch (error) {
    console.error('Error saving data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}
