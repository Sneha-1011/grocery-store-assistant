"use server"

import crypto from "crypto"
import { cookies } from "next/headers"
import { connectToDatabase } from "./db"

// Server-side only functions
export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export async function createUser(userData: {
  name: string
  email: string
  username: string
  password: string
  age: number
  gender: string
}) {
  const db = await connectToDatabase()
  const hashedPassword = await hashPassword(userData.password)

  try {
    const [result] = await db.execute(
      `INSERT INTO users (name, email, username, password_hash, age, gender) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userData.name, userData.email, userData.username, hashedPassword, userData.age, userData.gender],
    )

    return { success: true, userId: (result as any).insertId }
  } catch (error: any) {
    return {
      success: false,
      error: error.code === "ER_DUP_ENTRY" ? "Email or username already exists" : "Failed to create user",
    }
  }
}

export async function verifyUser(username: string, password: string) {
  const db = await connectToDatabase()
  const hashedPassword = await hashPassword(password)

  try {
    const [rows] = await db.execute("SELECT user_id, name FROM users WHERE username = ? AND password_hash = ?", [
      username,
      hashedPassword,
    ])

    if ((rows as any[]).length === 0) {
      return { success: false, error: "Invalid username or password" }
    }

    const user = (rows as any[])[0]
    return { success: true, userId: user.user_id, name: user.name }
  } catch (error) {
    console.error("Authentication error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

// Server-side cookie functions - Fixed for Next.js 15
export async function setServerCookies(userId: number, name: string) {
  // In Next.js 15, cookies() doesn't need to be awaited, but its methods do
  const cookieStore = await cookies()

  // Set the cookies
  cookieStore.set("userId", userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  cookieStore.set("userName", name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })
}

export async function clearServerCookies() {
  const cookieStore = await cookies()

  // Clear cookies
  cookieStore.set("userId", "", { maxAge: 0, path: "/" })
  cookieStore.set("userName", "", { maxAge: 0, path: "/" })
}

export async function getServerUser() {
  const cookieStore = await cookies()

  // Get cookies
  const userIdCookie = cookieStore.get("userId")
  const userNameCookie = cookieStore.get("userName")

  const userId = userIdCookie?.value
  const userName = userNameCookie?.value

  if (!userId || !userName) {
    return null
  }

  return { userId: Number.parseInt(userId), name: userName }
}
