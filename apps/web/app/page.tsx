import Image from "next/image";
import Link from "next/link";
import brandDesignerIllustration from "public/brand-designer-rose-painter.png";
import brandDesignerRocket from "public/brand-designer-rose-rocket-transparent.png";
import brandDesignerBoard from "public/brand-designer-rose-brand-board.png";
import brandDesignerCards from "public/brand-designer-rose-social-cards.png";
import Header from "./components/commons/Header";
import WaitlistForm from "./components/landing/WaitlistForm";
import VisitorStats from "./components/landing/VisitorStats";

const features = [
  {
    title: "A designer who knows your brand",
    copy: "Bring your website, logo, imagery and references. Your designer uses your approved brand rules and saved preferences for each new brief.",
  },
  {
    title: "A creative partner for your team",
    copy: "Share your audience, message and objective. Work with your designer on a concept, composition and visual direction that serve the brief.",
  },
  {
    title: "Finished creative you can edit",
    copy: "Keep your actual logo and imagery, with editable text and graphics. Adjust the details in Studio and export your creative when it is ready.",
  },
  {
    title: "Brand context for the next brief",
    copy: "Save the rules and feedback you want your designer to keep. The next request draws on that context, so you have less to explain again.",
  },
];

const journal = [
  {
    kicker: "Ad creative",
    title: "Give your next campaign a clear direction.",
    copy: "Turn your offer, message and source imagery into a static ad creative that fits your brand and gives you a direction to refine.",
  },
  {
    kicker: "Social media",
    title: "Show up as your brand.",
    copy: "Create social graphics for announcements, customer stories and everyday updates using your brand's colors, typography and imagery.",
  },
  {
    kicker: "Promotions",
    title: "Make the next offer feel like you.",
    copy: "Bring a new offer or launch brief to your designer. Shape the message and visual together, then edit and export the finished asset.",
  },
];

const questions = [
  {
    question: "What is Narrativee?",
    answer:
      "Narrativee is an AI brand designer being built to work alongside companies and agencies on recurring social and ad creative. Bring an existing brand and a brief, then work together on an editable asset you can refine and export.",
  },
  {
    question: "What is the brand brain?",
    answer:
      "Brand Brain holds your brand rules, references, imagery and saved feedback. Confirm your brand identity and save the preferences you want to reuse. Your designer receives that context for new briefs; automatic learning from Studio conversations is still in development.",
  },
  {
    question: "What could I make with it?",
    answer:
      "The first offer focuses on static social media and ad creative for an existing brand: announcements, promotional offers and customer stories. We are starting with one editable square creative per brief, with text, graphics and imagery you can adjust in Studio.",
  },
  {
    question: "Can I try it today?",
    answer:
      "Narrativee is in development. Join the waitlist and we will let you know when early access opens.",
  },
];

