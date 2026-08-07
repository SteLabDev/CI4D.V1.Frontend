import { TopNav } from '@/components/top-nav'
import { SettingsPanels } from '@/components/settings/settings-panels'

export default function SettingsPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <TopNav />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-muted-foreground">
          Manage your CI4D preferences.
        </p>

        <div className="mt-10">
          <SettingsPanels />
        </div>
      </main>
    </div>
  )
}
