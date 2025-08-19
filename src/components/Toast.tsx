'use client'

import { useState, useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
  onClose: () => void
}

export default function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000) // Auto hide after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const toastStyles = {
    success: {
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      icon: 'fas fa-check-circle',
      borderColor: '#10b981'
    },
    error: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      icon: 'fas fa-exclamation-circle',
      borderColor: '#f87171'
    }
  }

  const style = toastStyles[type]

  return (
    <div 
      className="toast-notification"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        minWidth: '300px',
        maxWidth: '400px',
        background: style.background,
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '15px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        border: `2px solid ${style.borderColor}`,
        animation: 'toastSlideIn 0.3s ease',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <i 
            className={style.icon}
            style={{ fontSize: '1.2rem' }}
          ></i>
          <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>
            {message}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '5px',
            marginLeft: '1rem',
            transition: 'all 0.2s ease',
            opacity: '0.8'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8'
            e.currentTarget.style.background = 'none'
          }}
        >
          <i className="fas fa-times" style={{ fontSize: '1rem' }}></i>
        </button>
      </div>
      
      <style jsx>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @media (max-width: 768px) {
          .toast-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            min-width: auto;
            max-width: none;
          }
        }
      `}</style>
    </div>
  )
}
