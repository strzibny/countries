"use client"

import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/providers/sidebar-provider'
import { DashboardHeader } from './header'

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className={cn(
      "transition-all duration-300",
      isCollapsed ? "lg:pl-16" : "lg:pl-64"
    )}>
      <DashboardHeader />
      <main className="py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
