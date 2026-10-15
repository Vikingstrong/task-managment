import { Suspense } from "react"
import { cookies } from "next/headers"
import HomeClient from "@/components/landing/HomeClient"

async function HomeContent() {
  const cookieStore = await cookies()
  const isAuth = cookieStore.has("access_token") || cookieStore.has("refresh_token")

  return <HomeClient initialIsAuth={isAuth} />
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
