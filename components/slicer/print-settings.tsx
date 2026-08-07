'use client'

import { useState } from 'react'
import {
  Box,
  Gauge,
  Layers,
  Package,
  Ruler,
  Sparkles,
  TerminalSquare,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Select, type SelectOption } from '@/components/ui/select'

type SettingField = {
  key: string
  label: string
  icon: LucideIcon
  options: SelectOption[]
  default: string
}

const opts = (...values: string[]): SelectOption[] =>
  values.map((v) => ({ label: v, value: v }))

const fields: SettingField[] = [
  {
    key: 'printer',
    label: 'Printer',
    icon: Package,
    options: opts('Bambu Lab X1 Carbon', 'Prusa MK4', 'Creality K1 Max', 'Voron 2.4'),
    default: 'Bambu Lab X1 Carbon',
  },
  {
    key: 'material',
    label: 'Material',
    icon: Box,
    options: opts('PLA', 'PETG', 'ABS', 'TPU', 'ASA'),
    default: 'PLA',
  },
  {
    key: 'nozzle',
    label: 'Nozzle',
    icon: TerminalSquare,
    options: opts('0.2 mm', '0.4 mm', '0.6 mm', '0.8 mm'),
    default: '0.4 mm',
  },
  {
    key: 'layer',
    label: 'Layer Goal',
    icon: Ruler,
    options: opts('0.08 mm', '0.12 mm', '0.16 mm', '0.20 mm', '0.28 mm'),
    default: '0.20 mm',
  },
  {
    key: 'quality',
    label: 'Quality',
    icon: Sparkles,
    options: opts('Draft', 'Standard', 'High', 'Ultra'),
    default: 'Standard',
  },
  {
    key: 'speed',
    label: 'Speed',
    icon: Zap,
    options: opts('Silent', 'Balanced', 'Sport', 'Ludicrous'),
    default: 'Balanced',
  },
  {
    key: 'supports',
    label: 'Supports',
    icon: Layers,
    options: opts('None', 'Touching Buildplate', 'Everywhere', 'Tree'),
    default: 'Touching Buildplate',
  },
]

function SettingCard({ field }: { field: SettingField }) {
  const [value, setValue] = useState(field.default)
  const Icon = field.icon
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-primary/30">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <span className="text-sm font-medium">{field.label}</span>
      </div>
      <Select options={field.options} value={value} onChange={setValue} />
    </div>
  )
}

export function PrintSettings() {
  return (
    <aside className="flex w-full flex-col border-border lg:h-full lg:w-[340px] lg:border-l">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Gauge className="size-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">Print Settings</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {fields.map((field) => (
          <SettingCard key={field.key} field={field} />
        ))}
      </div>
    </aside>
  )
}
