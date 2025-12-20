"use client"
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import FileUploadPrompt from "../../components/FileUploadPrompt";
import workspace from "../../../public/workspace.png";
import before from "../../../public/before.png";
import BeforeAfterSlider from "../../components/BeforeAfterSlider";
import user1 from "../../../public/1.png";
import user2 from "../../../public/2.png";
import user3 from "../../../public/3.png";
import { useGTMTracking } from "../../hooks/useGTMTracking";
import { IoSparkles, IoDocumentText, IoChatbubbles, IoShareSocial, IoFlash, IoShieldCheckmark, IoTime } from "react-icons/io5";

export default function AutomatedReportingPage() {
    const router = useRouter();
    const { trackEvent } = useGTMTracking();

    return (
        <div className="min-h-screen bg-white overflow-x-hidden relative">
            <div className="relative z-10 rounded-br-4xl rounded-bl-4xl mx-3">
                <Header />

                <main className="max-w-[90%] mx-auto px-4 md:px-8 pb-10">

                    {/* Hero Section */}
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mt-10 p-4">

                        {/* Left Column - Text & CTA */}
                        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">

                            <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex -space-x-3">
                                    {[user1, user2, user3].map((img, i) => (
                                        <div key={i} className="relative w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                                            <Image src={img} alt={`User ${i + 1}`} fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col items-start">
                                    <div className="flex gap-0.5 text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <span className="text-sm font-light text-gray-600">Loved by <span className="font-semibold text-gray-900">50+</span> data pros</span>
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-5xl xl:text-7xl leading-[1.1] text-gray-900 tracking-tight font-medium" style={{ fontFamily: 'var(--font-urbanist)' }}>
                                Automate Your Daily & Weekly Reporting
                            </h1>

                            <p className="text-black text-lg md:text-xl mt-6 max-w-lg font-light" style={{ fontFamily: 'var(--font-urbanist)' }}>
                                Stop spending hours copying and pasting from Excel to PowerPoint. Narrativee turns your raw data into written narrative reports instantly.
                            </p>

                            <div className="mt-8 w-full max-w-md">
                                <div className="mb-4 flex justify-center lg:justify-start">
                                    <button
                                        onClick={() => router.push('/auth/signup')}
                                        className="group relative px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-semibold rounded-2xl shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-300/50 transition-all duration-300 hover:scale-105 overflow-hidden"
                                        style={{ fontFamily: 'var(--font-urbanist)' }}
                                    >
                                        <span className="relative z-10 flex items-center gap-2 text-lg">
                                            <IoSparkles className="animate-pulse" size={20} />
                                            Automate My Reports
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </button>
                                </div>
                                <p style={{ fontFamily: 'var(--font-urbanist)' }} className="text-xs font-light text-gray-400 tracking-wider text-center lg:text-left">
                                    INSTANT START • NO ACCOUNT REQUIRED
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Visual */}
                        <div
                            className="flex-1 w-full max-w-3xl lg:max-w-none p-6 rounded-2xl"
                            style={{
                                backgroundImage: 'url(/wallapaper.jpg)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <BeforeAfterSlider
                                className="rounded-xs"
                                beforeImage={before}
                                afterImage={workspace}
                            />
                        </div>

                    </div>

                    {/* File Upload Area - Below Hero */}
                    <div id="file-upload-area" className="mt-16 max-w-2xl mx-auto">
                        <p style={{ fontFamily: 'var(--font-urbanist)' }} className="text-xs font-light text-gray-400 tracking-wider text-center lg:text-left">Try it now: Upload your sales or marketing data.</p>
                        <FileUploadPrompt />
                    </div>

                </main>
            </div>

            {/* Use Case Specific Content */}
            <section className="py-20 px-4 md:px-8 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-amber-500 font-semibold text-sm uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-urbanist)' }}>The Reality</p>
                    <h2 className="text-3xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
                        Why are you still manually writing updates?
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-urbanist)' }}>
                        Weekly status reports, marketing performance reviews, sales updates... they all start with the same data. Narrativee automates the "what happened" so you can focus on "what's next."
                    </p>
                </div>
            </section>

        </div>
    );
}
