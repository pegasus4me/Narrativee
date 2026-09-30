"use client";

import React, { useRef, useState, useEffect, type ReactNode, type HTMLAttributes } from "react";

interface GlideMenuProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  rowSelector?: string;
  highlightClassName?: string;
  className?: string;
}

export default function GlideMenu({
  children,
  rowSelector = "[data-row], [data-menu-row]",
  highlightClassName = "rounded-[7px] bg-hover-2",
  className = "",
  ...props
}: GlideMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    opacity: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnterRow = (el: HTMLElement) => {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      setHighlightStyle({
        top: elRect.top - containerRect.top,
        left: elRect.left - containerRect.left,
        width: elRect.width,
        height: elRect.height,
        opacity: 1,
      });
    };

    const handleMouseLeave = () => {
      setHighlightStyle((prev) => ({ ...prev, opacity: 0 }));
    };

    const rows = container.querySelectorAll<HTMLElement>(rowSelector);
    const listeners: Array<{ el: HTMLElement; enter: () => void }> = [];

    rows.forEach((row) => {
      const enter = () => handleMouseEnterRow(row);
      row.addEventListener("mouseenter", enter);
      listeners.push({ el: row, enter });
    });

    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      listeners.forEach(({ el, enter }) => {
        el.removeEventListener("mouseenter", enter);
      });
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [rowSelector, children]);

  return (
    <div ref={containerRef} className={`relative ${className}`} {...props}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute transition-[top,left,width,height,opacity] duration-150 ease-out ${highlightClassName}`}
        style={{
          top: `${highlightStyle.top}px`,
          left: `${highlightStyle.left}px`,
          width: `${highlightStyle.width}px`,
          height: `${highlightStyle.height}px`,
          opacity: highlightStyle.opacity,
        }}
      />
      {children}
    </div>
  );
}
