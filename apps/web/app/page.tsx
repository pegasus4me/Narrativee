import Image from "next/image"
import illustation from "public/heroImage.png"
import { Sparkles, Clock, Globe, Shield } from "lucide-react"
import { WaitlistForm } from "@/components/WaitlistForm"
import logo  from "@/public/logo1.png"
import clickImage from "@/public/cursor.webp"
import profileImage from "@/public/profile.jpg"
export default function Home() {
  return (
    <div className="min-h-screen bg-[#020212] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#0d1226] via-[#020212_50%] to-[#020212] text-white flex flex-col items-center justify-center p-6 md:p-12 selection:bg-indigo-500/30 font-[family-name:var(--font-urbanist)] overflow-x-hidden">
      <header className="w-full max-w-[1440px] mx-auto ">
        <Image src={logo} alt="Logo" className="h-12 w-auto" />
      </header>
      <div className="w-full max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 py-10 md:py-6">
        {/* Left Side: Text Content */}
        <div className="flex flex-col gap-8 md:w-5/12 animate-in fade-in slide-in-from-left duration-1000">
          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-white relative">
            Your newsletter,<br />
            repurposed <span className="relative inline-block">
              <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent relative z-0">everywhere.</span>
             
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-zinc-400 max-w-md leading-relaxed">
            Narrativee helps you repurpose your newsletter content for every platform you use and post it in few clicks, preserving your voice         </p>

          {/* Waitlist Form */}
          <WaitlistForm />
        </div>

        {/* Right Side: Image/Hero Illustration */}
        <div className="relative w-full md:w-7/12 flex justify-center items-center animate-in fade-in zoom-in duration-1000 delay-200">
          <div className="relative w-full scale-110 md:scale-125 origin-center">
             <Image 
                src={illustation} 
                alt="hero" 
                width={1600} 
                height={1400} 
                className="w-full h-auto object-contain"
                priority
             />
          </div>
        </div>
      </div>

      {/* Bottom Section: Social Proof & Features */}
      <div className="w-full max-w-[90%] mx-auto mt-auto pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 pb-12">
            {/* Left Column: Quote & Logos */}
            <div className="flex flex-col gap-8 md:gap-10">
                {/* Founder Quote */}
                <div className="flex items-center gap-4">
                  <Image src={profileImage} alt="Safoan" className="w-14 h-14 rounded-full object-cover border border-white/10" />
                  <div className="flex flex-col">
                    <p className="text-sm md:text-base italic text-zinc-200 max-w-md leading-relaxed">
                      "I was frustrated with content repurposing. Repeating the same lengthy process every single week was exhausting. Narrativee removed that bottleneck completely and let me focus on what actually matters, writing my newsletter."
                    </p>
                    <p className="text-xs text-zinc-400 mt-1.5">
                      <span className="font-bold text-white">Safoan</span>, Founder of Narrativee & Newsletter Creator
                    </p>
                  </div>
                </div>

                {/* Logos */}
                <div className="flex flex-col gap-4">
                    <span className="text-sm font-light text-zinc-500">Works with your favorite social platforms</span>
                <div className="flex flex-wrap items-center gap-8">
<img src="https://cdn.pixabay.com/photo/2021/06/15/12/28/tiktok-6338432_1280.png" alt="TikTok" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/X_icon.svg/3840px-X_icon.svg.png" alt="X" className="h-6 md:h-8 w-auto" />
<img src="https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/substack-app-icon-hd.png" alt="Substack" className="h-9 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" alt="YouTube" className="h-6 md:h-8 w-auto" />
<img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/threads-white-icon.png" alt="Threads" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Bluesky_Logo.svg" alt="Bluesky" className="h-6 md:h-8 w-auto" />
                </div>
            </div>

            </div>
            
            {/* Features list */}
            <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-6 bg-white/[0.03] p-4 md:p-6 rounded-2xl border border-white/5 backdrop-blur-sm min-h-[90px] w-full md:w-auto">
               <FeatureCard icon={<Clock className="w-4 h-4 text-indigo-400" />} title="Save Hours" desc="Automate your content repurposing" />
               <FeatureCard icon={<Globe className="w-4 h-4 text-indigo-400" />} title="Reach more people" desc="Distribute on every platform that matters" />
               <FeatureCard icon={<Shield className="w-4 h-4 text-indigo-400" />} title="For teams and creators" desc="Simple, secure, and made for newsletter creators." />
            </div>
         </div>
      </div>
    </div>
  )
}
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-gray-700/50 pb-4 md:pb-0 md:pr-6 last:border-0 w-full md:w-auto">
      <div className="p-2.5">
        {icon}
      </div>
      <div>
        <h3 className="text-MD font-bold text-white">{title}</h3>
        <p className="text-[12px] text-zinc-500 w-[150px]">{desc}</p>
      </div>
    </div>
  )
}