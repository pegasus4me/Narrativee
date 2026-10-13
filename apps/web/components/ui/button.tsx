"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"
  | "primary"
  | "tertiary"
  | "secondary"
  | "outline"
  | "destructive"
  | "contrast"
  | "ghost";

export type ButtonSize =
  | "sm"
  | "default"
  | "md"
  | "lg"
  | "xl"
  | "icon"
  | "icon-sm";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Custom contrast color for the 3D bottom edge */
  contrastColor?: string;
  /** Pass-through child element instead of rendering a native button */
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-zinc-900 text-white [--btn-contrast:#09090b] hover:bg-zinc-800",
  primary:
    "bg-zinc-900 text-white [--btn-contrast:#09090b] hover:bg-zinc-800",
  tertiary:
    "bg-[#ef5da8] text-white [--btn-contrast:#b8327a] hover:bg-[#f26cb0]",
  secondary:
    "bg-[#78ff93] text-zinc-950 font-bold [--btn-contrast:#30b852] hover:bg-[#8aff9f]",
  outline:
    "bg-white text-zinc-900 border border-zinc-200/90 [--btn-contrast:#d4d4d8] hover:bg-zinc-50",
  destructive:
    "bg-rose-600 text-white [--btn-contrast:#9f1239] hover:bg-rose-500",
  contrast:
    "bg-zinc-950 text-[#78ff93] border border-[#78ff93]/30 [--btn-contrast:#78ff93] hover:border-[#78ff93]/60",
  ghost:
    "bg-transparent text-zinc-700 shadow-none hover:bg-zinc-100 hover:text-zinc-900 active:translate-y-0.5",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  default: "h-10 px-4 py-2 text-sm rounded-xl gap-2",
  md: "h-10 px-4 py-2 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2.5",
  xl: "h-14 px-8 text-lg rounded-2xl gap-3",
  icon: "size-10 rounded-xl p-0",
  "icon-sm": "size-8 rounded-lg p-0",
};

export const buttonBaseStyles =
  "relative inline-flex items-center justify-center font-semibold select-none cursor-pointer outline-none transition-all duration-100 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none";

export const button3DStyles =
  "translate-y-0 shadow-[0_4px_0_0_var(--btn-contrast)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_var(--btn-contrast)] active:translate-y-1 active:shadow-[0_0px_0_0_var(--btn-contrast)]";

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  const is3D = variant !== "ghost";
  return cn(
    buttonBaseStyles,
    is3D && button3DStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      contrastColor,
      asChild = false,
      style,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const is3D = variant !== "ghost";
    const customStyle: React.CSSProperties = {
      ...(contrastColor
        ? ({ "--btn-contrast": contrastColor } as React.CSSProperties)
        : {}),
      ...style,
    };

    const classes = cn(
      buttonBaseStyles,
      is3D && button3DStyles,
      variantStyles[variant],
      sizeStyles[size],
      className,
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        className?: string;
        style?: React.CSSProperties;
      }>;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
        style: { ...customStyle, ...child.props.style },
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        style={customStyle}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
