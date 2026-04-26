"use client"

import { useState } from "react"
import { MoveRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    
    try {
      const response = await fetch("https://discord.com/api/webhooks/1498053728945569934/QKmykdAyZp4o0hBKejVnT8VGpjObW2TprgGx_6zjomv4PMcg2cKHLKjo8BU_L6AjHVCX", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `🎉 New Waitlist Signup: **${email}**`
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit to waitlist")
      }
      
      setShowSuccessModal(true)
      setEmail("")
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 pt-4 w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="flex-1 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 md:px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 disabled:hover:bg-indigo-600 font-semibold text-white transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Get Early Access
                <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        <div className="flex items-center gap-2 px-1">
          <span className="text-amber-400 text-sm">🎁</span>
          <p className="text-sm text-zinc-400">
            <span className="text-zinc-300 font-medium">Bonus:</span> Join now and get 40% off for the first 2 months when we launch.
          </p>
        </div>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md border-white/10 bg-[#020212]/95 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
              🎉 You're on the list!
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-base pt-2">
              We've secured your spot and will notify you as soon as Narrativee is ready. Plus, we've locked in your 40% discount for the first 2 months!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm text-zinc-300 font-medium tracking-wider">STATUS</span>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-1 rounded-full">VERIFIED</span>
            </div>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition-all active:scale-95 mt-2"
            >
              Got it, thanks!
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
