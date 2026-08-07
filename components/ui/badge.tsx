import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'beta' | 'muted' | 'outline'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  beta: 'bg-[oklch(0.9_0.14_95)] text-[oklch(0.35_0.09_80)] dark:bg-[oklch(0.85_0.15_95)] dark:text-[oklch(0.25_0.08_80)]',
  muted: 'bg-muted text-muted-foreground',
  outline: 'border border-border text-muted-foreground',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
