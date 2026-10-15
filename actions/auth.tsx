"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function logout() {
  const store = await cookies()
  store.delete("access_token")
  store.delete("refresh_token")
  redirect("/login")
}