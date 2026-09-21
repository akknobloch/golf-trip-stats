'use client'

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref
} from 'react'
import { createPortal } from 'react-dom'

interface EllipsisTooltipProps {
  children: ReactElement<HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> }>
  content?: ReactNode
  delayMs?: number
}

type Placement = 'top' | 'bottom'

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    (ref as { current: T | null }).current = value
  }
}

function isElementTruncated(element: HTMLElement) {
  return element.scrollWidth - element.clientWidth > 1 || element.scrollHeight - element.clientHeight > 1
}

export default function EllipsisTooltip({
  children,
  content,
  delayMs = 120
}: EllipsisTooltipProps) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const showTimerRef = useRef<number | null>(null)
  const tooltipId = useId()
  const [mounted, setMounted] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement>('top')
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [positioned, setPositioned] = useState(false)
  const [measuredLabel, setMeasuredLabel] = useState('')

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
  }, [])

  const measureTruncation = useCallback(() => {
    const element = triggerRef.current
    if (!element) return false
    setMeasuredLabel(element.textContent?.trim() ?? '')
    const nextTruncated = isElementTruncated(element)
    setTruncated(nextTruncated)
    return nextTruncated
  }, [])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!trigger || !tooltip) return

    const rect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const gap = 10
    const viewportPadding = 8
    const spaceAbove = rect.top
    const nextPlacement: Placement =
      spaceAbove < tooltipRect.height + gap + viewportPadding ? 'bottom' : 'top'

    let top = nextPlacement === 'top'
      ? rect.top - tooltipRect.height - gap
      : rect.bottom + gap
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2
    const maxLeft = window.innerWidth - tooltipRect.width - viewportPadding
    left = Math.min(Math.max(viewportPadding, left), Math.max(viewportPadding, maxLeft))
    top = Math.min(
      Math.max(viewportPadding, top),
      window.innerHeight - tooltipRect.height - viewportPadding
    )

    setPlacement(nextPlacement)
    setCoords({ top, left })
    setPositioned(true)
  }, [])

  const show = useCallback(() => {
    if (!measureTruncation()) {
      setOpen(false)
      return
    }

    clearShowTimer()
    showTimerRef.current = window.setTimeout(() => {
      setOpen(true)
    }, delayMs)
  }, [clearShowTimer, delayMs, measureTruncation])

  const hide = useCallback(() => {
    clearShowTimer()
    setOpen(false)
    setPositioned(false)
  }, [clearShowTimer])

  useEffect(() => {
    setMounted(true)
    return () => clearShowTimer()
  }, [clearShowTimer])

  useLayoutEffect(() => {
    measureTruncation()
  }, [measureTruncation, children])

  useEffect(() => {
    const element = triggerRef.current
    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      const stillTruncated = measureTruncation()
      if (!stillTruncated) hide()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [hide, measureTruncation])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition, content, children])

  useEffect(() => {
    if (!open) return

    const onReposition = () => updatePosition()
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open, updatePosition])

  if (!isValidElement(children)) {
    return children
  }

  const child = children
  const tooltipContent = content ?? measuredLabel

  const trigger = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node
      assignRef((child as unknown as { ref?: Ref<HTMLElement> }).ref, node)
    },
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      child.props.onMouseEnter?.(event)
      show()
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      child.props.onMouseLeave?.(event)
      hide()
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      child.props.onFocus?.(event)
      show()
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      child.props.onBlur?.(event)
      hide()
    },
    'aria-describedby': truncated && open ? tooltipId : child.props['aria-describedby']
  })

  return (
    <>
      {trigger}
      {mounted && open && truncated && tooltipContent != null && tooltipContent !== ''
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="ellipsis-tooltip"
              data-placement={placement}
              data-ready={positioned ? 'true' : 'false'}
              style={{ top: coords.top, left: coords.left }}
            >
              {tooltipContent}
            </div>,
            document.body
          )
        : null}
    </>
  )
}
