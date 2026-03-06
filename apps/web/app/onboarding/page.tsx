"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";
import { Upload, Building2, Globe, ArrowRight, Check, Loader2, Sparkles, User, FileText, Languages } from "lucide-react";
import Image from "next/image";
import logo from "../../public/logodark.png";
import PrimaryButton from "../components/commons/PrimaryButton";

type Step = "input-url" | "verify" | "connect-publication" | "preferences" | "completing";

export default function OnboardingPage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const [step, setStep] = useState<Step>("input-url");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Redirect logic
    useEffect(() => {
        if (!isPending) {
            if (!session?.user) {
                router.push("/auth/signin");
            } else if (session.user.onboarded) {
                router.push("/workspace");
            }
        }
    }, [isPending, session, router]);

    // Form Data

    const [substackUrl, setSubstackUrl] = useState("");
    const [profileData, setProfileData] = useState<any>(null);
    const [preferences, setPreferences] = useState({
        language: "English",
        writingStyle: "Professional",
        contentTopics: [] as string[]

    });
    const [topicInput, setTopicInput] = useState("");

    const fetchProfile = async () => {
        if (!substackUrl.includes("substack.com")) {
            setError("Please enter a valid Substack URL (e.g. https://substack.com/@username)");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/substack/fetch-profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.session?.token}`
                },
                credentials: "include",
                body: JSON.stringify({ profileUrl: substackUrl })
            });

            if (!response.ok) {
                const data: any = await response.json();
                throw new Error(data.error || "Failed to fetch profile");
            }

            const data: any = await response.json();
            setProfileData(data);
            setStep("verify");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to fetch profile. Please check the URL.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/onboarding/complete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.session?.token}`
                },
                credentials: "include",
                body: JSON.stringify({
                    substackPublicationName: profileData.name || "My Publication",
                    substackPublicationUrl: profileData.publicationUrl || profileData.url, // Use confirmed pub URL
                    substackPublicationLogo: profileData.image,
                    substackProfileUrl: profileData.url,
                    substackBio: profileData.bio,
                    substackHandle: profileData.handle,
                    // Preferences
                    language: preferences.language,
                    writingStyle: preferences.writingStyle,
                    contentTopics: preferences.contentTopics
                })
            });

            console.log("prfiee", profileData);
            if (!response.ok) {
                throw new Error("Failed to complete onboarding");
            }

            // Redirect to workspace
            router.push("/workspace");
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    const addTopic = () => {
        if (topicInput.trim() && !preferences.contentTopics.includes(topicInput.trim())) {
            setPreferences(prev => ({
                ...prev,
                contentTopics: [...prev.contentTopics, topicInput.trim()]
            }));
            setTopicInput("");
        }
    };

    const removeTopic = (topic: string) => {
        setPreferences(prev => ({
            ...prev,
            contentTopics: prev.contentTopics.filter(t => t !== topic)
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full  p-8 transition-all duration-300">

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Image src={logo} alt="Narrativee" width={140} height={40} className="object-contain" />
                </div>

                {/* Progress Indicators (Simple dots) */}
                <div className="flex justify-center gap-2 mb-8">
                    <div className={`h-2 w-2 rounded-full ${step === 'input-url' ? 'bg-primary w-6' : 'bg-gray-200'}`} />
                    <div className={`h-2 w-2 rounded-full ${step === 'verify' ? 'bg-primary w-6' : 'bg-gray-200'}`} />
                    <div className={`h-2 w-2 rounded-full ${step === 'connect-publication' ? 'bg-primary w-6' : 'bg-gray-200'}`} />
                    <div className={`h-2 w-2 rounded-full ${step === 'preferences' ? 'bg-primary w-6' : 'bg-gray-200'}`} />
                </div>

                {/* STEP 1: Input URL */}
                {step === "input-url" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-urbanist">Connect Substack</h1>
                            <p className="text-gray-500">Enter your Substack profile URL to get started.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Substack Profile URL</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Globe className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="https://substack.com/@username"
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-400 rounded-lg focus:ring-primary focus:border-primary transition-colors"
                                        value={substackUrl}
                                        onChange={(e) => setSubstackUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && fetchProfile()}
                                    />
                                </div>
                                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                            </div>

                            <PrimaryButton
                                onClick={fetchProfile}
                                disabled={isLoading || !substackUrl}
                                className="w-full justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                        Fetching...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                    </>
                                )}
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* STEP 2: Verify Profile */}
                {step === "verify" && profileData && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl text-gray-900 mb-2 font-urbanist">Is this you?</h1>
                            <p className="text-gray-500 font-light">Confirm your profile details</p>
                        </div>

                        <div className="rounded-xl p-6 flex flex-col items-center text-center bg-gray-50/50">
                            {profileData.image ? (
                                <img
                                    src={profileData.image}
                                    alt={profileData.name}
                                    className="w-24 h-24 rounded-full border-4 mb-4 object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <User className="w-10 h-10" />
                                </div>
                            )}

                            <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
                            {profileData.handle && <a href={profileData.url} className="text-primary font-medium">@{profileData.handle}</a>}

                            {profileData.bio && (
                                <p className="text-gray-600 text-sm mt-3 line-clamp-3">
                                    "{profileData.bio}"
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setStep('input-url')}
                                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                No, retry
                            </button>
                            <PrimaryButton
                                onClick={() => setStep('connect-publication')}
                                className="justify-center"
                            >
                                Yes, that&apos;s me
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* STEP 3: Connect Publication */}
                {step === "connect-publication" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl text-gray-900 mb-2 font-urbanist">Connect Publication</h1>
                            <p className="text-gray-500 font-light">
                                Connecting your blog URL helps for AI fine-tuning and content generation.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-center font-medium text-gray-700 mb-1">Substack Publication URL</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="https://yourname.substack.com"
                                        className="block w-full pl-10 pr-3 text-center py-3 border-none text-xl font-light focus:outline-none border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-colors"
                                        value={profileData?.publicationUrl || ""}
                                        onChange={(e) => setProfileData({ ...profileData, publicationUrl: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-center">Please verify it's correct.</p>
                            </div>

                            <PrimaryButton
                                onClick={() => setStep('preferences')}
                                className="w-full justify-center"
                            >
                                Continue
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* STEP 4: Preferences */}
                {step === "preferences" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl text-gray-900 mb-2 font-urbanist">Personalize your companion</h1>
                            <p className="text-gray-500 font-light">Tell us how you write.</p>
                        </div>

                        <div className="space-y-5">
                            {/* Language */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
                                    Preferred Language
                                </label>
                                <select
                                    className="w-full p-3 border placeholder:text-gray-400 border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary bg-white pr-5"
                                    value={preferences.language}
                                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                                >
                                    <option>English</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                    <option>German</option>
                                    <option>Italian</option>
                                    <option>Portuguese</option>
                                </select>
                            </div>

                            {/* Writing Style */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
                                    Writing Style
                                </label>
                                <select
                                    className="w-full p-3 border placeholder:text-gray-400 border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary bg-white"
                                    value={preferences.writingStyle}
                                    onChange={(e) => setPreferences({ ...preferences, writingStyle: e.target.value })}
                                >
                                    <option>Professional</option>
                                    <option>Casual</option>
                                    <option>Academic</option>
                                    <option>Storytelling</option>
                                    <option>Direct</option>
                                    <option>Inspirational</option>
                                </select>
                            </div>

                            {/* Content Topics */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
                                    Core Topics discussed
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Add a topic (e.g. AI, Marketing)..."
                                        className="flex-1 p-3 border placeholder:text-gray-400 border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary"
                                        value={topicInput}
                                        onChange={(e) => setTopicInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                                    />
                                    <button
                                        onClick={addTopic}
                                        className="bg-gray-100 px-4 rounded-lg font-bold text-gray-700 hover:bg-gray-200"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {preferences.contentTopics.map((topic, idx) => (
                                        <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border border-primary/20">
                                            {topic}
                                            <button onClick={() => removeTopic(topic)} className="hover:text-red-500 ml-1">×</button>
                                        </span>
                                    ))}
                                    {preferences.contentTopics.length === 0 && (
                                        <span className="text-gray-400 text-sm italic">No topics added yet.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

                        <PrimaryButton
                            onClick={handleComplete}
                            disabled={isLoading}
                            className="w-full justify-center mt-4"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                    Setting up Workspace...
                                </>
                            ) : (
                                "Complete Setup"
                            )}
                        </PrimaryButton>
                    </div>
                )}
            </div>

            <p className="mt-8 text-gray-400 text-sm">
                Need help? <a href="#" className="text-gray-600 hover:text-primary transition-colors">Contact support</a>
            </p>
        </div>
    );
}
