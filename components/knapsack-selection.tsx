"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Product } from "@/lib/algorithms"
import { motion } from "framer-motion"

interface KnapsackSelectionProps {
  products: Product[]
}

function formatWeight(product: Product): string {
  const weight = product.weights
  const category = product.category.toLowerCase()

  if (category.includes("milk") || category.includes("margarine")) {
    return `${weight}L`
  } else if (category.includes("cheese") ||  category.includes("butter")) {
    return `${weight}kg`
  } else if (category.includes("bread")) {
    return `${weight} loaf`
  } else if (category.includes("coffee") || category.includes("tea") ||
             category.includes("chips") || category.includes("chocolate")) {
    return `${weight}pkg`
  }

  return `${weight}kg`
}

// Filter best product per category (based on lowest price per unit weight)
function filterBestPerCategory(products: Product[]): Product[] {
  const bestProductsMap = new Map<string, Product>()

  for (const product of products) {
    const category = product.category.toLowerCase()
    const existing = bestProductsMap.get(category)

    if (!existing) {
      bestProductsMap.set(category, product)
    } else {
      const existingScore = existing.price / existing.weights
      const currentScore = product.price / product.weights

      if (currentScore < existingScore) {
        bestProductsMap.set(category, product)
      }
    }
  }

  return Array.from(bestProductsMap.values())
}

export function KnapsackSelection({ products }: KnapsackSelectionProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [totalCost, setTotalCost] = useState<number>(0)

  useEffect(() => {
    const filtered = filterBestPerCategory(products)
    setSelectedProducts(filtered)

    const cost = filtered.reduce((sum, product) => sum + product.price, 0)
    setTotalCost(cost)
  }, [products])

  return (
    <Card className="grocery-card mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">Knapsack Selection:</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {selectedProducts.map((product, index) => (
            <motion.div
              key={product.product_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex justify-between items-center py-1 border-b border-border/30 last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-foreground/70">{product.brand}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-primary">₹{product.price.toFixed(2)}</p>
                <p className="text-sm text-foreground/70">{formatWeight(product)}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 pt-2 border-t border-border">
          <div className="flex justify-between font-bold">
            <span>Total Knapsack Cost:</span>
            <span className="text-primary">₹{totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-foreground/70">
            <span>Total Items:</span>
            <span>{selectedProducts.length} items</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
