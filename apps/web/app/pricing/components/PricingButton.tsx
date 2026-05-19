"use client";

import { Button } from "@repo/ui/button";
import { ReactNode } from "react";

interface PricingButtonProps {
    color: "gray" | "primary" | "black";
    onClick?: () => void;
    children: ReactNode;
}

export default function PricingButton({ color, onClick, children }: PricingButtonProps) {
    const colorStyles = {
        gray: "bg-gray-100 p-2 text-gray-900 hover:bg-gray-200 rounded-md",
        primary: "bg-primary-400 text-black p-2 hover:bg-primary-500 rounded-md",
        black: "bg-gray-900 p-2 text-white hover:bg-gray-800 rounded-md",
    };

    return (
        <Button
            onClick={onClick}
            className={`w-full border-0 mb-8 ${colorStyles[color]}`}
        >
            {children}
        </Button>
    );
}
