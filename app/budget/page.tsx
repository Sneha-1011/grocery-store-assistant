"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, DollarSign, ShoppingCart, ArrowRight, Loader2, SlidersHorizontal } from "lucide-react"
import { searchProducts } from "@/app/actions"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"
import { getClientUser } from "@/lib/client-auth"

export default function BudgetPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [budget, setBudget] = useState<number>(0)
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(0)
  const [showPriceRange, setShowPriceRange] = useState<boolean>(false)
  const [currentItem, setCurrentItem] = useState<string>("")
  const [groceryItems, setGroceryItems] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [user, setUser] = useState<{ userId: number; name: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check authentication on component mount
  useEffect(() => {
    const clientUser = getClientUser()
    if (clientUser) {
      setUser(clientUser)
    } else {
      // If no client-side user data, redirect to login
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    // Clear any previous session data
    sessionStorage.removeItem("budget")
    sessionStorage.removeItem("minPrice")
    sessionStorage.removeItem("maxPrice")
    sessionStorage.removeItem("groceryItems")
    sessionStorage.removeItem("cart")
    sessionStorage.removeItem("totalCost")
  }, [])

  // Update max price when budget changes
  useEffect(() => {
    if (budget > 0) {
      setMaxPrice(budget)
    }
  }, [budget])

  const handleAddItem = async () => {
    if (!currentItem.trim()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check if the item exists in the database
      console.log(`Searching for: ${currentItem}`)
      const products = await searchProducts(currentItem)
      console.log(`Search results:`, products)

      if (products.length === 0) {
        setError(`No products found matching "${currentItem}"`)
      } else if (groceryItems.includes(currentItem.trim())) {
        setError(`"${currentItem}" is already in your list`)
      } else {
        setGroceryItems([...groceryItems, currentItem.trim()])
        setCurrentItem("")

        if (inputRef.current) {
          inputRef.current.focus()
        }
      }
    } catch (err) {
      console.error("Error searching products:", err)
      setError(`Error searching for "${currentItem}". Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddItem()
    }
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...groceryItems]
    newItems.splice(index, 1)
    setGroceryItems(newItems)
  }

  const handlePriceRangeChange = (values: number[]) => {
    setMinPrice(values[0])
    setMaxPrice(values[1])
  }

  const handleProceed = () => {
    if (budget <= 0) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid budget amount",
        variant: "destructive",
      })
      return
    }

    if (groceryItems.length === 0) {
      toast({
        title: "No Items Added",
        description: "Please add at least one grocery item",
        variant: "destructive",
      })
      return
    }

    // Validate price range if enabled
    if (showPriceRange) {
      if (minPrice < 0 || maxPrice <= 0 || minPrice >= maxPrice) {
        toast({
          title: "Invalid Price Range",
          description: "Please enter a valid price range (min < max)",
          variant: "destructive",
        })
        return
      }

      if (maxPrice > budget) {
        toast({
          title: "Invalid Price Range",
          description: "Maximum price cannot exceed your budget",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    // Store the data in session storage for the next page
    sessionStorage.setItem("budget", budget.toString())

    // Store price range if enabled, otherwise use 0 to budget as default range
    if (showPriceRange) {
      sessionStorage.setItem("minPrice", minPrice.toString())
      sessionStorage.setItem("maxPrice", maxPrice.toString())
    } else {
      sessionStorage.setItem("minPrice", "0")
      sessionStorage.setItem("maxPrice", budget.toString())
    }

    sessionStorage.setItem("groceryItems", JSON.stringify(groceryItems))

    // Navigate to alternatives page
    router.push("/alternatives")
  }


  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">
          <p className="text-lg">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 grocery-pattern animate-fade-in">
      <Card className="max-w-2xl mx-auto border-emerald-100 shadow-lg grocery-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Set Your Budget</CardTitle>
              <CardDescription>Enter your budget and the grocery items you need</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <label htmlFor="budget" className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Your Budget (in Rupees)
            </label>
            <Input
              id="budget"
              type="number"
              min="1"
              value={budget || ""}
              onChange={(e) => setBudget(Number(e.target.value))}
              placeholder="Enter your budget"
              className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPriceRange(!showPriceRange)}
                className={`flex items-center gap-2 ${showPriceRange ? "bg-emerald-50 text-emerald-600 border-emerald-200" : ""}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showPriceRange ? "Hide Price Range" : "Set Price Range"}
              </Button>
              {showPriceRange && (
                <span className="text-sm text-foreground/70">
                  ₹{minPrice} - ₹{maxPrice}
                </span>
              )}
            </div>

            {showPriceRange && (
              <div className="bg-emerald-50 p-4 rounded-md border border-emerald-100 mb-4">
                <label className="text-sm font-medium mb-4 block">
                  Desired Price Range (₹{minPrice} - ₹{maxPrice})
                </label>
                <Slider
                  defaultValue={[0, budget]}
                  value={[minPrice, maxPrice]}
                  max={budget}
                  step={1}
                  onValueChange={handlePriceRangeChange}
                  className="my-4"
                />
                <div className="flex justify-between text-sm text-foreground/70">
                  <span>Min: ₹{minPrice}</span>
                  <span>Max: ₹{maxPrice}</span>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-2"
          >
            <label htmlFor="groceryItem" className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
              Add Grocery Items
            </label>
            <div className="flex gap-2">
              <Input
                id="groceryItem"
                ref={inputRef}
                value={currentItem}
                onChange={(e) => setCurrentItem(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter an item and press Enter"
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300"
                disabled={loading}
              />
              <Button onClick={handleAddItem} className="btn-gradient" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md border border-red-200 flex items-start animate-fade-in">
                <span className="mt-0.5">⚠️</span>
                <span className="ml-2">{error}</span>
              </div>
            )}
          </motion.div>

          {groceryItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-2"
            >
              <h3 className="text-sm font-medium">Your Grocery List:</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {groceryItems.map((item, index) => (
                    <motion.div
                      key={`${item}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between bg-emerald-50 p-3 rounded-md border border-emerald-100"
                    >
                      <span className="font-medium text-gray-700">{item}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        aria-label={`Remove ${item}`}
                        className="text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </CardContent>

        <CardFooter>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full flex justify-between items-center"
          >
            <Button
              onClick={handleProceed}
              className="btn-gradient group"
              disabled={budget <= 0 || groceryItems.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  Proceed
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </div>
  )
}
