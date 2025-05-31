"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions"
import { ShoppingBasket, LogOut, LogIn, UserPlus } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { getClientUser, clearClientUser } from "@/lib/client-auth"
import { useRouter } from "next/navigation"

interface HeaderProps {
  user: { userId: number; name: string } | null
}

export default function Header({ user: serverUser }: HeaderProps) {
  const [user, setUser] = useState(serverUser)
  const router = useRouter()

  // Sync with client-side user data
  useEffect(() => {
    const clientUser = getClientUser()
    if (clientUser && !serverUser) {
      setUser(clientUser)
    } else if (serverUser) {
      setUser(serverUser)
    }
  }, [serverUser])

  const handleLogout = async () => {
    // Clear client-side user data
    clearClientUser()
    setUser(null)

    try {
      // Call server action to clear cookies
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
      // If server action fails, redirect manually
      router.push("/")
    }
  }

  return (
    <header className="bg-background/80 backdrop-blur-md shadow-md py-4 sticky top-0 z-50 animate-fade-in border-b border-border">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-primary flex items-center gap-2 transition-transform hover:scale-105"
        >
          <ShoppingBasket className="h-6 w-6" />
          <span>SS Online Grocery Assistant</span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {user ? (
            <>
              <span className="flex items-center text-foreground bg-primary/10 px-3 py-1 rounded-full">
                Welcome, {user.name}
              </span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10 transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10 transition-all duration-300"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg">
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
