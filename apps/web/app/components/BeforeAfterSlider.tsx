"use client";

import { useState, useRef, useEffect } from "react";
import Image, { StaticImageData } from "next/image";

interface BeforeAfterSliderProps {
    beforeImage: string | StaticImageData;
    afterImage: string | StaticImageData;
    beforeLabel?: string;
    afterLabel?: string;
    className?: string;
}

export default function BeforeAfterSlider({
    beforeImage,
    afterImage,
    beforeLabel = "Before",
    afterLabel = "After",
    className = "",
}: BeforeAfterSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;

        setSliderPosition(percentage);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        handleMove(e.clientX);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isDragging || !e.touches[0]) return;
        handleMove(e.touches[0].clientX);
    };

    const handleMouseDown = () => setIsDragging(true);

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        window.addEventListener("mouseup", handleGlobalMouseUp);
        window.addEventListener("touchend", handleGlobalMouseUp);
        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp);
            window.removeEventListener("touchend", handleGlobalMouseUp);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative w-full overflow-hidden rounded-2xl cursor-ew-resize select-none touch-none group ${className}`}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
        >
            {/* After Image (Background) - Defines the height */}
            <div className="relative w-full h-auto">
                <Image
                    src={afterImage}
                    alt={afterLabel}
                    width={2000}
                    height={1500}
                    className="w-full h-auto block"
                    draggable={false}
                    priority
                />
                <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full text-sm font-medium z-10 border border-white/10 shadow-lg">
                    {afterLabel}
                </div>
            </div>

            {/* Before Image (Foreground - Clipped) - Absolute overlay */}
            <div
                className="absolute inset-0 w-full h-full"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <Image
                    src={beforeImage}
                    alt={beforeLabel}
                    fill
                    className="object-cover object-top"
                    draggable={false}
                    priority
                />
                <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full text-sm font-medium z-10 border border-white/10 shadow-lg">
                    {beforeLabel}
                </div>
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 backdrop-blur-sm z-20 border-2 border-gray-400 group-hover:bg-white transition-colors"
                style={{ left: `${sliderPosition}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-gray-800 transition-transform hover:scale-110 active:scale-95">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M15 18l-6-6 6-6" />
                        <path d="M21 12H3" opacity="0" />
                        <path d="M9 18l6-6-6-6" transform="translate(6,0)" />
                        <path d="M8 12h8" strokeWidth="1.5" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
