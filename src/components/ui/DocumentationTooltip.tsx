import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  content: string
  children: React.ReactNode
}

export default function DocumentationTooltip({ content, children }: Props) {
  const [visible, setVisible] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const showTimerRef = useRef<number>(0)
  const hideTimerRef = useRef<number>(0)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const show = useCallback(() => {
    clearTimeout(hideTimerRef.current)
    showTimerRef.current = window.setTimeout(() => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        setCoords({ top: rect.bottom + 6, left: rect.left })
      }
      setVisible(true)
    }, 300)
  }, [])

  const hide = useCallback(() => {
    clearTimeout(showTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => setVisible(false), 100)
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(showTimerRef.current)
      clearTimeout(hideTimerRef.current)
    }
  }, [])

  return (
    <span
      ref={wrapperRef}
      className="sim-doc-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      <span className="sim-doc-icon" aria-label="Más información">i</span>
      {visible && createPortal(
        <span className="sim-doc-tooltip" style={{ top: coords.top, left: coords.left }}>
          {content}
        </span>,
        document.body
      )}
    </span>
  )
}
