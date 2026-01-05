"use client"
import { authClient } from "@/lib/auth-client";
import { reportApi } from "@/lib/apis";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { narrativee } from "@narrativee/sdk";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import WorkflowBuilder from '@/app/components/workflow/WorkflowBuilder';
import { format } from "date-fns";

export default function WorkflowsPage() {
    const { data: session } = authClient.useSession();
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [editingWorkflow, setEditingWorkflow] = useState<any>(null);

    const fetchWorkflows = async () => {
        try {
            const data = await reportApi.getWorkflows();
            setWorkflows(data || []);
        } catch (error) {
            console.error("Failed to fetch workflows", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchWorkflows();
        }
    }, [session]);

    const handleCreateNew = () => {
        setEditingWorkflow(null);
        narrativee.event('create_workflow')
        setView('editor');
    };

    const handleEdit = (wf: any) => {
        setEditingWorkflow(wf);
        setView('editor');
    };

    const handleSave = async (data: any) => {
        try {
            await reportApi.saveWorkflow(data);
            await fetchWorkflows(); // Refresh list
            setView('list');
        } catch (err) {
            console.error("Failed to save", err);
        }
    };

    if (view === 'editor') {
        return (
            <div className="flex h-screen w-full transition-all duration-500">
                <div className="flex-1 p-6 overflow-hidden">
                    <WorkflowBuilder
                        initialData={editingWorkflow}
                        onSave={handleSave}
                        onBack={() => setView('list')}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full ">
            <div className="flex-1 p-6 overflow-hidden max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold font-urbanist text-gray-900">Your Workflows</h1>
                        <p className="text-gray-500 font-manrope">Automate user journeys with custom triggers.</p>
                    </div>
                    {workflows.length > 0 && (
                        <Button onClick={handleCreateNew} className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-button">
                            <Plus size={16} /> New Workflow
                        </Button>
                    )}
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : workflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[500px] border border-dashed border-gray-200 rounded-2xl bg-white/50">
                        <div className="bg-blue-50 p-4 rounded-full mb-4">
                            <Plus className="text-primary w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows yet</h3>
                        <p className="text-gray-500 text-center max-w-sm mb-6">
                            Create your first workflow to automate user engagement based on scoring.
                        </p>
                        <Button onClick={handleCreateNew} size="lg" className="bg-primary text-white hover:bg-primary/90 shadow-button">
                            Create your first workflow
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Trigger</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workflows.map((wf) => (
                                    <TableRow key={wf.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleEdit(wf)}>
                                        <TableCell className="font-medium">{wf.name}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${wf.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {wf.isActive ? 'Active' : 'Draft'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-500">{wf.triggerType || 'Score'}</TableCell>
                                        <TableCell className="text-gray-500">{wf.createdAt ? format(new Date(wf.createdAt), 'MMM d, yyyy') : '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
