import { calculatePlayerAverage, calculatePlayerStats } from '@/lib/utils'
import { Player, Round, Trip } from '@/lib/types'

interface PlayerDetailsModalProps {
  player: Player
  rounds: Round[]
  trips: Trip[]
  onClose: () => void
}

export default function PlayerDetailsModal({ player, rounds, trips, onClose }: PlayerDetailsModalProps) {
  const playerStats = calculatePlayerStats(player, rounds, trips)
  const playerRounds = rounds.filter(round => round.playerId === player.id)
  const sortedRounds = [...playerRounds].sort((a, b) => b.year - a.year) // Newest first

  return (
    <div className="modal show">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Player Details</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="player-details">
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{player.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Years Played:</span>
            <span className="detail-value">{playerStats.yearsPlayed}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Total Rounds:</span>
            <span className="detail-value">{playerRounds.length}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Average Score:</span>
            <span className="detail-value">{playerStats.averageScore}</span>
          </div>
          {playerRounds.length > 0 && (
            <>
              <div className="detail-row">
                <span className="detail-label">Best Score:</span>
                <span className="detail-value">{playerStats.bestScore} ({playerStats.bestScoreYear})</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Trips:</span>
                <span className="detail-value">{playerStats.totalTrips}</span>
              </div>
            </>
          )}
        </div>

        {playerRounds.length > 0 && (
          <div className="player-scores-section">
            <h3>Recent Rounds</h3>
            <div className="scores-table">
              <div className="scores-header">
                <div className="score-header-year">Date</div>
                <div className="score-header-score">Score</div>
                <div className="score-header-course">Course</div>
              </div>
              {sortedRounds.slice(0, 10).map((round) => (
                <div key={round.id} className="score-row">
                  <div className="score-year">{round.date}</div>
                  <div className="score-value">{round.score}</div>
                  <div className="score-course">{round.courseId}</div>
                </div>
              ))}
            </div>
            {playerRounds.length > 10 && (
              <p className="more-rounds-note">
                Showing 10 most recent rounds. View all rounds in the Rounds section.
              </p>
            )}
          </div>
        )}

        {playerRounds.length === 0 && (
          <div className="no-scores-message">
            <i className="fas fa-info-circle"></i>
            <p>No rounds recorded yet. Add rounds in the Rounds section to see player performance.</p>
          </div>
        )}
      </div>
    </div>
  )
}
