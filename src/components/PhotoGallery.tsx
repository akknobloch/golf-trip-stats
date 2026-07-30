'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TripPhoto } from '@/lib/types'

interface PhotoGalleryProps {
  photos: TripPhoto[]
  title?: string
  className?: string
}

export default function PhotoGallery({ photos, title, className = '' }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const isOpen = selectedPhoto !== null

  useEffect(() => {
    setMounted(true)
  }, [])

  const openModal = (photo: TripPhoto, index: number) => {
    setSelectedPhoto(photo)
    setCurrentIndex(index)
  }

  const closeModal = () => {
    setSelectedPhoto(null)
    setCurrentIndex(0)
  }

  const goToIndex = (index: number) => {
    if (index < 0 || index >= photos.length) {
      return
    }
    setCurrentIndex(index)
    setSelectedPhoto(photos[index])
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null)
        setCurrentIndex(0)
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => {
          const next = Math.min(prev + 1, photos.length - 1)
          setSelectedPhoto(photos[next])
          return next
        })
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => {
          const next = Math.max(prev - 1, 0)
          setSelectedPhoto(photos[next])
          return next
        })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    overlayRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, photos])

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

  const modal = selectedPhoto && (
    <div
      ref={overlayRef}
      className="photo-modal-overlay"
      onClick={closeModal}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="photo-modal-header">
          <div className="photo-modal-info">
            <span className="photo-counter">
              {currentIndex + 1} of {photos.length}
            </span>
            {selectedPhoto.caption && (
              <span className="photo-caption-modal">{selectedPhoto.caption}</span>
            )}
          </div>
          <button
            type="button"
            className="photo-modal-close"
            onClick={closeModal}
            aria-label="Close photo viewer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="photo-modal-body">
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || `Trip photo ${currentIndex + 1}`}
            className="photo-modal-image"
          />
        </div>

        {photos.length > 1 && (
          <div className="photo-modal-navigation">
            <button
              type="button"
              className="photo-nav-btn photo-prev-btn"
              onClick={() => goToIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              aria-label="Previous photo"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              type="button"
              className="photo-nav-btn photo-next-btn"
              onClick={() => goToIndex(currentIndex + 1)}
              disabled={currentIndex === photos.length - 1}
              aria-label="Next photo"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`photo-gallery ${className}`}>
      {title && <h3 className="gallery-title">{title}</h3>}

      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="photo-item"
            onClick={() => openModal(photo, index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openModal(photo, index)
              }
            }}
            aria-label={`View ${photo.caption || `photo ${index + 1}`} full screen`}
          >
            <div className="photo-thumbnail">
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || `Trip photo ${index + 1}`}
                loading="lazy"
              />
              <div className="photo-overlay" aria-hidden="true">
                <i className="fas fa-expand"></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </div>
  )
}
