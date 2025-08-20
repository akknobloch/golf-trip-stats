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
  intensity = 15, 
  rotationIntensity = 5,
  onClick 
}: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cardRect, setCardRect] = useState({ width: 0, height: 0 })
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      setCardRect({ width: rect.width, height: rect.height })
      // Small delay to ensure smooth initial render
      setTimeout(() => setIsInitialized(true), 100)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate normalized position (-1 to 1)
    const normalizedX = (x / rect.width) * 2 - 1
    const normalizedY = (y / rect.height) * 2 - 1

    // Add more smoothing to the movement for less jerky transitions
    const smoothingFactor = isHovered ? 0.85 : 0.7 // More smoothing when not hovered
    setMousePosition(prev => ({
      x: prev.x * smoothingFactor + normalizedX * (1 - smoothingFactor),
      y: prev.y * smoothingFactor + normalizedY * (1 - smoothingFactor)
    }))
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    // Smoothly reset mouse position instead of jumping to 0
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
    }, 16) // 60fps
  }

  // Calculate Z-axis movement based on mouse distance from center with easing
  const distanceFromCenter = Math.sqrt(mousePosition.x * mousePosition.x + mousePosition.y * mousePosition.y)
  const zMovement = isHovered ? distanceFromCenter * 15 + 10 : 0
  
  // Calculate dynamic shadow based on mouse position and Z movement
  const shadowX = mousePosition.x * 8
  const shadowY = mousePosition.y * 8
  const shadowBlur = 20 + (zMovement * 0.5)
  const shadowOpacity = 0.1 + (zMovement * 0.005)
  
  // Add easing to the scale for smoother transitions
  const scaleValue = isHovered ? 1.02 + (distanceFromCenter * 0.03) : 1
  
  const transformStyle = {
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
  }

  return (
    <div
      ref={cardRef}
      className={`parallax-card ${className}`}
      style={transformStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
