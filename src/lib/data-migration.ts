import { Player, Round, Trip } from './types'

export interface PlayerMergeResult {
  success: boolean
  message: string
  details?: {
    removedPlayer: Player
    keptPlayer: Player
    updatedRounds: number
    updatedTrips: number
  }
}

/**
 * Combines two player records, keeping the primary player and updating all references
 * @param primaryPlayerName - The name of the player to keep
 * @param secondaryPlayerName - The name of the player to merge and remove
 * @returns PlayerMergeResult with details of the operation
 */
export function mergePlayerRecords(
  primaryPlayerName: string,
  secondaryPlayerName: string
): PlayerMergeResult {
  try {
    // Load current data
    const players = JSON.parse(localStorage.getItem('golfPlayers') || '[]')
    const rounds = JSON.parse(localStorage.getItem('golfRounds') || '[]')
    const trips = JSON.parse(localStorage.getItem('golfTrips') || '[]')

    // Find the players
    const primaryPlayer = players.find((p: Player) => 
      p.name.toLowerCase() === primaryPlayerName.toLowerCase()
    )
    const secondaryPlayer = players.find((p: Player) => 
      p.name.toLowerCase() === secondaryPlayerName.toLowerCase()
    )

    if (!primaryPlayer) {
      return {
        success: false,
        message: `Primary player "${primaryPlayerName}" not found`
      }
    }

    if (!secondaryPlayer) {
      return {
        success: false,
        message: `Secondary player "${secondaryPlayerName}" not found`
      }
    }

    if (primaryPlayer.id === secondaryPlayer.id) {
      return {
        success: false,
        message: 'Cannot merge player with themselves'
      }
    }

    // Update all rounds that reference the secondary player
    const updatedRounds = rounds.map((round: Round) => 
      round.playerId === secondaryPlayer.id 
        ? { ...round, playerId: primaryPlayer.id }
        : round
    )

    // Update any trips that have the secondary player as champion
    const updatedTrips = trips.map((trip: Trip) => 
      trip.championPlayerId === secondaryPlayer.id 
        ? { ...trip, championPlayerId: primaryPlayer.id }
        : trip
    )

    // Remove the secondary player from players array
    const updatedPlayers = players.filter((p: Player) => p.id !== secondaryPlayer.id)

    // Save updated data
    localStorage.setItem('golfPlayers', JSON.stringify(updatedPlayers))
    localStorage.setItem('golfRounds', JSON.stringify(updatedRounds))
    localStorage.setItem('golfTrips', JSON.stringify(updatedTrips))

    const updatedRoundsCount = rounds.filter((r: Round) => r.playerId === secondaryPlayer.id).length
    const updatedTripsCount = trips.filter((t: Trip) => t.championPlayerId === secondaryPlayer.id).length

    return {
      success: true,
      message: `Successfully merged "${secondaryPlayerName}" into "${primaryPlayerName}"`,
      details: {
        removedPlayer: secondaryPlayer,
        keptPlayer: primaryPlayer,
        updatedRounds: updatedRoundsCount,
        updatedTrips: updatedTripsCount
      }
    }

  } catch (error) {
    console.error('Error merging player records:', error)
    return {
      success: false,
      message: `Error merging records: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Finds players with similar names that might be duplicates
 * @returns Array of potential duplicate player groups
 */
export function findPotentialDuplicates(): Player[][] {
  try {
    const players = JSON.parse(localStorage.getItem('golfPlayers') || '[]')
    const duplicates: Player[][] = []

    // Group players by normalized names (lowercase, no spaces)
    const nameGroups: { [key: string]: Player[] } = {}
    
    players.forEach((player: Player) => {
      const normalizedName = player.name.toLowerCase().replace(/\s+/g, '')
      if (!nameGroups[normalizedName]) {
        nameGroups[normalizedName] = []
      }
      nameGroups[normalizedName].push(player)
    })

    // Find groups with multiple players
    Object.values(nameGroups).forEach(group => {
      if (group.length > 1) {
        duplicates.push(group)
      }
    })

    // Also check for common name variations
    const commonVariations = [
      { pattern: /matt|matthew/i, names: ['Matt', 'Matthew'] },
      { pattern: /mike|michael/i, names: ['Mike', 'Michael'] },
      { pattern: /joe|joseph/i, names: ['Joe', 'Joseph'] },
      { pattern: /jim|james/i, names: ['Jim', 'James'] },
      { pattern: /bob|robert/i, names: ['Bob', 'Robert'] },
      { pattern: /chris|christopher/i, names: ['Chris', 'Christopher'] },
      { pattern: /dave|david/i, names: ['Dave', 'David'] },
      { pattern: /steve|stephen|steven/i, names: ['Steve', 'Stephen', 'Steven'] }
    ]

    commonVariations.forEach(variation => {
      const matchingPlayers = players.filter((p: Player) => 
        variation.pattern.test(p.name)
      )
      
      if (matchingPlayers.length > 1) {
        // Check if they have the same last name
        const lastNameGroups: { [key: string]: Player[] } = {}
        matchingPlayers.forEach((player: Player) => {
          const nameParts = player.name.split(' ')
          const lastName = nameParts[nameParts.length - 1]
          if (!lastNameGroups[lastName]) {
            lastNameGroups[lastName] = []
          }
          lastNameGroups[lastName].push(player)
        })

        Object.values(lastNameGroups).forEach(group => {
          if (group.length > 1 && !duplicates.some(d => 
            d.every(p => group.some(gp => gp.id === p.id))
          )) {
            duplicates.push(group)
          }
        })
      }
    })

    return duplicates

  } catch (error) {
    console.error('Error finding duplicates:', error)
    return []
  }
}

/**
 * Specific function to combine Matt Slagel and Matthew Slagel records
 * @returns PlayerMergeResult
 */
export function combineSlagelRecords(): PlayerMergeResult {
  return mergePlayerRecords('Matt Slagel', 'Matthew Slagel')
}
