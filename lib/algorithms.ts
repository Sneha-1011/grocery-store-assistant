import { connectToDatabase } from "./db"
import crypto from "crypto"

export interface Product {
  product_id: number
  name: string
  category: string
  brand: string
  price: number
  stock_quantity: number
  weights: number
}

export interface CartItem {
  product_id: number
  name: string
  price: number
  quantity: number
  category: string
}

// Improved hashing function for product search
export function hashItem(item: string): string {
  return crypto.createHash("md5").update(item).digest("hex")
}

// Fetch products matching a search term
export async function fetchMatchingProducts(item: string): Promise<Product[]> {
  const db = await connectToDatabase()
  const itemHash = hashItem(item)

  try {
    // First get the category
    const [categoryResult] = await db.execute("SELECT DISTINCT category FROM products WHERE name LIKE ?", [`%${item}%`])

    const categories = categoryResult as any[]
    if (categories.length === 0) {
      return []
    }

    const category = categories[0].category

    // Then get products in that category matching the search
    const [productsResult] = await db.execute(
      `SELECT product_id, name, category, brand, price, stock_quantity, weights 
       FROM products 
       WHERE category = ? AND name LIKE ?
       ORDER BY price ASC`,
      [category, `%${item}%`],
    )

    return (productsResult as any[]).map((p) => ({
      product_id: p.product_id,
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: Number.parseFloat(p.price),
      stock_quantity: p.stock_quantity,
      weights: p.weights,
    }))
  } catch (error) {
    console.error("Error fetching matching products:", error)
    return []
  }
}

// Category-specific weight mapping
const categoryWeightMap: Record<string, number> = {
  milk: 1.0,
  "almond milk": 1.0,
  "soy milk": 1.0,
  cheese: 0.5,
  "vegan cheese": 0.5,
  butter: 0.25,
  margarine: 0.25,

  bread: 0.7,
  "multigrain bread": 0.8,
  "white bread": 0.7,
  "whole wheat bread": 0.8,

  coffee: 0.25,
  "decaf coffee": 0.25,
  tea: 0.1,
  "green tea": 0.1,

  "potato chips": 0.2,
  "baked chips": 0.2,
  chocolate: 0.1,
  "dark chocolate": 0.1,

  default: 0.5,
}

// Function to get normalized weight for a product
export function getNormalizedWeight(product: Product): number {
  // First try to match the exact category
  if (product.category.toLowerCase() in categoryWeightMap) {
    return categoryWeightMap[product.category.toLowerCase()] * product.weights
  }

  // If not found, try to match partial category
  for (const category in categoryWeightMap) {
    if (product.category.toLowerCase().includes(category) || product.name.toLowerCase().includes(category)) {
      return categoryWeightMap[category] * product.weights
    }
  }

  // Use default weight if no match found
  return categoryWeightMap.default * product.weights
}

// Enhanced Knapsack algorithm implementation with category-specific weights
export function knapsack(products: Product[], budget: number, groceryList: string[]): Product[] {
  const selected: Product[] = []
  let remainingBudget = budget

  // First try to select one item from each category in the grocery list
  for (const item of groceryList) {
    const matchingProducts = products.filter((p) => p.name.toLowerCase().includes(item.toLowerCase()))

    if (matchingProducts.length === 0) continue

    matchingProducts.sort((a, b) => {
      const weightA = getNormalizedWeight(a)
      const weightB = getNormalizedWeight(b)
      return a.price / weightA - b.price / weightB
    })

    const bestItem = matchingProducts[0]
    if (bestItem.price <= remainingBudget) {
      selected.push(bestItem)
      remainingBudget -= bestItem.price
      // Remove the selected product from consideration
      products = products.filter((p) => p.product_id !== bestItem.product_id)
    }
  }

  // Use remaining budget to get more items if possible
  // Sort by price/normalized weight ratio
  products.sort((a, b) => {
    const weightA = getNormalizedWeight(a)
    const weightB = getNormalizedWeight(b)
    return a.price / weightA - b.price / weightB
  })

  for (const product of products) {
    if (product.price <= remainingBudget) {
      selected.push(product)
      remainingBudget -= product.price
    }
  }

  return selected
}

// Multi-stage graph approach using dynamic programming
export interface GraphNode {
  id: string
  stage: number
  index: number
  product: Product
}

export interface GraphEdge {
  from: string
  to: string
  weight: number
}

export function buildMultistageGraph(
  groceryList: string[],
  products: Product[],
): {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stages: GraphNode[][]
} {
  const stages: GraphNode[][] = []
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Build stages
  for (let stageIndex = 0; stageIndex < groceryList.length; stageIndex++) {
    const item = groceryList[stageIndex]
    const matchingProducts = products.filter((p) => p.name.toLowerCase().includes(item.toLowerCase()))

    const stageNodes: GraphNode[] = []

    for (let i = 0; i < matchingProducts.length; i++) {
      const nodeId = `${stageIndex}_${i}`
      const node: GraphNode = {
        id: nodeId,
        stage: stageIndex,
        index: i,
        product: matchingProducts[i],
      }

      nodes.push(node)
      stageNodes.push(node)
    }

    stages.push(stageNodes)
  }

  // Build edges between consecutive stages
  for (let i = 0; i < stages.length - 1; i++) {
    for (const srcNode of stages[i]) {
      for (const dstNode of stages[i + 1]) {
        edges.push({
          from: srcNode.id,
          to: dstNode.id,
          weight: dstNode.product.price,
        })
      }
    }
  }

  return { nodes, edges, stages }
}

