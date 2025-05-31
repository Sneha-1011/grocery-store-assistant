"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full w-10 h-10 bg-background/50 backdrop-blur-sm border border-border"
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full w-10 h-10 bg-background/50 backdrop-blur-sm border border-border"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {theme === "light" ? (
          <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500 rotate-0 scale-100 transition-all" />
        ) : (
          <Moon className="h-[1.2rem] w-[1.2rem] text-sky-300 rotate-0 scale-100 transition-all" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
