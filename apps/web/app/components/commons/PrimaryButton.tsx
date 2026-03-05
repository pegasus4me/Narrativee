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
        rounded-full 
        text-sm md:text-base 
        whitespace-nowrap 
        transition-all 
        duration-200 
        border border-primary/20
        ${className || ""}
      `}
            {...props}
        >
            {children}
        </Button>
    );
}
