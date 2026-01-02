"use client"

import { ColumnDef } from "@tanstack/react-table"
import { UserDetailsDialog } from "./user-details-dialog"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// This type is used to define the shape of our data.
export type SaasUser = {
    id: string
    score: number
    lastSeen: string
    firstSeen: string
    metadata?: any
}

export const columns: ColumnDef<SaasUser>[] = [
    {
        accessorKey: "id",
        header: "User",
        cell: ({ row }) => {
            const meta = row.original.metadata;
            console.log("meta", meta)
            // Try to find name or email in metadata (case insensitive keys often help, but strict here for now)
            const name = meta?.name || meta?.Name;
            const email = meta?.email || meta?.Email;

            if (name || email) {
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{name || email}</span>
                        {name && email && <span className="text-xs text-gray-500">{email}</span>}
                        {/* Fallback to ID in tooltip or small text if needed, but keeping clean for now */}
                    </div>
                );
            }
            return <div className="font-mono text-xs">{row.getValue("id")}</div>
        }
    },
    {
        accessorKey: "score",
        header: "Engagement Score",
        cell: ({ row }) => {
            const score = parseFloat(row.getValue("score"))
            return <div className="font-medium">{score}</div>
        },
    },
    {
        accessorKey: "lastSeen",
        header: "Last Active",
        cell: ({ row }) => {
            const date = new Date(row.getValue("lastSeen"));
            return <div>{date.toLocaleString()}</div>
        }
    },
    {
        id: "plan",
        header: "Plan",
        cell: ({ row }) => {
            const meta = row.original.metadata;
            const plan = meta?.plan || meta?.Plan || 'free';
            const planColors: Record<string, string> = {
                'free': 'bg-gray-100 text-gray-700',
                'trial': 'bg-blue-100 text-blue-700',
                'paid': 'bg-green-100 text-green-700',
                'pro': 'bg-purple-100 text-purple-700',
                'enterprise': 'bg-amber-100 text-amber-700',
            };
            const colorClass = planColors[plan.toLowerCase()] || 'bg-gray-100 text-gray-700';
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
                    {plan}
                </span>
            );
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const user = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(user.id)}
                        >
                            Copy User ID
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <UserDetailsDialog user={user}>
                                <div className="w-full h-full cursor-pointer">View details</div>
                            </UserDetailsDialog>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
