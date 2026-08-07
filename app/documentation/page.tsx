import Link from 'next/link'
import { ArrowUpRight, BookOpen, Layers3, Rocket, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TopNav } from '@/components/top-nav'

const docs: {
  icon: LucideIcon
  title: string
  description: string
  href: string
}[] = [
  {
    icon: Rocket,
    title: 'Getting Started',
    description: 'Install CI4D, connect your printer and run your first optimized slice.',
    href: '#getting-started',
  },
  {
    icon: Layers3,
    title: 'Slicer AI',
    description: 'Understand print profiles, materials and AI-assisted slicing settings.',
    href: '#slicer',
  },
  {
    icon: Sparkles,
    title: 'Create AI',
    description: 'Generate printable 3D models from text prompts and reference images.',
    href: '#create',
  },
  {
    icon: BookOpen,
    title: 'Reference',
    description: 'Supported formats, keyboard shortcuts and configuration reference.',
    href: '#reference',
  },
]

export default function DocumentationPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <TopNav />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
        <p className="mt-1.5 max-w-xl text-muted-foreground">
          Everything you need to master professional 3D printing with CI4D.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {docs.map((doc) => {
            const Icon = doc.icon
            return (
              <Link
                key={doc.title}
                href={doc.href}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <h2 className="mt-4 font-semibold tracking-tight">{doc.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {doc.description}
                </p>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
