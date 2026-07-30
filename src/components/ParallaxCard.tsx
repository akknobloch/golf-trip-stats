'use client'

import React, { useRef, useState, useEffect } from 'react'

interface ParallaxCardProps {
  children: React.ReactNode
  className?: string
  intensity?: number
  rotationIntensity?: number
  onClick?: () => void
}

export default function ParallaxCard({ 
  children, 
  className = '', 
  intensity = 6, 
  rotationIntensity = 2,
  onClick 
}: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isInitialized, setIsInitialized] = useState(false)
  const [motionEnabled, setMotionEnabled] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(pointer: fine)')

    const updateMotion = () => {
      setMotionEnabled(!reduceMotion.matches && finePointer.matches)
    }

    updateMotion()
    reduceMotion.addEventListener('change', updateMotion)
    finePointer.addEventListener('change', updateMotion)

    if (cardRef.current) {
      setTimeout(() => setIsInitialized(true), 100)
    }

    return () => {
      reduceMotion.removeEventListener('change', updateMotion)
      finePointer.removeEventListener('change', updateMotion)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!motionEnabled || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const normalizedX = (x / rect.width) * 2 - 1
    const normalizedY = (y / rect.height) * 2 - 1

    const smoothingFactor = isHovered ? 0.85 : 0.7
    setMousePosition(prev => ({
      x: prev.x * smoothingFactor + normalizedX * (1 - smoothingFactor),
      y: prev.y * smoothingFactor + normalizedY * (1 - smoothingFactor)
    }))
  }

  const handleMouseEnter = () => {
    if (!motionEnabled) return
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    if (!motionEnabled) return
    setIsHovered(false)
    const resetInterval = setInterval(() => {
      setMousePosition(prev => {
        const newX = prev.x * 0.8
        const newY = prev.y * 0.8
        if (Math.abs(newX) < 0.01 && Math.abs(newY) < 0.01) {
          clearInterval(resetInterval)
          return { x: 0, y: 0 }
        }
        return { x: newX, y: newY }
      })
    }, 16)
  }

  const distanceFromCenter = Math.sqrt(mousePosition.x * mousePosition.x + mousePosition.y * mousePosition.y)
  const zMovement = isHovered ? distanceFromCenter * 15 + 10 : 0
  const shadowX = mousePosition.x * 8
  const shadowY = mousePosition.y * 8
  const shadowBlur = 20 + (zMovement * 0.5)
  const shadowOpacity = 0.1 + (zMovement * 0.005)
  const scaleValue = isHovered ? 1.02 + (distanceFromCenter * 0.03) : 1

  const transformStyle = motionEnabled ? {
    transform: `
      perspective(1000px)
      rotateX(${mousePosition.y * rotationIntensity}deg)
      rotateY(${-mousePosition.x * rotationIntensity}deg)
      translateX(${mousePosition.x * intensity}px)
      translateY(${mousePosition.y * intensity}px)
      translateZ(${zMovement}px)
      scale(${scaleValue})
    `,
    boxShadow: isHovered 
      ? `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`
      : '0 4px 20px rgba(0, 0, 0, 0.08)',
    borderColor: isHovered 
      ? `rgba(5, 150, 105, ${0.3 + Math.abs(mousePosition.x + mousePosition.y) * 0.2})`
      : 'transparent',
    transition: isInitialized 
      ? (isHovered ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)')
      : 'none'
  } : undefined

  return (
    <div
      ref={cardRef}
      className={`parallax-card ${className}`}
      style={transformStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
