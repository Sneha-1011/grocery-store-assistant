"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBasket, DollarSign, Sparkles, BarChart3, UserPlus, LogIn } from "lucide-react"
import { FloatingGroceryItems } from "@/components/floating-grocery-items"
import { motion } from "framer-motion"

export default function Home() {

  return (
    <div className="relative min-h-screen grocery-pattern">
      {/* Floating grocery items */}
      <FloatingGroceryItems />

      {/* Content */}
      <div className="relative z-5 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold mb-6 gradient-text"
        >
          Smart Grocery Shopping
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl mb-8 max-w-2xl text-foreground/80"
        >
          Optimize your grocery shopping with us. Stay within budget while getting all the items
          you need.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <Link href="/budget">
            <Button size="lg" className="btn-gradient text-primary-foreground px-8 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Get Started
            </Button>
          </Link>

          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 px-8 flex items-center gap-2 transition-all duration-300"
            >
              <LogIn className="h-5 w-5" />
              Login
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="grocery-card p-6 rounded-lg"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Budget Optimization</h3>
              <p className="text-foreground/80">Stay within your budget while getting all the items you need.</p>
            </motion.div>

            <motion.div
              whileHover={{
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="grocery-card p-6 rounded-lg"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Smart Alternatives</h3>
              <p className="text-foreground/80">Find the best alternatives for your grocery items.</p>
            </motion.div>

            <motion.div
              whileHover={{
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="grocery-card p-6 rounded-lg"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Visual Decision Making</h3>
              <p className="text-foreground/80">See the optimal path for your grocery selection.</p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12"
        >
          <Link href="/budget">
            <Button size="lg" className="btn-gradient text-primary-foreground px-12 flex items-center gap-2 group">
              <ShoppingBasket className="h-5 w-5 group-hover:animate-pulse-once" />
              Explore
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
