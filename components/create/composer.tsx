'use client'

import { useRef, useState } from 'react'
import { Box, ImagePlus, Sparkles, Wand2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Composer() {
  const [prompt, setPrompt] = useState('')
  const [imageName, setImageName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm transition-all focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Describe the 3D model you want to create — e.g. a low-poly desert fox figurine with a smooth base..."
          className="w-full resize-none bg-transparent px-2 pt-1 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) =>
                setImageName(e.target.files?.[0]?.name ?? null)
              }
            />
            {imageName ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <ImagePlus className="size-4 text-primary" />
                <span className="max-w-[160px] truncate">{imageName}</span>
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => setImageName(null)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-all hover:border-primary/40 hover:text-primary"
              >
                <ImagePlus className="size-4" />
                Upload image
              </button>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:shadow-primary/20"
          >
            <Wand2 className="size-4" />
            Generate
          </button>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground">
            Generated previews
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <PreviewPlaceholder key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewPlaceholder({ index }: { index: number }) {
  return (
    <div
      className={cn(
        'group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40',
      )}
    >
      <div
        className="absolute inset-0 bg-dotgrid opacity-40"
        aria-hidden="true"
      />
      <Box className="size-8 text-muted-foreground/50 transition-transform duration-300 group-hover:scale-110" />
      <span className="relative mt-2 text-xs text-muted-foreground/70">
        Preview {index + 1}
      </span>
    </div>
  )
}
