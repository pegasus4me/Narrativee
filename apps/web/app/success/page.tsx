"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tick2 } from "clicons-react";

export default function SuccessPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        const redirect = setTimeout(() => {
            router.push("/");
        }, 3000);

        return () => {
            clearInterval(timer);
            clearTimeout(redirect);
        };
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-2xl text-center max-w-md w-full border border-gray-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Tick2 className="text-green-600" size={32} />
                </div>

                <h1
                    className="text-3xl font-bold text-gray-900 mb-4"
                    style={{ fontFamily: 'var(--font-petrona)' }}
                >
                    Payment Successful!
                </h1>

                <p
                    className="text-gray-600 mb-8"
                    style={{ fontFamily: 'var(--font-noto)' }}
                >
                    Thank you for your purchase. Your subscription is now active.
                </p>

                <div className="text-sm text-gray-500">
                    Redirecting to home in <span className="font-bold text-primary-600">{countdown}</span> seconds...
                </div>
            </div>
        </div>
    );
}
