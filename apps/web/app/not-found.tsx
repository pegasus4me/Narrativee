"use client"
import { AlertCircle } from "clicons-react";
import PrimaryButton from "./components/commons/PrimaryButton";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-white" />
            </div>

            <h1
                className="text-6xl font-bold text-gray-900 mb-4"
            >
                404
            </h1>

            <h2
                className="text-2xl font-medium text-gray-800 mb-6"
            >
                Page not found
            </h2>

            <p
                className="text-gray-600 max-w-md mb-10 leading-relaxed"
            >
                Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
            </p>

            <PrimaryButton
                onClick={() => {
                    router.push("/");
                }}
            >
                Return Home
            </PrimaryButton>
        </div>
    );
}
