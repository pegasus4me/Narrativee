
"use client"
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import GenerateApiKey from "../components/workspaceComponents/generateApiKey.component";
import GetStarted from "../components/workspaceComponents/GetStarted";
import DashboardStats from "../components/workspaceComponents/DashboardStats";
import { API_URL } from "@/lib/api-config";

export default function DashboardPage() {
    const { data: session } = authClient.useSession();
    const [sdkStatus, setSdkStatus] = useState<'connected' | 'waiting' | 'offline'>('waiting');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch SDK status
        if (session?.user?.id) {
            fetchSdkStatus();
        }
    }, [session]);

    const fetchSdkStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/api-keys`, {
                headers: {
                    'x-user-id': session?.user?.id || ''
                }
            });
            const data = await res.json() as any;
            if (data.sdkStatus) {
                setSdkStatus(data.sdkStatus);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 max-w-7xl mx-auto mt-10">
            <div className="flex flex-col gap-4 flex-row justify-between">
                <div>
                    <h2 className="text-4xl font-manrope text-tertiary">Nice to see you, {session?.user?.name}</h2>
                    <p className="text-text font-manrope text-neutral-600">Here's a quick overview of your metrics</p>
                </div>
                {!loading && sdkStatus === 'connected' && (
                    <div className=" rounded-lg p-4 flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                            <p className=" text-green-800 font-manrope">SDK Connected</p>
                            <p className="text-sm text-green-600">Your SDK is receiving events. Head to the Dashboard to see your users!</p>
                        </div>
                    </div>
                )}
            </div>

            <br className="" />

            <section className="flex flex-col gap-4">
                {/* Show connected status if SDK is working */}
                <GenerateApiKey />

                {/* Show GetStarted only if SDK is not connected yet */}
                {!loading && sdkStatus !== 'connected' && <GetStarted />}
            </section>

            {/* Dashboard Metrics */}
            <DashboardStats />
        </div>
    );
}