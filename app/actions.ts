"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createUser, verifyUser, setServerCookies, clearServerCookies, getServerUser } from "@/lib/auth"
import {
  fetchMatchingProducts,
  knapsack,
  buildMultistageGraph,
  findMinCostPath,
  getAlternativeProducts,
  saveShoppingList,
} from "@/lib/algorithms"
import type { Product, CartItem } from "@/lib/algorithms"

// Define ComplementaryItem type here to avoid importing from market-basket
export interface ComplementaryItem {
  product_id: number
  name: string
  category: string
  brand: string
  price: number
  weights: number
  confidence: number
}

export type { Product, CartItem }

export async function getCurrentUser() {
  return getServerUser()
}

export async function signUp(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const age = Number.parseInt(formData.get("age") as string)
  const gender = formData.get("gender") as string

  if (!name || !email || !username || !password || !age || !gender) {
    return { success: false, error: "All fields are required" }
  }

  if (age < 15) {
    return { success: false, error: "You must be at least 15 years old" }
  }

  const result = await createUser({
    name,
    email,
    username,
    password,
    age,
    gender,
  })

  if (result.success) {
    revalidatePath("/login")
    redirect("/login")
  }

  return result
}

export async function login(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password) {
    return { success: false, error: "Username and password are required" }
  }

  try {
    const result = await verifyUser(username, password)
    console.log("Login result:", result)

    if (result.success && result.userId && result.name) {
      // Set cookies
      await setServerCookies(result.userId, result.name)

      // Return success with user data for client-side handling
      return {
        success: true,
        userId: result.userId.toString(),
        name: result.name,
      }
    }

    return { success: false, error: result.error || "Authentication failed" }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Authentication failed. Please try again." }
  }
}

export async function logout() {
  await clearServerCookies()
  revalidatePath("/")
  redirect("/")
}

export async function searchProducts(query: string) {
  if (!query || query.trim().length === 0) {
    return []
  }

  try {
    console.log(`Searching for products with query: "${query}"`)
    const products = await fetchMatchingProducts(query.trim())
    console.log(`Found ${products.length} products for query "${query}"`)
    return products
  } catch (error) {
    console.error("Error searching products:", error)
    return []
  }
}

// Update the calculateOptimalSelection function to include price range
export async function calculateOptimalSelection(
  budget: number,
  items: string[],
  minPrice = 0,
  maxPrice: number = Number.POSITIVE_INFINITY,
) {
  try {
    console.log(
      `Calculating optimal selection with budget: ${budget}, items: ${items.join(", ")}, price range: ${minPrice}-${maxPrice}`,
    )

    // Ensure maxPrice doesn't exceed budget
    maxPrice = Math.min(maxPrice, budget)

    // Fetch all products matching the items
    const allProducts: Product[] = []

    for (const item of items) {
      console.log(`Fetching products for item: ${item}`)
      const products = await fetchMatchingProducts(item)
      console.log(`Found ${products.length} products for item: ${item}`)
      allProducts.push(...products)
    }

    console.log(`Total products found: ${allProducts.length}`)

    // Use knapsack algorithm to find optimal selection
    const knapsackSelection = await knapsack(allProducts, budget, items)
    console.log(`Knapsack selection contains ${knapsackSelection.length} products`)

    // Build multi-stage graph
    const graph = await buildMultistageGraph(items, allProducts)
    console.log(`Graph built with ${graph.nodes.length} nodes and ${graph.edges.length} edges`)

    // Find minimum cost path within the price range
    const { path, cost } = await findMinCostPath(graph.nodes, graph.edges, graph.stages, minPrice, maxPrice)
    console.log(`Found optimal path with cost: ${cost}`)

    return {
      knapsackSelection,
      graph,
      path,
      cost,
    }
  } catch (error) {
    console.error("Error calculating optimal selection:", error)
    return {
      knapsackSelection: [],
      graph: { nodes: [], edges: [], stages: [] },
      path: [],
      cost: 0,
    }
  }
}

export async function getAlternatives(productId: number) {
  try {
    return await getAlternativeProducts(productId)
  } catch (error) {
    console.error("Error getting alternatives:", error)
    return []
  }
}

export async function saveCart(
  userId: number,
  items: CartItem[],
  totalCost: number,
  budget: number,
  groceryItems: string[],
) {
  try {
    // Ensure user is authenticated
    const user = await getServerUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const authenticatedUserId = user.userId

    // Save budget items
    await saveBudgetItems(authenticatedUserId, budget, groceryItems)

    // Save shopping list
    const listId = await saveShoppingList(authenticatedUserId, items, totalCost)

    if (listId) {
      revalidatePath("/checkout")
      return { success: true, listId }
    }

    return { success: false, error: "Failed to save cart" }
  } catch (error) {
    console.error("Error saving cart:", error)
    return { success: false, error: "An unexpected error occurred while saving your cart" }
  }
}

// Function to save budget items
export async function saveBudgetItems(userId: number, budget: number, items: string[]): Promise<boolean> {
  const db = await connectToDatabase()

  try {
    console.log(`Saving budget items for user ${userId}: budget ${budget}, items: ${items.join(", ")}`)

    // First delete any existing budget items for this user to avoid duplicates
    await db.execute("DELETE FROM budget_items WHERE user_id = ?", [userId])

    // Insert new budget items
    for (const item of items) {
      await db.execute(
        `INSERT INTO budget_items (user_id, budget, item_name, quantity, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [userId, budget, item, 1],
      )
    }

    console.log("Budget items saved successfully")
    return true
  } catch (error) {
    console.error("Error saving budget items:", error)
    return false
  }
}

// Get complementary items based on weights from knapsack algorithm
export async function getWeightBasedRecommendations(
  productIds: number[],
  weights: number[],
  category: string,
): Promise<Product[]> {
  if (!productIds.length) return []

  const db = await connectToDatabase()

  try {
    // Calculate average weight
    const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length

    // This query finds products with similar weight profiles to the selected products
    const [result] = await db.execute(
      `
      SELECT p.*, 
             ABS(p.weights - ?) AS weight_diff
      FROM products p
      WHERE p.category = ? 
      AND p.product_id NOT IN (${productIds.join(",")})
      ORDER BY weight_diff ASC
      LIMIT 5
    `,
      [avgWeight, category],
    )

    return (result as any[]).map((p) => ({
      product_id: p.product_id,
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: Number(p.price),
      stock_quantity: p.stock_quantity,
      weights: Number(p.weights),
    }))
  } catch (error) {
    console.error("Error fetching weight-based recommendations:", error)
    return []
  }
}

// Helper function to connect to the database
async function connectToDatabase() {
  const { connectToDatabase } = await import("@/lib/db")
  return connectToDatabase()
}
