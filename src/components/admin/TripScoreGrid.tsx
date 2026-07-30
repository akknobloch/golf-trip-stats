'use client'

import { useMemo, useState } from 'react'
import { Course, Player, Round, Trip } from '@/lib/types'
import { createId } from '@/lib/admin-data'

type CourseColumn = {
  courseId: string
  date: string
  newCourseName?: string
  newCourseLocation?: string
  newCoursePar?: number
}

interface TripScoreGridProps {
  trip: Trip
  players: Player[]
  courses: Course[]
  rounds: Round[]
  canEdit: boolean
  saving: boolean
  onSave: (payload: {
    courses: Course[]
    players: Player[]
    rounds: Round[]
    attendees: string[]
  }) => Promise<void>
}

function buildInitialColumns(trip: Trip, rounds: Round[], courses: Course[]): CourseColumn[] {
  const tripRounds = rounds.filter(round => round.tripId === trip.id)
  const byCourse = new Map<string, string>()

  tripRounds.forEach(round => {
    if (!byCourse.has(round.courseId)) {
      byCourse.set(round.courseId, round.date)
    }
  })

  const existing = Array.from(byCourse.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .slice(0, 3)
    .map(([courseId, date]) => ({ courseId, date }))

  while (existing.length < 3) {
    existing.push({
      courseId: '',
      date: trip.startDate
    })
  }

  return existing.map(col => {
    const course = courses.find(c => c.id === col.courseId)
    return {
      ...col,
      newCourseName: '',
      newCourseLocation: course?.location || '',
      newCoursePar: 72
    }
  })
}

function buildInitialScores(
  trip: Trip,
  players: Player[],
  rounds: Round[],
  columns: CourseColumn[]
): Record<string, Record<number, string>> {
  const scores: Record<string, Record<number, string>> = {}
  const tripRounds = rounds.filter(round => round.tripId === trip.id)
  const scoredIds = new Set(tripRounds.map(round => round.playerId))
  const attendeeIds = trip.attendees || []
  const rowPlayerIds = Array.from(new Set([...scoredIds, ...attendeeIds]))

  if (rowPlayerIds.length === 0) {
    players.forEach(player => {
      scores[player.id] = { 0: '', 1: '', 2: '' }
    })
    return scores
  }

  rowPlayerIds.forEach(playerId => {
    scores[playerId] = { 0: '', 1: '', 2: '' }
    columns.forEach((column, index) => {
      if (!column.courseId) return
      const match = tripRounds.find(
        round => round.playerId === playerId && round.courseId === column.courseId
      )
      if (match) {
        scores[playerId][index] = String(match.score)
      }
    })
  })

  return scores
}

export default function TripScoreGrid({
  trip,
  players,
  courses,
  rounds,
  canEdit,
  saving,
  onSave
}: TripScoreGridProps) {
  const [columns, setColumns] = useState<CourseColumn[]>(() =>
    buildInitialColumns(trip, rounds, courses)
  )
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => {
    const tripRounds = rounds.filter(round => round.tripId === trip.id)
    const scored = tripRounds.map(round => round.playerId)
    const attendees = trip.attendees || []
    const initial = Array.from(new Set([...scored, ...attendees]))
    return initial.length > 0 ? initial : players.map(p => p.id)
  })
  const [scores, setScores] = useState<Record<string, Record<number, string>>>(() =>
    buildInitialScores(trip, players, rounds, buildInitialColumns(trip, rounds, courses))
  )
  const [newPlayerName, setNewPlayerName] = useState('')
  const [tsvText, setTsvText] = useState('')
  const [localPlayers, setLocalPlayers] = useState(players)

  const sortedPlayers = useMemo(
    () => [...localPlayers].sort((a, b) => a.name.localeCompare(b.name)),
    [localPlayers]
  )

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId)
      }
      setScores(current => ({
        ...current,
        [playerId]: current[playerId] || { 0: '', 1: '', 2: '' }
      }))
      return [...prev, playerId]
    })
  }

  const addNewPlayer = () => {
    const name = newPlayerName.trim()
    if (!name) return
    if (localPlayers.some(player => player.name.toLowerCase() === name.toLowerCase())) {
      alert('A player with that name already exists')
      return
    }
    const player: Player = {
      id: createId(),
      name,
      yearsPlayed: 0,
      averageScore: 0,
      totalTrips: 0
    }
    setLocalPlayers(prev => [...prev, player])
    setSelectedPlayerIds(prev => [...prev, player.id])
    setScores(prev => ({ ...prev, [player.id]: { 0: '', 1: '', 2: '' } }))
    setNewPlayerName('')
  }

  const updateColumn = (index: number, patch: Partial<CourseColumn>) => {
    setColumns(prev => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const applyTsv = () => {
    const lines = tsvText.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    if (lines.length < 2) {
      alert('Paste a header row and at least one data row')
      return
    }

    const header = lines[0].split('\t').map(cell => cell.trim().toLowerCase())
    const nameIndex = header.findIndex(cell => cell === 'name' || cell === 'golfer' || cell === 'player')
    const roundIndexes = [1, 2, 3].map(n =>
      header.findIndex(cell => cell === `round ${n}` || cell === `r${n}` || cell === String(n))
    )

    if (nameIndex === -1 || roundIndexes.some(index => index === -1)) {
      alert('Expected columns like Name, Round 1, Round 2, Round 3')
      return
    }

    const nextScores = { ...scores }
    const nextSelected = new Set(selectedPlayerIds)
    let nextPlayers = [...localPlayers]

    lines.slice(1).forEach(line => {
      const cells = line.split('\t').map(cell => cell.trim())
      const name = cells[nameIndex]
      if (!name) return

      let player = nextPlayers.find(p => p.name.toLowerCase() === name.toLowerCase())
      if (!player) {
        player = {
          id: createId(),
          name,
          yearsPlayed: 0,
          averageScore: 0,
          totalTrips: 0
        }
        nextPlayers = [...nextPlayers, player]
      }

      nextSelected.add(player.id)
      nextScores[player.id] = nextScores[player.id] || { 0: '', 1: '', 2: '' }
      roundIndexes.forEach((colIndex, roundNumber) => {
        const value = cells[colIndex] || ''
        nextScores[player!.id][roundNumber] = value
      })
    })

    setLocalPlayers(nextPlayers)
    setSelectedPlayerIds(Array.from(nextSelected))
    setScores(nextScores)
  }

  const handleSave = async () => {
    if (!canEdit) return

    const nextCourses = [...courses]
    const resolvedCourseIds: (string | null)[] = columns.map(column => {
      if (column.courseId === '__new__') {
        const name = (column.newCourseName || '').trim()
        const location = (column.newCourseLocation || '').trim() || 'TBD'
        const par = column.newCoursePar || 72
        if (!name) return null
        const existing = nextCourses.find(c => c.name.toLowerCase() === name.toLowerCase())
        if (existing) return existing.id
        const course: Course = {
          id: createId(),
          name,
          location,
          par,
          timesPlayed: 0
        }
        nextCourses.push(course)
        return course.id
      }
      return column.courseId || null
    })

    if (resolvedCourseIds.every(id => !id)) {
      alert('Select at least one course before saving scores')
      return
    }

    const year = new Date(trip.startDate).getFullYear()
    const otherRounds = rounds.filter(round => round.tripId !== trip.id)
    const newTripRounds: Round[] = []

    selectedPlayerIds.forEach(playerId => {
      resolvedCourseIds.forEach((courseId, index) => {
        if (!courseId) return
        const raw = scores[playerId]?.[index]?.trim() || ''
        if (!raw) return
        const score = parseInt(raw, 10)
        if (!Number.isFinite(score) || score <= 0) return

        newTripRounds.push({
          id: createId(),
          playerId,
          tripId: trip.id,
          courseId,
          score,
          date: columns[index].date || trip.startDate,
          year,
          notes: `Round ${index + 1}`
        })
      })
    })

    const playersWithScores = new Set(newTripRounds.map(round => round.playerId))
    const attendees = selectedPlayerIds.filter(id => !playersWithScores.has(id))

    await onSave({
      courses: nextCourses,
      players: localPlayers,
      rounds: [...otherRounds, ...newTripRounds],
      attendees
    })
  }

  return (
    <div className="trip-score-grid-section">
      <div className="section-header">
        <h2 className="section-title">Scores</h2>
        <p className="section-help">
          Pick up to three courses, select who played, enter scores. Leave cells empty for no score.
        </p>
      </div>

      <div className="score-course-columns">
        {columns.map((column, index) => (
          <div key={`course-col-${index}`} className="score-course-card">
            <h3>Round {index + 1}</h3>
            <label htmlFor={`course-select-${index}`}>Course</label>
            <select
              id={`course-select-${index}`}
              value={column.courseId}
              disabled={!canEdit}
              onChange={e => updateColumn(index, { courseId: e.target.value })}
            >
              <option value="">None</option>
              <option value="__new__">+ Create new course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            {column.courseId === '__new__' && (
              <>
                <label htmlFor={`new-course-name-${index}`}>New course name</label>
                <input
                  id={`new-course-name-${index}`}
                  type="text"
                  value={column.newCourseName || ''}
                  disabled={!canEdit}
                  onChange={e => updateColumn(index, { newCourseName: e.target.value })}
                />
                <label htmlFor={`new-course-location-${index}`}>Location</label>
                <input
                  id={`new-course-location-${index}`}
                  type="text"
                  value={column.newCourseLocation || ''}
                  disabled={!canEdit}
                  onChange={e => updateColumn(index, { newCourseLocation: e.target.value })}
                />
                <label htmlFor={`new-course-par-${index}`}>Par</label>
                <input
                  id={`new-course-par-${index}`}
                  type="number"
                  value={column.newCoursePar || 72}
                  disabled={!canEdit}
                  onChange={e => updateColumn(index, { newCoursePar: parseInt(e.target.value, 10) || 72 })}
                />
              </>
            )}

            <label htmlFor={`course-date-${index}`}>Date</label>
            <input
              id={`course-date-${index}`}
              type="date"
              value={column.date}
              disabled={!canEdit}
              onChange={e => updateColumn(index, { date: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="score-roster">
        <h3>Who played</h3>
        <div className="attendees-list">
          {sortedPlayers.map(player => (
            <label key={player.id} className="attendee-checkbox">
              <input
                type="checkbox"
                checked={selectedPlayerIds.includes(player.id)}
                disabled={!canEdit}
                onChange={() => togglePlayer(player.id)}
              />
              <span>{player.name}</span>
            </label>
          ))}
        </div>
        {canEdit && (
          <div className="inline-add-player">
            <input
              type="text"
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              placeholder="Add new player name"
            />
            <button type="button" className="btn btn-secondary" onClick={addNewPlayer}>
              Add player
            </button>
          </div>
        )}
      </div>

      <div className="score-table-wrap">
        <table className="score-grid-table">
          <thead>
            <tr>
              <th>Player</th>
              {columns.map((column, index) => {
                const course =
                  column.courseId && column.courseId !== '__new__'
                    ? courses.find(c => c.id === column.courseId)
                    : null
                const label =
                  column.courseId === '__new__'
                    ? column.newCourseName || `Round ${index + 1}`
                    : course?.name || `Round ${index + 1}`
                return <th key={`head-${index}`}>{label}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {selectedPlayerIds.map(playerId => {
              const player = localPlayers.find(p => p.id === playerId)
              if (!player) return null
              return (
                <tr key={playerId}>
                  <td>{player.name}</td>
                  {[0, 1, 2].map(index => (
                    <td key={`${playerId}-${index}`}>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        disabled={!canEdit || !columns[index].courseId}
                        value={scores[playerId]?.[index] ?? ''}
                        onChange={e =>
                          setScores(prev => ({
                            ...prev,
                            [playerId]: {
                              ...(prev[playerId] || {}),
                              [index]: e.target.value
                            }
                          }))
                        }
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="info-box">
          <h3>Paste from Excel (optional)</h3>
          <p>Columns: Name, Round 1, Round 2, Round 3. Applies to this trip only.</p>
          <textarea
            value={tsvText}
            onChange={e => setTsvText(e.target.value)}
            rows={5}
            placeholder="Name\tRound 1\tRound 2\tRound 3"
          />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={applyTsv}>
              Apply paste
            </button>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canEdit || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save scores'}
        </button>
      </div>
    </div>
  )
}
