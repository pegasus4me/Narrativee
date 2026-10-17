import Image from "next/image";
import Link from "next/link";
import brandDesignerRocket from "public/brand-designer-rose-rocket-transparent.png";
import brandDesignerBoard from "public/brand-designer-rose-brand-board.png";
import brandDesignerCards from "public/brand-designer-rose-social-cards.png";
import landingWorkspace from "public/landing-workspace.png";
import Header from "./components/commons/Header";
import StartCreatingLink from "./components/landing/StartCreatingLink";
import VisitorStats from "./components/landing/VisitorStats";
import HeroPlatformStack from "./components/landing/HeroPlatformStack";
import {
  socialPlatformBackgrounds,
  socialPlatformLogos,
} from "@/lib/social-platform-logos";

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
      "Create an account to try the beta. Scan your website, review your Brand Brain, then brief your creative team in Studio. The first version creates one editable square social post or ad at a time.",
  },
];

export default function Home(): React.ReactNode {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-white text-[#171717] [color-scheme:light] font-sans antialiased">
      <Header />
      <main
        id="top"
        className="relative mx-auto w-[calc(100%-48px)] md:w-[min(60%,1120px)]"
      >
        <section
          className="relative left-1/2 flex w-[min(calc(100vw-48px),1120px)] -translate-x-1/2 justify-center py-12 text-center md:py-20"
          aria-labelledby="hero-title"
        >
          <div className="w-full min-w-0 max-w-[960px]">
            <div className="max-w-full">
              <h1
                id="hero-title"
                className="m-0 text-[clamp(2.5rem,5.5vw,4.5rem)] font-stackSans font-medium leading-[1.2] tracking-[-0.045em]"
              >
                From brand context to creative ads your team can{" "}
                <span className="whitespace-nowrap">
                  ship
                  <HeroPlatformStack />
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-[620px] text-[18px] md:text-[22px] font-semibold tracking-[-0.025em] text-[#525252]">
                The shared workspace where your team and AI agents build on your
                brand, keeping every campaign true to what makes it yours.
              </p>
              <div
                id="start"
                className="mx-auto mt-8 w-full max-w-xl scroll-mt-28"
              >
                <StartCreatingLink
                  location="hero"
                  websiteInput
                  className="inline-flex items-center rounded-full px-6 py-4 text-base font-semibold text-white"
                >
                  Amplify my brand →
                </StartCreatingLink>
              </div>
              <ul
                aria-label="Social platforms"
                className="mx-auto mt-8 flex max-w-full flex-wrap items-center justify-center gap-4 p-0 list-none sm:gap-6"
              >
                {Object.entries(socialPlatformLogos).map(([platform, src]) => (
                  <li
                    key={platform}
                    style={{
                      filter:
                        platform === "tiktok"
                          ? "drop-shadow(-1px -1px 0 #25f4ee) drop-shadow(1px 1px 0 #fe2c55)"
                          : undefined,
                    }}
                  >
                    <span
                      role="img"
                      aria-label={platform === "x" ? "X" : platform}
                      className="block size-5 sm:size-6"
                      style={{
                        background: socialPlatformBackgrounds[platform],
                        mask: `url(${src}) center / contain no-repeat`,
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          className="relative left-1/2 mb-[110px] w-[min(calc(100vw-48px),1120px)] -translate-x-1/2 overflow-hidden rounded-xl md:mb-[155px]"
          aria-label="Narrativee creative workspace"
        >
          <Image
            src={landingWorkspace}
            alt="Narrativee Studio showing AI agents and two skincare campaign creatives"
            sizes="(max-width: 1168px) calc(100vw - 48px), 1120px"
            className="block h-auto w-full"
          />
        </section>

        <section
          id="features"
          className="relative left-1/2 mb-[110px] w-screen -translate-x-1/2 scroll-mt-24 bg-[#111111] py-20 text-white md:mb-[155px] md:py-28"
        >
          <div className="mx-auto grid w-[calc(100%-48px)] grid-cols-1 gap-7 md:w-[min(60%,1120px)] md:grid-cols-2 md:gap-6">
            <div className="max-w-[420px]">
              <h2 className="m-0 text-4xl font-medium leading-[1.15] tracking-[-0.035em] text-white md:text-[2.75rem]">
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
                  <div className="mb-[5px] text-[20px] md:text-[22px] font-[550] text-[#f3f3f3] transition-colors group-hover:text-white">
                    {feature.title}
                  </div>
                  <p className="m-0 max-w-[610px] text-[17px] md:text-[19px] font-medium leading-[1.5] text-[#a3a3a3]">
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
            <h2 className="m-0 text-4xl font-medium leading-[1.15] tracking-[-0.035em] text-[#171717] md:text-[2.75rem]">
              Your brand. Your feedback. Better creatives, together.
            </h2>
            <Image
              src={brandDesignerBoard}
              alt="A playful designer arranging a logo and color palette on a brand board"
              sizes="(max-width: 767px) min(100vw - 48px, 420px), min(30vw, 420px)"
              className="mt-8 h-auto w-full"
            />
          </div>
          <div className="md:col-start-2 max-w-[690px]">
            <p className="m-0 text-[19px] md:text-[22px] font-medium tracking-[-0.02em] leading-[1.5] text-[#595959]">
              Narrativee learns how you like to create, helping you shape social
              posts and ads with less repeated briefing.
            </p>
          </div>
        </section>

        <section className="mb-[110px] md:mb-[155px] scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6">
          <div className="max-w-[420px]">
            <h2 className="m-0 text-4xl font-medium leading-[1.15] tracking-[-0.035em] text-[#171717] md:text-[2.75rem]">
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
                <div className="mb-4 text-sm uppercase tracking-[0.08em] text-[#666666]">
                  {item.kicker}
                </div>
                <h3 className="m-0 mb-3 text-2xl font-medium leading-[1.2] tracking-[-0.03em] text-[#171717]">
                  {item.title}
                </h3>
                <p className="m-0 text-base leading-[1.55] text-[#595959]">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="get-started"
          className="mb-[110px] md:mb-[155px] scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6"
        >
          <h2 className="m-0 max-w-[420px] text-4xl font-medium leading-[1.15] tracking-[-0.035em] text-[#171717] md:text-[2.75rem]">
            Meet your creative team
          </h2>
          <div className="md:col-start-2 max-w-[700px]">
            <p className="m-0 mb-[26px] text-[19px] md:text-[21px] leading-[1.5] text-[#595959]">
              Bring your website, brand materials and a brief. Work with your
              research, brand and creative agents in one shared workspace.
            </p>
            <StartCreatingLink
              location="footer"
              websiteInput
              className="inline-flex items-center rounded-full bg-[#171717] px-6 py-3 text-base font-semibold text-white hover:bg-black"
            >
              Start creating →
            </StartCreatingLink>
          </div>
        </section>

        <section
          className="mb-[110px] md:mb-[155px] scroll-mt-12 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6"
          aria-labelledby="faq-title"
        >
          <h2
            id="faq-title"
            className="m-0 max-w-[420px] text-4xl font-medium leading-[1.15] tracking-[-0.035em] text-[#171717] md:text-[2.75rem]"
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
                <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 py-[21px] text-left text-[17px] md:text-[19px] text-[#171717] [&::-webkit-details-marker]:hidden after:content-['+'] after:text-[#595959] after:text-[24px] after:transition-transform after:duration-180 group-open:after:rotate-45">
                  {item.question}
                </summary>
                <div className="max-w-[680px] pr-[35px] pb-[22px] text-[17px] leading-[1.55] text-[#595959]">
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
          <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[#e5e5e5] pt-5 text-sm text-[#747474] md:mt-14">
            <span>© {new Date().getFullYear()} Narrativee</span>
            <Link
              className="transition-colors hover:text-[#171717]"
              href="/pricing"
            >
              Pricing
            </Link>
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
