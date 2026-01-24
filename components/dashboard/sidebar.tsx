"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Settings,
  X,
  LogOut,
  PanelLeftClose,
  Home,
  Globe
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useSidebar } from '@/components/providers/sidebar-provider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Lists', href: '/lists', icon: Globe },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface NavItemProps {
  item: { name: string; href: string; icon: React.ElementType }
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}

function NavItem({ item, isActive, isCollapsed, onClick }: NavItemProps) {
  const linkContent = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isCollapsed && "justify-center px-2",
        isActive
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <item.icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-900"
        )}
      />
      {!isCollapsed && item.name}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
          {item.name}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

interface LogoutButtonProps {
  isCollapsed: boolean
  onClick: () => void
}

function LogoutButton({ isCollapsed, onClick }: LogoutButtonProps) {
  const buttonContent = (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-red-600 hover:bg-red-50 hover:text-red-700",
        isCollapsed && "justify-center px-2"
      )}
    >
      <LogOut className="h-5 w-5 shrink-0 transition-colors text-red-500 group-hover:text-red-600" />
      {!isCollapsed && "Logout"}
    </button>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
          Logout
        </TooltipContent>
      </Tooltip>
    )
  }

  return buttonContent
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { signOut } = useAuth()
  const { isCollapsed, toggleCollapse } = useSidebar()

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => {
    const collapsed = isMobile ? false : isCollapsed

    return (
      <>
        <div className={cn(
          "flex shrink-0 items-center border-b border-gray-200",
          collapsed ? "justify-center h-16 px-2" : "h-16 justify-between px-6"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            {!collapsed && <span className="text-lg font-semibold text-gray-900">Starter</span>}
          </Link>
          {!isMobile && !collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-900 h-8 w-8"
              onClick={toggleCollapse}
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          )}
        </div>
        <nav className={cn("flex flex-1 flex-col py-4", collapsed ? "px-2" : "px-4")}>
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <NavItem
                    item={item}
                    isActive={isActive}
                    isCollapsed={collapsed}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                </li>
              )
            })}
          </ul>
          <ul role="list" className="mt-auto space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <NavItem
                    item={item}
                    isActive={isActive}
                    isCollapsed={collapsed}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                </li>
              )
            })}
            <li>
              <LogoutButton
                isCollapsed={collapsed}
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut()
                }}
              />
            </li>
          </ul>
        </nav>
      </>
    )
  }

  return (
    <TooltipProvider>
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:hidden",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-4 text-gray-400 hover:text-gray-900"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
        <NavLinks isMobile />
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
        isCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 relative">
          <NavLinks />
        </div>
      </div>

      {/* Mobile menu button - this is triggered from header */}
      <div id="mobile-menu-trigger" data-open={mobileMenuOpen} className="hidden">
        <button onClick={() => setMobileMenuOpen(true)}>Open</button>
      </div>
    </TooltipProvider>
  )
}

// Export a hook to control mobile menu from header
export function useMobileMenu() {
  const trigger = () => {
    const triggerEl = document.getElementById('mobile-menu-trigger')
    if (triggerEl) {
      const isOpen = triggerEl.getAttribute('data-open') === 'true'
      const button = triggerEl.querySelector('button')
      if (button && !isOpen) {
        button.click()
      }
    }
  }
  return { trigger }
}
