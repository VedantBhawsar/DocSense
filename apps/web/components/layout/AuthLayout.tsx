import Link from "next/link"
import { FileText, MessageSquare, Zap, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  { icon: MessageSquare, title: "Natural Conversations", desc: "Ask questions and get instant, accurate answers from your documents." },
  { icon: Zap, title: "Lightning Fast", desc: "Process huge documents in seconds with our optimized AI pipeline." },
  { icon: Shield, title: "Secure & Private", desc: "Enterprise-grade encryption keeps your sensitive data protected." }
]

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-primary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)' }} />
        
        {/* Gradient overlays */}
        <div className="absolute -top-[30%] -left-[10%] w-[80%] h-[60%] rounded-full bg-white/8 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-[60%] h-[50%] rounded-full bg-white/5 blur-[100px]" />
        
        <div className="relative z-10 animate-scale-in">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="size-11 rounded-xl bg-white text-primary flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <FileText className="size-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">DocSense</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-[1.15] text-white">
            Unlock the knowledge hidden in your documents.
          </h1>
          <p className="text-white/75 text-lg mb-12 leading-relaxed">
            Join thousands of professionals who save hours every week by chatting directly with their PDFs and documents.
          </p>
          
          <div className="space-y-5">
            {features.map((f, i) => (
              <div key={i} className={cn("flex items-start gap-4 animate-fade-in-up", `animate-stagger-${i+1}`)}>
                <div className="size-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15 backdrop-blur-sm">
                  <f.icon className="size-5 text-white/90" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {["JK", "ML", "AS", "RK"].map((initials) => (
                <div key={initials} className="size-7 rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white">
                  {initials[0]}
                </div>
              ))}
            </div>
            <span className="text-sm text-white/60 ml-2">2,400+ active users</span>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[60%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-12">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                <FileText className="size-5" />
              </div>
              <span className="font-bold text-2xl tracking-tight">DocSense</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}