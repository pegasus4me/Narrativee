"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";
import { Upload, Building2, Globe, ArrowRight, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import logo from "../../public/logoDark.png";
import PrimaryButton from "../components/commons/PrimaryButton";
export default function OnboardingPage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [orgName, setOrgName] = useState("");
    const [orgUrl, setOrgUrl] = useState("");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Check if already onboarded
    useEffect(() => {
        if (session?.user?.id) {
            checkOnboardingStatus();
        }
    }, [session]);

    const checkOnboardingStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/onboarding`, {
                credentials: 'include'
            });
            const data = await res.json() as any;

            if (data.onboarded) {
                router.replace('/workspace');
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgName.trim() || !orgUrl.trim()) return;

        setLoading(true);

        try {
            // For now, we'll just send the org data without file upload
            // File upload can be added later with Supabase Storage
            const res = await fetch(`${API_URL}/onboarding/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    orgName: orgName.trim(),
                    orgUrl: orgUrl.trim(),
                    orgLogo: logoPreview // Base64 for now, can be URL later
                })
            });

            if (res.ok) {
                router.push('/workspace');
            } else {
                console.error('Failed to complete onboarding');
            }
        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center p-6 font-manrope">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Image src={logo} alt="Logo" width={120} height={120} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 font-manrope">Set up your organization</h1>
                    <p className="text-gray-500 text-sm font-manrope">Let's get your workspace ready in 30 seconds</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Organization Logo
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative w-24 h-24 mx-auto rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors cursor-pointer group overflow-hidden"
                            >
                                {logoPreview ? (
                                    <>
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
                                        <Upload className="w-6 h-6 mb-1" />
                                        <span className="text-xs">Upload</span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                            <p className="text-center text-xs text-gray-400 mt-2">PNG, JPG up to 2MB</p>
                        </div>

                        {/* Org Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Organization Name
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Acme Inc."
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Org URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Website URL
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="url"
                                    value={orgUrl}
                                    onChange={(e) => setOrgUrl(e.target.value)}
                                    placeholder="https://acme.com"
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <PrimaryButton
                            type="submit"
                            disabled={loading || !orgName.trim() || !orgUrl.trim()}
                            className="w-full"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Continue to Dashboard
                                </>
                            )}
                        </PrimaryButton>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    You can change these settings later in your workspace
                </p>
            </div>
        </div>
    );
}
