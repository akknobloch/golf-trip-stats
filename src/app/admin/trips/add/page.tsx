import { redirect } from 'next/navigation'

export default function LegacyAdminTripsAddPage() {
  redirect('/admin/trips/new')
}
