import { TopNav } from '@/components/top-nav'
import { Badge } from '@/components/ui/badge'
import { Composer } from '@/components/create/composer'

export default function CreatePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <TopNav breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Create AI' }]} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 lg:px-8 lg:py-24">
        <div className="mb-10 flex flex-col items-center text-center">
          <Badge variant="beta">Beta</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance">
            Create AI
          </h1>
          <p className="mt-3 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Generate 3D models from text or images. Describe an idea or upload a
            reference to get started.
          </p>
        </div>

        <Composer />
      </main>
    </div>
  )
}
