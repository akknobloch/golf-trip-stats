import Link from 'next/link'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: string
  actionHref?: string
  actionLabel?: string
}

export default function EmptyState({
  title,
  description,
  icon = 'fa-flag',
  actionHref,
  actionLabel = 'Dashboard'
}: EmptyStateProps) {
  return (
    <div className="empty-state surface-panel">
      <div className="empty-state-icon" aria-hidden="true">
        <i className={`fas ${icon}`}></i>
      </div>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actionHref ? (
        <Link href={actionHref} className="btn btn-secondary">
          <i className="fas fa-arrow-left" aria-hidden="true"></i> {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
