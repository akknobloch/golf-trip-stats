import { Player, Course, Trip, Round } from './types'

export interface GolfDataPayload {
  players: Player[]
  courses: Course[]
  trips: Trip[]
  rounds: Round[]
}

/** Generate the TypeScript source for src/data/golf-data.ts from validated data. */
export function generateGolfDataFileContent(data: GolfDataPayload): string {
  return `import { Player, Course, Trip, Round } from '@/lib/types'

// Static data for public deployment
// This data will be embedded in the application and served statically
// Update this file when you want to update the public data

export const staticPlayers: Player[] = ${JSON.stringify(data.players, null, 2)}

export const staticCourses: Course[] = ${JSON.stringify(data.courses, null, 2)}

export const staticTrips: Trip[] = ${JSON.stringify(data.trips, null, 2)}

export const staticRounds: Round[] = ${JSON.stringify(data.rounds, null, 2)}
`
}

/**
 * Extract a top-level exported array from golf-data.ts content.
 * Handles nested arrays (e.g. trip.photos) that break naive regex parsers.
 */
export function extractExportedArray(content: string, exportName: string): unknown[] {
  const marker = `export const ${exportName}`
  const markerIndex = content.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error(`Could not find export: ${exportName}`)
  }

  const bracketStart = content.indexOf('[', markerIndex)
  if (bracketStart === -1) {
    throw new Error(`Could not find array for export: ${exportName}`)
  }

  let depth = 0
  let inString = false
  let escape = false

  for (let i = bracketStart; i < content.length; i++) {
    const char = content[i]

    if (inString) {
      if (escape) {
        escape = false
      } else if (char === '\\') {
        escape = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '[') {
      depth += 1
    } else if (char === ']') {
      depth -= 1
      if (depth === 0) {
        const parsed = JSON.parse(content.slice(bracketStart, i + 1))
        if (!Array.isArray(parsed)) {
          throw new Error(`Export ${exportName} is not an array`)
        }
        return parsed
      }
    }
  }

  throw new Error(`Unclosed array for export: ${exportName}`)
}

export function parseGolfDataFileContent(content: string): GolfDataPayload {
  return {
    players: extractExportedArray(content, 'staticPlayers') as Player[],
    courses: extractExportedArray(content, 'staticCourses') as Course[],
    trips: extractExportedArray(content, 'staticTrips') as Trip[],
    rounds: extractExportedArray(content, 'staticRounds') as Round[],
  }
}
