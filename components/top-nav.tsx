'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Settings, User } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Documentation', href: '/documentation' },
  { label: 'Settings', href: '/settings' },
]

function AccountButton() {
  return (
    <button
      type="button"
      aria-label="Account"
      className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:text-foreground hover:border-primary/40"
    >
      <User className="size-[18px]" />
    </button>
  )
}

export type Crumb = { label: string; href?: string }

export function TopNav({ breadcrumb }: { breadcrumb?: Crumb[] }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
            <Logo />
          </Link>

          {breadcrumb && breadcrumb.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex min-w-0"
            >
              <span className="h-4 w-px bg-border" />
              {breadcrumb.map((crumb, i) => {
                const last = i === breadcrumb.length - 1
                return (
                  <span key={crumb.label} className="flex items-center gap-1.5 min-w-0">
                    {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
                    {crumb.href && !last ? (
                      <Link
                        href={crumb.href}
                        className="truncate transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={cn('truncate', last && 'font-medium text-foreground')}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </span>
                )
              })}
            </nav>
          )}
        </div>

        {!breadcrumb && (
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {breadcrumb && (
            <Link
              href="/settings"
              aria-label="Settings"
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:text-foreground hover:border-primary/40"
            >
              <Settings className="size-[18px]" />
            </Link>
          )}
          <ThemeToggle />
          <AccountButton />
        </div>
      </div>
    </header>
  )
}
