import { useEffect, useState } from "react";
import { reportApi } from "../../lib/apis";
import { Trash2, TrendingUp, Plus } from "lucide-react";

export function ScoringManager() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [eventName, setEventName] = useState("");
    const [scoreValue, setScoreValue] = useState(10);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            const data = await reportApi.getScoringConfigs();
            setConfigs(data);
        } catch (error) {
            console.error("Failed to load scoring configs", error);
        }
    };

    const handleAdd = async () => {
        if (!eventName) return;
        setLoading(true);
        try {
            await reportApi.createScoringConfig(eventName, Number(scoreValue));
            setEventName("");
            setScoreValue(10);
            await loadConfigs();
        } catch (error) {
            console.error("Failed to add config", error);
            alert("Failed to add rule");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this rule?")) return;
        try {
            await reportApi.deleteScoringConfig(id);
            setConfigs(configs.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete rule");
        }
    };

    return (
        <div className="space-y-6 font-manrope">
            <div className="grid gap-4 md:grid-cols-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                    <input
                        type="text"
                        placeholder="e.g. view_pricing"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Score Points</label>
                    <input
                        type="number"
                        min="1"
                        value={scoreValue}
                        onChange={(e) => setScoreValue(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div className="md:col-span-1">
                    <button
                        onClick={handleAdd}
                        disabled={loading || !eventName}
                        className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        Add Rule
                    </button>
                </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">Event Name</th>
                            <th className="px-4 py-3">Points</th>
                            <th className="px-4 py-3 w-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {configs.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                    No rules defined yet. Add one above!
                                </td>
                            </tr>
                        ) : (
                            configs.map((config) => (
                                <tr key={config.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{config.eventName}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-green-600 font-bold px-2 py-1 rounded w-fit">
                                            +{config.scoreValue}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleDelete(config.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
