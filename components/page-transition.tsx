"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart } from "lucide-react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [prevPathname, setPrevPathname] = useState("")
  const router = useRouter()

  // Listen for route changes
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setPrevPathname(pathname)
      setIsNavigating(true)
    }

    const handleRouteChangeComplete = () => {
      setTimeout(() => {
        setIsNavigating(false)
      }, 500) // Keep the loading screen a bit longer for visual effect
    }

    // Custom event listeners for route changes
    window.addEventListener("beforeunload", handleRouteChangeStart)
    window.addEventListener("load", handleRouteChangeComplete)

    // Intercept clicks on anchor tags
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement
      const anchor = target.closest("a")

      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.target &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault()
        const href = anchor.href.replace(window.location.origin, "")

        if (href !== pathname) {
          handleRouteChangeStart()
          router.push(href)
          setTimeout(handleRouteChangeComplete, 1000)
        }
      }
    })

    // Intercept form submissions
    document.addEventListener("submit", () => {
      handleRouteChangeStart()
      setTimeout(handleRouteChangeComplete, 2000)
    })

    return () => {
      window.removeEventListener("beforeunload", handleRouteChangeStart)
      window.removeEventListener("load", handleRouteChangeComplete)
    }
  }, [pathname, router])

  // Reset navigation state when pathname changes
  useEffect(() => {
    if (prevPathname && prevPathname !== pathname) {
      setTimeout(() => {
        setIsNavigating(false)
      }, 500)
    }
  }, [pathname, prevPathname])

  return (
    <>
      <AnimatePresence mode="wait">
        {isNavigating ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                <ShoppingCart className="absolute inset-0 m-auto h-10 w-10 text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-emerald-800">Loading...</p>
              <p className="text-gray-600 mt-2">Please wait while we prepare the next page</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </>
  )
}
