'use client'

import { useState, useEffect } from 'react'
import { Course } from '@/lib/types'

interface CourseEditFormProps {
  course?: Course
  onSave: (courseData: Omit<Course, 'id'>) => void
  onCancel: () => void
  isEditing?: boolean
}

export default function CourseEditForm({ course, onSave, onCancel, isEditing = false }: CourseEditFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    par: 72,
    timesPlayed: 0,
    imageUrl: '',
    lastPlayed: ''
  })

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name,
        location: course.location,
        par: course.par,
        timesPlayed: course.timesPlayed,
        imageUrl: course.imageUrl || '',
        lastPlayed: course.lastPlayed?.toString() || ''
      })
    }
  }, [course])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Course name is required')
      return
    }
    if (!formData.location.trim()) {
      alert('Course location is required')
      return
    }
    
    // Convert form data to match Course type
    const courseData: Omit<Course, 'id'> = {
      name: formData.name,
      location: formData.location,
      par: formData.par,
      timesPlayed: formData.timesPlayed,
      imageUrl: formData.imageUrl || undefined,
      lastPlayed: formData.lastPlayed ? parseInt(formData.lastPlayed) : undefined
    }
    
    onSave(courseData)
  }

  return (
    <div className="edit-form-overlay">
      <div className="edit-form">
        <div className="edit-form-header">
          <h3>{isEditing ? 'Edit Course' : 'Add New Course'}</h3>
          <button onClick={onCancel} className="btn-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="courseName">Course Name *</label>
            <input
              id="courseName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Enter course name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="courseLocation">Location *</label>
            <input
              id="courseLocation"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
              placeholder="Enter course location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="coursePar">Par</label>
            <input
              id="coursePar"
              type="number"
              value={formData.par}
              onChange={(e) => setFormData(prev => ({ ...prev, par: parseInt(e.target.value) || 72 }))}
              min="54"
              max="80"
            />
          </div>

          <div className="form-group">
            <label htmlFor="timesPlayed">Times Played</label>
            <input
              id="timesPlayed"
              type="number"
              value={formData.timesPlayed}
              onChange={(e) => setFormData(prev => ({ ...prev, timesPlayed: parseInt(e.target.value) || 0 }))}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastPlayed">Last Played</label>
            <input
              id="lastPlayed"
              type="text"
              value={formData.lastPlayed}
              onChange={(e) => setFormData(prev => ({ ...prev, lastPlayed: e.target.value }))}
              placeholder="e.g., 2024-06-15"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Update Course' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
