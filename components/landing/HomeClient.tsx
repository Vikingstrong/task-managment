"use client"

import * as React from "react"
import { useAppSelector } from "@/redux/hooks"
import GuestLanding from "@/components/landing/GuestLanding"
import WorkspacesPortal from "@/components/workspaces/WorkspacesPortal"

interface HomeClientProps {
  initialIsAuth: boolean
}

const emptySubscribe = () => () => {}

export default function HomeClient({ initialIsAuth }: HomeClientProps) {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const reduxIsAuth = useAppSelector((state) => state.auth.isAuthenticated)
  const isAuthenticated = isMounted ? (reduxIsAuth || initialIsAuth) : initialIsAuth

  if (isAuthenticated) {
    return <WorkspacesPortal />
  }

  return <GuestLanding />
}
