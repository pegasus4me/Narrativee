"use client"

import { useEffect, useState } from "react"
import { SaasUser, columns } from "./columns"
import { DataTable } from "../../components/ui/data-table" // Ensure this path is correct
import { authClient } from "@/lib/auth-client"
import PrimaryButton from "@/app/components/commons/PrimaryButton"
import DashboardStats from "../../components/workspaceComponents/DashboardStats"
import { ScoringDialog } from "./scoring-dialog"

export default function DashboardPage() {
    const { data: session } = authClient.useSession();
    const [data, setData] = useState<SaasUser[]>([])
    const [loading, setLoading] = useState(true)
    const [showScoringDialog, setShowScoringDialog] = useState(false)

    useEffect(() => {
        async function fetchData() {
            if (!session?.user?.id) return;

            try {
                // Fetch from our new backend route
                const res = await fetch('http://localhost:3002/api/saas-users', {
                    headers: {
                        'x-user-id': session.user.id
                    }
                });
                const json = await res.json() as any;

                if (json.users) {
                    setData(json.users);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [session]);

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-7xl mx-auto  h-screen px-2">
            <ScoringDialog open={showScoringDialog} onClose={() => setShowScoringDialog(false)} />

            <div className="flex justify-between items-center">
                <div className="flex gap-2 items-end justify-between w-full">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-urbanist">Trial Users</h1>
                        <p className="text-muted-foreground">Monitor and know who is engaging with your app</p>
                    </div>
                    <div>
                        <PrimaryButton onClick={() => setShowScoringDialog(true)}>
                            Edit scoring
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="">
                {loading ? (
                    <div className="h-48 flex items-center justify-center text-gray-500">Loading users...</div>
                ) : (
                    <DataTable columns={columns} data={data} />
                )}
            </div>
        </div>
    )
}