export default function Home(): React.ReactNode {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-white text-[#171717] [color-scheme:light] font-sans antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[calc(100%-32px)] max-w-[1248px] -translate-x-1/2 border-x border-dashed border-neutral-400"
      />
      <Header />
      <main
        id="top"
        className="relative mx-auto w-[calc(100%-48px)] md:w-[min(60%,1120px)]"
      >
        <section
          className="relative left-1/2 grid w-[min(calc(100vw-48px),1120px)] -translate-x-1/2 grid-cols-1 items-center gap-8 py-16 md:min-h-[615px] md:grid-cols-[1.15fr_1fr] md:gap-10 md:py-24"
          aria-labelledby="hero-title"
        >
          <div className="min-w-0 text-left">
            <div className="max-w-full">
              <h1
                id="hero-title"
                className="m-0 text-[clamp(2.25rem,4.5vw,4rem)] font-stackSans font-medium leading-[1.3] tracking-[-0.045em]"
              >
                Your AI copilot
                <br />
                for social and ad{" "}
                <span className="inline-block whitespace-nowrap">
                  <Image
                    src="/hero-creatives.svg"
                    alt="creatives"
                    width={526}
                    height={134}
                    className="inline-block h-auto w-[5.25em] align-[-0.08em]"
                    unoptimized
                  />
                  .
                </span>
              </h1>
              <h4 className="font-semibold text-black mt-5">
                [ Your AI brand designer ]
              </h4>
              <p className="my-[45px] md:mt-10 md:mb-9 max-w-[620px] text-[17px] md:text-[20px] font-semibold tracking-[-0.025em] text-[#525252]">
                Work with an AI brand designer that turns your briefs into
                editable visuals, using your brand identity and saved
                preferences.
              </p>
              <div id="start" className="mt-7 scroll-mt-28">
                <WaitlistForm />
              </div>
            </div>
          </div>
          <Image
            src={brandDesignerIllustration}
            alt="A playful designer painting a rose-pink canvas"
            sizes="(max-width: 767px) min(100vw - 48px, 420px), (max-width: 1168px) 45vw, 502px"
            className="mx-auto h-auto w-full max-w-[420px] md:max-w-none"
            priority
          />
        </section>

        <section
          id="features"
          className="relative left-1/2 mb-[110px] w-screen -translate-x-1/2 scroll-mt-24 bg-[#111111] py-20 text-white md:mb-[155px] md:py-28"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-px h-10 overflow-hidden md:h-16"
          >
            <svg
              className="h-full w-[200%] motion-safe:animate-[marquee_30s_linear_infinite]"
              viewBox="0 0 2880 80"
              preserveAspectRatio="none"
            >
              <path
                id="hero-wave-shape"
                fill="#ffffff"
                d="M0 0H1440V40C1400 0 1360 0 1320 40S1240 80 1200 40S1120 0 1080 40S1000 80 960 40S880 0 840 40S760 80 720 40S640 0 600 40S520 80 480 40S400 0 360 40S280 80 240 40S160 0 120 40S40 80 0 40Z"
              />
              <use href="#hero-wave-shape" x="1440" />
            </svg>
          </div>
          <div className="mx-auto grid w-[calc(100%-48px)] grid-cols-1 gap-7 md:w-[min(60%,1120px)] md:grid-cols-2 md:gap-6">
            <div className="max-w-[420px]">
              <h2 className="m-0 text-3xl font-medium leading-[1.15] tracking-[-0.035em] text-white md:text-4xl">
                A designer alongside your team
              </h2>
              <div className="mt-8">
                <Image
                  src={brandDesignerRocket}
                  alt="A playful designer riding a rose-pink pencil rocket"
                  sizes="(max-width: 767px) min(100vw - 48px, 420px), min(30vw, 420px)"
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div className="max-w-[720px]">
              {features.map((feature) => (
                <a
                  className="group block pb-[21px] md:pb-[27px] mb-[25px] md:mb-[34px] last:mb-0 border-b border-[#333333] transition-colors"
                  href="#start"
                  key={feature.title}
                >
                  <div className="mb-[5px] text-[18px] md:text-[20px] font-[550] text-[#f3f3f3] transition-colors group-hover:text-white">
                    {feature.title}
                  </div>
                  <p className="m-0 max-w-[610px] text-[15px] md:text-[17px] font-medium leading-[1.5] text-[#a3a3a3]">
                    {feature.copy}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section
          id="solution"
          className="mb-[110px] md:mb-[155px] scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6"
        >
          <div className="max-w-[420px]">
            <h2 className="m-0 text-3xl font-medium leading-[1.15] tracking-[-0.035em] text-[#171717] md:text-4xl">
              Your brand, the next brief
            </h2>
            <Image
              src={brandDesignerBoard}
              alt="A playful designer arranging a logo and color palette on a brand board"
              sizes="(max-width: 767px) min(100vw - 48px, 420px), min(30vw, 420px)"
              className="mt-8 h-auto w-full"
            />
          </div>
          <div className="md:col-start-2 max-w-[690px]">
            <p className="m-0 text-[17px] md:text-[20px] font-medium tracking-[-0.02em] leading-[1.5] text-[#595959]">
              An announcement. A new offer. Another social post. Give your
              designer the brief and source material, then steer the result in
              Studio. Narrativee brings your saved brand context into the work,
              with editable elements you can refine and export for your existing
              workflow.
            </p>
          </div>
        </section>

        <section className="mb-[110px] md:mb-[155px] scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6">
          <div className="max-w-[420px]">
            <h2 className="m-0 text-3xl font-medium leading-[1.15] tracking-[-0.035em] text-[#171717] md:text-4xl">
              What you can create
            </h2>
            <Image
              src={brandDesignerCards}
              alt="A playful designer assembling rose-pink social posts and ad cards"
              sizes="(max-width: 767px) min(100vw - 48px, 420px), min(30vw, 420px)"
              className="mt-8 h-auto w-full"
            />
          </div>
          <div className="md:col-start-2 grid grid-cols-1 md:grid-cols-2 gap-[18px]">
            {journal.map((item) => (
              <article
                className="first:col-span-full first:min-h-0 min-h-0 md:min-h-[180px] pb-6 border-b border-[#e5e5e5]"
                key={item.title}
              >
                <div className="mb-4 text-xs uppercase tracking-[0.08em] text-[#666666]">
                  {item.kicker}
                </div>
                <h3 className="m-0 mb-3 text-[21px] font-medium leading-[1.2] tracking-[-0.03em] text-[#171717]">
                  {item.title}
                </h3>
                <p className="m-0 text-sm leading-[1.55] text-[#595959]">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="waitlist"
          className="mb-[110px] md:mb-[155px] scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6"
        >
          <h2 className="m-0 max-w-[420px] text-3xl font-medium leading-[1.15] tracking-[-0.035em] text-[#171717] md:text-4xl">
            Early access
          </h2>
          <div className="md:col-start-2 max-w-[700px]">
            <p className="m-0 mb-[26px] text-[17px] md:text-[19px] leading-[1.5] text-[#595959]">
              Need social and ad creative regularly? Join the early-access
              waitlist. We’ll let you know when you can bring your brand and
              first brief to Narrativee.
            </p>
            <a
              className="inline-flex items-center text-[17px] font-semibold text-inherit transition-colors duration-180 hover:text-black"
              href="#start"
            >
              Join early access
            </a>
          </div>
        </section>

        <section
          className="mb-[110px] md:mb-[155px] scroll-mt-12 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6"
          aria-labelledby="faq-title"
        >
          <h2
            id="faq-title"
            className="m-0 max-w-[420px] text-3xl font-medium leading-[1.15] tracking-[-0.035em] text-[#171717] md:text-4xl"
          >
            Frequently asked
          </h2>
          <div className="md:col-start-2">
            {questions.map((item, index) => (
              <details
                className="group border-b border-[#e5e5e5]"
                key={item.question}
                open={index === 0}
              >
                <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 py-[21px] text-left text-[15px] md:text-[17px] text-[#171717] [&::-webkit-details-marker]:hidden after:content-['+'] after:text-[#595959] after:text-[22px] after:transition-transform after:duration-180 group-open:after:rotate-45">
                  {item.question}
                </summary>
                <div className="max-w-[680px] pr-[35px] pb-[22px] text-[15px] leading-[1.55] text-[#595959]">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-10 pt-10 pb-6 md:pt-14">
        <div className="mx-auto w-[calc(100%-48px)] max-w-[1440px]">
          <Link
            className="mt-12 block transition-opacity hover:opacity-80 md:mt-16"
            href="#top"
            aria-label="Narrativee — back to top"
          >
            <Image
              src="/logo-dark.png"
              alt="Narrativee"
              width={2511}
              height={480}
              sizes="(max-width: 768px) calc(100vw - 48px), min(100vw - 48px, 1440px) "
              className="block h-auto w-full opacity-10"
            />
          </Link>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[#e5e5e5] pt-5 text-[12px] text-[#747474] md:mt-14">
            <span>© {new Date().getFullYear()} Narrativee</span>
            <a
              className="transition-colors hover:text-[#171717]"
              href="mailto:contact@narrativee.com"
            >
              contact@narrativee.com
            </a>
            <span>Designed to keep creating.</span>
            <VisitorStats />
          </div>
        </div>
      </footer>
    </div>
  );
}
