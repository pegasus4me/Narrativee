"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function TimeZoneComponent({ timezone }: { timezone: string }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Timezone:</span>
                    <span className="text-md text-zinc-100">{timezone}</span>
                </div>
            </DropdownMenuTrigger>
        </DropdownMenu>
        
    );
}