export function findMinCostPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  stages: GraphNode[][],
): { path: GraphNode[]; cost: number } {
  if (stages.length === 0 || stages[0].length === 0) {
    return { path: [], cost: 0 }
  }

  // Initialize distance and predecessor arrays
  const dist: Record<string, number> = {}
  const pred: Record<string, string | null> = {}

  // Set initial distances to infinity
  for (const node of nodes) {
    dist[node.id] = Number.POSITIVE_INFINITY
    pred[node.id] = null
  }

  // Set distance of first stage nodes
  for (const node of stages[0]) {
    dist[node.id] = node.product.price
  }

  // Dynamic programming approach
  for (let i = 0; i < stages.length - 1; i++) {
    for (const srcNode of stages[i]) {
      for (const dstNode of stages[i + 1]) {
        const edge = edges.find((e) => e.from === srcNode.id && e.to === dstNode.id)
        if (!edge) continue

        const newDist = dist[srcNode.id] + edge.weight
        if (newDist < dist[dstNode.id]) {
          dist[dstNode.id] = newDist
          pred[dstNode.id] = srcNode.id
        }
      }
    }
  }

  // Find the minimum cost path
  let minCost = Number.POSITIVE_INFINITY
  let lastNode: GraphNode | null = null

  for (const node of stages[stages.length - 1]) {
    if (dist[node.id] < minCost) {
      minCost = dist[node.id]
      lastNode = node
    }
  }

  if (!lastNode) {
    return { path: [], cost: 0 }
  }

  // Reconstruct the path
  const path: GraphNode[] = [lastNode]
  let current = lastNode.id

  while (pred[current] !== null) {
    const prevId = pred[current]
    if (!prevId) break

    const prevNode = nodes.find((n) => n.id === prevId)
    if (!prevNode) break

    path.unshift(prevNode)
    current = prevId
  }

  return { path, cost: minCost }
}

// Get alternative products for a given product
export async function getAlternativeProducts(productId: number): Promise<Product[]> {
  const db = await connectToDatabase()

  try {
    const [result] = await db.execute(
      `SELECT p.* 
       FROM products p
       JOIN alternative_products ap ON p.product_id = ap.alternative_id
       WHERE ap.product_id = ?`,
      [productId],
    )


    return (result as any[]).map((p) => ({
      product_id: p.product_id,
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: Number.parseFloat(p.price),
      stock_quantity: p.stock_quantity,
      weights: p.weights,
    }))
  } catch (error) {
    console.error("Error fetching alternative products:", error)
    return []
  }
}

// Save shopping list to database
export async function saveShoppingList(userId: number, items: CartItem[], totalCost: number): Promise<number | null> {
  const db = await connectToDatabase()

  try {

    // Create shopping list
    const [listResult] = await db.execute("INSERT INTO shopping_lists (user_id, total_cost) VALUES (?, ?)", [
      userId,
      totalCost,
    ])

    const listId = (listResult as any).insertId

    // Add items to shopping list
    for (const item of items) {
      await db.execute(
        `INSERT INTO shopping_list_items 
         (list_id, product_id, quantity, total_price) 
         VALUES (?, ?, ?, ?)`,
        [listId, item.product_id, item.quantity, item.price * item.quantity],
      )
    }

    return listId
  } catch (error) {
    console.error("Error saving shopping list:", error)
    return null
  }
}

export async function saveBudgetItems(userId: number, budget: number, items: string[]): Promise<boolean> {
  const db = await connectToDatabase()

  try {
    for (const item of items) {
      await db.execute(
        `INSERT INTO budget_items (user_id, budget, item_name, quantity)
         VALUES (?, ?, ?, ?)`,
        [userId, budget, item, 1],
      )
    }

    return true
  } catch (error) {
    console.error("Error saving budget items:", error)
    return false
  }
}

// Get complementary items based on weights from knapsack algorithm
export async function getWeightBasedRecommendations(
  productIds: number[],
  category: string,
  weights: number[],
): Promise<Product[]> {
  if (!productIds.length) return []

  const db = await connectToDatabase()

  try {
    // This query finds products with similar weight profiles to the selected products
    const [result] = await db.execute(
      `
      SELECT p.*, 
             ABS(p.weights - (SELECT AVG(weights) FROM products WHERE product_id IN (${productIds.join(",")}))) AS weight_diff
      FROM products p
      WHERE p.category = ? 
      AND p.product_id NOT IN (${productIds.join(",")})
      ORDER BY weight_diff ASC
      LIMIT 5
    `,
      [category],
    )


    return (result as any[]).map((p) => ({
      product_id: p.product_id,
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: Number.parseFloat(p.price),
      stock_quantity: p.stock_quantity,
      weights: p.weights,
    }))
  } catch (error) {
    console.error("Error fetching weight-based recommendations:", error)
    return []
  }
}
