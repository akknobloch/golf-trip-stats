import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const base = process.env.VERIFY_BASE_URL || 'http://localhost:3005'
const root = process.cwd()
const envPath = join(root, '.env.local')
const dataPath = join(root, 'src/data/golf-data.ts')

function loadAdminPassword() {
  const env = readFileSync(envPath, 'utf8')
  const match = env.match(/^ADMIN_PASSWORD=(.*)$/m)
  if (!match) throw new Error('ADMIN_PASSWORD missing from .env.local')
  return match[1].trim().replace(/^['"]|['"]$/g, '')
}

function parseCookie(setCookie) {
  if (!setCookie) return ''
  return Array.isArray(setCookie) ? setCookie[0].split(';')[0] : setCookie.split(';')[0]
}

function loadDatasetFromFile(content) {
  const match = content.match(
    /export const staticPlayers: Player\[\] = (\[[\s\S]*?\])\s*export const staticCourses: Course\[\] = (\[[\s\S]*?\])\s*export const staticTrips: Trip\[\] = (\[[\s\S]*?\])\s*export const staticRounds: Round\[\] = (\[[\s\S]*?\])\s*$/
  )
  if (!match) throw new Error('Could not parse golf-data.ts arrays')
  return {
    players: JSON.parse(match[1]),
    courses: JSON.parse(match[2]),
    trips: JSON.parse(match[3]),
    rounds: JSON.parse(match[4])
  }
}

async function main() {
  const password = loadAdminPassword()
  const originalData = readFileSync(dataPath, 'utf8')
  const dataset = loadDatasetFromFile(originalData)

  const loginRes = await fetch(`${base}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  const loginJson = await loginRes.json()
  if (!loginRes.ok || !loginJson.success) {
    throw new Error(`Login failed: ${loginRes.status}`)
  }

  const rawCookie = loginRes.headers.getSetCookie?.() || loginRes.headers.get('set-cookie')
  const cookie = parseCookie(rawCookie)
  if (!cookie) throw new Error('No session cookie returned')

  const capsRes = await fetch(`${base}/api/admin/capabilities`, {
    headers: { Cookie: cookie }
  })
  const caps = await capsRes.json()
  if (!capsRes.ok || caps.canEdit !== true) {
    throw new Error(`Expected canEdit=true in development, got ${JSON.stringify(caps)}`)
  }

  const placeholderId = `verify_placeholder_${Date.now()}`
  const placeholderTrip = {
    id: placeholderId,
    startDate: '2026-09-18',
    endDate: '2026-09-20',
    location: 'Verify Placeholder, MO',
    description: 'Scheduled placeholder with no scores',
    attendees: []
  }

  const saveRes = await fetch(`${base}/api/admin/save-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      data: {
        players: dataset.players,
        courses: dataset.courses,
        trips: [...dataset.trips, placeholderTrip],
        rounds: dataset.rounds
      }
    })
  })
  const saveJson = await saveRes.json()
  if (!saveRes.ok || !saveJson.success) {
    writeFileSync(dataPath, originalData, 'utf8')
    throw new Error(`Save failed: ${saveRes.status} ${JSON.stringify(saveJson)}`)
  }

  const updated = readFileSync(dataPath, 'utf8')
  const hasTrip = updated.includes(placeholderId) && updated.includes('Verify Placeholder, MO')
  const placeholderRoundRefs = (updated.match(new RegExp(`"tripId": "${placeholderId}"`, 'g')) || []).length

  writeFileSync(dataPath, originalData, 'utf8')

  if (!hasTrip) {
    throw new Error('Placeholder trip was not written to golf-data.ts')
  }
  if (placeholderRoundRefs !== 0) {
    throw new Error('Placeholder trip unexpectedly created rounds')
  }

  console.log(JSON.stringify({
    ok: true,
    canEdit: caps.canEdit,
    mode: caps.mode,
    savedTripId: placeholderId,
    roundsForPlaceholder: placeholderRoundRefs,
    restored: true
  }, null, 2))
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
