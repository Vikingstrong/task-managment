import { Suspense } from "react"
import ModulesView from "@/components/modules/ModulesView"

interface ModulesPageProps {
  params: Promise<{
    workspaceSlug: string
    projectId: string
  }>
}

async function ModulesPageContent({ params }: ModulesPageProps) {
  const { workspaceSlug, projectId } = await params
  return <ModulesView workspaceSlug={workspaceSlug} projectId={projectId} />
}

export default function ModulesPage({ params }: ModulesPageProps) {
  return (
    <Suspense fallback={null}>
      <ModulesPageContent params={params} />
    </Suspense>
  )
}
