'use client'

import { useState, useRef } from 'react'
import { TripPhoto } from '@/lib/types'

interface PhotoUploadProps {
  onPhotosAdded: (photos: TripPhoto[]) => void
  existingPhotos?: TripPhoto[]
  className?: string
}

export default function PhotoUpload({ onPhotosAdded, existingPhotos = [], className = '' }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      alert('Please select image files only.')
      return
    }

    setUploading(true)

    try {
      const newPhotos: TripPhoto[] = []

      for (const file of imageFiles) {
        // For now, we'll create a data URL as a placeholder
        // In a real app, you'd upload to a cloud service like AWS S3, Cloudinary, etc.
        const photoUrl = await createDataURL(file)
        const thumbnailUrl = await createThumbnail(file)
        
        const photo: TripPhoto = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: photoUrl,
          thumbnailUrl: thumbnailUrl,
          caption: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension for caption
          date: new Date().toISOString()
        }
        
        newPhotos.push(photo)
      }

      onPhotosAdded([...existingPhotos, ...newPhotos])
    } catch (error) {
      console.error('Error processing photos:', error)
      alert('Error processing photos. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const createDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate thumbnail dimensions (max 400x400 for better quality)
        const maxSize = 400
        let { width, height } = img
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Enable image smoothing for better quality
        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
        }
        
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
      
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const removePhoto = (photoId: string) => {
    const updatedPhotos = existingPhotos.filter(photo => photo.id !== photoId)
    onPhotosAdded(updatedPhotos)
  }

  const updatePhotoCaption = (photoId: string, caption: string) => {
    const updatedPhotos = existingPhotos.map(photo => 
      photo.id === photoId ? { ...photo, caption } : photo
    )
    onPhotosAdded(updatedPhotos)
  }

  return (
    <div className={`photo-upload ${className}`}>
      <h3>📸 Trip Photos</h3>
      
      {/* Upload Area */}
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          {uploading ? (
            <div className="upload-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Processing photos...</p>
            </div>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt"></i>
              <p>Drop photos here or click to select</p>
              <small>Supports JPG, PNG, GIF</small>
            </>
          )}
        </div>
      </div>

      {/* Existing Photos */}
      {existingPhotos.length > 0 && (
        <div className="existing-photos">
          <h4>Current Photos ({existingPhotos.length})</h4>
          <div className="photo-list">
            {existingPhotos.map((photo, index) => (
              <div key={photo.id} className="photo-item-admin">
                <div className="photo-preview">
                  <img 
                    src={photo.thumbnailUrl || photo.url} 
                    alt={photo.caption || `Photo ${index + 1}`}
                  />
                  <button 
                    className="remove-photo"
                    onClick={() => removePhoto(photo.id)}
                    title="Remove photo"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <input
                  type="text"
                  value={photo.caption || ''}
                  onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                  placeholder="Add caption..."
                  className="photo-caption-input"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
