import { Suspense } from "react"
import WorkspaceSettingsView from "@/components/workspaces/WorkspaceSettingsView"

interface SettingsPageProps {
  params: Promise<{
    workspaceSlug: string
  }>
}

async function SettingsContent({ params }: SettingsPageProps) {
  const { workspaceSlug } = await params
  return <WorkspaceSettingsView workspaceSlug={workspaceSlug} />
}

export default function WorkspaceSettingsPage({ params }: SettingsPageProps) {
  return (
    <Suspense fallback={null}>
      <SettingsContent params={params} />
    </Suspense>
  )
}
