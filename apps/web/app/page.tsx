"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, ReactNode } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { FileText, MessageSquare, Zap, ArrowRight, Sparkles, BookOpen, CheckCircle2, Github, Twitter, Star, Layers, Brain, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

function TypingDemo() {
  const [text, setText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [showResponse, setShowResponse] = useState(false)
  const fullText = "What are the key findings and methodology used?"
  
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    
    if (isTyping) {
      if (text.length < fullText.length) {
        timeout = setTimeout(() => {
          setText(fullText.slice(0, text.length + 1))
        }, 40 + Math.random() * 40)
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false)
          setShowResponse(true)
        }, 500)
      }
    }
    
    return () => clearTimeout(timeout)
  }, [text, isTyping])

  return (
    <motion.div 
      className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div 
        className="px-5 py-4 flex items-center gap-3.5" 
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <motion.div 
          className="size-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--primary)' }}
          whileHover={{ scale: 1.05, rotate: -5 }}
        >
          <FileText className="size-4" style={{ color: 'var(--primary-foreground)' }} />
        </motion.div>
        <div className="min-w-0">
          <motion.p 
            className="text-sm font-semibold truncate" 
            style={{ color: 'var(--foreground)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            research_paper_2026.pdf
          </motion.p>
          <motion.p 
            className="text-xs" 
            style={{ color: 'var(--muted-foreground)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            24 pages · Ready to analyze
          </motion.p>
        </div>
        <motion.div 
          className="ml-auto shrink-0 flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div 
            className="size-2 rounded-full" 
            style={{ backgroundColor: '#22c55e' }}
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Online</span>
        </motion.div>
      </motion.div>
      
      <div className="p-6 flex flex-col gap-5 flex-1">
        <motion.div 
          className="flex flex-col gap-1.5 items-end"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <motion.div 
            className="rounded-2xl rounded-tr-md px-4 py-3 text-sm max-w-[80%] leading-relaxed"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {text}
            {isTyping && (
              <motion.span 
                className="inline-block w-1.5 h-4 ml-1 rounded-sm align-middle" 
                style={{ backgroundColor: 'var(--primary-foreground)', opacity: 0.6 }}
                animate={{ opacity: [0.6, 0.3, 0.6] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </motion.div>
        </motion.div>
        
        {showResponse && (
          <motion.div 
            className="flex gap-3 items-start"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div 
              className="size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: 'var(--primary)' }}
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-foreground)' }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </motion.div>
            <motion.div 
              className="rounded-2xl rounded-tl-md px-5 py-4 text-sm max-w-[85%] leading-relaxed"
              style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <motion.p 
                className="font-semibold mb-3" 
                style={{ color: 'var(--foreground)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Analysis Results
              </motion.p>
              <div className="space-y-2.5" style={{ color: 'var(--muted-foreground)' }}>
                {[
                  { text: "The study employs a mixed-methods approach with 847 participants across 12 institutions.", color: 'var(--primary)' },
                  { text: "Key finding: 73% improvement in outcomes compared to baseline measurements.", color: 'var(--accent)' },
                  { text: "95% confidence interval reported with p-value less than 0.001.", color: 'var(--chart-3)' }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.15 }}
                  >
                    <motion.div 
                      className="size-1.5 rounded-full mt-2 shrink-0" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function AnimatedSection({ children, className, delay = 0, style = {} }: { children: ReactNode; className?: string; delay?: number; style?: React.CSSProperties }) {
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

function FeatureCard({ children, delay = 0, className = "", style = {} }: { children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
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

function StepCircle({ step, delay = 0 }: { step: number; delay?: number }) {
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

function FloatingOrb({ className = "", color = 'var(--primary)', size = 200, blur = 100, duration = 8, delay = 0 }: { className?: string; color?: string; size?: number; blur?: number; duration?: number; delay?: number }) {
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

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-foreground)' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function CpuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-foreground)' }}>
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-foreground)' }}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function WorkflowDemo() {
  return (
    <motion.div
      className="relative max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <DocumentWorkflowAnimation />
    </motion.div>
  )
}

function DocumentWorkflowAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [stage, setStage] = useState(0)
  const [documentY, setDocumentY] = useState(0)
  const [particles, setParticles] = useState<{id: number, x: number, y: number}[]>([])
  const [chatMessages, setChatMessages] = useState<string[]>([])
  const [typingText, setTypingText] = useState("")
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const runSequence = () => {
      setStage(0)
      setDocumentY(0)
      setParticles([])
      setChatMessages([])
      setTypingText("")
      setShowCursor(true)

      const sequence: { delay: number; action: () => void }[] = [
        { delay: 300, action: () => setStage(1) },
        { delay: 1000, action: () => setDocumentY(-30) },
        { delay: 1600, action: () => setStage(2) },
        { delay: 2200, action: () => {
          setParticles([...Array(12)].map((_, i) => ({ id: i, x: 50 + Math.random() * 300, y: 180 + Math.random() * 80 })))
        }},
        { delay: 3800, action: () => {
          setParticles([])
          setDocumentY(0)
          setStage(3)
        }},
        { delay: 4200, action: () => {
          setChatMessages(["What are the key findings?"])
          let charIndex = 0
          const text = "The study employed mixed-methods with 847 participants across 12 institutions, showing 73% improvement with p-value less than 0.001."
          const interval = setInterval(() => {
            setTypingText(text.slice(0, charIndex + 1))
            charIndex++
            if (charIndex >= text.length) {
              clearInterval(interval)
              setShowCursor(false)
            }
          }, 25)
          return () => clearInterval(interval)
        }}
      ]

      const timeouts: ReturnType<typeof setTimeout>[] = []

      sequence.forEach(({ delay, action }) => {
        const t = setTimeout(action, delay)
        timeouts.push(t)
      })

      return () => timeouts.forEach((t) => clearTimeout(t))
    }

    const cleanup = runSequence()
    const loopTimeout = setTimeout(() => {
      cleanup?.()
      const intervalId = setInterval(() => {
        cleanup?.()
        runSequence()
      }, 8000)
      return () => clearInterval(intervalId)
    }, 6500)

    return () => {
      cleanup?.()
      clearTimeout(loopTimeout)
    }
  }, [isVisible])

  return (
    <div ref={ref} className="relative h-[480px] rounded-3xl overflow-hidden" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, transparent 50%, rgba(139, 92, 246, 0.02) 100%)' }} />

      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.4 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 80 240 Q 240 160, 400 240 T 720 240"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: isVisible ? 1 : 0, opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
      </svg>

      <div className="relative h-full flex items-center justify-center">
        <motion.div
          className="absolute w-16 h-20 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--muted)', border: '2px solid var(--primary)', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)', left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}
          initial={{ opacity: 0 }}
          animate={isVisible ? { y: documentY, scale: stage >= 3 ? 0.6 : stage >= 2 ? 0.8 : 1, opacity: stage >= 3 ? 0.4 : 1 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={stage === 2 && isVisible ? { rotate: [0, 8, -8, 0] } : {}}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            <FileText className="size-8" style={{ color: 'var(--primary)' }} />
          </motion.div>

          {stage >= 2 && isVisible && (
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#22c55e' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <CheckCircle2 className="size-4 text-white" />
            </motion.div>
          )}
        </motion.div>

        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--primary)' }}
            initial={{ x: 400, y: 240, opacity: 0 }}
            animate={isVisible ? {
              x: p.x,
              y: p.y,
              opacity: [0, 0.7, 0],
              scale: [0.5, 1.2, 0.5]
            } : {}}
            transition={{ duration: 0.8, delay: p.id * 0.04 }}
          />
        ))}

        {stage >= 3 && isVisible && (
          <motion.div
            className="absolute left-1/2 top-[55%] -translate-x-1/2 w-[360px] max-w-[85%] rounded-2xl p-4"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div className="size-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <FileText className="size-3" style={{ color: 'var(--primary-foreground)' }} />
              </motion.div>
              <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>research_paper.pdf</span>
              <motion.div className="ml-auto size-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            </div>

            <div className="space-y-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <motion.div
                    className="rounded-xl rounded-tr-sm px-3 py-2.5 text-xs ml-auto max-w-[80%]"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {msg}
                  </motion.div>
                  {typingText && (
                    <motion.div
                      className="rounded-xl rounded-tl-sm px-3 py-2.5 text-xs max-w-[85%]"
                      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {typingText}
                      {showCursor && (
                        <motion.span className="inline-block w-0.5 h-3 ml-1 rounded-sm align-middle" style={{ backgroundColor: 'var(--primary)' }} animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {['Upload', 'Process', 'Chat'].map((label, i) => (
          <motion.div
            key={label}
            className="flex items-center gap-2"
            animate={{ opacity: isVisible && stage >= i + 1 ? 1 : 0.4 }}
            transition={{ duration: 0.4 }}
          >
            {i > 0 && (
              <motion.div
                className="w-6 h-px"
                style={{ backgroundColor: isVisible && stage > i ? 'var(--primary)' : 'var(--border)' }}
              />
            )}
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isVisible && stage >= i + 1 ? 'var(--primary)' : 'var(--muted)' }} />
            <span className="text-xs font-medium" style={{ color: isVisible && stage >= i + 1 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
              {label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/documents")
    }
  }, [status, router])

  if (status === "loading" || session) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center" 
        style={{ backgroundColor: 'var(--background)' }}
      >
        <motion.div 
          className="flex items-center gap-3" 
          style={{ color: 'var(--muted-foreground)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div 
            className="size-4 rounded-full" 
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <span className="text-sm font-medium">Loading...</span>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen" 
      style={{ backgroundColor: 'var(--background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background Orbs */}
      <FloatingOrb color="var(--primary)" size={400} blur={120} duration={10} delay={0} className="[-top:20%] [-left:5%]" />
      <FloatingOrb color="var(--accent)" size={300} blur={100} duration={12} delay={3} className="[top:40%] [-right:10%]" />
      <FloatingOrb color="var(--chart-2)" size={350} blur={100} duration={14} delay={5} className="[-bottom:20%] [left:30%]" />

      {/* Navigation */}
      <motion.header 
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2.5 group"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="size-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary)' }}
              whileHover={{ scale: [1, 1.05, 1], rotate: [0, -5, 0] }}
              transition={{ duration: 0.3 }}
            >
              <FileText className="size-4" style={{ color: 'var(--primary-foreground)' }} />
            </motion.div>
            <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--foreground)' }}>DocSense</span>
          </motion.div>
          
          <motion.nav 
            className="hidden md:flex items-center gap-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {["Features", "How it works", "Pricing"].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium"
                style={{ color: 'var(--muted-foreground)' }}
                whileHover={{ y: -2, color: 'var(--foreground)' }}
                transition={{ duration: 0.2 }}
              >
                {item}
              </motion.a>
            ))}
          </motion.nav>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/login">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="ghost" size="sm" className="font-medium">Sign in</Button>
              </motion.span>
            </Link>
            <Link href="/signup">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="sm" className="gap-2 font-medium">
                  Get started <ArrowRight className="size-3.5" />
                </Button>
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </motion.header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 lg:px-10 pt-20 md:pt-28 pb-24 lg:pb-36">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="max-w-xl">
              <motion.div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium mb-8"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', opacity: 0.1 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="size-3.5" style={{ color: 'var(--primary)' }} />
                </motion.div>
                <span style={{ color: 'var(--primary)' }}>AI-powered document intelligence</span>
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.span style={{ color: 'var(--foreground)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  Talk to your
                </motion.span>
                <br />
                <motion.span 
                  style={{ color: 'var(--primary)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  documents.
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl mb-10 leading-relaxed"
                style={{ color: 'var(--muted-foreground)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                Don't just read your documents—converse with them. DocSense uses advanced AI to extract insights, answer questions, and summarize content instantly.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <Link href="/signup">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg" className="gap-2.5 text-base h-12 px-7 font-medium">
                      Start free <ArrowRight className="size-4" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/login">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" size="lg" className="gap-2.5 text-base h-12 px-7 font-medium">
                      View demo
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-6 mt-10 pt-8"
                style={{ borderTop: '1px solid var(--border)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {["JK", "ML", "AS", "RK"].map((initials, i) => (
                      <motion.div 
                        key={initials} 
                        className="size-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderColor: 'var(--background)' }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        whileHover={{ scale: 1.1, zIndex: 10 }}
                      >
                        {initials[0]}
                      </motion.div>
                    ))}
                  </div>
                  <span className="text-sm ml-2" style={{ color: 'var(--muted-foreground)' }}>2,400+ users</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + i * 0.05 }}
                    >
                      <Star className="size-4" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    </motion.div>
                  ))}
                  <span className="text-sm ml-1" style={{ color: 'var(--muted-foreground)' }}>4.9/5</span>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              className="relative h-[420px] md:h-[480px] w-full max-w-lg mx-auto lg:max-w-none lg:mr-0"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <TypingDemo />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 lg:py-32" style={{ backgroundColor: 'var(--muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <AnimatedSection delay={0} className="mb-16 max-w-2xl">
              <motion.p 
                className="text-sm font-semibold uppercase tracking-widest mb-4" 
                style={{ color: 'var(--primary)' }}
              >
                Features
              </motion.p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight leading-[1.1]" style={{ color: 'var(--foreground)' }}>
                Everything you need to work faster
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Powerful AI capabilities built into a beautifully designed interface.
              </p>
            </AnimatedSection>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Primary Feature */}
              <FeatureCard delay={0.1} className="lg:col-span-2 rounded-2xl p-8 lg:p-10" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <motion.div 
                  className="size-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'var(--primary)' }}
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <MessageSquare className="size-7" style={{ color: 'var(--primary-foreground)' }} />
                </motion.div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-4 tracking-tight" style={{ color: 'var(--foreground)' }}>Conversational AI</h3>
                <p className="leading-relaxed max-w-lg text-base lg:text-lg" style={{ color: 'var(--muted-foreground)' }}>
                  Ask complex questions and receive precise answers with direct citations from your documents. The AI understands context, nuance, and document structure.
                </p>
              </FeatureCard>
              
              {/* Small Feature 1 */}
              <FeatureCard delay={0.15} className="rounded-2xl p-8" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <motion.div 
                  className="size-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#fef3c7' }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Zap className="size-7" style={{ color: '#d97706' }} />
                </motion.div>
                <h3 className="text-xl font-bold mb-3 tracking-tight" style={{ color: 'var(--foreground)' }}>Lightning Fast</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Upload large documents and start chatting in seconds. Our vector database ensures instant retrieval.
                </p>
              </FeatureCard>
              
              {/* Small Feature 2 */}
              <FeatureCard delay={0.2} className="rounded-2xl p-8" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <motion.div 
                  className="size-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#e0e0e0' }}
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Layers className="size-7" style={{ color: '#333' }} />
                </motion.div>
                <h3 className="text-xl font-bold mb-3 tracking-tight" style={{ color: 'var(--foreground)' }}>Multi-format Support</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Process PDFs, DOCX files, and more. Automatic text extraction and intelligent chunking.
                </p>
              </FeatureCard>
              
              {/* Small Feature 3 */}
              <FeatureCard delay={0.25} className="rounded-2xl p-8" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <motion.div 
                  className="size-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#d4e8d4' }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Brain className="size-7" style={{ color: '#2d5a2d' }} />
                </motion.div>
                <h3 className="text-xl font-bold mb-3 tracking-tight" style={{ color: 'var(--foreground)' }}>Smart Summaries</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Get instant summaries, key points, and structured insights from any document.
                </p>
              </FeatureCard>
              
              {/* Small Feature 4 */}
              <FeatureCard delay={0.3} className="rounded-2xl p-8" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <motion.div 
                  className="size-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#e8d4d4' }}
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Lock className="size-7" style={{ color: '#5a2d2d' }} />
                </motion.div>
                <h3 className="text-xl font-bold mb-3 tracking-tight" style={{ color: 'var(--foreground)' }}>Enterprise Security</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Your data is encrypted at rest and in transit. Documents are isolated and never used for training.
                </p>
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* How it works - Animated Demo */}
        <section id="how-it-works" className="py-24 lg:py-32 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <AnimatedSection className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--primary)' }}>Process</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight leading-[1.1]" style={{ color: 'var(--foreground)' }}>See it in action</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>Watch how DocSense transforms your documents into interactive conversations.</p>
            </AnimatedSection>

            <WorkflowDemo />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 lg:py-32" style={{ backgroundColor: 'var(--muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <AnimatedSection className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--primary)' }}>Pricing</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight leading-[1.1]" style={{ color: 'var(--foreground)' }}>Simple, transparent pricing</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>Start for free, upgrade when you need more power.</p>
            </AnimatedSection>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <FeatureCard delay={0.1} className="p-8 lg:p-10 rounded-2xl" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <motion.div 
                    className="size-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--muted)' }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <BookOpen className="size-6" style={{ color: 'var(--muted-foreground)' }} />
                  </motion.div>
                  <span className="font-bold text-xl" style={{ color: 'var(--foreground)' }}>Free</span>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-bold" style={{ color: 'var(--foreground)' }}>$0</span>
                  <span className="ml-2" style={{ color: 'var(--muted-foreground)' }}>forever</span>
                </div>
                <p className="mb-8 pb-8" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>Perfect for trying out DocSense on smaller files.</p>
                
                <ul className="space-y-4 mb-8">
                  {["3 documents total", "50 messages per month", "5MB max file size", "Standard processing speed"].map((f, i) => (
                    <motion.li 
                      key={f} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <CheckCircle2 className="size-5 shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)' }} />
                      <span style={{ color: 'var(--muted-foreground)' }}>{f}</span>
                    </motion.li>
                  ))}
                </ul>
                <Link href="/signup" className="block">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button variant="outline" className="w-full h-12 text-base font-medium">Get started for free</Button>
                  </motion.span>
                </Link>
              </FeatureCard>
              
              {/* Pro Plan */}
              <FeatureCard delay={0.2} className="p-8 lg:p-10 rounded-2xl" style={{ backgroundColor: 'var(--card)', border: '2px solid var(--primary)' }}>
                <motion.div 
                  className="absolute top-0 right-0 text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wide"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  Most Popular
                </motion.div>
                
                <div className="flex items-center gap-3 mb-6">
                  <motion.div 
                    className="size-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }}
                    whileHover={{ scale: 1.1, rotate: -5 }}
                  >
                    <Zap className="size-6" style={{ color: 'var(--primary)' }} />
                  </motion.div>
                  <span className="font-bold text-xl" style={{ color: 'var(--primary)' }}>Pro</span>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-bold" style={{ color: 'var(--foreground)' }}>$19</span>
                  <span className="ml-2" style={{ color: 'var(--muted-foreground)' }}>/month</span>
                </div>
                <p className="mb-8 pb-8" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>For professionals who rely on documents daily.</p>
                
                <ul className="space-y-4 mb-8">
                  {["Unlimited documents", "Unlimited messages", "50MB max file size", "Priority processing", "Export chats to Markdown"].map((f, i) => (
                    <motion.li 
                      key={f} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.25 + i * 0.1 }}
                    >
                      <CheckCircle2 className="size-5 shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>{f}</span>
                    </motion.li>
                  ))}
                </ul>
                <Link href="/signup" className="block">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button className="w-full h-12 text-base font-medium">Upgrade to Pro</Button>
                  </motion.span>
                </Link>
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <motion.section 
          className="py-24 lg:py-32 relative overflow-hidden"
          style={{ backgroundColor: 'var(--primary)' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)' }}
          />
          <motion.div 
            className="mx-auto max-w-4xl px-6 lg:px-10 text-center relative z-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight" style={{ color: 'var(--primary-foreground)' }}>
              Ready to unlock your documents?
            </h2>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--primary-foreground)', opacity: 0.8 }}>
              Join thousands of users who are already saving hours of reading time every week.
            </p>
            <Link href="/signup">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="secondary" className="gap-2.5 text-base h-14 px-8 font-semibold rounded-full">
                  Create free account <ArrowRight className="size-4" />
                </Button>
              </motion.span>
            </Link>
          </motion.div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t pt-16 pb-8 relative z-10" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <motion.div 
                className="flex items-center gap-2.5 mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="size-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                  <FileText className="size-4" style={{ color: 'var(--primary-foreground)' }} />
                </div>
                <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--foreground)' }}>DocSense</span>
              </motion.div>
              <motion.p 
                className="text-sm max-w-xs mb-6 leading-relaxed"
                style={{ color: 'var(--muted-foreground)' }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                The intelligent way to interact with your documents. Extract insights faster with AI.
              </motion.p>
              <motion.div 
                className="flex items-center gap-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <a href="#" style={{ color: 'var(--muted-foreground)' }}>
                  <Twitter className="size-5" />
                </a>
                <a href="#" style={{ color: 'var(--muted-foreground)' }}>
                  <Github className="size-5" />
                </a>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Product</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li><a href="#features" className="hover:opacity-80 transition-opacity">Features</a></li>
                <li><a href="#pricing" className="hover:opacity-80 transition-opacity">Pricing</a></li>
                <li><a href="#" className="hover:opacity-80 transition-opacity">Changelog</a></li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Resources</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li><a href="#" className="hover:opacity-80 transition-opacity">Documentation</a></li>
                <li><a href="#" className="hover:opacity-80 transition-opacity">Blog</a></li>
                <li><a href="#" className="hover:opacity-80 transition-opacity">Contact</a></li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Legal</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li><a href="#" className="hover:opacity-80 transition-opacity">Privacy Policy</a></li>
                <li><a href="#" className="hover:opacity-80 transition-opacity">Terms of Service</a></li>
              </ul>
            </motion.div>
          </div>
          
          <motion.div 
            className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderTop: '1px solid var(--border)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>© {new Date().getFullYear()} DocSense. All rights reserved.</p>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <span>Made with</span>
              <span style={{ color: 'var(--destructive)' }}>♥</span>
              <span>by the DocSense team</span>
            </div>
          </motion.div>
        </div>
      </footer>
    </motion.div>
  )
}