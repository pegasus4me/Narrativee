"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { reportApi, Report } from "../../lib/apis";
import { File, Eye, Calendar, Share4 } from "clicons-react";

export default function WorkspaceMainPage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);

    useEffect(() => {
        // Redirect unauthenticated users
        if (!isPending && !session) {
            router.push("/auth/signin");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        // Fetch reports when user is authenticated
        const fetchReports = async () => {
            if (session?.user) {
                try {
                    const data = await reportApi.getAllReports();
                    setReports(data);
                } catch (error) {
                    console.error('Failed to fetch reports:', error);
                } finally {
                    setIsLoadingReports(false);
                }
            }
        };

        fetchReports();
    }, [session]);

    // Handle Loading State
    if (isPending) {
        return (
            <div className="h-full w-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                    <p>Loading workspace...</p>
                </div>
            </div>
        );
    }

    // Return null if redirecting
    if (!session) {
        return null;
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-petrona)' }}>
                        <span className="font-light">Hey</span>, {session.user.name}
                    </h1>
                    <p className="text-gray-600">Manage your reports and track their performance</p>
                </div>

                {/* Reports Grid */}
                {isLoadingReports ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-16">
                        <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No reports yet</h3>
                        <p className="text-gray-600 mb-6">Create your first report to get started</p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-amber-500 text-black rounded-lg hover:bg-amber-600 transition-colors font-medium"
                        >
                            Create Report
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.map((report) => (
                            <Link
                                key={report.id}
                                href={`/workspace/${report.id}`}
                                className="bg-white rounded-lg border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all p-6 group"
                            >
                                {/* Report Name */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors line-clamp-2">
                                    {report.name}
                                </h3>

                                {/* File Info */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                    <File className="w-4 h-4" strokeWidth={1.5} />
                                    <span className="truncate">{report.fileName}</span>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                    {/* View Count */}
                                    {report.isShared && (
                                        <div className="flex items-center gap-1">
                                            <Eye size={14} />
                                            <span>{report.viewCount || 0}</span>
                                        </div>
                                    )}

                                    {/* Created Date */}
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                        {report.reportStyle}
                                    </span>
                                    {report.isShared && (
                                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded flex items-center gap-1">
                                            <Share4 size={12} />
                                            Shared
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}