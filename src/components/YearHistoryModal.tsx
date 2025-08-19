'use client'

import { useState } from 'react'
import { Player, YearStats, Round } from '@/lib/types'
import { calculateYearStats, getAvailableYears } from '@/lib/utils'

interface YearHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  players: Player[]
  rounds: Round[]
}

export default function YearHistoryModal({ isOpen, onClose, players, rounds }: YearHistoryModalProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const availableYears = getAvailableYears(rounds)
  
  const yearStats = selectedYear ? calculateYearStats(players, rounds, selectedYear) : null

  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>Year History</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="year-history-content">
          <div className="year-selector">
            <label htmlFor="yearSelect">Select Year:</label>
            <select 
              id="yearSelect"
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
              className="year-select"
            >
              <option value="">Choose a year...</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {yearStats && (
            <div className="year-stats">
              <h3>{selectedYear} Golf Trip Results</h3>
              
              <div className="year-stats-grid">
                <div className="year-stat-card">
                  <div className="year-stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="year-stat-content">
                    <h4>{yearStats.totalPlayers}</h4>
                    <p>Players</p>
                  </div>
                </div>
                
                <div className="year-stat-card">
                  <div className="year-stat-icon">
                    <i className="fas fa-calculator"></i>
                  </div>
                  <div className="year-stat-content">
                    <h4>{yearStats.averageScore}</h4>
                    <p>Average Score</p>
                  </div>
                </div>
                
                <div className="year-stat-card">
                  <div className="year-stat-icon">
                    <i className="fas fa-trophy"></i>
                  </div>
                  <div className="year-stat-content">
                    <h4>{yearStats.bestScore}</h4>
                    <p>Best Score</p>
                    <small>{yearStats.bestPlayer}</small>
                  </div>
                </div>
                
                <div className="year-stat-card">
                  <div className="year-stat-icon">
                    <i className="fas fa-arrow-down"></i>
                  </div>
                  <div className="year-stat-content">
                    <h4>{yearStats.worstScore}</h4>
                    <p>Worst Score</p>
                    <small>{yearStats.worstPlayer}</small>
                  </div>
                </div>
              </div>

              <div className="year-players-list">
                <h4>Player Scores</h4>
                <div className="players-scores">
                  {players
                    .map(player => {
                      const playerRounds = rounds.filter(round => round.playerId === player.id && round.year === selectedYear)
                      const totalScore = playerRounds.reduce((sum, round) => sum + round.score, 0)
                      const averageScore = playerRounds.length > 0 ? Math.round(totalScore / playerRounds.length) : 0
                      return playerRounds.length > 0 ? { player, score: averageScore } : null
                    })
                    .filter(Boolean)
                    .sort((a, b) => (a?.score || 0) - (b?.score || 0))
                    .map((item, index) => (
                      <div key={item?.player.id} className="player-score-row">
                        <div className="player-score-position">
                          <span className="position-number">{index + 1}</span>
                        </div>
                        <div className="player-score-name">
                          {item?.player.name}
                        </div>
                        <div className="player-score-value">
                          {item?.score}
                        </div>
                        {index === 0 && (
                          <div className="player-score-winner">
                            <i className="fas fa-crown"></i>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {!selectedYear && availableYears.length > 0 && (
            <div className="year-history-empty">
              <i className="fas fa-calendar-alt"></i>
              <h3>Select a Year</h3>
              <p>Choose a year from the dropdown above to view historical data</p>
            </div>
          )}

          {!selectedYear && availableYears.length === 0 && (
            <div className="year-history-empty">
              <i className="fas fa-calendar-alt"></i>
              <h3>No Historical Data</h3>
              <p>Add players with year scores to view historical data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


