"use client";

import { useState, useEffect } from "react";
import { X, Puzzle, ArrowRight } from "lucide-react";
import Image from "next/image";

import logo from "../../../public/logo.png";

export default function ExtensionBanner({ isSidebarOpen = true }: { isSidebarOpen?: boolean }) {
    if (!isSidebarOpen) return null;

    return (
        <div className="mt-3">
            

            <div
                className=""

            >
                {/* Orange accent bar */}
                <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                        background: "",
                    }}
                />

                <div className="">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                       



                        {/* CTA */}
                        <a
                            href="https://chrome.google.com/webstore"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full  p-2 rounded-xl text-sm font-semibold text-white bg-primary"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg"
                                alt="Chrome"
                                className="w-5 h-5"
                            />
                            Download extension
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
            );
}