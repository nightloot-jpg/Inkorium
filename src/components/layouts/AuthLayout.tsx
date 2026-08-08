import * as React from "react"
import { Hexagon } from "lucide-react"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans bg-[#F9FAFB]">
      {/* Decorative blurry background circles to mimic the reference image gradient vibe */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E8EBF2] rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FCE8F3] rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-[#EBE9F5] rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-[440px] p-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-soft">
                <Hexagon className="w-6 h-6 text-white" />
            </div>
        </div>

        {children}
      </div>
    </div>
  )
}
