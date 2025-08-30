'use client'

import { useState } from 'react'
import { TripPhoto } from '@/lib/types'

interface PhotoGalleryProps {
  photos: TripPhoto[]
  title?: string
  className?: string
}

export default function PhotoGallery({ photos, title, className = '' }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openModal = (photo: TripPhoto, index: number) => {
    setSelectedPhoto(photo)
    setCurrentIndex(index)
  }

  const closeModal = () => {
    setSelectedPhoto(null)
    setCurrentIndex(0)
  }

  const nextPhoto = () => {
    if (selectedPhoto && currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedPhoto(photos[currentIndex + 1])
    }
  }

  const prevPhoto = () => {
    if (selectedPhoto && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setSelectedPhoto(photos[currentIndex - 1])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal()
    } else if (e.key === 'ArrowRight') {
      nextPhoto()
    } else if (e.key === 'ArrowLeft') {
      prevPhoto()
    }
  }

  if (photos.length === 0) {
    return (
      <div className={`photo-gallery-empty ${className}`}>
        <div className="empty-state">
          <i className="fas fa-camera"></i>
          <p>No photos yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`photo-gallery ${className}`}>
      {title && <h3 className="gallery-title">{title}</h3>}
      
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div 
            key={photo.id} 
            className="photo-item"
            onClick={() => openModal(photo, index)}
          >
            <div className="photo-thumbnail">
              <img 
                src={photo.thumbnailUrl || photo.url} 
                alt={photo.caption || `Trip photo ${index + 1}`}
                loading="lazy"
              />
              <div className="photo-overlay">
                <i className="fas fa-expand"></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedPhoto && (
        <div 
          className="photo-modal-overlay"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-info">
                <span className="photo-counter">
                  {currentIndex + 1} of {photos.length}
                </span>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.caption || `Trip photo ${currentIndex + 1}`}
                className="modal-image"
              />
            </div>

            <div className="modal-navigation">
              <button 
                className="nav-btn prev-btn" 
                onClick={prevPhoto}
                disabled={currentIndex === 0}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                className="nav-btn next-btn" 
                onClick={nextPhoto}
                disabled={currentIndex === photos.length - 1}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
