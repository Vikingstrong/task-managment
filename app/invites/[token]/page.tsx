import { Suspense } from "react"
import InviteClient from "./InviteClient"

interface InvitePageProps {
  params: Promise<{
    token: string
  }>
}

async function InvitePageContent({ params }: InvitePageProps) {
  const { token } = await params
  return <InviteClient token={token} />
}

export default function InvitePage({ params }: InvitePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
          <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </div>
      }
    >
      <InvitePageContent params={params} />
    </Suspense>
  )
}
