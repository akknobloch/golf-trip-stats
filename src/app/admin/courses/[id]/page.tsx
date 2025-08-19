'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Course } from '@/lib/types'
import Link from 'next/link'

// Required for static export - returns empty array since this is client-side
export async function generateStaticParams() {
  return []
}

export default function EditCourse() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    par: 72,
    description: '',
    imageUrl: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load existing course data
    const loadCourse = () => {
      try {
        const existingCourses = JSON.parse(localStorage.getItem('golfCourses') || '[]')
        const course = existingCourses.find((c: Course) => c.id === courseId)
        
        if (!course) {
          setError('Course not found')
          setLoading(false)
          return
        }
        
        setFormData({
          name: course.name,
          location: course.location,
          par: course.par,
          description: course.description || '',
          imageUrl: course.imageUrl || ''
        })
        setLoading(false)
      } catch (error) {
        console.error('Error loading course:', error)
        setError('Error loading course data')
        setLoading(false)
      }
    }
    
    loadCourse()
  }, [courseId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Load existing courses and update the specific one
      const existingCourses = JSON.parse(localStorage.getItem('golfCourses') || '[]')
      const updatedCourses = existingCourses.map((course: Course) => 
        course.id === courseId 
          ? { 
              ...course, 
              name: formData.name,
              location: formData.location,
              par: formData.par,
              description: formData.description || undefined,
              imageUrl: formData.imageUrl || undefined
            }
          : course
      )
      
      localStorage.setItem('golfCourses', JSON.stringify(updatedCourses))
      router.push('/admin?tab=courses&message=Course%20updated%20successfully&type=success')
    } catch (error) {
      console.error('Error updating course:', error)
      router.push('/admin?tab=courses&message=Error%20updating%20course&type=error')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'par' ? parseInt(value) || 72 : value
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
          <Link href="/admin?tab=courses" className="btn btn-primary">
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
          <h1><i className="fas fa-flag"></i> Edit Course</h1>
          <p>Update course information</p>
          <div className="admin-links">
            <Link href="/admin?tab=courses" className="btn btn-secondary">
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
              <Link href="/admin?tab=courses" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Update Course
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
