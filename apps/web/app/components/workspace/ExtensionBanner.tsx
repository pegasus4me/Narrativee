"use client";

import { useState, useEffect } from "react";
import { X, Puzzle, ArrowRight } from "lucide-react";
import Image from "next/image";

import logo from "../../../public/logo.png";

export default function ExtensionBanner({ isSidebarOpen = true }: { isSidebarOpen?: boolean }) {
    if (!isSidebarOpen) return null;

    return (
        <div className="w-full mb-4 px-2">

            <div
                className="relative rounded-2xl overflow-hidden bg-tertiary"

            >
                {/* Orange accent bar */}
                <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                        background: "",
                    }}
                />

                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"

                            >
                                <Image src={logo} alt="Logo" width={30} height={30} />
                            </div>
                            <div>
                                <p className="text-gray-100 font-semibold text-sm leading-tight">
                                    Get the Chrome Extension
                                </p>
                                <p className="text-gray-500 text-xs mt-0.5">
                                    Narrativee · Free
                                </p>
                            </div>
                        </div>



                        {/* CTA */}
                        <a
                            href="https://chrome.google.com/webstore"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-primary"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg"
                                alt="Chrome"
                                className="w-5 h-5"
                            />
                            Download from Chrome Store
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
            );
}
