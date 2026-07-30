'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

type PageShellProps = {
  title: string
  subtitle?: ReactNode
  icon?: string
  backHref?: string
  backLabel?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export default function PageShell({
  title,
  subtitle,
  icon,
  backHref,
  backLabel = 'Dashboard',
  actions,
  children,
  className = ''
}: PageShellProps) {
  return (
    <div className={`container page-shell ${className}`.trim()}>
      <header className="header">
        <div className={`header-content${backHref ? ' has-back' : ''}`.trim()}>
          {backHref ? (
            <Link href={backHref} className="back-link">
              <i className="fas fa-arrow-left" aria-hidden="true"></i>
              {backLabel}
            </Link>
          ) : null}

          <h1>
            {icon ? <i className={`fas ${icon}`} aria-hidden="true"></i> : null}
            {title}
          </h1>
          {subtitle ? <div className="header-subtitle">{subtitle}</div> : null}
          {actions ? <div className="admin-links">{actions}</div> : null}
        </div>
      </header>
      <main className="main-content page-enter">{children}</main>
    </div>
  )
}
