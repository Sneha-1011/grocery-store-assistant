"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

// Grocery item images
const groceryImages = [
  {
    src: "https://cdn-icons-png.flaticon.com/512/2553/2553691.png", // Milk
    alt: "Milk carton",
    width: 60,
    height: 60,
  },
  {
    src: "/assets/bread.png", // Bread
    alt: "Bread loaf",
    width: 70,
    height: 70,
  },
  {
    src: "https://cdn-icons-png.flaticon.com/512/2553/2553651.png", // Apple
    alt: "Apple",
    width: 50,
    height: 50,
  },
  {
    src: "https://cdn-icons-png.flaticon.com/512/2553/2553691.png", // Cheese
    alt: "Cheese",
    width: 55,
    height: 55,
  },
  {
    src: "https://cdn-icons-png.flaticon.com/512/2553/2553635.png", // Carrot
    alt: "Carrot",
    width: 45,
    height: 45,
  },
  {
    src: "https://cdn-icons-png.flaticon.com/512/2553/2553642.png", // Broccoli
    alt: "Broccoli",
    width: 50,
    height: 50,
  },
  {
    src: "https://cdn-icons-png.flaticon.com/512/2553/2553650.png", // Banana
    alt: "Banana",
    width: 60,
    height: 60,
  },
  {
    src: "https://cdn-icons-png.flaticon.com/512/2553/2553639.png", // Tomato
    alt: "Tomato",
    width: 45,
    height: 45,
  },
  {
    src: "https://cdn-icons-png.flaticon.com/512/2553/2553652.png", // Strawberry
    alt: "Strawberry",
    width: 40,
    height: 40,
  },
  {
    src: "https://cdn-icons-png.flaticon.com/512/2553/2553638.png", // Eggplant
    alt: "Eggplant",
    width: 55,
    height: 55,
  },
]

export function FloatingGroceryItems() {
  const [items, setItems] = useState<
    Array<{
      id: number
      x: string
      y: string
      image: (typeof groceryImages)[0]
      delay: number
      duration: number
    }>
  >([])

  useEffect(() => {
    // Generate random positions for grocery items
    const newItems = Array.from({ length: 15 }, (_, i) => {
      const x = `${Math.random() * 100}%`
      const y = `${Math.random() * 100}%`
      const imageIndex = Math.floor(Math.random() * groceryImages.length)
      const delay = Math.random() * 5
      const duration = 6 + Math.random() * 4 // Between 6-10s

      return {
        id: i,
        x,
        y,
        image: groceryImages[imageIndex],
        delay,
        duration,
      }
    })

    setItems(newItems)
  }, [])

  return (
    <div className="floating-grocery-items">
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="floating-item"
          initial={{ x: item.x, y: item.y, opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.05, 0.1, 0.05],
            scale: [0.8, 1, 0.8],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          style={{ left: item.x, top: item.y }}
        >
          <Image
            src={item.image.src || "/placeholder.svg"}
            alt={item.image.alt}
            width={item.image.width}
            height={item.image.height}
            className="dark:invert"
          />
        </motion.div>
      ))}
    </div>
  )
}
