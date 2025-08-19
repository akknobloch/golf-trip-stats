import { Stats } from '@/lib/types'

interface StatsGridProps {
  stats: Stats
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">
          <i className="fas fa-users"></i>
        </div>
        <div className="stat-content">
          <h3>{stats.totalPlayers}</h3>
          <p>Total Players</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">
          <i className="fas fa-calendar-alt"></i>
        </div>
        <div className="stat-content">
          <h3>{stats.totalYears}</h3>
          <p>Years Tracked</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">
          <i className="fas fa-trophy"></i>
        </div>
        <div className="stat-content">
          <h3>{stats.bestAverage}</h3>
          <p>Best Average</p>
        </div>
      </div>
      {stats.bestScore && (
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.bestScore}</h3>
            <p>Best Single Score</p>
            {stats.bestScorePlayer && (
              <small>{stats.bestScorePlayer} ({stats.bestScoreYear})</small>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
