import Image from "next/image";
import Link from "next/link";
import Header from "./components/commons/Header";
import HeroGradient from "./components/landing/HeroGradient";
import WaitlistForm from "./components/landing/WaitlistForm";

const features = [
  {
    title: "A designer who knows your brand",
    copy: "Bring your website, guidelines, references and past work. Your brand brain keeps that context close to every new project.",
  },
  {
    title: "Creative direction, not just generation",
    copy: "Explore ideas with an agent that considers your business, audience and competitors before making design decisions.",
  },
  {
    title: "From identity to campaign",
    copy: "Work together on brand explorations, logos, illustrations, launch visuals and campaigns in one workspace.",
  },
  {
    title: "A relationship that gets better",
    copy: "Keep the directions you love, change what you do not and carry those decisions into the next piece of work.",
  },
];

const journal = [
  {
    kicker: "Brand exploration",
    title: "Find the look only your brand could own.",
    copy: "Explore new directions with the story, audience and competitive landscape behind each creative choice.",
  },
  {
    kicker: "Campaigns",
    title: "Make the next launch feel like you.",
    copy: "Create a visual world for an announcement, an Instagram campaign or a new offer.",
  },
  {
    kicker: "Everyday design",
    title: "Keep moving without starting over.",
    copy: "Carry what your brand has learned into the next illustration, social asset or piece of promotional work.",
  },
];

const questions = [
  {
    question: "What is Narrativee?",
    answer: "Narrativee is a workspace for creating with an AI brand designer. The vision is to take you from creative exploration to finished brand and campaign assets with an agent that knows your business.",
  },
  {
    question: "What is the brand brain?",
    answer: "It is the context your designer builds from your website, brand guidelines, references, past work and feedback, so each new project starts with an understanding of your brand.",
  },
  {
    question: "What could I make with it?",
    answer: "Narrativee is being built for brand explorations, rebrands, logos, illustrations, launch materials and campaigns—not just one-off images.",
  },
  {
    question: "Can I try it today?",
    answer: "Narrativee is in development. Join the waitlist and we will let you know when early access opens.",
  },
];

