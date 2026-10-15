import { Suspense } from "react"
import CyclesView from "@/components/cycles/CyclesView"

interface CyclesPageProps {
  params: Promise<{
    workspaceSlug: string
    projectId: string
  }>
}

async function CyclesPageContent({ params }: CyclesPageProps) {
  const { workspaceSlug, projectId } = await params
  return <CyclesView workspaceSlug={workspaceSlug} projectId={projectId} />
}

export default function CyclesPage({ params }: CyclesPageProps) {
  return (
    <Suspense fallback={null}>
      <CyclesPageContent params={params} />
    </Suspense>
  )
}
