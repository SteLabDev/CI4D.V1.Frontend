import { TopNav } from '@/components/top-nav'
import { DropZone } from '@/components/slicer/drop-zone'
import { PrintSettings } from '@/components/slicer/print-settings'
import { AssistantChat } from '@/components/slicer/assistant-chat'

export default function SlicerPage() {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <TopNav breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Slicer AI' }]} />

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 lg:p-8">
            <DropZone />
          </div>
          <AssistantChat />
        </div>

        <PrintSettings />
      </div>
    </div>
  )
}
