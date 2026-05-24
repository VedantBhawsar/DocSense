"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { FileText, MessageSquare, Zap, Shield, ArrowRight, Sparkles, BookOpen, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/documents")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="size-4 rounded-full bg-primary animate-pulse" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.77_0.22_264),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.45_0.22_264),transparent)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <header className="relative z-10 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">DocSense</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gap-1.5">
                Get started <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pt-24 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Sparkles className="size-3.5" />
              AI-powered document intelligence
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Chat with your documents
              <span className="block text-primary">like never before</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload any PDF and get instant answers. DocSense uses advanced AI to understand your documents and have meaningful conversations about their content.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-base h-12 px-8">
                  Start free <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="gap-2 text-base h-12 px-8">
                  View demo
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-24 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl shadow-primary/5">
              <div className="flex items-start gap-4 mb-6">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">DocSense Assistant</p>
                  <p className="text-xs text-muted-foreground">Ready to help</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-muted rounded-2xl rounded-tl-sm p-4 max-w-md">
                  <p className="text-sm">Upload your PDFs and start asking questions right away. I can help you understand contracts, research papers, manuals, and more!</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">Your turn</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Powerful features to make document interaction effortless and intuitive.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Natural Conversations</h3>
                <p className="text-muted-foreground leading-relaxed">Ask questions in plain English and get precise answers extracted directly from your documents.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Processing</h3>
                <p className="text-muted-foreground leading-relaxed">Upload and process documents in seconds. Our AI quickly indexes content for blazing-fast responses.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Private & Secure</h3>
                <p className="text-muted-foreground leading-relaxed">Your documents are encrypted and never shared. Full control over your data with enterprise-grade security.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Three simple steps to start chatting with your documents.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
                <h3 className="text-xl font-semibold mb-3">Upload your PDF</h3>
                <p className="text-muted-foreground">Drag and drop any PDF file. We support documents up to 50MB with no limits on pages.</p>
              </div>
              <div className="text-center">
                <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
                <h3 className="text-xl font-semibold mb-3">AI processes it</h3>
                <p className="text-muted-foreground">Our AI analyzes and indexes your document, understanding structure and content.</p>
              </div>
              <div className="text-center">
                <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
                <h3 className="text-xl font-semibold mb-3">Start chatting</h3>
                <p className="text-muted-foreground">Ask anything about your document and get accurate, contextual answers instantly.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple pricing</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Start free, upgrade when you need more.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="p-8 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="size-5 text-muted-foreground" />
                  <span className="font-semibold">Free</span>
                </div>
                <p className="text-4xl font-bold mb-2">$0</p>
                <p className="text-muted-foreground mb-6">Forever free with basic features.</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary" /> 5 documents per month</li>
                  <li className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary" /> 50MB max file size</li>
                  <li className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary" /> Basic AI responses</li>
                </ul>
                <Link href="/signup" className="block">
                  <Button variant="outline" className="w-full">Get started</Button>
                </Link>
              </div>
              <div className="p-8 rounded-2xl bg-card border-2 border-primary relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">Popular</div>
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="size-5 text-primary" />
                  <span className="font-semibold">Pro</span>
                </div>
                <p className="text-4xl font-bold mb-2">$19<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
                <p className="text-muted-foreground mb-6">For power users who need more.</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary" /> Unlimited documents</li>
                  <li className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary" /> 100MB max file size</li>
                  <li className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary" /> Advanced AI with better accuracy</li>
                  <li className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary" /> Priority support</li>
                </ul>
                <Link href="/signup" className="block">
                  <Button className="w-full">Upgrade to Pro</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-muted/30">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground text-lg mb-10">Join thousands of users who chat with their documents every day.</p>
            <Link href="/signup">
              <Button size="lg" className="gap-2 text-base h-12 px-8">
                Create free account <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary flex items-center justify-center">
              <FileText className="size-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-sm">DocSense</span>
          </div>
          <p className="text-sm text-muted-foreground">Built with AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}