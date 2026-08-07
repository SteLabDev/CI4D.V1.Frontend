'use client'

import { useState } from 'react'
import { MessagesSquare, SendHorizontal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AssistantChat() {
  const [value, setValue] = useState('')
  const canSend = value.trim().length > 0

  function handleSend() {
    if (!canSend) return
    // Interface only — no AI is connected.
    setValue('')
  }

  return (
    <section className="flex flex-col border-t border-border bg-card/40">
      <div className="flex items-center gap-2 px-6 pt-4">
        <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="size-3.5" />
        </span>
        <h2 className="text-sm font-semibold tracking-tight">AI Assistant</h2>
      </div>

      <div className="flex min-h-[132px] flex-col items-center justify-center px-6 py-6 text-center">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <MessagesSquare className="size-5" />
        </span>
        <p className="mt-3 text-sm text-muted-foreground">
          Ask anything about your print.
        </p>
      </div>

      <div className="px-6 pb-5">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-1.5 pl-4 shadow-sm transition-all focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Message the CI4D assistant..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              'inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition-all',
              canSend
                ? 'bg-primary text-primary-foreground hover:shadow-md hover:shadow-primary/20'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
