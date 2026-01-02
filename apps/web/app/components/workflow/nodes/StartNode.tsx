"use client"
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

export function StartNode() {
    return (
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full p-4 shadow-lg border-2 border-green-400">
            <div className="flex items-center justify-center gap-2">
                <Play size={20} fill="white" />
                <span className="font-semibold text-sm font-manrope">Start</span>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-white !w-3 !h-3" />
        </div>
    );
}
