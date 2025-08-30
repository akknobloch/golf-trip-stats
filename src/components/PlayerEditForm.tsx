'use client'

import { useState, useEffect } from 'react'
import { Player } from '@/lib/types'

interface PlayerEditFormProps {
  player?: Player
  onSave: (playerData: Omit<Player, 'id'>) => void
  onCancel: () => void
  isEditing?: boolean
}

export default function PlayerEditForm({ player, onSave, onCancel, isEditing = false }: PlayerEditFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    yearsPlayed: 0,
    averageScore: 0,
    totalTrips: 0
  })

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name,
        yearsPlayed: player.yearsPlayed,
        averageScore: player.averageScore,
        totalTrips: player.totalTrips
      })
    }
  }, [player])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Player name is required')
      return
    }
    onSave(formData)
  }

  return (
    <div className="edit-form-overlay">
      <div className="edit-form">
        <div className="edit-form-header">
          <h3>{isEditing ? 'Edit Player' : 'Add New Player'}</h3>
          <button onClick={onCancel} className="btn-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="playerName">Player Name *</label>
            <input
              id="playerName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Enter player name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="yearsPlayed">Years Played</label>
            <input
              id="yearsPlayed"
              type="number"
              value={formData.yearsPlayed}
              onChange={(e) => setFormData(prev => ({ ...prev, yearsPlayed: parseInt(e.target.value) || 0 }))}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="averageScore">Average Score</label>
            <input
              id="averageScore"
              type="number"
              value={formData.averageScore}
              onChange={(e) => setFormData(prev => ({ ...prev, averageScore: parseInt(e.target.value) || 0 }))}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="totalTrips">Total Trips</label>
            <input
              id="totalTrips"
              type="number"
              value={formData.totalTrips}
              onChange={(e) => setFormData(prev => ({ ...prev, totalTrips: parseInt(e.target.value) || 0 }))}
              min="0"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Update Player' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

