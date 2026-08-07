'use client'

import { useRef, useState } from 'react'
import { FileUp, UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUPPORTED = ['STL', 'OBJ', '3MF']

export function DropZone() {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) setFileName(files[0].name)
  }

  return (
    <div className="flex h-full flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'group relative flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer',
          dragging
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-border bg-card hover:border-primary/50 hover:bg-accent/40',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".stl,.obj,.3mf"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {fileName ? (
          <div className="flex flex-col items-center">
            <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileUp className="size-8" />
            </span>
            <p className="mt-5 text-lg font-semibold">{fileName}</p>
            <p className="mt-1 text-sm text-muted-foreground">Ready to slice</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFileName(null)
              }}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
            >
              <X className="size-3.5" />
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'inline-flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary transition-transform duration-300',
                dragging ? 'scale-110' : 'group-hover:scale-105',
              )}
            >
              <UploadCloud className="size-10" />
            </span>
            <p className="mt-6 text-xl font-semibold tracking-tight text-balance">
              Drop your STL, OBJ or 3MF file here
            </p>
            <p className="mt-1.5 text-muted-foreground">or click to browse</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Supported formats
        </span>
        {SUPPORTED.map((format) => (
          <span
            key={format}
            className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
          >
            {format}
          </span>
        ))}
      </div>
    </div>
  )
}
