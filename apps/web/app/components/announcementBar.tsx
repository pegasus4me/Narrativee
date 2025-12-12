"use client";

import { ArrowRight } from "clicons-react";
import Link from "next/link";

export default function AnnouncementBar() {
    return (
        <div className="w-full flex justify-center">
            <Link
                href="#"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-amber-200/50 hover:bg-white hover:border-amber-300 backdrop-blur-sm transition-all duration-300 group cursor-pointer"
            >
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900" style={{ fontFamily: 'var(--font-urbanist)' }}>
                    Introducing Narrativee 1.0
                </span>
                <ArrowRight size={12} className="text-gray-400 group-hover:text-amber-600 transition-colors" />
            </Link>
        </div>
    );
}