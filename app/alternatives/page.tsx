"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  calculateOptimalSelection,
  getAlternatives,
  type Product,
  type CartItem,
  type ComplementaryItem,
} from "@/app/actions"
import { MultiStageGraph } from "@/components/multi-stage-graph"
import { KnapsackSelection } from "@/components/knapsack-selection"
import { ShoppingCart, BarChart3, ArrowRight, Plus, Trash2, AlertCircle, SlidersHorizontal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { FloatingGroceryItems } from "@/components/floating-grocery-items"
import { useToast } from "@/hooks/use-toast"
import { RecommendedItems } from "@/components/recommended-items"
import { Slider } from "@/components/ui/slider"

export default function AlternativesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [budget, setBudget] = useState<number>(0)
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(0)
  const [groceryItems, setGroceryItems] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const [knapsackSelection, setKnapsackSelection] = useState<Product[]>([])
  const [graphData, setGraphData] = useState<any>(null)
  const [pathData, setPathData] = useState<any>(null)
  const [totalCost, setTotalCost] = useState<number>(0)

  const [selectedItem, setSelectedItem] = useState<string>("")
  const [alternatives, setAlternatives] = useState<Product[]>([])
  const [cart, setCart] = useState<Record<number, CartItem>>({})
  const [mounted, setMounted] = useState(false)
  const [showPriceRange, setShowPriceRange] = useState<boolean>(false)

  // Ref to track if component is mounted
  const isMounted = useRef(true)

  useEffect(() => {
    setMounted(true)
    // Set isMounted to false when component unmounts
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Load data from session storage
    const storedBudget = sessionStorage.getItem("budget")
    const storedMinPrice = sessionStorage.getItem("minPrice")
    const storedMaxPrice = sessionStorage.getItem("maxPrice")
    const storedItems = sessionStorage.getItem("groceryItems")

    if (!storedBudget || !storedItems) {
      setError("No budget or grocery items found. Please go back to the budget page.")
      setLoading(false)
      return
    }

    const parsedBudget = Number.parseFloat(storedBudget)
    const parsedMinPrice = storedMinPrice ? Number.parseFloat(storedMinPrice) : 0
    const parsedMaxPrice = storedMaxPrice ? Number.parseFloat(storedMaxPrice) : parsedBudget
    const parsedItems = JSON.parse(storedItems) as string[]

    setBudget(parsedBudget)
    setMinPrice(parsedMinPrice)
    setMaxPrice(parsedMaxPrice)
    setGroceryItems(parsedItems)

    // Show price range controls if a custom range was set
    if (parsedMinPrice > 0 || parsedMaxPrice < parsedBudget) {
      setShowPriceRange(true)
    }

    // Optimize calculation by using a more efficient approach
    const fetchData = async () => {
      try {
        // Start calculation in a non-blocking way
        setTimeout(async () => {
          const result = await calculateOptimalSelection(parsedBudget, parsedItems, parsedMinPrice, parsedMaxPrice)

          if (!isMounted.current) return

          setKnapsackSelection(result.knapsackSelection)
          setGraphData(result.graph)
          setPathData(result.path)
          setTotalCost(result.cost)

          // Initialize cart with optimal selection
          const initialCart: Record<number, CartItem> = {}
          result.path.forEach((node: any) => {
            const product = node.product
            initialCart[product.product_id] = {
              product_id: product.product_id,
              name: product.name,
              price: product.price,
              quantity: 1,
              category: product.category,
            }
          })

          setCart(initialCart)

          if (parsedItems.length > 0) {
            setSelectedItem(parsedItems[0])
            const alternatives = await getAlternatives(result.path[0]?.product.product_id || 0)
            if (isMounted.current) {
              setAlternatives(alternatives)
              setLoading(false)
            }
          } else {
            setLoading(false)
          }
        }, 0)
      } catch (err) {
        if (isMounted.current) {
          setError("Failed to calculate optimal selection")
          console.error(err)
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [mounted])

  const handleItemChange = async (value: string) => {
    setSelectedItem(value)

    // Find the product in the cart that matches the selected item
    const matchingProduct = Object.values(cart).find((item) => item.name.toLowerCase().includes(value.toLowerCase()))

    if (matchingProduct) {
      const alternatives = await getAlternatives(matchingProduct.product_id)
      setAlternatives(alternatives)
    } else {
      setAlternatives([])
    }
  }

  const handleAddAlternative = (product: Product) => {
    // Check if this exact product is already in the cart
    if (cart[product.product_id]) {
      setAlert(`You have already selected that brand product: ${product.name}`)
      setTimeout(() => setAlert(null), 3000)
      return
    }

    // Check if adding this product would exceed the budget
    const currentTotal = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0)
    const newTotal = currentTotal + product.price

    if (newTotal > budget) {
      setAlert(`Adding this alternative would exceed your budget of ₹${budget}`)
      setTimeout(() => setAlert(null), 3000)
      return
    }

    // Add the product to cart
    setCart({
      ...cart,
      [product.product_id]: {
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        quantity: 1,
        category: product.category,
      },
    })
  }

  const handleRemoveItem = (productId: number) => {
    const productName = cart[productId]?.name || "Product"
    const newCart = { ...cart }
    delete newCart[productId]
    setCart(newCart)

    toast({
      title: "Product Removed",
      description: `${productName} has been removed from your cart.`,
      variant: "default",
    })
  }

  // Add a function to handle adding recommended items to the cart
  const handleAddRecommendedItem = (item: ComplementaryItem) => {
    // Check if this exact product is already in the cart
    if (cart[item.product_id]) {
      setAlert(`You have already selected that brand product: ${item.name}`)
      setTimeout(() => setAlert(null), 3000)
      return
    }

    // Check if adding this product would exceed the budget
    const currentTotal = Object.values(cart).reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0)
    const newTotal = currentTotal + item.price

    if (newTotal > budget) {
      setAlert(`Adding this item would exceed your budget of ₹${budget}`)
      setTimeout(() => setAlert(null), 3000)
      return
    }

    // Add the product to cart
    setCart({
      ...cart,
      [item.product_id]: {
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: 1,
        category: item.category,
      },
    })
  }

  const handlePriceRangeChange = async (values: number[]) => {
    setMinPrice(values[0])
    setMaxPrice(values[1])

    // Recalculate optimal path with new price range
    if (groceryItems.length > 0) {
      setLoading(true)
      try {
        const result = await calculateOptimalSelection(budget, groceryItems, values[0], values[1])

        setGraphData(result.graph)
        setPathData(result.path)
        setTotalCost(result.cost)

        // Update cart with new optimal selection
        const newCart: Record<number, CartItem> = {}
        result.path.forEach((node: any) => {
          const product = node.product
          newCart[product.product_id] = {
            product_id: product.product_id,
            name: product.name,
            price: product.price,
            quantity: 1,
            category: product.category,
          }
        })

        setCart(newCart)
      } catch (err) {
        console.error("Error recalculating optimal path:", err)
        toast({
          title: "Calculation Error",
          description: "Failed to recalculate the optimal path with the new price range.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleProceed = () => {
    if (Object.keys(cart).length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add some items.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Store cart data in session storage
    sessionStorage.setItem("cart", JSON.stringify(Object.values(cart)))
    sessionStorage.setItem(
      "totalCost",
      Object.values(cart)
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toString(),
    )

    // Add a small delay for the animation
    setTimeout(() => {
      router.push("/checkout")
    }, 300) // Reduced delay for faster transition
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center grocery-pattern min-h-screen flex items-center justify-center">
        <div className="animate-fade-in">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <BarChart3 className="absolute inset-0 m-auto h-10 w-10 text-primary" />
          </div>
          <p className="text-lg font-medium text-primary">Calculating optimal selection...</p>
          <p className="text-foreground/80 mt-2">Please wait while we find the best products for your budget</p>
        </div>
      </div>
    )
  }

  if (error && !groceryItems.length) {
    return (
      <div className="container mx-auto px-4 py-12 text-center grocery-pattern min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="animate-fade-in max-w-md"
        >
          <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <p className="text-destructive text-xl font-medium mb-4">{error}</p>
          <p className="text-foreground/80 mb-8">We'll redirect you to the budget page shortly.</p>
          <Button onClick={() => router.push("/budget")} className="btn-gradient">
            <ArrowRight className="mr-2 h-4 w-4" />
            Go to Budget Page
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 grocery-pattern animate-fade-in relative min-h-screen">
      <FloatingGroceryItems />

      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-6 text-center gradient-text"
      >
        Alternative Selection
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left side - Knapsack Selection and Graph visualization */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="transition-all duration-300"
        >
          {/* Price Range Controls */}
          <Card className="grocery-card mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Price Range</CardTitle>
                    <CardDescription>Adjust your desired price range</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPriceRange(!showPriceRange)}
                  className={showPriceRange ? "bg-primary/10 text-primary" : ""}
                >
                  {showPriceRange ? "Hide" : "Show"}
                </Button>
              </div>
            </CardHeader>

            {showPriceRange && (
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Min: ₹{minPrice}</span>
                    <span>Budget: ₹{budget}</span>
                    <span>Max: ₹{maxPrice}</span>
                  </div>

                  <Slider
                    value={[minPrice, maxPrice]}
                    min={0}
                    max={budget}
                    step={1}
                    onValueChange={handlePriceRangeChange}
                    className="my-4"
                  />

                  <div className="text-center text-sm text-primary font-medium">
                    Current Range: ₹{minPrice} - ₹{maxPrice}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Knapsack Selection */}
          <KnapsackSelection products={knapsackSelection} />

          {/* Graph Visualization - Full width on mobile */}
          <div className="lg:col-span-1 col-span-2">
            <Card className="grocery-card h-[750px]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Optimal Path Visualization</CardTitle>
                    <CardDescription>Multi-stage graph showing the best selection path</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="h-[650px] overflow-auto">
                {graphData && pathData ? (
                  <MultiStageGraph
                    graph={graphData}
                    path={pathData}
                    totalCost={totalCost}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                  />
                ) : (
                  <p>No graph data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Right side - Alternative selection */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="transition-all duration-300"
        >
          <Card className="grocery-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Select Alternatives</CardTitle>
                  <CardDescription>Choose alternatives for your grocery items</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label htmlFor="item-select" className="text-sm font-medium">
                  Select Grocery Item
                </label>
                <Select value={selectedItem} onValueChange={handleItemChange}>
                  <SelectTrigger id="item-select" className="border-input focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {groceryItems.map((item, index) => (
                      <SelectItem key={index} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <AnimatePresence>
                {alert && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Alert</AlertTitle>
                      <AlertDescription>{alert}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-sm font-medium">Alternative Products:</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {alternatives.length > 0 ? (
                      alternatives.map((product) => (
                        <motion.div
                          key={product.product_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.02, backgroundColor: "rgba(6, 182, 212, 0.1)" }}
                          className="flex items-center justify-between bg-secondary/50 p-3 rounded-md border border-border transition-all duration-200"
                        >
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-sm text-foreground/70">
                              ₹{product.price.toFixed(2)} | {product.weights}kg |{" "}
                              {product.brand || product.name.split(" - ")[1] || "Brand"}
                            </p>
                          </div>
                          <Button size="sm" onClick={() => handleAddAlternative(product)} className="btn-gradient">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-foreground/70 text-center py-4">No alternatives available</p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm font-medium">Your Selection:</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {Object.values(cart).length > 0 ? (
                      Object.values(cart).map((item) => (
                        <motion.div
                          key={item.product_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.02, backgroundColor: "rgba(6, 182, 212, 0.15)" }}
                          className="flex items-center justify-between bg-primary/10 p-3 rounded-md border border-primary/20 transition-all duration-200"
                        >
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-sm text-foreground/70">
                              ₹{item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.product_id)}
                            className="text-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-foreground/70 text-center py-4">No items selected</p>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  className="bg-secondary/50 p-4 rounded-md mt-4 border border-border"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between font-medium">
                    <span>Total Cost:</span>
                    <span className="text-primary">
                      ₹
                      {Object.values(cart)
                        .reduce((sum, item) => sum + item.price * item.quantity, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-foreground/70">
                    <span>Budget:</span>
                    <span>₹{budget.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span>Remaining:</span>
                    <span
                      className={
                        budget - Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0) < 0
                          ? "text-destructive"
                          : "text-green-500"
                      }
                    >
                      ₹
                      {(
                        budget - Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Weight-based recommendations */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {Object.keys(cart).length > 0 && (
                  <RecommendedItems
                    selectedProducts={Object.values(cart).map((item) => ({
                      product_id: item.product_id,
                      name: item.name,
                      category: item.category,
                      brand: item.name.split(" - ")[1] || "",
                      price: item.price,
                      stock_quantity: 0,
                      weights: knapsackSelection.find((p) => p.product_id === item.product_id)?.weights || 1,
                    }))}
                    onAddItem={handleAddRecommendedItem}
                  />
                )}
              </motion.div>
            </CardContent>

            <CardFooter>
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <Button
                  onClick={handleProceed}
                  className="w-full btn-gradient group"
                  disabled={Object.keys(cart).length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout
                      <motion.div
                        className="ml-2 inline-block"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.div>
                    </>
                  )}
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
