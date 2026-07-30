type LoadingStateProps = {
  label?: string
  variant?: 'page' | 'inline'
}

export default function LoadingState({
  label = 'Loading...',
  variant = 'page'
}: LoadingStateProps) {
  return (
    <div className={`loading-state loading-state-${variant}`} role="status" aria-live="polite">
      <div className="loading-pulse" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>{label}</p>
    </div>
  )
}
