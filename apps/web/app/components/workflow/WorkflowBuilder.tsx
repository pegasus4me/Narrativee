"use client"
import React, { useCallback, useState } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StartNode } from './nodes/StartNode';
import { ScoreTriggerNode } from './nodes/ScoreTriggerNode';
import { ComponentActionNode } from './nodes/ComponentActionNode';
import { EmailActionNode } from './nodes/EmailActionNode';
import { Button } from '@/components/ui/button';
import { Plus, Save, Play, Square } from 'lucide-react';

const nodeTypes = {
    'start': StartNode,
    'score-trigger': ScoreTriggerNode,
    'component-action': ComponentActionNode,
    'email-action': EmailActionNode,
};

// Default Start Node (always present)
const defaultStartNode: Node = {
    id: 'start',
    position: { x: 150, y: 20 },
    type: 'start',
    data: {},
    deletable: false, // Cannot be deleted
    
};

// Initial Nodes for demo
const initialNodes: Node[] = [
    defaultStartNode,
    {
        id: '1',
        position: { x: 100, y: 120 },
        type: 'score-trigger',
        data: { threshold: 50 }
    },
    {
        id: '2',
        position: { x: 100, y: 350 },
        type: 'component-action',
        data: { componentId: 'upgrade-modal' }
    },
];
const initialEdges: Edge[] = [
    { id: 'e-start-1', source: 'start', target: '1' },
    { id: 'e1-2', source: '1', target: '2' }
];

interface WorkflowBuilderProps {
    initialData?: {
        id?: string;
        name: string;
        nodes: Node[];
        edges: Edge[];
    };
    onSave: (data: any) => Promise<void>;
    onBack: () => void;
}

export default function WorkflowBuilder({ initialData, onSave, onBack }: WorkflowBuilderProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || initialEdges);
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [workflowName, setWorkflowName] = useState(initialData?.name || 'Untitled Workflow');
    const [saving, setSaving] = useState(false);

    // Pass onChange handler to nodes
    const onNodeDataChange = useCallback((id: string, field: string, value: any) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: { ...node.data, [field]: value }
                };
            }
            return node;
        }));
    }, [setNodes]);

    // Inject callbacks into nodes
    const nodesWithCallbacks = nodes.map(node => ({
        ...node,
        data: {
            ...node.data,
            onChange: (field: string, value: any) => onNodeDataChange(node.id, field, value)
        }
    }));

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            // Extract Logic for Backend Execution
            const triggerNode = nodes.find(n => n.type === 'score-trigger');
            const componentNode = nodes.find(n => n.type === 'component-action');
            const emailNode = nodes.find(n => n.type === 'email-action');

            // Construct Logic Object
            const triggerCondition = triggerNode ? {
                operator: '>',
                value: triggerNode.data.threshold ?? 50
            } : {};

            // Determine Action Type
            let actionType = 'none';
            let actionConfig = {};

            if (componentNode) {
                actionType = 'component';
                actionConfig = { componentId: componentNode.data.componentId ?? 'upgrade-modal' };
            } else if (emailNode) {
                actionType = 'email';
                actionConfig = {
                    provider: 'brevo',
                    templateId: emailNode.data.templateId ?? ''
                };
            }

            await onSave({
                id: initialData?.id,
                name: workflowName,
                nodes: nodes, // Save UI state
                edges,
                isActive,
                triggerType: 'score',
                triggerCondition,
                actionType,
                actionConfig
            });
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const addNode = (type: 'score-trigger' | 'component-action' | 'email-action') => {
        const id = (nodes.length + 1).toString();
        const newNode: Node = {
            id,
            position: { x: Math.random() * 200, y: Math.random() * 200 },
            type: type,
            data: { label: `New Node` },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    return (
        <div className="h-[calc(100vh-150px)] w-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col font-manrope">
            {/* Toolbar */}
            <div className="border-b border-gray-100 p-4 flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        &larr; Back
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <input
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                className="font-semibold text-gray-900 font-urbanist border-none outline-none focus:ring-0 p-0 text-lg placeholder:text-gray-400 max-w-[200px]"
                                placeholder="Workflow Name"
                            />
                            {isActive ? (
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wide">Active</span>
                            ) : (
                                <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 uppercase tracking-wide">Inactive</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">Design your automation flow</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Active Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
                        <button
                            onClick={() => setIsActive(true)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${isActive ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Play size={12} className={isActive ? "fill-green-700" : ""} /> Run
                        </button>
                        <button
                            onClick={() => setIsActive(false)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${!isActive ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Square size={12} className={!isActive ? "fill-red-600" : ""} /> Stop
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    <Button variant="outline" size="sm" onClick={() => addNode('score-trigger')} className="gap-2">
                        <Plus size={16} /> Trigger
                    </Button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <Button variant="outline" size="sm" onClick={() => addNode('component-action')} className="gap-2 text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100">
                        <Plus size={16} /> UI Component
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addNode('email-action')} className="gap-2 text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100">
                        <Plus size={16} /> Email
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-button ml-2">
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Workflow'}
                    </Button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 w-full h-full">
                <ReactFlow
                    nodes={nodesWithCallbacks}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
}
