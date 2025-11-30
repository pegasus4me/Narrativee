"use client";

import { Button } from "@repo/ui/button";
import { ReactNode } from "react";

interface PricingButtonProps {
    color: "gray" | "amber" | "black";
    onClick?: () => void;
    children: ReactNode;
}

export default function PricingButton({ color, onClick, children }: PricingButtonProps) {
    const colorStyles = {
        gray: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        amber: "bg-amber-400 text-black hover:bg-amber-500",
        black: "bg-gray-900 text-white hover:bg-gray-800",
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
