"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signUp } from "@/app/actions"
import { UserPlus, Loader2, Mail, User, Lock, Calendar, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      const result = await signUp(formData)

      if (!result.success) {
        setError(result.error || "Failed to sign up")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center grocery-pattern animate-fade-in">
      <Tabs defaultValue="signup" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="signup" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Sign Up
          </TabsTrigger>
          <TabsTrigger value="login">
            <Link href="/login" className="w-full h-full flex items-center justify-center">
              Login
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signup" className="animate-slide-in">
          <Card className="border-emerald-100 shadow-lg grocery-card">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Create an account</CardTitle>
                  <CardDescription>Enter your information to create an account</CardDescription>
                </div>
              </div>
            </CardHeader>

            <form action={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-600" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300"
                  />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Age
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="15"
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Gender
                  </Label>
                  <RadioGroup defaultValue="Male" name="gender" className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Male" id="male" className="text-emerald-600 focus:ring-emerald-500" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Female" id="female" className="text-emerald-600 focus:ring-emerald-500" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Other" id="other" className="text-emerald-600 focus:ring-emerald-500" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign Up
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
