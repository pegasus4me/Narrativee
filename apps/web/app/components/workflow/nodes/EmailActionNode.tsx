import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail } from 'lucide-react';

interface EmailActionData {
    provider?: string;
    templateId?: string;
    onChange?: (field: string, value: any) => void;
    [key: string]: any;
}

export function EmailActionNode({ data }: { data: EmailActionData }) {
    const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (data.onChange) {
            data.onChange('templateId', e.target.value);
        }
    };

    return (
        <div className="bg-white rounded-lg border-2 border-orange-400 shadow-sm min-w-[220px]">
            <Handle type="target" position={Position.Top} className="!bg-orange-400" />
            <div className="bg-orange-50 p-2 border-b border-orange-100 flex items-center gap-2 rounded-t-lg">
                <Mail className="text-orange-500 w-4 h-4" />
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Send Email</span>
            </div>
            <div className="p-3">
                <label className="text-sm font-medium text-gray-700 block mb-1">Provider</label>
                <select className="w-full border rounded px-2 py-1 text-sm bg-gray-50 focus:ring-2 ring-orange-400/20 outline-none mb-2" defaultValue="brevo">
                    <option value="brevo">Brevo (Sendinblue)</option>
                    <option value="resend" disabled>Resend (Coming Soon)</option>
                </select>

                <label className="text-sm font-medium text-gray-700 block mb-1">Template / Sequence ID</label>
                <input
                    defaultValue={data.templateId || ""}
                    className="w-full border rounded px-2 py-1 text-sm bg-gray-50 focus:ring-2 ring-orange-400/20 outline-none"
                    onChange={handleTemplateChange}
                    placeholder="e.g. 12"
                />
            </div>
        </div>
    );
}
