"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

interface GraphNode {
  id: string
  stage: number
  index: number
  product: {
    name: string
    price: number
    brand?: string
    category?: string
    weights?: number
  }
}

interface MultiStageGraphProps {
  graph: {
    nodes: GraphNode[]
    edges: { from: string; to: string; weight: number }[]
    stages: GraphNode[][]
  }
  path: GraphNode[]
  totalCost: number
  minPrice?: number
  maxPrice?: number
}

export function MultiStageGraph({
  graph,
  path,
  totalCost,
  minPrice = 0,
  maxPrice = Number.POSITIVE_INFINITY,
}: MultiStageGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [mounted, setMounted] = useState(false)
  const [bestPathInRange, setBestPathInRange] = useState<{ path: GraphNode[]; cost: number } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate the best path within the price range
  useEffect(() => {
    if (!graph || !graph.stages || graph.stages.length === 0) return

    // Find all possible paths through the graph
    const findAllPaths = () => {
      // Start with paths from the first stage
      let paths = graph.stages[0].map((node) => ({
        path: [node],
        cost: node.product.price,
      }))

      // Build paths stage by stage
      for (let stageIndex = 1; stageIndex < graph.stages.length; stageIndex++) {
        const newPaths: { path: GraphNode[]; cost: number }[] = []

        // For each existing path
        for (const currentPath of paths) {
          const lastNode = currentPath.path[currentPath.path.length - 1]

          // Find all edges from the last node to the next stage
          const nextEdges = graph.edges.filter((edge) => edge.from === lastNode.id)

          // For each edge, create a new path
          for (const edge of nextEdges) {
            const nextNode = graph.nodes.find((node) => node.id === edge.to)
            if (nextNode) {
              const newPath = {
                path: [...currentPath.path, nextNode],
                cost: currentPath.cost + nextNode.product.price,
              }
              newPaths.push(newPath)
            }
          }
        }

        paths = newPaths
      }

      return paths
    }

    const allPaths = findAllPaths()

    // Filter paths that fall within the price range
    const pathsInRange = allPaths.filter((p) => p.cost >= minPrice && p.cost <= maxPrice)

    // Find the path with minimum cost within the range
    if (pathsInRange.length > 0) {
      const minCostPath = pathsInRange.reduce(
        (min, current) => (current.cost < min.cost ? current : min),
        pathsInRange[0],
      )

      setBestPathInRange(minCostPath)
      console.log(`Best path in ra  nge: cost ${minCostPath.cost}`)
    } else {
      setBestPathInRange(null)
      console.log("No paths found within the price range")
    }
  }, [graph, minPrice, maxPrice])

  const drawGraph = () => {
    if (!canvasRef.current || !graph || !path) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = Math.max(800, 1381)
    setCanvasSize({ width: canvas.width, height: canvas.height })

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Define colors based on theme
    const isDark = theme === "dark"
    const textColor = isDark ? "#e2e8f0" : "#1e293b"
    const backgroundColor = isDark ? "#1e293b" : "#ffffff"
    const primaryColor = "#06b6d4" // Cyan for both themes
    const secondaryColor = isDark ? "#164e63" : "#cffafe"
    const tertiaryColor = isDark ? "#083344" : "#ecfeff"
    const lineColor = isDark ? "#475569" : "#cbd5e1"
    const highlightLineColor = primaryColor
    const inRangeColor = "#10b981" // Green for path in price range
    const inRangeSecondaryColor = "#d1fae5"

    // Calculate node positions with improved spacing
    const nodePositions: Record<string, { x: number; y: number }> = {}
    const nodeRadius = 45
    const legendHeight = 150

    // Calculate maximum number of nodes in any stage
    const maxNodesInStage = Math.max(...graph.stages.map((stage) => stage.length), 1)

    // Calculate horizontal spacing
    const horizontalSpacing = canvas.width / (graph.stages.length + 1)

    const verticalSpacing = Math.min(160, (canvas.height - legendHeight - 150) / (maxNodesInStage - 2));


    // Position nodes with price-based arrangement (lower prices at the top)
    graph.stages.forEach((stage, stageIndex) => {
      const stageX = horizontalSpacing * (stageIndex + 1)

      // Sort nodes by price for vertical positioning
      const sortedNodes = [...stage].sort((a, b) => a.product.price - b.product.price)

      const totalStageHeight = verticalSpacing * (sortedNodes.length - 1)
      const verticalStart = legendHeight + (canvas.height - legendHeight - totalStageHeight) / 2

      sortedNodes.forEach((node, nodeIndex) => {
        nodePositions[node.id] = {
          x: stageX,
          y: verticalStart + verticalSpacing * nodeIndex,
        }
      })
    })

    // Draw regular edges first (so they appear behind highlighted edges)
    graph.edges.forEach((edge) => {
      const fromPos = nodePositions[edge.from]
      const toPos = nodePositions[edge.to]

      if (!fromPos || !toPos) return

      // Check if this edge is part of the optimal path
      const isOptimalEdge = path.some(
        (node, index) => index < path.length - 1 && node.id === edge.from && path[index + 1].id === edge.to,
      )

      // Check if this edge is part of the best path in range
      const isInRangeEdge = bestPathInRange?.path.some(
        (node, index) =>
          index < bestPathInRange.path.length - 1 &&
          node.id === edge.from &&
          bestPathInRange.path[index + 1].id === edge.to,
      )

      // Skip edges that will be drawn as part of highlighted paths
      if (isOptimalEdge || isInRangeEdge) return

      // Draw regular edge
      ctx.beginPath()
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.lineTo(toPos.x, toPos.y)
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.2
      ctx.stroke()
      ctx.globalAlpha = 1.0
    })

    // Draw best path in range edges (if exists)
    if (bestPathInRange) {
      for (let i = 0; i < bestPathInRange.path.length - 1; i++) {
        const fromNode = bestPathInRange.path[i]
        const toNode = bestPathInRange.path[i + 1]

        const fromPos = nodePositions[fromNode.id]
        const toPos = nodePositions[toNode.id]

        if (!fromPos || !toPos) continue

        // Skip if this edge is also part of the optimal path (will be drawn later)
        const isAlsoOptimal = path.some(
          (node, index) => index < path.length - 1 && node.id === fromNode.id && path[index + 1].id === toNode.id,
        )

        if (isAlsoOptimal) continue

        ctx.beginPath()
        ctx.moveTo(fromPos.x, fromPos.y)
        ctx.lineTo(toPos.x, toPos.y)
        ctx.strokeStyle = inRangeColor
        ctx.lineWidth = 3
        ctx.shadowColor = inRangeColor
        ctx.shadowBlur = 5
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // Draw optimal path edges
    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = path[i]
      const toNode = path[i + 1]

      const fromPos = nodePositions[fromNode.id]
      const toPos = nodePositions[toNode.id]

      if (!fromPos || !toPos) continue

      ctx.beginPath()
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.lineTo(toPos.x, toPos.y)
      ctx.strokeStyle = highlightLineColor
      ctx.lineWidth = 3
      ctx.shadowColor = highlightLineColor
      ctx.shadowBlur = 10
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Draw stage labels
    graph.stages.forEach((stage, stageIndex) => {
      if (stage.length > 0) {
        const x = horizontalSpacing * (stageIndex + 1)

        // Get the category name from the first node in the stage
        const categoryName =
          stage[0].product.name.split(" - ")[0] || stage[0].product.category || `Stage ${stageIndex - 1}`

        // Draw stage number
        ctx.fillStyle = primaryColor
        ctx.font = "bold 20px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(`Stage ${stageIndex + 1}`, x, 240)

        // Draw category name below stage number
        ctx.fillStyle = textColor
        ctx.font = "18px Inter, sans-serif"
        ctx.fillText(categoryName, x, 270)
      }
    })

    // Draw nodes
    Object.entries(nodePositions).forEach(([nodeId, position]) => {
      const node = graph.nodes.find((n) => n.id === nodeId)
      if (!node) return

      const isInOptimalPath = path.some((n) => n.id === nodeId)
      const isInRangePath = bestPathInRange?.path.some((n) => n.id === nodeId) || false

      // Draw circle
      ctx.beginPath()
      ctx.arc(position.x, position.y, nodeRadius, 0, Math.PI * 2)

      // Create gradient fill for nodes
      const gradient = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, nodeRadius)

      if (isInOptimalPath) {
        // Optimal path node
        gradient.addColorStop(0, primaryColor)
        gradient.addColorStop(1, secondaryColor)
        ctx.fillStyle = gradient
        ctx.strokeStyle = primaryColor
      } else if (isInRangePath) {
        // Node in best path within price range
        gradient.addColorStop(0, inRangeColor)
        gradient.addColorStop(1, inRangeSecondaryColor)
        ctx.fillStyle = gradient
        ctx.strokeStyle = inRangeColor
      } else {
        // Regular node
        gradient.addColorStop(0, backgroundColor)
        gradient.addColorStop(1, tertiaryColor)
        ctx.fillStyle = gradient
        ctx.strokeStyle = lineColor
      }

      ctx.lineWidth = 2
      ctx.fill()
      ctx.stroke()

      // Extract product info
      const productName = node.product.name.split(" - ")[0] || ""
      const brand = node.product.brand || node.product.name.split(" - ")[1] || "Brand"
      const price = node.product.price
      const weight = node.product.weights || 0

      // Draw price inside the node
      ctx.fillStyle = isInOptimalPath || isInRangePath ? "#ffffff" : textColor
      ctx.font = "bold 14px Inter, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`₹${price.toFixed(0)}`, position.x, position.y - 10)

      // Draw weight inside the node
      ctx.fillStyle = isInOptimalPath || isInRangePath ? "#ffffff" : textColor
      ctx.font = "12px Inter, sans-serif"
      ctx.fillText(`${weight}kg`, position.x, position.y + 10)

      // Draw brand below the node with improved visibility and more space
      ctx.fillStyle = isInOptimalPath ? primaryColor : isInRangePath ? inRangeColor : textColor
      ctx.font = "bold 13px Inter, sans-serif"

      // Add a background for the brand text to make it more readable
      const brandText = brand
      const brandMetrics = ctx.measureText(brandText)
      const brandWidth = brandMetrics.width + 10 // Add padding
      const brandHeight = 20

      // Draw background for brand text
      ctx.fillStyle = isInOptimalPath
        ? "rgba(6, 182, 212, 0.1)"
        : isInRangePath
          ? "rgba(16, 185, 129, 0.1)"
          : "rgba(255, 255, 255, 0.7)"
      if (isDark) {
        ctx.fillStyle = isInOptimalPath
          ? "rgba(6, 182, 212, 0.3)"
          : isInRangePath
            ? "rgba(16, 185, 129, 0.3)"
            : "rgba(30, 41, 59, 0.7)"
      }

      // Use roundRect with fallback for browsers that don't support it
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(position.x - brandWidth / 2, position.y + nodeRadius + 10, brandWidth, brandHeight, 5)
        ctx.fill()
      } else {
        // Fallback for browsers without roundRect
        ctx.beginPath()
        ctx.rect(position.x - brandWidth / 2, position.y + nodeRadius + 10, brandWidth, brandHeight)
        ctx.fill()
      }

      // Draw brand text
      ctx.fillStyle = isInOptimalPath ? primaryColor : isInRangePath ? inRangeColor : textColor
      ctx.fillText(brandText, position.x, position.y + nodeRadius + 20)
    })

    // Draw min cost path text at the top with price range
    ctx.font = "bold 24px Inter, sans-serif"
    ctx.fillStyle = textColor
    ctx.textAlign = "left"
    ctx.fillText(`Optimal Path Cost: ₹${totalCost.toFixed(2)}`, 20, 15)

    // Add price range information
    if (minPrice > 0 || maxPrice < Number.POSITIVE_INFINITY) {
      ctx.font = "20px Inter, sans-serif"
      ctx.fillStyle = primaryColor
      ctx.fillText(`Price Range: ₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`, 20, 45)

      // Add best path in range cost
      if (bestPathInRange) {
        ctx.fillStyle = inRangeColor
        ctx.fillText(`Best Path in Range: ₹${bestPathInRange.cost.toFixed(2)}`, 20, 80)
      } else {
        ctx.fillStyle = inRangeColor
        ctx.fillText("No paths found within price range", 20, 80)
      }
    }

    // Draw the path as text (adjust y position if price range is shown)
    const pathTextStartY = minPrice > 0 || maxPrice < Number.POSITIVE_INFINITY ? 105 : 75

    if (path.length > 0) {
      const pathText = path
        .map((node) => {
          const brand = node.product.brand || node.product.name.split(" - ")[1] || "Brand"
          const productName = node.product.name.split(" - ")[0] || ""
          return `${productName} - ${brand}`
        })
        .join(" → ")

      // Draw path text with wrapping
      const maxWidth = canvas.width - 40
      const words = pathText.split(" ")
      let line = ""
      let y = pathTextStartY

      ctx.font = "18px Inter, sans-serif"
      ctx.fillStyle = textColor

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " "
        const metrics = ctx.measureText(testLine)
        const testWidth = metrics.width

        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line, 20, y)
          line = words[i] + " "
          y += 20
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, 20, y)
    }

    // Draw optimal path legend
    ctx.beginPath()
    ctx.arc(30, 1265, 10, 0, Math.PI * 2)
    const pathGradient = ctx.createRadialGradient(30, 130, 0, 30, 130, 10)
    pathGradient.addColorStop(0, primaryColor)
    pathGradient.addColorStop(1, secondaryColor)
    ctx.fillStyle = pathGradient
    ctx.fill()
    ctx.strokeStyle = primaryColor
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = textColor
    ctx.font = "18px Inter, sans-serif"
    ctx.textAlign = "left"
    ctx.fillText("Optimal Path", 50, 1265)

    // Draw in-range path legend
    ctx.beginPath()
    ctx.arc(30, 1295, 10, 0, Math.PI * 2)
    const rangeGradient = ctx.createRadialGradient(30, 160, 0, 30, 160, 10)
    rangeGradient.addColorStop(0, inRangeColor)
    rangeGradient.addColorStop(1, inRangeSecondaryColor)
    ctx.fillStyle = rangeGradient
    ctx.fill()
    ctx.strokeStyle = inRangeColor
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = textColor
    ctx.fillText("Best Path In Price Range", 50, 1295)

    // Draw alternative nodes legend
    ctx.beginPath()
    ctx.arc(30, 1325, 10, 0, Math.PI * 2)
    const altGradient = ctx.createRadialGradient(30, 190, 0, 30, 190, 10)
    altGradient.addColorStop(0, backgroundColor)
    altGradient.addColorStop(1, tertiaryColor)
    ctx.fillStyle = altGradient
    ctx.fill()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = textColor
    ctx.fillText("Other Products", 50, 1325)
  }

  // Redraw on theme change
  useEffect(() => {
    if (mounted) {
      drawGraph()
    }
  }, [theme, graph, path, totalCost, mounted, minPrice, maxPrice, bestPathInRange])

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => {
      if (mounted) {
        drawGraph()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [graph, path, totalCost, theme, mounted, minPrice, maxPrice, bestPathInRange])

  return (
    <div className="w-full h-[800px]">
      <canvas ref={canvasRef} className="w-full h-full" style={{ touchAction: "none" }} />
    </div>
  )
}
