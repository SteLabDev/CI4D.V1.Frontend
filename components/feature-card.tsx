import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function FeatureCard({
  href,
  icon: Icon,
  title,
  description,
  cta,
  beta = false,
  style,
}: {
  href: string
  icon: LucideIcon
  title: string
  description: string
  cta: string
  beta?: boolean
  style?: React.CSSProperties
}) {
  return (
    <Link
      href={href}
      style={style}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-8 text-left',
        'shadow-sm transition-all duration-300 ease-out',
        'hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10',
        'animate-rise',
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="flex items-start justify-between">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
          <Icon className="size-7" />
        </span>
        {beta && <Badge variant="beta">Beta</Badge>}
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-pretty leading-relaxed text-muted-foreground">
        {description}
      </p>

      <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 group-hover:gap-3 group-hover:shadow-md group-hover:shadow-primary/20 w-fit">
        {cta}
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
