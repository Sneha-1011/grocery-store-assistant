import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import { PageTransition } from "@/components/page-transition"
import { getCurrentUser } from "@/app/actions"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SS Online Grocery Assistant",
  description: "Smart grocery shopping with budget optimization",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get user data from server
  const user = await getCurrentUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Header user={user} />
          <PageTransition>
            <main className="min-h-screen bg-background text-foreground">{children}</main>
          </PageTransition>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