export default function Home(): React.ReactNode {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#050505] text-[#f3f3f3] font-sans antialiased">
      <HeroGradient />
      <Header />
      <main id="top" className="relative mx-auto w-[calc(100%-48px)] md:w-[min(60%,1120px)]">
        <section className="min-h-[680px] pt-[48px] md:min-h-[705px] md:pt-10" aria-labelledby="hero-title">
          <div className="text-center">
            <div className="mx-auto max-w-full">
              <h1
                id="hero-title"
                className="m-0 text-[clamp(2.7rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.045em]"
              >
                Not another design tool. An AI brand designer that learns your business.
              </h1>
              <p className="mx-auto my-[25px] md:mt-10 md:mb-9 max-w-[620px] text-[17px] md:text-[20px] font-medium leading-[1.4] tracking-[-0.025em] text-[#9a9a9a]">
                A creative partner for the work ahead. Explore identities, make campaigns and create beautiful assets with an agent that remembers what makes your brand yours.
              </p>
              <div id="start" className="mt-7 scroll-mt-28">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mb-[110px] md:mb-[155px] scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6">
          <h2 className="m-0 text-[17px] md:text-[18px] font-[550] leading-[1.4] text-[#929292]">More than a design tool</h2>
          <div className="max-w-[720px]">
            {features.map((feature) => (
              <a
                className="group block pb-[21px] md:pb-[27px] mb-[25px] md:mb-[34px] last:mb-0 border-b border-[#252525] transition-colors"
                href="#start"
                key={feature.title}
              >
                <div className="mb-[5px] text-[18px] md:text-[20px] font-[550] text-[#f3f3f3] transition-colors group-hover:text-white">
                  {feature.title}
                </div>
                <p className="m-0 max-w-[610px] text-[15px] md:text-[17px] font-medium leading-[1.5] text-[#929292]">
                  {feature.copy}
                </p>
              </a>
            ))}
          </div>
        </section>

        <section id="solution" className="mb-[110px] md:mb-[155px] scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6">
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-[18px] md:mb-[52px]" aria-label="Abstract visual explorations">
            <div className="relative aspect-[1.8] md:aspect-auto md:h-[clamp(190px,25vw,360px)] overflow-hidden bg-[#080808]">
              <Image src="/narrativee-use-1.png" alt="Blue, pink and green abstract light texture" fill sizes="(max-width: 760px) 92vw, 30vw" className="object-cover" />
            </div>
            <div className="relative aspect-[1.8] md:aspect-auto md:h-[clamp(190px,25vw,360px)] overflow-hidden bg-[#080808]">
              <Image src="/narrativee-use-2.png" alt="Blue and magenta abstract light texture" fill sizes="(max-width: 760px) 92vw, 30vw" className="object-cover" />
            </div>
          </div>
          <h2 className="m-0 text-[17px] md:text-[18px] font-[550] leading-[1.4] text-[#929292]">One brand, every project</h2>
          <div className="md:col-start-2 max-w-[690px]">
            <p className="m-0 text-[17px] md:text-[20px] font-medium tracking-[-0.02em] leading-[1.5] text-[#999999]">
              A new identity. A launch campaign. The illustration you need by tomorrow. Narrativee is being built to connect all of it: your creative decisions, your finished work and the context behind them, ready for whatever you make next.
            </p>
          </div>
        </section>

        <section className="mb-[110px] md:mb-[155px] scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6">
          <h2 className="m-0 text-[17px] md:text-[18px] font-[550] leading-[1.4] text-[#929292]">What you can create</h2>
          <div className="md:col-start-2 grid grid-cols-1 md:grid-cols-2 gap-[18px]">
            {journal.map((item) => (
              <article
                className="first:col-span-full first:min-h-0 min-h-0 md:min-h-[180px] pb-6 border-b border-[#252525]"
                key={item.title}
              >
                <div className="mb-4 text-xs uppercase tracking-[0.08em] text-[#858585]">{item.kicker}</div>
                <h3 className="m-0 mb-3 text-[21px] font-medium leading-[1.2] tracking-[-0.03em] text-[#f3f3f3]">{item.title}</h3>
                <p className="m-0 text-sm leading-[1.55] text-[#929292]">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="waitlist" className="mb-[110px] md:mb-[155px] scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6">
          <h2 className="m-0 text-[17px] md:text-[18px] font-[550] leading-[1.4] text-[#929292]">Early access</h2>
          <div className="md:col-start-2 max-w-[700px]">
            <p className="m-0 mb-[26px] text-[17px] md:text-[19px] leading-[1.5] text-[#999999]">
              Join the waitlist for early access. We’ll let you know when Narrativee is ready for you to try.
            </p>
            <a className="inline-flex items-center text-[17px] font-semibold text-inherit transition-colors duration-180 hover:text-white" href="#start">
              Join the waitlist
            </a>
          </div>
        </section>

        <section className="mb-[110px] md:mb-[155px] scroll-mt-12 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6" aria-labelledby="faq-title">
          <h2 id="faq-title" className="m-0 text-[17px] md:text-[18px] font-[550] leading-[1.4] text-[#929292]">Frequently asked</h2>
          <div className="md:col-start-2">
            {questions.map((item, index) => (
              <details className="group border-b border-[#252525]" key={item.question} open={index === 0}>
                <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 py-[21px] text-left text-[15px] md:text-[17px] text-[#f3f3f3] [&::-webkit-details-marker]:hidden after:content-['+'] after:text-[#999999] after:text-[22px] after:transition-transform after:duration-180 group-open:after:rotate-45">
                  {item.question}
                </summary>
                <div className="max-w-[680px] pr-[35px] pb-[22px] text-[15px] leading-[1.55] text-[#929292]">{item.answer}</div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-10 pt-10 pb-6 md:pt-14">
        <div className="mx-auto w-[calc(100%-48px)] max-w-[1440px]">
          <Link className="mt-12 block transition-opacity hover:opacity-80 md:mt-16" href="#top" aria-label="Narrativee — back to top">
            <Image
              src="/logo-white.png"
              alt="Narrativee"
              width={2511}
              height={480}
              sizes="(max-width: 768px) calc(100vw - 48px), min(100vw - 48px, 1440px) "
              className="block h-auto w-full opacity-10"
            />
          </Link>
          <div className="mt-10 flex items-center justify-between border-t border-[#222222] pt-5 text-[12px] text-[#747474] md:mt-14">
            <span>© {new Date().getFullYear()} Narrativee</span>
            <span>Designed to keep creating.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
