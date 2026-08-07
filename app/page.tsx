import { Layers3, Sparkles } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { LogoMark } from '@/components/logo'
import { FeatureCard } from '@/components/feature-card'

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <TopNav />

      <main className="relative flex flex-1 flex-col items-center overflow-hidden px-5 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-dotgrid opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]"
          aria-hidden="true"
        />

        <section className="relative mx-auto flex w-full max-w-4xl flex-col items-center pt-20 pb-10 text-center lg:pt-28">
          <div className="relative animate-rise">
            <div
              className="hero-glow absolute -inset-16 -z-10"
              aria-hidden="true"
            />
            <LogoMark className="size-20 rounded-[26%]" />
          </div>

          <h1
            className="mt-8 text-5xl font-semibold tracking-tight text-balance animate-rise sm:text-6xl"
            style={{ animationDelay: '60ms' }}
          >
            CI<span className="text-primary">4</span>D
          </h1>
          <p
            className="mt-4 max-w-xl text-lg text-pretty leading-relaxed text-muted-foreground animate-rise"
            style={{ animationDelay: '120ms' }}
          >
            Artificial Intelligence for Professional 3D Printing
          </p>
        </section>

        <section className="relative mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 pb-24 md:grid-cols-2">
          <FeatureCard
            href="/slicer"
            icon={Layers3}
            title="Slicer AI"
            description="Automatically optimize your 3D prints using AI."
            cta="Open Slicer"
            style={{ animationDelay: '180ms' }}
          />
          <FeatureCard
            href="/create"
            icon={Sparkles}
            title="Create AI"
            description="Generate 3D models from text or images."
            cta="Start Creating"
            beta
            style={{ animationDelay: '240ms' }}
          />
        </section>
      </main>
    </div>
  )
}
