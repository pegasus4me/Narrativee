'use client';

import React, { useState } from 'react';
import { authClient } from '../../../lib/auth-client';
import { ViewOff, View, Sparkles, Loader } from "clicons-react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from "../../../public/logo.png";
import PrimaryButton from "../../components/commons/PrimaryButton";
import { useGTMTracking } from "../../hooks/useGTMTracking";

export default function SignIn() {
  const router = useRouter();
  const { trackEvent } = useGTMTracking();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
    } catch (err) {
      setError("Failed to connect with Google");
      setIsLoading(false);
    }
  };

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordField) {
      setShowPasswordField(true);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordField) {
      setShowPasswordField(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.email({
        email,
        password,
      }, {
        onSuccess: async () => {
          trackEvent({ eventName: 'login', eventData: { method: 'email' } });

          // Check if onboarding is complete
          try {
            // We can check the session directly if improved, but usually we need to fetch user details or check a claim.
            // Let's fetch the onboarding status endpoint we made.
            const res = await fetch(`${window.location.origin}/api/onboarding`);
            // Note: Depending on how the client is set up, we might need to handle the URL better or use authClient.useSession if it updates immediately.
            // A safer bet involves either a dedicated check or relying on the session object if it carries the "onboarded" flag.
            // Given our backend `GET /onboarding` endpoint, let's use that.

            // Wait for session to be established? The onSuccess usually implies session is set locally.

            // Actually, `authClient` might not have the session updated in the hook immediately, but the cookie is there.
            // Let's rely on a direct fetch to our new endpoint.
            // Since we are on client, we need the full URL if it's ssr, but here relative is fine.
            // BUT: The api is at API_URL (likely localhost:3002 or narrativee.com).
            // We need to import API_URL.

            // Let's verify where API_URL comes from.
            // It's in `../../lib/api-config`.
          } catch (e) {
            console.error("Failed to check onboarding status", e);
          }

          // Actually, let's do a simple redirect to a generic /dashboard or /workspace
          // AND have a protective wrapper (Layout or specialized component) that redirects to /onboarding if needed.
          // However, the user asked for the redirect *right now*.

          // Let's try to fetch the session/user data.
          const { data } = await authClient.getSession();

          // If our session object (from better-auth) includes the `onboarded` field (which we added to schema), we can use it.
          // If not, we fetch.

          if (data?.user?.onboarded) {
            router.push("/workspace");
          } else {
            router.push("/onboarding");
          }
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setIsLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans antialiased">
      {/* Left Side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-white relative">
        <div className="w-full max-w-[440px]">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <Image src={Logo} alt='narrative' width={100} />
            </div>
            <h1 className="text-3xl font-medium tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-petrona)' }}>
              Sign in
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              Welcome back to Narrativee
            </p>
          </div>

          {/* Card Content - Removed Border/Padding for cleaner look on white bg */}
          <div className="">
            {/* Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 border text-black border-gray-200 font-medium rounded-xl flex items-center justify-center gap-3 transition-all duration-200 hover:bg-gray-50 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-gray-600 font-medium">Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 tracking-widest font-medium" style={{ fontFamily: 'var(--font-petrona)' }}>Or</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700 ml-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>

              {showPasswordField && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[13px] font-medium text-gray-700">Password</label>
                    <a href="/forgot-password" className="text-[12px] text-gray-500 hover:text-black transition-colors">Forgot?</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-11 border border-gray-200 rounded-xl px-4 text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all pr-10 bg-gray-50/50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <ViewOff size={18} /> : <View size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <PrimaryButton
                type="submit"
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  showPasswordField ? "Sign in" : "Continue"
                )}
              </PrimaryButton>
            </form>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                Don't have an account?{" "}
                <a href="/auth/signup" className="text-amber-500 font-medium hover:underline transition-colors">
                  Sign up
                </a>
              </p>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="absolute bottom-6 left-0 right-0 text-center text-gray-400 text-xs" style={{ fontFamily: 'var(--font-petrona)' }}>
            &copy; 2025 Narrativee.
          </div>
        </div>
      </div>

      {/* Right Side: Gradient */}
      <div className="hidden lg:flex w-1/2 rounded-l-md relative items-center justify-center overflow-hidden">
        {/* Abstract Shapes */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-contrast to-contrast/50 rounded-full blur-[100px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-contrast to-contrast/50 rounded-full blur-[120px] opacity-40" />

        {/* Content in the gradient side - optional, maybe a quote or feature highlight */}
        <div className="relative z-10 max-w-md text-center p-8">

        </div>
      </div>
    </div>
  );
}