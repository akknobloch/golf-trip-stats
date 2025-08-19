'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Course } from '@/lib/types'
import Link from 'next/link'

export default function AddCourse() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    par: 72,
    description: '',
    imageUrl: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newCourse: Course = {
      id: Date.now().toString(),
      name: formData.name,
      location: formData.location,
      par: formData.par,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      timesPlayed: 0
    }
    
    // Load existing courses and add new one
    const existingCourses = JSON.parse(localStorage.getItem('golfCourses') || '[]')
    const updatedCourses = [...existingCourses, newCourse]
    localStorage.setItem('golfCourses', JSON.stringify(updatedCourses))
    
    router.push('/admin')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'par' ? parseInt(value) || 72 : value
    }))
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1><i className="fas fa-flag"></i> Add New Course</h1>
          <p>Add a new golf course to the database</p>
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
              <label htmlFor="courseName">Course Name</label>
              <input
                type="text"
                id="courseName"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="courseLocation">Location</label>
              <input
                type="text"
                id="courseLocation"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="coursePar">Par</label>
              <input
                type="number"
                id="coursePar"
                name="par"
                value={formData.par}
                onChange={handleInputChange}
                min="1"
                max="200"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="courseDescription">Description (Optional)</label>
              <textarea
                id="courseDescription"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief description of the course..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="courseImageUrl">Image URL (Optional)</label>
              <input
                type="url"
                id="courseImageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/course-image.jpg"
              />
            </div>

            <div className="form-actions">
              <Link href="/admin" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Add Course
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

