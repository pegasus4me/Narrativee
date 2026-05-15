import Image from "next/image"
import illustation from "@/public/dash.png"
import { Target, Brain, Clock, BarChart2 } from "lucide-react"
import { WaitlistForm } from "@/components/WaitlistForm"
import logo  from "@/public/logo.png"
import clickImage from "@/public/cursor.webp"
import profileImage from "@/public/profile.jpg"
export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-6 md:p-12 selection:bg-indigo-500/30 font-[family-name:var(--font-urbanist)] overflow-x-hidden">
      <header className="w-full max-w-[1440px] mx-auto ">
        <Image src={logo} alt="Logo" className="h-12 w-auto" />
      </header>
      <div className="w-full max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 py-10 md:py-6">
        {/* Left Side: Text Content */}
        <div className="flex flex-col gap-8 md:w-5/12">
          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-zinc-900 relative">
           turn your newsletter into native platform content
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-zinc-600 max-w-md leading-relaxed">
            Narrativee helps newsletter creators turn their newsletter into platform-native posts for LinkedIn, Twitter and Instagram without rewriting from scratch
          </p>
          {/* Waitlist Form */}
          <WaitlistForm />
        </div>

        {/* Right Side: Image/Hero Illustration */}
        <div className="relative w-full md:w-7/12 flex justify-center items-center">
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
      <div className="w-full flex justify-center mx-auto mt-8 md:mt-12">
         <div className="flex flex-col md:flex-row justify-center items-center gap-12 pb-12 w-full max-w-[1440px]">
            {/* Left Column: Quote & Logos */}
            <div className="flex flex-col gap-8 md:gap-10">

                {/* Logos */}
                <div className="flex flex-col gap-4">
                    <span className="text-sm font-light text-zinc-600">Works with your favorite social platforms</span>
                <div className="flex flex-wrap items-center gap-8">
<img src="https://cdn.pixabay.com/photo/2021/06/15/12/28/tiktok-6338432_1280.png" alt="TikTok" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/X_icon.svg/3840px-X_icon.svg.png" alt="X" className="h-6 md:h-8 w-auto" />
<img src="https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/substack-app-icon-hd.png" alt="Substack" className="h-9 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" alt="YouTube" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Threads_%28app%29_logo.svg/960px-Threads_%28app%29_logo.svg.png" alt="Threads" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook" className="h-6 md:h-8 w-auto" />
<img src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Bluesky_Logo.svg" alt="Bluesky" className="h-6 md:h-8 w-auto" />
                </div>
            </div>

            </div>
            
            {/* Features list */}
            <div className="flex flex-col lg:flex-row flex-wrap gap-4 md:gap-6 p-1 md:p-6 min-h-[90px]">
               <FeatureCard icon={<Target className="w-5 h-5 text-indigo-600" />} iconBgClass="bg-indigo-100" title="One source of truth" desc="Your newsletter is the starting point for everything." />
               <FeatureCard icon={<Brain className="w-5 h-5 text-emerald-600" />} iconBgClass="bg-emerald-100" title="Voice consistency" desc="AI adapts to your voice, not the other way around." />
               <FeatureCard icon={<Clock className="w-5 h-5 text-orange-600" />} iconBgClass="bg-orange-100" title="Saves hours every week" desc="No more copy-paste, tab switching, or manual rewriting." />
               <FeatureCard icon={<BarChart2 className="w-5 h-5 text-indigo-600" />} iconBgClass="bg-indigo-100" title="See what performs" desc="Track distribution and engagement across platforms." />
            </div>
         </div>
      </div>
    </div>
  )
}
function FeatureCard({ icon, title, desc, iconBgClass }: { icon: React.ReactNode, title: string, desc: string, iconBgClass?: string }) {
  return (
    <div className="flex items-start md:items-center gap-4 border-b md:border-b-0 lg:border-r border-zinc-200 pb-4 md:pb-0 lg:pr-6 last:border-0 w-full lg:w-auto">
      <div className={`p-2.5 rounded-full flex-shrink-0 ${iconBgClass || 'bg-zinc-100'}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
        <p className="text-[12px] text-zinc-500 max-w-[200px] leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  )
}