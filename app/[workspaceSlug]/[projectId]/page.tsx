import { Suspense } from "react"
import ProjectDetailView from "@/components/projects/ProjectDetailView"

interface ProjectPageProps {
  params: Promise<{
    workspaceSlug: string
    projectId: string
  }>
}

async function ProjectPageContent({ params }: ProjectPageProps) {
  const { workspaceSlug, projectId } = await params
  return (
    <ProjectDetailView
      workspaceSlug={workspaceSlug}
      projectId={projectId}
    />
  )
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <Suspense fallback={null}>
      <ProjectPageContent params={params} />
    </Suspense>
  )
}
