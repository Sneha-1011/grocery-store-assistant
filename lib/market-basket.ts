import { connectToDatabase } from "./db"
import type { Product } from "./algorithms"

// Interface for complementary item recommendations
export interface ComplementaryItem {
  product_id: number
  name: string
  category: string
  brand: string
  price: number
  weights: number
  confidence: number // How strongly these items are associated (0-1)
}

// Function to get frequently bought together items
export async function getComplementaryItems(productIds: number[]): Promise<ComplementaryItem[]> {
  if (!productIds.length) return []

  const db = await connectToDatabase()

  try {
    // This query finds products that are frequently purchased together with the given products
    // It's based on the Apriori algorithm concept for association rule mining
    const [result] = await db.execute(`
      SELECT p.product_id, p.name, p.category, p.brand, p.price, p.weights,
             COUNT(*) / (SELECT COUNT(*) FROM shopping_lists) AS confidence
      FROM shopping_list_items sli1
      JOIN shopping_list_items sli2 ON sli1.list_id = sli2.list_id AND sli1.product_id != sli2.product_id
      JOIN products p ON sli2.product_id = p.product_id
      WHERE sli1.product_id IN (${productIds.join(",")})
      AND sli2.product_id NOT IN (${productIds.join(",")})
      GROUP BY p.product_id
      HAVING confidence > 0.1
      ORDER BY confidence DESC, COUNT(*) DESC
      LIMIT 5
    `)

    await db.end()

    return (result as any[]).map((item) => ({
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      brand: item.brand,
      price: Number(item.price),
      weights: Number(item.weights),
      confidence: Number(item.confidence),
    }))
  } catch (error) {
    console.error("Error fetching complementary items:", error)
    await db.end()
    return []
  }
}

// Get weight-based recommendations
export async function getWeightBasedRecommendations(
  selectedProducts: Product[],
  excludeIds: number[],
): Promise<ComplementaryItem[]> {
  if (selectedProducts.length === 0) return []

  const db = await connectToDatabase()

  // Calculate average weight of selected products
  const avgWeight = selectedProducts.reduce((sum, p) => sum + p.weights, 0) / selectedProducts.length

  try {
    // Find products with similar weights to the average of selected products
    const [result] = await db.execute(
      `
      SELECT 
        product_id, name, category, brand, price, weights,
        ABS(weights - ?) / ? AS weight_similarity
      FROM products
      WHERE product_id NOT IN (${excludeIds.join(",") || 0})
      ORDER BY weight_similarity ASC
      LIMIT 5
    `,
      [avgWeight, Math.max(1, avgWeight)],
    )

    await db.end()

    return (result as any[]).map((item) => ({
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      brand: item.brand,
      price: Number(item.price),
      weights: Number(item.weights),
      confidence: 1 - Number(item.weight_similarity), // Convert similarity to confidence score
    }))
  } catch (error) {
    console.error("Error fetching weight-based recommendations:", error)
    await db.end()
    return []
  }
}

// Fallback function when no purchase history is available
// Uses category-based recommendations
export async function getRelatedItems(category: string, excludeIds: number[]): Promise<ComplementaryItem[]> {
  if (!category) return []

  const db = await connectToDatabase()

  try {
    const [result] = await db.execute(
      `
      SELECT product_id, name, category, brand, price, weights, 0.5 AS confidence
      FROM products
      WHERE category = ? AND product_id NOT IN (${excludeIds.join(",") || 0})
      ORDER BY RAND()
      LIMIT 3
    `,
      [category],
    )

    await db.end()

    return (result as any[]).map((item) => ({
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      brand: item.brand,
      price: Number(item.price),
      weights: Number(item.weights),
      confidence: 0.5, // Default confidence for category-based recommendations
    }))
  } catch (error) {
    console.error("Error fetching related items:", error)
    await db.end()
    return []
  }
}
