import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Smartphone } from 'lucide-react';

interface ComponentActionData {
    componentId?: string;
    onChange?: (field: string, value: any) => void;
    [key: string]: any;
}

export function ComponentActionNode({ data }: { data: ComponentActionData }) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (data.onChange) {
            data.onChange('componentId', e.target.value);
        }
    };

    return (
        <div className="bg-white rounded-lg border-2 border-purple-400 shadow-sm min-w-[220px]">
            <Handle type="target" position={Position.Top} className="!bg-purple-400" />
            <div className="bg-purple-50 p-2 border-b border-purple-100 flex items-center gap-2 rounded-t-lg">
                <Smartphone className="text-purple-500 w-4 h-4" />
                <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Trigger Component</span>
            </div>
            <div className="p-3">
                <label className="text-sm font-medium text-gray-700 block mb-1">Component ID</label>
                <div className="text-xs text-gray-400 mb-2">The ID used in your SDK code</div>
                <input
                    defaultValue={data.componentId || "upgrade-modal"}
                    className="w-full border rounded px-2 py-1 text-sm bg-gray-50 focus:ring-2 ring-purple-400/20 outline-none"
                    onChange={handleChange}
                    placeholder="e.g. vip-banner"
                />
            </div>
        </div>
    );
}
