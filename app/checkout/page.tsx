"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { saveCart, type CartItem, getCurrentUser } from "@/app/actions"
import { ShoppingCart, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { getClientUser, setClientUser } from "@/lib/client-auth"

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [budget, setBudget] = useState<number>(0)
  const [totalCost, setTotalCost] = useState<number>(0)
  const [groceryItems, setGroceryItems] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutComplete, setCheckoutComplete] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [user, setUser] = useState<{ userId: number; name: string } | null>(null)

  useEffect(() => {
    // First try to get user from client storage
    const clientUser = getClientUser()

    if (clientUser) {
      setUser(clientUser)
      loadCartData()
    } else {
      // If not found, fetch from server
      const fetchUser = async () => {
        try {
          const serverUser = await getCurrentUser()
          if (serverUser) {
            setUser(serverUser)
            // Save to client storage for future use
            setClientUser(serverUser)
          } else {
            setError("You must be logged in to access this page")
            setTimeout(() => router.push("/login"), 2000)
          }
        } catch (err) {
          setError("Failed to authenticate user")
        } finally {
          loadCartData()
        }
      }

      fetchUser()
    }
  }, [router])

  const loadCartData = () => {
    // Load data from session storage
    const storedCart = sessionStorage.getItem("cart")
    const storedBudget = sessionStorage.getItem("budget")
    const storedTotalCost = sessionStorage.getItem("totalCost")
    const storedItems = sessionStorage.getItem("groceryItems")

    if (!storedCart || !storedBudget || !storedTotalCost || !storedItems) {
      setError("No cart data found. Please go back to the alternatives page.")
      setLoading(false)
      return
    }

    const parsedCart = JSON.parse(storedCart) as CartItem[]
    const parsedBudget = Number.parseFloat(storedBudget)
    const parsedTotalCost = Number.parseFloat(storedTotalCost)
    const parsedItems = JSON.parse(storedItems) as string[]

    setCart(parsedCart)
    setBudget(parsedBudget)
    setTotalCost(parsedTotalCost)
    setGroceryItems(parsedItems)
    setLoading(false)
  }

  const handleCheckout = async () => {
    if (!user) {
      setError("You must be logged in to checkout")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await saveCart(user.userId, cart, totalCost, budget, groceryItems)

      if (result.success) {
        // Clear session storage
        sessionStorage.removeItem("cart")
        sessionStorage.removeItem("budget")
        sessionStorage.removeItem("totalCost")
        sessionStorage.removeItem("groceryItems")

        // Show success animation before setting checkout complete
        setTimeout(() => {
          setCheckoutComplete(true)
        }, 1000)
      } else {
        setError(result.error || "Failed to complete checkout")
        setIsSubmitting(false)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center grocery-pattern min-h-screen flex items-center justify-center">
        <div className="animate-fade-in">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <ShoppingCart className="absolute inset-0 m-auto h-10 w-10 text-primary" />
          </div>
          <p className="text-lg font-medium text-primary">Loading your cart...</p>
          <p className="text-foreground/80 mt-2">Please wait while we prepare your checkout</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center grocery-pattern min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="animate-fade-in max-w-md"
        >
          <div className="bg-red-100 dark:bg-red-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-red-500 dark:text-red-400 text-xl font-medium mb-4">{error}</p>
          <p className="text-foreground/80 mb-8">We'll redirect you to the appropriate page shortly.</p>
          <Button onClick={() => router.push("/alternatives")} className="btn-gradient">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back to Alternatives Page
          </Button>
        </motion.div>
      </div>
    )
  }

  if (checkoutComplete) {
    return (
      <div className="container mx-auto px-4 py-12 text-center grocery-pattern min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <Card className="border-primary/20 shadow-lg grocery-card">
            <CardHeader className="pb-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
                className="flex justify-center mb-4"
              >
                <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-14 w-14 text-primary" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl text-primary text-center">Checkout Complete!</CardTitle>
              <CardDescription className="text-center text-lg">Your order has been saved successfully</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-center pt-6">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl"
              >
                Thank you for using SS Online Grocery Assistant!
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                Your optimized grocery list has been saved.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="checkout-summary mt-8"
              >
                <div className="flex justify-between font-medium text-lg">
                  <span>Total Spent:</span>
                  <span className="text-primary">₹{totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-md text-foreground/70 mt-2">
                  <span>Budget:</span>
                  <span>₹{budget.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-md font-medium mt-2">
                  <span>Saved:</span>
                  <span className="text-green-500">
                    ₹{(budget - totalCost > 0 ? budget - totalCost : 0).toFixed(2)}
                  </span>
                </div>
              </motion.div>
            </CardContent>

            <CardFooter>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="w-full"
              >
                <Button onClick={() => router.push("/budget")} className="w-full btn-gradient py-6 text-lg">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Start a New Shopping List
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 grocery-pattern animate-fade-in">
      <Card className="max-w-2xl mx-auto border-primary/20 shadow-lg grocery-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>Review your optimized grocery selection</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Your Grocery Items:
            </h3>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <motion.div
                  key={item.product_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="checkout-item"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-foreground/70">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-primary">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="checkout-summary"
          >
            <div className="flex justify-between mb-2">
              <span className="font-medium">Total Cost:</span>
              <span className="font-medium text-primary">₹{totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Your Budget:</span>
              <span>₹{budget.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Remaining Budget:</span>
              <span className={budget - totalCost < 0 ? "text-red-500 dark:text-red-400" : "text-green-500"}>
                ₹{(budget - totalCost).toFixed(2)}
              </span>
            </div>
          </motion.div>
        </CardContent>

        <CardFooter>
          <Button onClick={handleCheckout} className="w-full btn-gradient" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Checkout
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
