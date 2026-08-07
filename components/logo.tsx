import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-[28%] bg-primary text-primary-foreground shadow-sm',
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-[62%]"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
        <path d="M3.5 7 12 11.75 20.5 7" />
        <path d="M12 11.75V21.5" />
      </svg>
    </span>
  )
}

export function Logo({
  className,
  showText = true,
  size = 'md',
}: {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const mark = { sm: 'size-6', md: 'size-8', lg: 'size-9' }[size]
  const text = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' }[size]
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={mark} />
      {showText && (
        <span className={cn('font-semibold tracking-tight', text)}>
          CI<span className="text-primary">4</span>D
        </span>
      )}
    </span>
  )
}
