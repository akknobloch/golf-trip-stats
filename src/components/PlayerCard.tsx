import { Player, Round, Trip, Course } from '@/lib/types'
import { calculatePlayerAverage, calculatePlayerStats } from '@/lib/utils'
import ParallaxCard from './ParallaxCard'

interface PlayerCardProps {
  player: Player
  rounds: Round[]
  trips: Trip[]
  courses: Course[]
  onViewDetails: () => void
  onDelete: () => void
}

export default function PlayerCard({ player, rounds, trips, courses, onViewDetails, onDelete }: PlayerCardProps) {
  const playerStats = calculatePlayerStats(player, rounds)
  const playerRounds = rounds.filter(round => round.playerId === player.id)
  const playerTrips = trips.filter(trip => 
    playerRounds.some(round => round.tripId === trip.id)
  )
  
  // Calculate additional stats
  const uniqueYears = new Set(playerRounds.map(round => round.year))
  const bestScore = Math.min(...playerRounds.map(round => round.score))
  const worstScore = Math.max(...playerRounds.map(round => round.score))
  const bestScoreRound = playerRounds.find(round => round.score === bestScore)
  const bestScoreCourse = bestScoreRound ? courses.find(c => c.id === bestScoreRound.courseId) : null
  
  // Recent performance (last 3 rounds)
  const recentRounds = playerRounds
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  return (
    <ParallaxCard className="player-card" onClick={onViewDetails}>
      <div className="player-header">
        <div className="player-name">{player.name}</div>
        <div className="player-actions" onClick={(e) => e.stopPropagation()}>
          <button 
            className="action-btn"
            onClick={onDelete}
            title="Delete Player"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div className="player-stats">
        <div className="stat-item">
          <span className="stat-value">{playerStats.averageScore}</span>
          <span className="stat-label">Average</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{playerTrips.length}</span>
          <span className="stat-label">Trips</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{playerStats.yearsPlayed}</span>
          <span className="stat-label">Years</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{playerRounds.length}</span>
          <span className="stat-label">Rounds</span>
        </div>
      </div>

      {/* Best Score Highlight */}
      {bestScoreRound && (
        <div className="player-best-score">
          <div className="best-score-header">
            <i className="fas fa-star"></i>
            <span>Best Round</span>
          </div>
          <div className="best-score-content">
            <div className="best-score-value">{bestScore}</div>
            <div className="best-score-details">
              <span className="best-score-year">{bestScoreRound.year}</span>
              {bestScoreCourse && (
                <span className="best-score-course">{bestScoreCourse.name}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Performance - Slimmed Down */}
      {recentRounds.length > 0 && (
        <div className="player-recent-performance">
          <div className="recent-header">
            <span>Recent Rounds</span>
          </div>
          <div className="recent-rounds-compact">
            {recentRounds.map((round) => {
              const course = courses.find(c => c.id === round.courseId)
              const toPar = course ? round.score - course.par : 0
              const toParDisplay = toPar > 0 ? `+${toPar}` : toPar.toString()
              
              return (
                <div key={round.id} className="recent-round-compact-item">
                  <span className="recent-round-compact-score">{round.score}</span>
                  <span className="recent-round-compact-course">{course?.name || 'Unknown'}</span>
                  <span className={`recent-round-compact-par ${toPar <= 0 ? 'under-par' : 'over-par'}`}>
                    {toParDisplay}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Performance Range */}
      <div className="player-performance-range">
        <div className="range-item">
          <span className="range-label">Best</span>
          <span className="range-value best">{bestScore}</span>
        </div>
        <div className="range-item">
          <span className="range-label">Worst</span>
          <span className="range-value worst">{worstScore}</span>
        </div>
        <div className="range-item">
          <span className="range-label">Range</span>
          <span className="range-value">{worstScore - bestScore}</span>
        </div>
      </div>
    </ParallaxCard>
  )
}
