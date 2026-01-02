import { Button } from "@repo/ui/button";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
}

export default function PrimaryButton({ children, className, ...props }: PrimaryButtonProps) {
    return (
        <Button
            className={`
        bg-primary 
        hover:bg-contrast
        text-white 
        font-medium 
        px-4 py-2 md:px-5 md:py-2 
        rounded-lg 
        text-sm md:text-base 
        whitespace-nowrap 
        transition-all 
        duration-200 
        border border-primary/20
        shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.05)]
        active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]
        active:translate-y-[1px]
        ${className || ""}
      `}
            {...props}
        >
            {children}
        </Button>
    );
}
