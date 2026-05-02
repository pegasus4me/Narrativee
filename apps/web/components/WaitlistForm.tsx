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
import { joinWaitlist } from "@/app/actions/waitlist"

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    
    try {
      const result = await joinWaitlist(email)

      if (!result.success) {
        throw new Error("Failed to submit to waitlist")
      }
      
      if (result.emailError) {
        console.warn("Waitlist joined, but email failed:", result.emailError)
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
        <div className="flex items-start gap-2 px-1 mt-1">
          <span className="text-amber-400 text-sm mt-0.5">🎁</span>
          <p className="text-sm text-zinc-400 leading-snug">
            <span className="text-zinc-300 font-medium">Bonus Bundle:</span> Join now and get 40% off your first 2 months <span className="text-zinc-500 mx-1">+</span> our free playbook: <span className="italic">"The Content Multiplier"</span>.
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
              We've secured your spot and locked in your 40% discount! The ebook will be sent to you soon via email, please make sure to check your spam folder.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
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
