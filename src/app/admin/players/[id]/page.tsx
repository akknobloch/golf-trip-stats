'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Player } from '@/lib/types'
import Link from 'next/link'

// Required for static export - returns empty array since this is client-side
export async function generateStaticParams() {
  return []
}

export default function EditPlayer() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string
  
  const [formData, setFormData] = useState({
    name: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load existing player data
    const loadPlayer = () => {
      try {
        const existingPlayers = JSON.parse(localStorage.getItem('golfPlayers') || '[]')
        const player = existingPlayers.find((p: Player) => p.id === playerId)
        
        if (!player) {
          setError('Player not found')
          setLoading(false)
          return
        }
        
        setFormData({
          name: player.name
        })
        setLoading(false)
      } catch (error) {
        console.error('Error loading player:', error)
        setError('Error loading player data')
        setLoading(false)
      }
    }
    
    loadPlayer()
  }, [playerId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Load existing players and update the specific one
      const existingPlayers = JSON.parse(localStorage.getItem('golfPlayers') || '[]')
      const updatedPlayers = existingPlayers.map((player: Player) => 
        player.id === playerId 
          ? { ...player, name: formData.name }
          : player
      )
      
      localStorage.setItem('golfPlayers', JSON.stringify(updatedPlayers))
      router.push('/admin?tab=players&message=Player%20updated%20successfully&type=success')
    } catch (error) {
      console.error('Error updating player:', error)
      router.push('/admin?tab=players&message=Error%20updating%20player&type=error')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/admin?tab=players" className="btn btn-primary">
            Back to Admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1><i className="fas fa-user-edit"></i> Edit Player</h1>
          <p>Update player information</p>
          <div className="admin-links">
            <Link href="/admin?tab=players" className="btn btn-secondary">
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
              <Link href="/admin?tab=players" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Update Player
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
