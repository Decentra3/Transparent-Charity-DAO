'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutDashboard, HandCoins, Vote, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_HEIGHT = 64

export function MobileNav() {
  const pathname = usePathname()

  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: HandCoins },
    { href: '/vote', label: 'Vote', icon: Vote },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-[hsl(var(--background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/70 md:hidden"
      style={{ height: NAV_HEIGHT }}
      aria-label="Bottom Navigation"
    >
      <ul className="grid grid-cols-5 h-full">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <li key={item.href} className="h-full">
              <Link
                href={item.href}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-xs',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export const MOBILE_NAV_HEIGHT = NAV_HEIGHT


