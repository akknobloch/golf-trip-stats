'use client'

import React, { useEffect, useRef } from 'react'

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
  const rafRef = useRef<number | null>(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const hoveredRef = useRef(false)
  const reducedMotionRef = useRef(false)

  const applyTransform = (x: number, y: number, hovered: boolean) => {
    const card = cardRef.current
    if (!card) return

    if (reducedMotionRef.current) {
      card.style.transform = ''
      card.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)'
      card.style.borderColor = 'transparent'
      return
    }

    const distanceFromCenter = Math.sqrt(x * x + y * y)
    const zMovement = hovered ? distanceFromCenter * 15 + 10 : 0
    const scaleValue = hovered ? 1.02 + distanceFromCenter * 0.03 : 1
    const shadowX = x * 8
    const shadowY = y * 8
    const shadowBlur = 20 + zMovement * 0.5
    const shadowOpacity = 0.1 + zMovement * 0.005

    card.style.transform = `
      perspective(1000px)
      rotateX(${y * rotationIntensity}deg)
      rotateY(${-x * rotationIntensity}deg)
      translateX(${x * intensity}px)
      translateY(${y * intensity}px)
      translateZ(${zMovement}px)
      scale(${scaleValue})
    `
    card.style.boxShadow = hovered
      ? `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`
      : '0 4px 20px rgba(0, 0, 0, 0.08)'
    card.style.borderColor = hovered
      ? `rgba(5, 150, 105, ${0.3 + Math.abs(x + y) * 0.2})`
      : 'transparent'
  }

  const tick = () => {
    const smoothing = hoveredRef.current ? 0.85 : 0.7
    const current = currentRef.current
    const target = targetRef.current

    current.x = current.x * smoothing + target.x * (1 - smoothing)
    current.y = current.y * smoothing + target.y * (1 - smoothing)

    applyTransform(current.x, current.y, hoveredRef.current)

    const settled =
      Math.abs(current.x - target.x) < 0.001 &&
      Math.abs(current.y - target.y) < 0.001 &&
      Math.abs(current.x) < 0.001 &&
      Math.abs(current.y) < 0.001

    if (!settled || hoveredRef.current) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      rafRef.current = null
      applyTransform(0, 0, false)
    }
  }

  const ensureAnimating = () => {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const card = cardRef.current
    if (card) {
      card.style.transition = 'box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      card.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)'
      card.style.borderColor = 'transparent'
    }

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotionRef.current || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    targetRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1
    }
    ensureAnimating()
  }

  const handleMouseEnter = () => {
    hoveredRef.current = true
    ensureAnimating()
  }

  const handleMouseLeave = () => {
    hoveredRef.current = false
    targetRef.current = { x: 0, y: 0 }
    ensureAnimating()
  }

  return (
    <div
      ref={cardRef}
      className={`parallax-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
