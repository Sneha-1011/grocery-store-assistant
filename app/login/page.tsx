"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { login } from "@/app/actions"
import { LogIn, Loader2, User, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { setClientUser, getClientUser } from "@/lib/client-auth"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const user = getClientUser()
    if (user) {
      router.push("/budget")
    }
  }, [router])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      // Use the server action
      const result = await login(formData)

      if (!result.success) {
        setError(result.error || "Failed to login")
        setLoading(false)
      } else if (result.success && result.userId && result.name) {
        // If login was successful
        setClientUser({ userId: result.userId, name: result.name })

        // Add a small delay to ensure client-side state is updated
        setTimeout(() => {
          router.push("/budget")
        }, 100)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center grocery-pattern animate-fade-in">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="login" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Login
          </TabsTrigger>
          <TabsTrigger value="signup">
            <Link href="/signup" className="w-full h-full flex items-center justify-center">
              Sign Up
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="animate-slide-in">
          <Card className="border-emerald-100 shadow-lg grocery-card">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <LogIn className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Login to your account</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </div>
              </div>
            </CardHeader>

            <form action={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md border border-red-200 flex items-start">
                    <span className="mt-0.5">⚠️</span>
                    <span className="ml-2">{error}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full btn-gradient" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
