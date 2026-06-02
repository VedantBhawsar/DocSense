"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

export function useAnimatedInView(threshold = 0.2) {
  return { ref: null, inView: true }
}

export function StepCircle({ 
  step, 
  delay = 0,
}: { 
  step: number
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <motion.div
        className="size-28 mx-auto rounded-full relative z-10 flex items-center justify-center"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.div
          className="size-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }}
        >
          <motion.span 
            className="text-3xl font-bold"
            style={{ color: 'var(--primary)' }}
          >
            {step}
          </motion.span>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute top-1/2 left-full w-full h-0.5 z-0 hidden md:block"
        style={{ backgroundColor: 'var(--border)' }}
        initial={{ scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: delay + 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  )
}

export function FeatureCard({ 
  children, 
  delay = 0,
  className = "",
  style = {}
}: { 
  children: ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedSection({ 
  children, 
  className,
  delay = 0,
  style = {}
}: { 
  children: ReactNode
  className?: string
  delay?: number
  style?: React.CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

export function FloatingOrb({ 
  className = "",
  color = 'var(--primary)',
  size = 200,
  blur = 100,
  duration = 8,
  delay = 0
}: { 
  className?: string
  color?: string
  size?: number
  blur?: number
  duration?: number
  delay?: number
}) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{ backgroundColor: color, width: size, height: size, filter: `blur(${blur}px)` }}
      animate={{
        y: [0, -40, 0],
        x: [0, 20, 0],
        opacity: [0.06, 0.12, 0.06],
        scale: [1, 1.1, 1]
      }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    />
  )
}