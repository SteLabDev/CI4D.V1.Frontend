'use client'

import { useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Select } from '@/components/ui/select'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' },
  { label: 'Deutsch', value: 'de' },
  { label: '日本語', value: 'ja' },
  { label: '中文', value: 'zh' },
]

function Row({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border py-6 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SectionCard({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      <div className="rounded-3xl border border-border bg-card px-6 shadow-sm">
        {children}
      </div>
    </section>
  )
}

export function SettingsPanels() {
  const { theme, setTheme } = useTheme()
  const [language, setLanguage] = useState('en')

  return (
    <div className="space-y-8">
      <SectionCard label="Appearance">
        <Row title="Theme" description="Choose how CI4D looks on this device.">
          <div className="inline-flex rounded-xl border border-border bg-background p-1">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const active = theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </Row>
      </SectionCard>

      <SectionCard label="General">
        <Row title="Language" description="Set your preferred interface language.">
          <Select
            options={languages}
            value={language}
            onChange={setLanguage}
            className="w-48"
          />
        </Row>
      </SectionCard>

      <SectionCard label="About CI4D">
        <div className="py-6">
          <div className="flex items-center justify-between gap-4">
            <Logo size="lg" />
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Version 1.0.0
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            CI4D — Creative Intelligence for 3D. Artificial Intelligence for
            Professional 3D Printing, bringing intelligent slicing and generative
            modeling into one elegant workspace.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-muted px-2.5 py-1">Terms</span>
            <span className="rounded-md bg-muted px-2.5 py-1">Privacy</span>
            <span className="rounded-md bg-muted px-2.5 py-1">Licenses</span>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
