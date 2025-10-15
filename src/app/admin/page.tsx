import AdminDashboard from '@/components/AdminDashboard'
import { getCurrentAdminSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getCurrentAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return <AdminDashboard adminEmail={session.email} />
}