"use client";

import { useState, useEffect } from "react";
import { authClient } from "../../../lib/auth-client";
import { Tick } from "clicons-react";
import { useRouter } from "next/navigation";
import PowebiLogo from "../../../public/powerbi.webp";
import Image from "next/image";
import { DatasetSelector } from "../../components/powerbi/DatasetSelector";
import posthog from 'posthog-js';
export default function IntegrationsPage() {
    const { data: session } = authClient.useSession();
    const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDatasetSelectorOpen, setIsDatasetSelectorOpen] = useState(false);

    const handleDatasetSelect = (dataset: any) => {
        console.log("Selected dataset:", dataset);
        // TODO: Save selection to backend or trigger report generation
        alert(`Selected dataset: ${dataset.name}`);
    };

    useEffect(() => {
        if (session?.user) {
            authClient.listAccounts().then((res) => {
                if (res.data) {
                    setLinkedAccounts(res.data);
                }
                setIsLoading(false);
            });
        } else if (session === null) {
            setIsLoading(false);
        }
    }, [session]);

    const handleConnectPowerBI = async () => {
        try {
            // PostHog: Capture powerbi_connected event before redirect
            posthog.capture('powerbi_connected', {
                action: 'connect_initiated',
                source: 'integrations_page',
            });
            await authClient.linkSocial({
                provider: "microsoft",
                callbackURL: window.location.origin + "/workspace/integrations",
            });
        } catch (error) {
            console.error("Failed to link PowerBI:", error);
            posthog.captureException(error instanceof Error ? error : new Error('Failed to connect PowerBI'));
            alert("Failed to connect PowerBI account");
        }
    };

    const handleDisconnectPowerBI = async () => {
        if (!confirm("Are you sure you want to disconnect PowerBI?")) return;

        try {
            await authClient.unlinkAccount({
                providerId: "microsoft"
            });
            // Refresh the list
            const res = await authClient.listAccounts();
            if (res.data) {
                setLinkedAccounts(res.data);
            }
            setIsDatasetSelectorOpen(false);
        } catch (error) {
            console.error("Failed to disconnect PowerBI:", error);
            alert("Failed to disconnect PowerBI account");
        }
    };

    const isPowerBIConnected = linkedAccounts.some(acc => acc.providerId === "microsoft");

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="max-w-[90%] mx-auto p-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>Integrations</h1>
            <p className="text-gray-600 mb-8 text-sm">Connect your data sources to automatically generate reports.</p>

            <div className="grid gap-4">
                {/* PowerBI Integration Card */}
                <div className={`flex items-center justify-between p-6 border rounded-xl transition-colors"}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}>
                            {isPowerBIConnected ? (
                               <Image src={PowebiLogo} alt="PowerBI Logo" width={50} height={50} />
                            ) : (
                                <Image src={PowebiLogo} alt="PowerBI Logo" width={50} height={50} />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-lg">Microsoft PowerBI</h3>
                            <p className="text-sm text-gray-500">
                                {isPowerBIConnected ? "Connected and ready to sync" : "Connect your dashboards and datasets"}
                            </p>
                        </div>
                    </div>
                    {isPowerBIConnected ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsDatasetSelectorOpen(true)}
                                className="px-4 py-2 bg-white border rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-50 transition-colors"
                            >
                                Select Dataset
                            </button>
                            <button
                                onClick={handleDisconnectPowerBI}
                                className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleConnectPowerBI}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                            Connect
                        </button>
                    )}
                </div>
            </div>

            <DatasetSelector
                isOpen={isDatasetSelectorOpen}
                onClose={() => setIsDatasetSelectorOpen(false)}
                onSelect={handleDatasetSelect}
            />
        </div>
    );
}
