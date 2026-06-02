"use client"

import { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface MotionProviderProps {
  children: ReactNode
}

export function MotionProvider({ children }: MotionProviderProps) {
  return <>{children}</>
}

export const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, ease: "easeOut" }
}

export const slideInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

export const slideInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
}

export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
}

export const smoothTransition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1]
}

export function AnimatedSection({ 
  children, 
  className,
  delay = 0,
  direction = "up"
}: { 
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
}) {
  const directions = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
    none: {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.7, 
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedCard({ 
  children, 
  className,
  delay = 0,
  scale = true
}: { 
  children: ReactNode
  className?: string
  delay?: number
  scale?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={scale ? { y: -8, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } } : {}}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedNumber({ 
  value, 
  className 
}: { 
  value: number
  className?: string 
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {value}
    </motion.span>
  )
}

export function ParallaxBackground() {
  return (
    <>
      <motion.div
        className="absolute -top-[30%] -left-[5%] w-[60%] h-[60%] rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--primary)', filter: 'blur(140px)' }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.08, 0.12, 0.08]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-[40%] -right-[10%] w-[40%] h-[50%] rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--accent)', filter: 'blur(120px)' }}
        animate={{
          y: [0, 30, 0],
          opacity: [0.06, 0.1, 0.06]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      <motion.div
        className="absolute -bottom-[20%] left-[30%] w-[50%] h-[40%] rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--chart-2)', filter: 'blur(100px)' }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.05, 0.08, 0.05]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
      />
    </>
  )
}