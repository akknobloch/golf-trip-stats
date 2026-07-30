'use client'

import { useState } from 'react'
import LoadingState from '@/components/LoadingState'
import AdminShell from '@/components/admin/AdminShell'
import CourseEditForm from '@/components/CourseEditForm'
import { useAdminDataset } from '@/hooks/useAdminDataset'
import { createId } from '@/lib/admin-data'
import { Course } from '@/lib/types'

export default function AdminCoursesPage() {
  const {
    dataset,
    capabilities,
    canEdit,
    loading,
    saving,
    toast,
    closeToast,
    saveDataset
  } = useAdminDataset()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (loading || !dataset) {
    return <LoadingState label="Loading courses…" />
  }

  const addCourse = async (courseData: Omit<Course, 'id'>) => {
    if (!canEdit) return
    const result = await saveDataset({
      ...dataset,
      courses: [...dataset.courses, { ...courseData, id: createId() }]
    })
    if (result.success) setShowAdd(false)
  }

  const updateCourse = async (id: string, courseData: Omit<Course, 'id'>) => {
    if (!canEdit) return
    const result = await saveDataset({
      ...dataset,
      courses: dataset.courses.map(course =>
        course.id === id ? { ...course, ...courseData } : course
      )
    })
    if (result.success) setEditingId(null)
  }

  const deleteCourse = async (id: string) => {
    if (!canEdit) return
    if (!confirm('Delete this course and all rounds played on it?')) return
    await saveDataset({
      ...dataset,
      courses: dataset.courses.filter(course => course.id !== id),
      rounds: dataset.rounds.filter(round => round.courseId !== id)
    })
  }

  return (
    <AdminShell
      title="Courses"
      subtitle="Secondary management for course list"
      capabilities={capabilities}
      toast={toast}
      onCloseToast={closeToast}
      actions={
        canEdit ? (
          <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <i className="fas fa-plus" aria-hidden="true"></i> Add Course
          </button>
        ) : null
      }
    >
      <div className="admin-section">
        <div className="admin-grid">
          {[...dataset.courses]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(course => {
              const courseRounds = dataset.rounds.filter(round => round.courseId === course.id)
              const uniqueTrips = new Set(courseRounds.map(round => round.tripId))
              return (
                <div key={course.id} className="admin-card">
                  <div className="card-header">
                    <h3>{course.name}</h3>
                    {canEdit && (
                      <div className="card-actions">
                        <button type="button" className="btn btn-edit" onClick={() => setEditingId(course.id)}>
                          <i className="fas fa-edit" aria-hidden="true"></i>
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => deleteCourse(course.id)} disabled={saving}>
                          <i className="fas fa-trash" aria-hidden="true"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="card-content">
                    <p><strong>Location:</strong> {course.location}</p>
                    <p><strong>Par:</strong> {course.par}</p>
                    <p><strong>Times played:</strong> {uniqueTrips.size}</p>
                    <p><strong>Rounds:</strong> {courseRounds.length}</p>
                  </div>
                </div>
              )
            })}
        </div>

        {showAdd && (
          <CourseEditForm
            onSave={addCourse}
            onCancel={() => setShowAdd(false)}
            isEditing={false}
          />
        )}

        {editingId && (
          <CourseEditForm
            course={dataset.courses.find(course => course.id === editingId)}
            onSave={courseData => updateCourse(editingId, courseData)}
            onCancel={() => setEditingId(null)}
            isEditing
          />
        )}
      </div>
    </AdminShell>
  )
}
