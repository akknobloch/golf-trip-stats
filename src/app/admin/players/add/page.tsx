'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Player } from '@/lib/types'
import Link from 'next/link'

export default function AddPlayer() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: formData.name,
      yearsPlayed: 0,
      averageScore: 0,
      totalTrips: 0
    }
    
    // Load existing players and add new one
    const existingPlayers = JSON.parse(localStorage.getItem('golfPlayers') || '[]')
    const updatedPlayers = [...existingPlayers, newPlayer]
    localStorage.setItem('golfPlayers', JSON.stringify(updatedPlayers))
    
    router.push('/admin')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1><i className="fas fa-user-plus"></i> Add New Player</h1>
          <p>Add a new player to the golf trip database</p>
          <div className="admin-links">
            <Link href="/admin" className="btn btn-secondary">
              <i className="fas fa-arrow-left"></i> Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="admin-form-container">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="playerName">Player Name</label>
              <input
                type="text"
                id="playerName"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>



            <div className="form-actions">
              <Link href="/admin" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Add Player
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

