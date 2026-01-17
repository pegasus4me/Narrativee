"use client"
import Image from "next/image";
import logo from "../public/logo.png";
import { authClient } from "../lib/auth-client";
import { useRouter } from "next/navigation";
import Header from "./components/commons/Header";
import Footer from "./components/commons/Footer";

import { useGTMTracking } from "./hooks/useGTMTracking";
import PrimaryButton from "./components/commons/PrimaryButton";
import { Target, TrendingUp, Zap, Users, BarChart3, Bell, ArrowRight, X, Play } from "lucide-react";
import { ROICalculator } from "./components/pricing/ROICalculator";
import { HeaderROICalculator } from "./components/pricing/HeaderROICalculator";
import { ComparisonTable } from "./components/landing/ComparisonTable";
import BetaSignupPopup from "./components/commons/BetaSignupPopup";
import CenterBetaModal from "./components/commons/CenterBetaModal";
import { EngagementScoreChart } from "./components/landing/EngagementScoreChart";
import { TriggerIllustration } from "./components/landing/TriggerIllustration";
import { ConvertIllustration } from "./components/landing/ConvertIllustration";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const { trackEvent } = useGTMTracking();
  const { data: session } = authClient.useSession();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBetaPopup, setShowBetaPopup] = useState(false);

  return (
    <div className="min-h-screen max-w-7xl mx-auto flex items-center justify-center">
      <h1 className="text-center text-7xl font-urbanist">in validation mode, see you soon</h1>
    </div>
  );
}