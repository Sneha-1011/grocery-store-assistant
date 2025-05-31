"use client"

// Client-side auth utilities
export function getClientUser() {
  // Check if we're in the browser
  if (typeof window === "undefined") return null

  // Get user data from localStorage
  const userData = localStorage.getItem("user")
  if (!userData) return null

  try {
    return JSON.parse(userData)
  } catch (e) {
    return null
  }
}

export function setClientUser(user: { userId: string | number; name: string }) {
  if (typeof window === "undefined") return
  localStorage.setItem(
    "user",
    JSON.stringify({
      userId: typeof user.userId === "string" ? Number.parseInt(user.userId) : user.userId,
      name: user.name,
    }),
  )
}

export function clearClientUser() {
  if (typeof window === "undefined") return
  localStorage.removeItem("user")
}
