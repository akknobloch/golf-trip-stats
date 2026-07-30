import { Player, Course, Trip, Round } from '@/lib/types'

export type GolfDataset = {
  players: Player[]
  courses: Course[]
  trips: Trip[]
  rounds: Round[]
}

export type AdminCapabilities = {
  canEdit: boolean
  mode: 'development' | 'production'
}

export type SaveResult =
  | { success: true; stats?: { players: number; courses: number; trips: number; rounds: number } }
  | { success: false; error: string; status?: number }

export function createId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function getTripYear(trip: Trip): number {
  return new Date(trip.startDate).getFullYear()
}

export function tripDisplayName(trip: Trip): string {
  return `${getTripYear(trip)} ${trip.location}`
}

export function normalizeTripPhotosForSave(trip: Trip): Trip {
  if (!trip.photos || trip.photos.length === 0) {
    return trip
  }

  const photos = trip.photos.map(photo => {
    const normalized = { ...photo }
    if (normalized.thumbnailUrl === normalized.url) {
      normalized.thumbnailUrl = undefined
    }
    return normalized
  })

  return { ...trip, photos }
}

export function sanitizeDataset(data: GolfDataset): GolfDataset {
  return {
    ...data,
    trips: data.trips.map(normalizeTripPhotosForSave)
  }
}

export async function fetchAdminCapabilities(): Promise<AdminCapabilities> {
  try {
    const response = await fetch('/api/admin/capabilities', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    })
    if (!response.ok) {
      return { canEdit: false, mode: 'production' }
    }
    const data = await response.json()
    return {
      canEdit: data.canEdit === true,
      mode: data.mode === 'development' ? 'development' : 'production'
    }
  } catch {
    return { canEdit: false, mode: 'production' }
  }
}

export function productionEditMessage(): string {
  return 'Editing only works on localhost. Run the app locally, save changes, commit src/data/golf-data.ts, then redeploy.'
}

export async function saveGolfDataset(data: GolfDataset): Promise<SaveResult> {
  try {
    const sanitized = sanitizeDataset(data)
    const response = await fetch('/api/admin/save-data', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: sanitized })
    })

    const result = await response.json().catch(() => ({}))

    if (response.status === 403) {
      return {
        success: false,
        status: 403,
        error: productionEditMessage()
      }
    }

    if (!response.ok || !result.success) {
      return {
        success: false,
        status: response.status,
        error: result.error || `Save failed (HTTP ${response.status})`
      }
    }

    return {
      success: true,
      stats: result.stats
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error while saving'
    }
  }
}

export function sortTripsNewestFirst(trips: Trip[]): Trip[] {
  return [...trips].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )
}

export function tripRoundCount(tripId: string, rounds: Round[]): number {
  return rounds.filter(round => round.tripId === tripId).length
}

export function tripPlayerCount(trip: Trip, rounds: Round[]): number {
  const tripRounds = rounds.filter(round => round.tripId === trip.id)
  const scoredPlayerIds = new Set(tripRounds.map(round => round.playerId))
  const attendeeOnly = (trip.attendees || []).filter(id => !scoredPlayerIds.has(id))
  return scoredPlayerIds.size + attendeeOnly.length
}

export function tripCourseCount(tripId: string, rounds: Round[]): number {
  return new Set(
    rounds.filter(round => round.tripId === tripId).map(round => round.courseId)
  ).size
}

export function tripStatusLabel(trip: Trip, rounds: Round[]): string {
  const count = tripRoundCount(trip.id, rounds)
  if (count === 0) return 'Scheduled / no scores yet'
  return `${count} scores recorded`
}
