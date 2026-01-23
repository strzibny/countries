import { RequireAuth } from '@/components/auth/require-auth'
import { SidebarProvider } from '@/components/providers/sidebar-provider'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireAuth>
      <SidebarProvider>
        <div className="min-h-screen bg-gray-50">
          <DashboardSidebar />
          <DashboardContent>
            {children}
          </DashboardContent>
        </div>
      </SidebarProvider>
    </RequireAuth>
  )
}
