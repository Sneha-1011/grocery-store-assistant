"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getWeightBasedRecommendations, type ComplementaryItem } from "@/app/actions"
import { Plus, ShoppingBag, Scale } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Product } from "@/lib/algorithms"

interface RecommendedItemsProps {
  selectedProducts: Product[]
  onAddItem: (item: ComplementaryItem) => void
}

function formatWeight(product: { weights?: number; category?: string }): string {
  const weight = product.weights ?? 0
  const category = product.category?.toLowerCase() ?? ""

  if (category.includes("milk") || category.includes("butter") || category.includes("margarine")) {
    return `${weight}L`
  } else if (category.includes("cheese")) {
    return `${weight}kg`
  } else if (category.includes("bread")) {
    return `${weight} loaf`
  } else if (
    category.includes("coffee") || category.includes("tea") ||
    category.includes("chips") || category.includes("chocolate")
  ) {
    return `${weight}pkg`
  }

  return `${weight}kg`
}

export function RecommendedItems({ selectedProducts, onAddItem }: RecommendedItemsProps) {
  const [recommendations, setRecommendations] = useState<ComplementaryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedProducts.length === 0) return

    const fetchRecommendations = async () => {
      setLoading(true)
      try {
        // Get product IDs and weights from selected products
        const productIds = selectedProducts.map((p) => p.product_id)
        const weights = selectedProducts.map((p) => p.weights)
        const category = selectedProducts[0]?.category || ""

        // Use the server action to get recommendations
        const items = await getWeightBasedRecommendations(productIds, weights, category)
        setRecommendations(items)
      } catch (error) {
        console.error("Error fetching recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [selectedProducts])

  if (loading) {
    return (
      <Card className="grocery-card mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Recommended Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-pulse flex space-x-4">
              <div className="h-10 w-full bg-primary/10 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <Card className="grocery-card mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          Recommended Items (Weight-Based)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          <div className="space-y-2">
            {recommendations.map((item) => (
              <motion.div
                key={item.product_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between bg-secondary/30 p-2 rounded-md border border-border"
              >
                <div>
                  <p className="font-medium text-foreground text-sm">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <span>₹{item.price.toFixed(2)}</span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <Scale className="h-3 w-3" />
                      {formatWeight(item)}
                    </span>
                    <span>|</span>
                    <span>{item.brand || "Brand"}</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => onAddItem(item)} className="h-8 w-8 p-0 btn-gradient">
                  <Plus className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
