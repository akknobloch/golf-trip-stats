'use client'

import { AdminCapabilities } from '@/lib/admin-data'

interface AdminEditBannerProps {
  capabilities: AdminCapabilities | null
}

export default function AdminEditBanner({ capabilities }: AdminEditBannerProps) {
  if (!capabilities) return null

  if (capabilities.canEdit) {
    return (
      <div className="admin-banner admin-banner-dev" role="status">
        <i className="fas fa-laptop-code" aria-hidden="true"></i>
        <div>
          <strong>Local editing enabled.</strong>
          <span> Changes write to <code>src/data/golf-data.ts</code>. Commit and redeploy to update production.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-banner admin-banner-prod" role="status">
      <i className="fas fa-lock" aria-hidden="true"></i>
      <div>
        <strong>Production is view-only.</strong>
        <span> Editing only works on localhost. Run the app locally, save changes, commit <code>src/data/golf-data.ts</code>, then redeploy.</span>
      </div>
    </div>
  )
}
