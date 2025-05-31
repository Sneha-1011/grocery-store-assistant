import mysql from "mysql2/promise"

// Add a check to ensure this only runs on the server
const isServer = typeof window === "undefined"

// Connection pool for better performance and reliability
let pool: mysql.Pool | null = null

export async function connectToDatabase() {
  if (!isServer) {
    throw new Error("Database connection can only be established on the server")
  }

  try {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "Sneha@.03",
        database: process.env.DB_NAME || "grocery",
        port: Number.parseInt(process.env.DB_PORT || "3306"),
        waitForConnections: true,
        connectionLimit: 10, // Maximum number of connections in the pool
        queueLimit: 0, // Unlimited queue
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000, // 10 seconds
      })
    }

    // Test connection
    const connection = await pool.getConnection()
    try {
      await connection.query("SELECT 1")
      console.log("Database connection successful")
    } finally {
      connection.release() // Ensure we always release the connection
    }

    // Return the pool for query execution
    return pool
  } catch (error) {
    console.error("Database connection error:", error)

    // If connection fails, try to recreate the pool
    if (pool) {
      try {
        await pool.end()
      } catch (endError) {
        console.error("Error ending pool:", endError)
      }
      pool = null
    }

    throw new Error("Failed to connect to database")
  }
}

// Helper function to safely execute database queries with error handling
export async function executeQuery(query: string, params: any[] = []) {
  if (!isServer) {
    throw new Error("Database queries can only be executed on the server")
  }

  const pool = await connectToDatabase()
  let connection

  try {
    connection = await pool.getConnection()
    const [result] = await connection.execute(query, params)
    connection.release() // Release connection after use

    return result
  } catch (error) {
    console.error("Database query error:", error)

    if (connection) {
      try {
        connection.release()
      } catch (releaseError) {
        console.error("Error releasing connection:", releaseError)
      }
    }

    throw error
  }
}

// Only close the pool when the application is shutting down
export async function closePool() {
  if (pool) {
    try {
      await pool.end()
      console.log("Database connection pool closed")
      pool = null
    } catch (error) {
      console.error("Error closing database connection pool:", error)
    }
  }
}
