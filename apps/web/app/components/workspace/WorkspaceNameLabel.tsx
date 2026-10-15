"use client";

import { useEffect, useState } from "react";
import { getOnboardingProfile } from "@/lib/api/onboarding";

export default function WorkspaceNameLabel({
  className = "",
}: {
  className?: string;
}) {
  const [name, setName] = useState("");
  useEffect(() => {
    let mounted = true;
    void getOnboardingProfile()
      .then(({ profile }) => {
        if (mounted) setName(profile?.workspaceName ?? "");
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);
  return name ? (
    <span className={className} title={name}>
      {name}
    </span>
  ) : null;
}
