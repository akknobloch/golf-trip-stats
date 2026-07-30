'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { logout } from '@/lib/auth'
import { AdminCapabilities } from '@/lib/admin-data'
import Toast from '@/components/Toast'
import AdminEditBanner from '@/components/admin/AdminEditBanner'

interface AdminShellProps {
  title: string
  subtitle?: string
  capabilities: AdminCapabilities | null
  toast: {
    message: string
    type: 'success' | 'error'
    isVisible: boolean
  }
  onCloseToast: () => void
  actions?: ReactNode
  children: ReactNode
}

const navItems = [
  { href: '/admin', label: 'Trips', match: (path: string) => path === '/admin' || path.startsWith('/admin/trips') },
  { href: '/admin/players', label: 'Players', match: (path: string) => path.startsWith('/admin/players') },
  { href: '/admin/courses', label: 'Courses', match: (path: string) => path.startsWith('/admin/courses') }
]

export default function AdminShell({
  title,
  subtitle,
  capabilities,
  toast,
  onCloseToast,
  actions,
  children
}: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  return (
    <div className="container">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={onCloseToast}
      />

      <header className="header">
        <div className="header-content">
          <h1>
            <i className="fas fa-cog" aria-hidden="true"></i>
            {title}
          </h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
          <div className="admin-links">
            <Link href="/" className="btn btn-secondary">
              Dashboard
            </Link>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <AdminEditBanner capabilities={capabilities} />

        <nav className="admin-tabs" aria-label="Admin sections">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`tab-btn ${item.match(pathname) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {actions && <div className="admin-page-actions">{actions}</div>}

        {children}
      </main>
    </div>
  )
}
