'use client';

import React, { useState } from 'react';
import { authClient } from '../../../lib/auth-client';
import { ViewOff, View, Sparkles, Loader } from "clicons-react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from "../../../public/sidelogo.png";
import PrimaryButton from "../../components/PrimaryButton";
import { sendGTMEvent } from "../../../lib/gtm";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin ,
      });
    } catch (err) {
      setError("Failed to connect with Google");
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authClient.signUp.email({
        email,
        password,
        name,
      }, {
        onSuccess: () => {
          sendGTMEvent('create_account', { method: 'email' });
          router.push("/create");
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setIsLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans antialiased">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-[440px] z-10">

        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo */}
          <div className="">
            <Image src={Logo} alt='narrative' width={100} />
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-black mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>
            Sign up
          </h1>
          <h3 className='text-black/50 text-sm'>Get started for free. No credit card required.</h3>
        </div>

        {/* Card Content */}
        <div className="p-6 sm:p-8">

          {/* Google Button */}
          <button
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full h-12 border text-black border-gray-200 font-medium rounded-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
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
                <span className="transition-colors">Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="text-sm px-3 text-black tracking-widest font-medium" style={{ fontFamily: 'var(--font-petrona)' }}>Or</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/50 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-600 ml-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-11 border border-gray-200 rounded-lg px-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-600 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 border border-gray-200 rounded-lg px-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-600 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full h-11 border border-gray-200 rounded-lg px-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all pr-10"
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

            <PrimaryButton
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                "Create Account"
              )}
            </PrimaryButton>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[#6B7280] text-sm">
            Already have an account?{" "}
            <a href="/auth/signin" className="text-amber-500 font-medium hover:underline transition-colors">
              Sign in
            </a>
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-[#4B5563] text-xs" style={{ fontFamily: 'var(--font-petrona)' }}>
        &copy; 2025 Narrativee.
      </div>
    </div>
  );
}
