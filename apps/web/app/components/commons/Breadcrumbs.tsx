"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface BreadcrumbItem {
  readonly label: string;
  readonly href: string;
}

/**
 * Breadcrumbs navigation component mapping active pathname segments
 * to friendly hierarchical link structures.
 */
export default function Breadcrumbs(): React.JSX.Element | null {
  const pathname = usePathname();
  if (!pathname) return null;

  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "home",
      href: "/workspace",
    },
  ];

  let currentPath = "/workspace";

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    let label = segment;

    if (segment === "create") {
      label = "create";
      currentPath = "/workspace/create";
    } else if (segment === "new") {
      label = "New creation";
      currentPath = "/workspace/create/new";
    } else if (segment === "calendar") {
      label = "calendar";
      currentPath = "/workspace/calendar";
    } else if (segment === "channels") {
      label = "channels";
      currentPath = "/workspace/channels";
    } else if (segment === "memory") {
      label = "memory";
      currentPath = "/workspace/memory";
    } else if (segment === "hooks") {
      label = "hooks";
      currentPath = "/workspace/hooks";
    } else if (segment === "post-queue") {
      label = "posts";
      currentPath = "/workspace/post-queue";
    } else {
      label = "pack details";
      currentPath = `${currentPath}/${segment}`;
    }

    breadcrumbItems.push({
      label,
      href: currentPath,
    });
  }

  return (
    <nav className="flex items-center gap-2 text-lg text-white/60 font-light select-none">
      {breadcrumbItems.map((item, idx) => {
        const isLast = idx === breadcrumbItems.length - 1;
        return (
          <div key={item.href} className="flex items-center gap-2">
            {idx > 0 && <span className="text-zinc-800 text-lg">/</span>}
            {isLast ? (
              <span className="text-white font-base ">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-zinc-300 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
