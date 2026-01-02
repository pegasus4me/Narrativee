import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Target, Zap } from 'lucide-react';

interface ScoreTriggerData {
    threshold?: number;
    onChange?: (field: string, value: any) => void;
    [key: string]: any;
}

export function ScoreTriggerNode({ data }: { data: ScoreTriggerData }) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (data.onChange) {
            data.onChange('threshold', Number(e.target.value));
        }
    };

    return (
        <div className="bg-white rounded-lg border-2 border-primary shadow-sm min-w-[200px]">
            <Handle type="target" position={Position.Top} className="!bg-primary" />
            <div className="bg-primary/5 p-2 border-b border-primary/10 flex items-center gap-2 rounded-t-lg">
                <Zap className="text-primary w-4 h-4" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Trigger</span>
            </div>
            <div className="p-3">
                <label className="text-sm font-medium text-gray-700 block mb-1">Engagement Score</label>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">When score &gt;</span>
                    <input
                        type="number"
                        defaultValue={data.threshold ?? 50}
                        className="w-16 border rounded px-2 py-1 text-sm bg-gray-50 focus:ring-2 ring-primary/20 outline-none"
                        onChange={handleChange}
                    />
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-primary" />
        </div>
    );
}
