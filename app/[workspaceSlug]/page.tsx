import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Settings } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import ProjectsView from "@/components/projects/ProjectsView"

interface WorkspacePageProps {
  params: Promise<{
    workspaceSlug: string
  }>
}

async function WorkspaceViewContent({ params }: WorkspacePageProps) {
  const { workspaceSlug } = await params

  if (workspaceSlug === "workspaces" || workspaceSlug === "new") {
    redirect("/")
  }


  return (
    <div className="min-h-[calc(100dvh-3.5rem)] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="size-3.5" />
              <span>Все пространства</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-md border border-border bg-muted/40 font-mono text-sm font-medium text-foreground flex items-center justify-center uppercase select-none">
                {workspaceSlug.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl capitalize">
                  {workspaceSlug.replace(/-/g, " ")}
                </h1>
                <p className="text-xs font-mono text-muted-foreground">
                  /{workspaceSlug}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${workspaceSlug}/settings`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-8 text-xs font-medium gap-1.5",
              })}
            >
              <Settings className="size-3.5" />
              <span>Настройки</span>
            </Link>
          </div>
        </div>

        {/* Mac-Styled Projects Workspace */}
        <ProjectsView workspaceSlug={workspaceSlug} />
      </div>
    </div>
  )
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense fallback={null}>
      <WorkspaceViewContent params={params} />
    </Suspense>
  )
}
